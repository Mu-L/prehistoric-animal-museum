import { deformRock, waterPhases } from './scenery-math'
import {
  DataTexture, RedFormat, FloatType, LinearFilter, DoubleSide, TextureLoader, SRGBColorSpace, type Texture, type Material, BackSide, type BufferGeometry, Color, CylinderGeometry, DirectionalLight, Group,
  HemisphereLight, IcosahedronGeometry, InstancedMesh, Mesh, MeshStandardMaterial, Object3D,
  PlaneGeometry, ShaderMaterial, SphereGeometry, Vector2, type Scene,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { chunkAt, chunkKey, hash, scatter, type Address, type Prop, terrainAt, coastAt } from './world'
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
function crownGeometry(variant: number) {
  const parts = [0, 1, 2].map(i => {
    const part = new IcosahedronGeometry(1, 1)
    part.scale(.48 + variant * .05, .38 + i * .08, .45)
    part.translate((i - 1) * .25, .85 + (i % 2) * .25, (variant - 1) * i * .12)
    return part
  })
  const geometry = mergeGeometries(parts); parts.forEach(p => p.dispose()); return geometry
}
interface PropBatch { address: Address; root: Group; signature: string; bytes: number; refresh: () => void }
export class FlightScenery {
  readonly review = { hideProps: false, flatWater: false, freezeWater: false }
  private readonly flatWater = { value: 0 }
  readonly root = new Group()
  readonly sky = new Mesh(new SphereGeometry(4000, 24, 12), new ShaderMaterial({
    vertexShader: skyVertex, fragmentShader: skyFragment, side: BackSide, depthWrite: false,
  }))
  private readonly shoreData = new Float32Array(256)
  private readonly shoreTexture = new DataTexture(this.shoreData, 256, 1, RedFormat, FloatType)
  private readonly shoreOffset = { value: new Vector2() }
  private shoreStart = Infinity
  private readonly wavePhase = { value: new Vector2() }

  private readonly waterMaterial = new MeshStandardMaterial({ color: '#358b98', roughness: .48, metalness: 0 })
  private readonly water = new Mesh(new PlaneGeometry(10000, 10000, 1, 1), this.waterMaterial)
  private readonly rocks = [0, 1, 2].map(i => { const g = new IcosahedronGeometry(1, i === 2 ? 0 : 1); deformRock(g); g.scale(1 + i * .28, 1 + i * .13, 1 - i * .17); return g })
  private readonly crowns = [0, 1, 2].map(crownGeometry)
  private readonly trunkGeometry = new CylinderGeometry(.09, .17, 1.8, 5)
  private readonly rockMaterial = new MeshStandardMaterial({ color: '#9e947b', roughness: 1 })
  private readonly crownMaterial = new MeshStandardMaterial({ color: '#405b3b', roughness: .95 })
  private readonly trunkMaterial = new MeshStandardMaterial({ color: '#716049', roughness: 1 })
  private readonly batches = new Map<string, PropBatch>()
  readonly metrics = { pending: 0, installMs: 0, peakInstallMs: 0, installedThisFrame: 0, bytes: 0, batches: 0 }
  private groundingIndex = 0
  private origin: Address = { x: 0, z: 0 }
  private disposed = false
  private atlas: Texture | null = null
  private treeMaterial: MeshStandardMaterial | null = null
  private readonly treeGeometries = [treeGeometry(0), treeGeometry(3)]
  constructor(scene: Scene, wake: () => void, private readonly surface: (x: number, z: number) => number = (x, z) => terrainAt(x, z).height) {
    void new TextureLoader().loadAsync(new URL('../scale-encounter/assets/environments/midground-mature-tree-atlas-v1-1024.webp', import.meta.url).href).then(texture => {
      if (this.disposed) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      this.atlas = texture
      this.treeMaterial = new MeshStandardMaterial({ map: texture, alphaTest: .4, side: DoubleSide, color: '#a8b899', roughness: 1, fog: true })
      wake()
    }).catch(() => { /* Retain the bounded procedural fallback if the optional atlas is unavailable. */ })
    this.shoreTexture.minFilter = LinearFilter; this.shoreTexture.magFilter = LinearFilter
    this.sky.frustumCulled = false; this.sky.renderOrder = -10
    this.water.rotation.x = -Math.PI / 2; this.water.position.y = -.7
    this.waterMaterial.onBeforeCompile = shader => {
      shader.uniforms.shoreProfile = { value: this.shoreTexture }; shader.uniforms.shoreOffset = this.shoreOffset
      shader.uniforms.wavePhase = this.wavePhase; shader.uniforms.flatWater = this.flatWater
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 waterWorld;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nwaterWorld = (modelMatrix * vec4(transformed,1.)).xyz;')
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D shoreProfile; uniform vec2 shoreOffset; uniform float flatWater; uniform vec2 wavePhase; varying vec3 waterWorld;')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          float a=waterWorld.x*.035+waterWorld.z*.045+wavePhase.x;
          float b=waterWorld.x*.09-waterWorld.z*.055+wavePhase.y;
          float fade=1.-smoothstep(150.,1500.,length(vViewPosition));
          vec2 gradient=vec2(cos(a)*.035*.8+cos(b)*.09*.25, cos(a)*.045*.8-cos(b)*.055*.25)*fade*(1.-flatWater);
          vec3 worldNormal=normalize(vec3(-gradient.x,1.,-gradient.y));
          normal=normalize(mat3(viewMatrix)*worldNormal);`)
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float shoreU=clamp((waterWorld.z-shoreOffset.y)/8192.,0.,1.);
        float coastX=texture2D(shoreProfile,vec2(shoreU,.5)).r-shoreOffset.x;
        float shallows=1.-smoothstep(5.,130.,abs(waterWorld.x-coastX));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.38,.32),shallows*.45);`)
        .replace('#include <opaque_fragment>', `float fresnel=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),5.);
        outgoingLight=mix(outgoingLight,vec3(.58,.72,.76),.035+fresnel*.32);
        #include <opaque_fragment>`)
    }
    const sun = new DirectionalLight('#fff0d7', 2.1); sun.position.set(-600, 650, -450)
    scene.add(new HemisphereLight('#d5e8f3', '#6e7151', 1.9), sun)
    this.root.add(this.sky, this.water); scene.add(this.root)
  }
  update(x: number, y: number, z: number, time: number, quality: 'low' | 'balanced') {
    this.sky.position.set(x - this.origin.x, y, z - this.origin.z)
    this.water.position.set(x - this.origin.x, -.7, z - this.origin.z)
    const shoreStart = Math.floor(z / 512) * 512 - 4096
    if (shoreStart !== this.shoreStart) {
      this.shoreStart = shoreStart
      for (let i = 0; i < 256; i++) this.shoreData[i] = coastAt(shoreStart + (i + .5) * 32)
      this.shoreTexture.needsUpdate = true
    }
    this.shoreOffset.value.set(this.origin.x, this.shoreStart - this.origin.z)
    this.flatWater.value = Number(this.review.flatWater)
    this.wavePhase.value.set(...waterPhases(this.origin.x, this.origin.z, this.review.freezeWater ? 0 : time))
    this.batches.forEach(batch => { batch.root.visible = !this.review.hideProps })
    const center = chunkAt(x, z), wanted = new Map<string, { address: Address; signature: string; near: boolean; distance: number }>()
    const radius = quality === 'low' ? 1 : 2
    for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
      const address = { x: center.x + dx, z: center.z + dz }, key = chunkKey(address)
      const distance = Math.hypot((address.x + .5) * 512 - x, (address.z + .5) * 512 - z)
      const wasNear = this.batches.get(key)?.signature.startsWith('near')
      const near = distance < (wasNear ? 780 : 650)
      const representation = near ? 'near' : distance > 1200 ? 'far' : 'mid'
      wanted.set(key, { address, near, distance, signature: `${representation}:${quality}:${Boolean(this.treeMaterial)}` })
    }
    for (const [key, batch] of this.batches) if (!wanted.has(key)) { this.releaseBatch(batch); this.batches.delete(key) }
    const pending = [...wanted.entries()].filter(([key, w]) => this.batches.get(key)?.signature !== w.signature).sort((a, b) => a[1].distance - b[1].distance)
    this.metrics.pending = pending.length; this.metrics.installedThisFrame = 0
    // One atomic batch, <=256 candidates and 192 KiB of instance buffers per frame.
    // Existing batches remain visible until their replacement is installed.
    const next = pending[0]
    if (next) {
      const start = performance.now(), [key, request] = next
      const batch = this.buildBatch(request.address, request.signature, request.near, quality)
      const previous = this.batches.get(key)
      if (previous) this.releaseBatch(previous)
      this.batches.set(key, batch); this.root.add(batch.root)
      this.metrics.installMs = performance.now() - start
      this.metrics.peakInstallMs = Math.max(this.metrics.peakInstallMs, this.metrics.installMs)
      this.metrics.installedThisFrame = 1; this.metrics.pending--
    }
    const batches = [...this.batches.values()]
    // Ground one resident batch against the currently displayed triangles per frame.
    if (batches.length && !next) batches[this.groundingIndex++ % batches.length]?.refresh()
    this.metrics.batches = batches.length; this.metrics.bytes = batches.reduce((sum, b) => sum + b.bytes, 0)
  }
  get busy() { return this.metrics.pending > 0 }
  private buildBatch(address: Address, signature: string, near: boolean, quality: 'low' | 'balanced'): PropBatch {
    const props = scatter(address).filter(p => p.priority < (quality === 'low' ? .55 : .85))
    const root = new Group(), dummy = new Object3D(), refreshers: (() => void)[] = []
    let bytes = 0
    const build = (selected: Prop[], geometry: BufferGeometry, material: Material, part: 'rock' | 'crown' | 'trunk' | 'atlas') => {
      if (!selected.length || bytes + selected.length * 76 > 192 * 1024) return
      const mesh = new InstancedMesh(geometry, material, selected.length); bytes += selected.length * 76
      const refresh = () => {
        selected.forEach((p, i) => {
          const ground = this.surface(p.x, p.z)
          dummy.position.set(p.x - address.x * 512, ground + (part === 'rock' ? p.scale * .25 : part === 'trunk' ? p.scale * .5 : 0), p.z - address.z * 512)
          dummy.rotation.set(0, p.yaw, 0)
          dummy.scale.setScalar(part === 'atlas' ? 6 + p.scale : p.scale)
          dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere()
      }
      refresh(); refreshers.push(refresh)
      selected.forEach((p, i) => mesh.setColorAt(i, new Color().setScalar(.88 + p.priority * .2)))
      root.add(mesh)
    }
    const rocks = props.filter(p => p.kind === 'rock'), trees = props.filter(p => p.kind === 'plant')
    const variant = (p: Prop) => Math.floor(hash(Math.floor(p.x), Math.floor(p.z), 61) * 3)
    this.rocks.forEach((g, i) => build(rocks.filter(p => variant(p) === i), g, this.rockMaterial, 'rock'))
    if (near || !this.treeMaterial || signature.startsWith('far')) {
      this.crowns.forEach((g, i) => build(trees.filter(p => variant(p) === i), g, this.crownMaterial, 'crown'))
      if (!signature.startsWith('far')) build(trees, this.trunkGeometry, this.trunkMaterial, 'trunk')
    } else this.treeGeometries.forEach((g, i) => build(trees.filter(p => variant(p) % 2 === i), g, this.treeMaterial!, 'atlas'))
    root.position.set(address.x * 512 - this.origin.x, 0, address.z * 512 - this.origin.z)
    root.visible = !this.review.hideProps
    return { address, root, signature, bytes, refresh: () => refreshers.forEach(refresh => refresh()) }
  }
  private releaseBatch(batch: PropBatch) { batch.root.traverse(o => { if (o instanceof InstancedMesh) o.dispose() }); batch.root.removeFromParent() }
  relocate(origin: Address) {
    this.origin = { ...origin };
    for (const batch of this.batches.values()) batch.root.position.set(batch.address.x * 512 - origin.x, 0, batch.address.z * 512 - origin.z)
  }
  private clearBatches() {
    this.batches.forEach(batch => { batch.root.traverse(o => { if (o instanceof InstancedMesh) o.dispose() }); batch.root.removeFromParent() })
    this.batches.clear()
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.shoreTexture.dispose()
    this.atlas?.dispose(); this.treeMaterial?.dispose(); this.treeGeometries.forEach(g => g.dispose())
    this.clearBatches()
    for (const mesh of [this.sky, this.water]) { mesh.geometry.dispose(); mesh.material.dispose() }
    for (const resource of [...this.rocks, ...this.crowns, this.trunkGeometry, this.rockMaterial, this.crownMaterial, this.trunkMaterial]) resource.dispose()
    this.root.removeFromParent()
  }
}
