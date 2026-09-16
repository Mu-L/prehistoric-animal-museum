import { decorateShadowFade } from '../environment/shadow-fade'
import { Group, InstancedMesh, Matrix4, Mesh, Object3D, Vector3, Texture, type BufferGeometry, type Material } from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import assetUrl from '../assets/landscape/landscape-samples.glb?url'
import { scatter, chunkAt, type Address, type Prop } from '../world'
import { loadPropImpostors } from './prop-impostors'
import type { PropLandmark } from './prop-obstacles'
import { cellKey, dimensions, propLod, PROP_CELL_SIZE, PROP_CELL_RADII, PROP_INSTANCE_CAPACITY } from './prop-lod'

type Quality = 'low' | 'balanced'
interface ScatterSource { scatter(address: Address): Prop[] }
interface Pool { meshes: InstancedMesh[]; free: number[]; next: number; live: number }
interface Instance { prop: Prop; lod: number; pool: Pool; slot: number; fixedScale?: number; fixedY?: number }
interface Cell { key: string; x: number; z: number; quality: Quality; instances: Instance[]; signature: string }
const hiddenMatrix = new Matrix4().makeScale(0, 0, 0)
function disposeMaterials(materials: Set<Material>) {
  const textures = new Set<Texture>()
  for (const material of materials) for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value as Texture)
  textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose())
}
/** Global instance pools keep draw calls independent of cell count. Cells own slots,
 * not geometry or materials. A replacement is prepared before releasing its old slots.
 * Only one <=16-candidate cell is installed and one is regrounded per update. */
