import {
  DoubleSide, MeshBasicMaterial, TextureLoader, SRGBColorSpace, type Texture, type Material, BackSide, type BufferGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, Group,
  HemisphereLight, IcosahedronGeometry, InstancedMesh, Mesh, MeshStandardMaterial, Object3D,
  PlaneGeometry, ShaderMaterial, SphereGeometry, Vector3, type Scene,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { chunkAt, chunkKey, hash, scatter, type Address } from './world'
const skyVertex = `varying vec3 vDirection; void main(){vDirection=position; vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww;}`
const skyFragment = `varying vec3 vDirection;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
void main(){vec3 d=normalize(vDirection); float h=max(0.,d.y);
vec3 color=mix(vec3(.72,.82,.83),vec3(.16,.43,.67),pow(h,.55));
vec2 q=d.xz/max(.13,d.y)*2.2; float f=n(q)*.56+n(q*2.03)*.28+n(q*4.01)*.16;
float cloud=smoothstep(.53,.77,f)*smoothstep(.04,.16,h)*(1.-smoothstep(.55,.95,h));
color=mix(color,vec3(.93,.94,.91),cloud*.8);
vec3 sun=normalize(vec3(-.6,.65,-.45)); float glow=pow(max(0.,dot(d,sun)),48.);
color+=vec3(.16,.13,.07)*glow; color=mix(color,vec3(1.,.97,.83),smoothstep(.9994,.9998,dot(d,sun)));
gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment> }`
function treeGeometry(profile: number): BufferGeometry {
  const parts = [0, 1, 2].map(index => {
    const plane = new PlaneGeometry(.8, 1)
    const uv = plane.getAttribute('uv'), column = profile % 4, row = Math.floor(profile / 4)
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (column + .006 + uv.getX(i) * .988) / 4, 1 - (row + .994 - uv.getY(i) * .988) / 2)
    plane.translate(0, .5, 0); plane.rotateY(index * Math.PI / 3)
    return plane
  })
  const geometry = mergeGeometries(parts); parts.forEach(p => p.dispose()); return geometry
}
export class FlightScenery {
  readonly root = new Group()
  readonly sky = new Mesh(new SphereGeometry(4000, 24, 12), new ShaderMaterial({
    vertexShader: skyVertex, fragmentShader: skyFragment, side: BackSide, depthWrite: false,
  }))
  private readonly waterTime = { value: 0 }
  private readonly waterOrigin = { value: new Vector3() }
  private readonly waterMaterial = new MeshStandardMaterial({ color: '#358b98', roughness: .36, metalness: .22 })
  private readonly water = new Mesh(new PlaneGeometry(10000, 10000, 1, 1), this.waterMaterial)
  private readonly rockGeometry = new IcosahedronGeometry(1, 1)
  private readonly crownGeometry = new ConeGeometry(1, 2.2, 7, 3)
  private readonly trunkGeometry = new CylinderGeometry(.09, .17, 1.8, 5)
  private readonly rockMaterial = new MeshStandardMaterial({ color: '#9e947b', roughness: 1 })
  private readonly crownMaterial = new MeshStandardMaterial({ color: '#405b3b', roughness: .95 })
  private readonly trunkMaterial = new MeshStandardMaterial({ color: '#716049', roughness: 1 })
  private readonly batches = new Map<string, { address: Address; root: Group }>()
  private origin: Address = { x: 0, z: 0 }
  private quality = 'low'
  private disposed = false
  private atlas: Texture | null = null
  private treeMaterial: MeshBasicMaterial | null = null
  private readonly treeGeometries = [treeGeometry(0), treeGeometry(3)]
  constructor(scene: Scene, wake: () => void) {
    void new TextureLoader().loadAsync(new URL('../scale-encounter/assets/environments/midground-mature-tree-atlas-v1-1024.webp', import.meta.url).href).then(texture => {
      if (this.disposed) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      this.atlas = texture
      this.treeMaterial = new MeshBasicMaterial({ map: texture, alphaTest: .32, alphaToCoverage: true, side: DoubleSide, color: '#b8beaf', fog: true })
      this.clearBatches(); wake()
    }).catch(() => { /* Retain the bounded procedural fallback if the optional atlas is unavailable. */ })
    this.sky.frustumCulled = false; this.sky.renderOrder = -10
    this.water.rotation.x = -Math.PI / 2; this.water.position.y = -.7
    this.waterMaterial.onBeforeCompile = shader => {
      shader.uniforms.flightTime = this.waterTime; shader.uniforms.flightOrigin = this.waterOrigin
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 waterWorld;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nwaterWorld = (modelMatrix * vec4(transformed,1.)).xyz;')
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float flightTime; uniform vec3 flightOrigin; varying vec3 waterWorld;')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          vec2 w=waterWorld.xz+flightOrigin.xz;
          float ripple=sin(w.x*.035+w.y*.045+flightTime*.55)*.06+sin(w.x*.09-w.y*.055+flightTime*.7)*.025;
          normal=normalize(normal+vec3(ripple,0.,ripple*.6));`)
    }
    const rockPositions = this.rockGeometry.getAttribute('position')
    for (let i = 0; i < rockPositions.count; i++) {
      const f = .8 + hash(i, 0, 50) * .35
      rockPositions.setXYZ(i, rockPositions.getX(i) * f, rockPositions.getY(i) * f * .7, rockPositions.getZ(i) * f)
    }
    this.rockGeometry.computeVertexNormals()
    const sun = new DirectionalLight('#fff0d7', 2.1); sun.position.set(-600, 650, -450)
    scene.add(new HemisphereLight('#d5e8f3', '#6e7151', 1.9), sun)
    this.root.add(this.sky, this.water); scene.add(this.root)
  }
  update(x: number, y: number, z: number, time: number, quality: 'low' | 'balanced') {
    this.sky.position.set(x - this.origin.x, y, z - this.origin.z)
    this.water.position.set(x - this.origin.x, -.7, z - this.origin.z)
    this.waterTime.value = time
    const center = chunkAt(x, z), wanted = new Set<string>()
    if (this.quality !== quality) { this.clearBatches(); this.quality = quality }
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const address = { x: center.x + dx, z: center.z + dz }, key = chunkKey(address)
      wanted.add(key)
      if (this.batches.has(key)) continue
      const props = scatter(address).filter(p => p.priority < (quality === 'low' ? .4 : .8))
      const root = new Group(), dummy = new Object3D()
      const build = (kind: 'rock' | 'plant', geometry: BufferGeometry, material: Material, trunk = false, profile = -1) => {
        const selected = props.filter(p => p.kind === kind && (profile < 0 || (hash(Math.floor(p.x), Math.floor(p.z), 61) > .5 ? 1 : 0) === profile))
        if (!selected.length) return
        const mesh = new InstancedMesh(geometry, material, selected.length)
        selected.forEach((p, i) => {
          const atlasTree = profile >= 0
          const height = atlasTree ? 0 : kind === 'rock' ? p.scale * .4 : p.scale * (trunk ? .45 : .9)
          dummy.position.set(p.x - address.x * 512, p.y + height - (kind === 'rock' ? .5 : 0), p.z - address.z * 512)
          dummy.rotation.set(0, p.yaw, 0)
          dummy.scale.setScalar(atlasTree ? 6 + p.scale : p.scale * (kind === 'plant' ? trunk ? .6 : .85 : 1))
          dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix)
          const color = new Color('#ffffff')
          color.multiplyScalar(.82 + p.priority * .4); mesh.setColorAt(i, color)
        })
        mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); root.add(mesh)
      }
      build('rock', this.rockGeometry, this.rockMaterial)
      if (this.treeMaterial) this.treeGeometries.forEach((geometry, i) => build('plant', geometry, this.treeMaterial!, false, i))
      else { build('plant', this.crownGeometry, this.crownMaterial); build('plant', this.trunkGeometry, this.trunkMaterial, true) }
      root.position.set(address.x * 512 - this.origin.x, 0, address.z * 512 - this.origin.z)
      this.root.add(root); this.batches.set(key, { address, root })
    }
    for (const [key, batch] of this.batches) if (!wanted.has(key)) {
      batch.root.traverse(object => { if (object instanceof InstancedMesh) object.dispose() })
      batch.root.removeFromParent(); this.batches.delete(key)
    }
  }
  relocate(origin: Address) {
    this.origin = { ...origin }; this.waterOrigin.value.set(origin.x, 0, origin.z)
    for (const batch of this.batches.values()) batch.root.position.set(batch.address.x * 512 - origin.x, 0, batch.address.z * 512 - origin.z)
  }
  private clearBatches() {
    this.batches.forEach(batch => { batch.root.traverse(o => { if (o instanceof InstancedMesh) o.dispose() }); batch.root.removeFromParent() })
    this.batches.clear()
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.atlas?.dispose(); this.treeMaterial?.dispose(); this.treeGeometries.forEach(g => g.dispose())
    this.clearBatches()
    for (const mesh of [this.sky, this.water]) { mesh.geometry.dispose(); mesh.material.dispose() }
    for (const resource of [this.rockGeometry, this.crownGeometry, this.trunkGeometry, this.rockMaterial, this.crownMaterial, this.trunkMaterial]) resource.dispose()
    this.root.removeFromParent()
  }
}
