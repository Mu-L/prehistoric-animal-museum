import { horizonTopology } from './horizon-topology'
import { horizonColor } from './materials/horizon-color'
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial, Vector2, DataTexture, RedFormat, UnsignedByteType, type Material } from 'three'
import type { Address, WorldSampler } from './world'
import type { FrameWorkBudget } from './frame-work-budget'

export const HORIZON_STEP = 256
export const HORIZON_RADIUS = 12288
const SIDE = HORIZON_RADIUS * 2 / HORIZON_STEP + 1
/** Same world, coarse land only. No props, textures, collision, or second world seed.
 * One row per budget slice; retain the published mesh until its replacement is ready.
 */
export class HorizonTerrain {
  readonly root = new Group()
  readonly material = new MeshStandardMaterial({ vertexColors: true, roughness: 1 })
  readonly metrics = { pending: 1, vertices: 0, triangles: 0, bytes: 0, preparedRows: 0 }
  private readonly originUniform = { value: new Vector2() }
  private readonly coverage = new DataTexture(new Uint8Array(33 * 33), 33, 33, RedFormat, UnsignedByteType)
  private readonly coverageOrigin = { value: new Vector2() }
  private coverageSignature = ''
  private origin: Address = { x: 0, z: 0 }
  private mesh: Mesh | null = null
  private published: Address | null = null
  private build: { x: number; z: number; row: number; positions: number[]; colors: number[]; indices:number[]; extra:Map<string,number>; topology:ReturnType<typeof horizonTopology> } | null = null
  constructor(private readonly world: WorldSampler, decorate: (material: Material) => void) {
    this.coverage.generateMipmaps = false; this.coverage.needsUpdate = true
    decorate(this.material)
    const compile = this.material.onBeforeCompile.bind(this.material), key = this.material.customProgramCacheKey.bind(this.material)
    this.material.onBeforeCompile = (shader, renderer) => {
      compile(shader, renderer)
      Object.assign(shader.uniforms, { horizonOrigin: this.originUniform, horizonCoverage: { value: this.coverage }, horizonCoverageOrigin: this.coverageOrigin })
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform vec2 horizonOrigin; varying vec2 horizonXZ; varying float horizonHeight;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nhorizonXZ=(modelMatrix*vec4(transformed,1.)).xz+horizonOrigin;horizonHeight=(modelMatrix*vec4(transformed,1.)).y;')
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D horizonCoverage; uniform vec2 horizonCoverageOrigin; varying vec2 horizonXZ; varying float horizonHeight;')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif(horizonHeight<-.7)discard; vec2 uv=(floor((horizonXZ-horizonCoverageOrigin)/512.)+.5)/33.; if(all(greaterThanEqual(uv,vec2(0.)))&&all(lessThan(uv,vec2(1.)))&&texture2D(horizonCoverage,uv).r>.5)discard;')
    }
    this.material.customProgramCacheKey = () => `${key()}:horizon-land-coverage-v3`
  }
  get ready() { return this.mesh !== null }
  /** Never infer ownership from pending work: moving streams retain real terrain. */
  setCoverage(addresses: readonly Address[]) {
    const signature=addresses.map(a=>`${a.x},${a.z}`).sort().join(';')
    if(signature===this.coverageSignature)return
    this.coverageSignature=signature
    const data=this.coverage.image.data as Uint8Array;data.fill(0)
    if(addresses.length){
      const x=Math.min(...addresses.map(a=>a.x)),z=Math.min(...addresses.map(a=>a.z))
      this.coverageOrigin.value.set(x*512,z*512)
      for(const a of addresses){const dx=a.x-x,dz=a.z-z;if(dx>=0&&dz>=0&&dx<33&&dz<33)data[dz*33+dx]=255}
    }
    this.coverage.needsUpdate=true
  }
  update(x: number, z: number, budget: FrameWorkBudget) {
    const cx = Math.floor(x / 2048) * 2048, cz = Math.floor(z / 2048) * 2048
    this.metrics.preparedRows = 0
    if (this.build && (this.build.x !== cx || this.build.z !== cz)) this.build = null
    if (!this.build && (this.published?.x !== cx || this.published?.z !== cz)) {
      this.build = { x: cx, z: cz, row: 0, positions: new Array<number>(SIDE * SIDE * 3).fill(0), colors: new Array<number>(SIDE * SIDE * 3).fill(0),indices:[],extra:new Map(),topology:horizonTopology(this.world,HORIZON_STEP,{x:cx,z:cz}) }
    }
    const b = this.build
    if (b && b.row < SIDE && budget.canStart(.15)) budget.measure('horizon.prepare', () => {
      const z = b.row * HORIZON_STEP - HORIZON_RADIUS
      for (let c = 0; c < SIDE; c++) {
        const x = c * HORIZON_STEP - HORIZON_RADIUS, t = this.world.terrainAt(b.x + x, b.z + z), i = (b.row * SIDE + c) * 3
        // Published coverage removes overlap; never sink valid lowland below water.
        b.positions[i]=x;b.positions[i+1]=t.height;b.positions[i+2]=z
        const color=horizonColor(this.world,b.x+x,b.z+z,HORIZON_STEP);for(let k=0;k<3;k++)b.colors[i+k]=color[k]!
      }
      if(b.row<SIDE-1)for(let c=0;c<SIDE-1;c++){
        const x=c*HORIZON_STEP-HORIZON_RADIUS,topology=b.topology(b.x+x,b.z+z),vertices:number[]=[]
        for(let v=0;v<topology.points.length;v+=2){
          const px=x+topology.points[v]!,pz=z+topology.points[v+1]!
          if((px+HORIZON_RADIUS)%HORIZON_STEP===0&&(pz+HORIZON_RADIUS)%HORIZON_STEP===0){vertices.push((pz+HORIZON_RADIUS)/HORIZON_STEP*SIDE+(px+HORIZON_RADIUS)/HORIZON_STEP);continue}
          const key=`${px},${pz}`;let index=b.extra.get(key)
          if(index===undefined){index=b.positions.length/3;b.extra.set(key,index);b.positions.push(px,this.world.terrainAt(b.x+px,b.z+pz).height,pz);b.colors.push(...horizonColor(this.world,b.x+px,b.z+pz,HORIZON_STEP))}
          vertices.push(index)
        }
        for(const index of topology.indices)b.indices.push(vertices[index]!)
      }
      b.row++; this.metrics.preparedRows = 1
    })
    if (b && b.row === SIDE && budget.canStart(.3, b.positions.length*12+b.indices.length*2, 1)) budget.measure('horizon.install', () => {
      const indices=b.indices
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(b.positions), 3)); geometry.setAttribute('color', new BufferAttribute(new Float32Array(b.colors), 3)); geometry.setIndex(indices)
      geometry.computeVertexNormals(); geometry.computeBoundingSphere()
      const mesh = new Mesh(geometry, this.material); mesh.position.set(b.x - this.origin.x, 0, b.z - this.origin.z)
      this.root.add(mesh); this.mesh?.removeFromParent(); this.mesh?.geometry.dispose(); this.mesh = mesh
      this.published = { x: b.x, z: b.z }; this.build = null
      this.metrics.vertices = b.positions.length/3; this.metrics.triangles = indices.length / 3
      this.metrics.bytes = Object.values(geometry.attributes).reduce((n, a) => n + a.array.byteLength, 0) + (geometry.index?.array.byteLength ?? 0)
    }, b.positions.length*12+b.indices.length*2, 1)
    this.metrics.pending = Number(this.build !== null)
  }
  relocate(origin: Address) {
    this.origin = { ...origin }; this.originUniform.value.set(origin.x, origin.z)
    if (this.mesh && this.published) this.mesh.position.set(this.published.x - origin.x, 0, this.published.z - origin.z)
  }
  dispose() { this.mesh?.geometry.dispose(); this.material.dispose(); this.coverage.dispose(); this.root.clear(); this.root.removeFromParent(); this.build = null; this.mesh = null; this.published = null; this.metrics.pending = 0 }
}