export class PropStream {
  readonly root = new Group()
  readonly metrics = { pending: 0, installMs: 0, peakInstallMs: 0, installedThisFrame: 0, bytes: 0, batches: 0, instances: 0, cells: 0, nearInstances: 0, ready: false, failed: false }
  private readonly cells = new Map<string, Cell>()
  private readonly tileCandidates = new Map<string, Prop[]>()
  private readonly pools = new Map<string, Pool>()
  private readonly geometries = new Set<BufferGeometry>()
  private readonly materials = new Set<Material>()
  private readonly transform = new Object3D()
  private origin = { x: 0, z: 0 }
  private released = false
  private readonly groundDirty = new Set<string>()
  private ready = false
  private readonly loadTimeout: ReturnType<typeof setTimeout>
  private landmarks: PropLandmark[] = []
  private landmarkInstances: Instance[] = []
  private landmarksDirty = false
  constructor(parent: Group, private readonly wake: () => void, private readonly surface: (x: number, z: number) => number, private readonly sampler: ScatterSource = { scatter }, private readonly decorateMaterial: (material: Material) => void = () => {}) {
    this.root.name = 'flight-props-128m'; parent.add(this.root)
    this.loadTimeout=setTimeout(()=>{if(!this.released&&!this.ready){this.metrics.failed=true;this.wake()}},20000)
    Promise.resolve().then(() => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(assetUrl)).then(async gltf => {
      const geometrySet = new Set<BufferGeometry>(), materialSet = new Set<Material>()
      gltf.scene.traverse(object => { if (object instanceof Mesh) { const typed = object as Mesh<BufferGeometry, Material | Material[]>; geometrySet.add(typed.geometry); for (const material of Array.isArray(typed.material) ? typed.material : [typed.material]) materialSet.add(material) } })
      if (this.released || this.metrics.failed) { geometrySet.forEach(g => g.dispose()); disposeMaterials(materialSet); return }
      let impostors: Awaited<ReturnType<typeof loadPropImpostors>>
      try { impostors = await loadPropImpostors() } catch (error) {
        geometrySet.forEach(g => g.dispose()); disposeMaterials(materialSet); throw error
      }
      if (this.released || this.metrics.failed) { for (const parts of impostors.values()) for (const part of parts) { part.geometry.dispose(); part.material.map?.dispose(); part.material.dispose() }; geometrySet.forEach(g => g.dispose()); disposeMaterials(materialSet); return }
      gltf.scene.updateMatrixWorld(true)
      for (const object of gltf.scene.children) {
        if (!/^(tree|rock|cliff)-.*-lod[012]$/.test(object.name)) continue
        const pool: Pool = { meshes: [], free: [], next: 0, live: 0 }
        const silhouette = object.name.startsWith('tree-') && object.name.endsWith('-lod2') ? impostors.get(object.name.replace('-lod2', '')) : undefined
        if (silhouette) for (const part of silhouette) {
          this.geometries.add(part.geometry); this.materials.add(part.material)
          const mesh = new InstancedMesh(part.geometry, part.material, PROP_INSTANCE_CAPACITY)
          mesh.name = object.name; mesh.count = 0; mesh.frustumCulled = false; mesh.receiveShadow = true; pool.meshes.push(mesh); this.root.add(mesh)
        }
        if (!silhouette) object.traverse(part => {
          if (!(part instanceof Mesh)) return
          const typed = part as Mesh<BufferGeometry, Material | Material[]>
          const geometry = typed.geometry.clone(); geometry.applyMatrix4(part.matrixWorld)
          this.geometries.add(geometry)
          for (const material of Array.isArray(typed.material) ? typed.material : [typed.material]) this.materials.add(material)
          const mesh = new InstancedMesh(geometry, typed.material, PROP_INSTANCE_CAPACITY)
          mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = object.name.endsWith('lod0'); mesh.receiveShadow = true
          mesh.name = object.name; pool.meshes.push(mesh); this.root.add(mesh)
        })
        this.pools.set(object.name, pool)
      }
      geometrySet.forEach(g => g.dispose())
      // The cliff only appears via explicit landmarks with matching obstacle metadata.
      materialSet.forEach(m => { if (!this.materials.has(m)) m.dispose() })
      this.materials.forEach(decorateShadowFade)
      this.materials.forEach(this.decorateMaterial)
      this.ready = true; this.metrics.ready = true
      this.metrics.bytes = [...this.pools.values()].reduce((sum, p) => sum + p.meshes.reduce((s, m) => s + m.instanceMatrix.array.byteLength, 0), 0)
      const textures = new Set<Texture>()
      for (const material of this.materials) for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value as Texture)
      this.metrics.bytes += [...textures].reduce((sum, texture) => { const source = texture.image as { width?: number; height?: number } | undefined; return sum + (source?.width ?? 0) * (source?.height ?? 0) * 4 * 4 / 3 }, 0)
      this.metrics.bytes += [...this.geometries].reduce((sum, g) => sum + Object.values(g.attributes).reduce((s, a) => s + a.array.byteLength, 0) + (g.index?.array.byteLength ?? 0), 0)
      this.wake()
    }).catch(() => { if (!this.released) { this.metrics.failed = true; this.wake() } }).finally(()=>clearTimeout(this.loadTimeout))
  }
  markGroundDirty(worldTileKeys: string[]) {
    for (const tileKey of worldTileKeys) {
      const coordinate = tileKey.split(':').at(-1) ?? tileKey
      const [tx, tz] = coordinate.split(',').map(Number)
      if (tx === undefined || tz === undefined || !Number.isFinite(tx) || !Number.isFinite(tz)) continue
      for (let z = tz * 4; z < tz * 4 + 4; z++) for (let x = tx * 4; x < tx * 4 + 4; x++) {
        const key = `${x},${z}`; if (this.cells.has(key)) this.groundDirty.add(key)
      }
    }
  }
  setLandmarks(landmarks: readonly PropLandmark[]) {
    this.landmarks = landmarks.slice(0, 2).map(l => ({ ...l })); this.landmarksDirty = true
  }
  get busy() { return !this.metrics.failed && (!this.ready || this.metrics.pending > 0) }
  set visible(value: boolean) { this.root.visible = value }
  update(x: number, y: number, z: number, quality: Quality) {
    if (this.released || !this.ready) return
    if (this.landmarksDirty) {
      this.releaseCell({ instances: this.landmarkInstances } as Cell); this.landmarkInstances = []
      for (const landmark of this.landmarks) {
        const pool = this.pools.get(`${landmark.asset}-lod0`); if (!pool) continue
        const slot = pool.free.pop() ?? pool.next++; pool.live++
        const instance: Instance = { prop: { ...landmark, kind: 'rock', priority: 0 }, lod: 0, pool, slot, fixedScale: landmark.scale, fixedY: landmark.y }
        this.place(instance); this.landmarkInstances.push(instance)
      }
      this.landmarksDirty = false
    }
    const start = performance.now(), cx = Math.floor(x / PROP_CELL_SIZE), cz = Math.floor(z / PROP_CELL_SIZE), radius = PROP_CELL_RADII[quality]
    const nearby: Prop[] = []
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) nearby.push(...this.candidates(cx + dx, cz + dz))
    const nearIds = new Set(nearby.filter(p => p.priority < (quality === 'low' ? .55 : .85)).sort((a, b) => Math.hypot(a.x - x, a.y - y, a.z - z) - Math.hypot(b.x - x, b.y - y, b.z - z)).slice(0, quality === 'low' ? 12 : 24).map(p => p.id))
    const chooseLod = (p: Prop, previous?: number) => { const lod = propLod(Math.hypot(p.x - x, p.y - y, p.z - z), previous); return lod === 0 && !nearIds.has(p.id) ? 1 : lod }
    const wanted = new Set<string>(), pending: { key: string; x: number; z: number; props: Prop[]; signature: string; distance: number }[] = []
    for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
      const ax = cx + dx, az = cz + dz, key = `${ax},${az}`; wanted.add(key)
      const previous = this.cells.get(key), props = this.candidates(ax, az).filter(p => p.priority < (quality === 'low' ? .55 : .85))
      const signature = props.map(p => `${p.id}:${chooseLod(p, previous?.instances.find(i => i.prop.id === p.id)?.lod)}`).join('|')
      if (!previous || signature !== previous.signature || previous.quality !== quality) pending.push({ key, x: ax, z: az, props, signature, distance: Math.hypot((ax + .5) * PROP_CELL_SIZE - x, (az + .5) * PROP_CELL_SIZE - z) })
    }
    for (const [key, cell] of this.cells) if (!wanted.has(key)) { this.releaseCell(cell); this.cells.delete(key); this.groundDirty.delete(key) }
    pending.sort((a, b) => a.distance - b.distance)
    this.metrics.installedThisFrame = 0
    const next = pending[0]
    if (next) {
      const previous = this.cells.get(next.key), instances: Instance[] = []
      for (const prop of next.props) {
        const lod = chooseLod(prop, previous?.instances.find(i => i.prop.id === prop.id)?.lod)
        const pool = this.pools.get(`${dimensions(prop).asset}-lod${lod}`)
        if (!pool) continue
        const slot = pool.free.pop() ?? (pool.next < PROP_INSTANCE_CAPACITY ? pool.next++ : undefined)
        if (slot === undefined) continue
        pool.live++; const instance = { prop, lod, pool, slot }; this.place(instance); instances.push(instance)
      }
      if (previous) this.releaseCell(previous)
      this.cells.set(next.key, { key: next.key, x: next.x, z: next.z, quality, instances, signature: next.signature })
      this.metrics.installedThisFrame = 1
    }
    // Bounded refresh follows morphing displayed surfaces, including paused buffering.
    const dirty = [...this.groundDirty].map(key => this.cells.get(key)).filter((cell): cell is Cell => Boolean(cell)).sort((a, b) => Math.hypot((a.x + .5) * PROP_CELL_SIZE - x, (a.z + .5) * PROP_CELL_SIZE - z) - Math.hypot((b.x + .5) * PROP_CELL_SIZE - x, (b.z + .5) * PROP_CELL_SIZE - z))[0]
    if (dirty) { for (const instance of dirty.instances) this.place(instance); this.groundDirty.delete(dirty.key) }
    // Tile candidate cache is bounded to resident cell ownership.
    const tiles = new Set([...wanted].map(key => { const [ax = 0, az = 0] = key.split(',').map(Number); return `${Math.floor(ax / 4)},${Math.floor(az / 4)}` }))
    for (const key of this.tileCandidates.keys()) if (!tiles.has(key)) this.tileCandidates.delete(key)
    this.metrics.pending = Math.max(0, pending.length - (next ? 1 : 0)); this.metrics.cells = this.cells.size
    this.metrics.instances = [...this.pools.values()].reduce((sum, p) => sum + p.live, 0)
    this.metrics.nearInstances = [...this.pools.entries()].reduce((sum, [name, p]) => sum + (name.endsWith('lod0') ? p.live : 0), 0)
    for (const [name, pool] of this.pools) for (const mesh of pool.meshes) { mesh.visible = pool.live > 0; mesh.castShadow = name.endsWith('lod0') && this.metrics.nearInstances <= 32 }
    this.metrics.batches = [...this.pools.values()].reduce((sum, p) => sum + (p.live ? p.meshes.length : 0), 0)
    this.metrics.installMs = performance.now() - start; this.metrics.peakInstallMs = Math.max(this.metrics.peakInstallMs, this.metrics.installMs)
  }
  private candidates(x: number, z: number) {
    const address = chunkAt(x * PROP_CELL_SIZE, z * PROP_CELL_SIZE), key = `${address.x},${address.z}`
    let props = this.tileCandidates.get(key)
    if (!props) { props = this.sampler.scatter(address); this.tileCandidates.set(key, props) }
    return props.filter(p => cellKey(p.x, p.z) === `${x},${z}`)
  }
  private place(instance: Instance) {
    const { prop, pool, slot } = instance
    const ground = this.surface(prop.x, prop.z)
    this.transform.position.set(prop.x - this.origin.x, instance.fixedY ?? (Number.isFinite(ground) ? ground : prop.y), prop.z - this.origin.z)
    this.transform.rotation.set(0, prop.yaw, 0); this.transform.scale.setScalar(instance.fixedScale ?? dimensions(prop).scale); this.transform.updateMatrix()
    for (const mesh of pool.meshes) { mesh.setMatrixAt(slot, this.transform.matrix); mesh.count = pool.next; mesh.instanceMatrix.needsUpdate = true }
  }
  private releaseCell(cell: Cell) {
    for (const { pool, slot } of cell.instances) { pool.live--; pool.free.push(slot); for (const mesh of pool.meshes) { mesh.setMatrixAt(slot, hiddenMatrix); mesh.instanceMatrix.needsUpdate = true } }
  }
  relocate(origin: { x: number; z: number }) {
    const delta = new Vector3(this.origin.x - origin.x, 0, this.origin.z - origin.z), matrix = new Matrix4()
    this.origin = { ...origin }
    // Rare origin event: same bounded live matrices, no world/seed resampling.
    for (const { pool, slot } of [...this.cells.values()].flatMap(cell => cell.instances).concat(this.landmarkInstances)) for (const mesh of pool.meshes) {
      mesh.getMatrixAt(slot, matrix); matrix.elements[12] += delta.x; matrix.elements[14] += delta.z; mesh.setMatrixAt(slot, matrix); mesh.instanceMatrix.needsUpdate = true
    }
  }
  dispose() {
    if (this.released) return
    this.released = true; clearTimeout(this.loadTimeout); this.root.removeFromParent()
    this.root.traverse(o => { if (o instanceof InstancedMesh) o.dispose() })
    this.geometries.forEach(g => g.dispose())
    const textures = new Set<Texture>()
    for (const material of this.materials) for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value as Texture)
    textures.forEach(t => t.dispose()); this.materials.forEach(m => m.dispose()); this.cells.clear(); this.tileCandidates.clear(); this.pools.clear(); this.landmarkInstances = []; this.landmarks = []; this.groundDirty.clear(); this.geometries.clear(); this.materials.clear(); this.root.clear()
    this.metrics.pending = 0; this.metrics.instances = 0; this.metrics.cells = 0; this.metrics.bytes = 0
  }
}
