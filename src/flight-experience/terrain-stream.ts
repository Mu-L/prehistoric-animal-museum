import { sampleDisplayed, type DisplayedSurface } from './displayed-surface'
import { Box3, Sphere, Vector3, TextureLoader, RepeatWrapping, SRGBColorSpace, Vector2, type Texture, BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { chunkWindow, localChunkPosition, type WantedChunk } from './chunk-window'
import { generateTerrain, resultBytes, validTerrainResult, type TerrainJob, type TerrainResult } from './terrain-protocol'
import { CHUNK_SIZE, WORLD, chunkAt, chunkKey, terrainAt, type Address } from './world'

let nextSession = 0
interface Resident extends DisplayedSurface { mesh: Mesh<BufferGeometry, MeshStandardMaterial> }
interface Slot { worker: Worker; job: TerrainJob | null; started: number }
export class TerrainStream {
  readonly root = new Group()
  readonly resident = new Map<string, Resident>()
  readonly material = new MeshStandardMaterial({ vertexColors: true, roughness: .96, metalness: 0 })
  readonly sessionId = ++nextSession
  readonly metrics = { generated: 0, rejected: 0, generationMs: 0, installMs: 0, readyBytes: 0, peakReadyBytes: 0, peakResident: 0, peakQueue: 0 }
  simplified = false
  private disposed = false
  private serial = 0
  private wanted = new Map<string, WantedChunk>()
  private prepared: TerrainResult[] = []
  private slots: Slot[] = []
  private failures = 0
  private surfaceTexture: Texture | null = null
  private readonly textureUniform = { value: null as Texture | null }
  private readonly textureReady = { value: 0 }
  private readonly surfaceOrigin = { value: new Vector2() }
  private readonly strataPhase = { value: 0 }
  private lastPlan = ''
  private fixedCenter: Address | null = null
  origin: Address = { x: 0, z: 0 }
  radius = 4
  constructor(private readonly wake: () => void, private readonly onFailure: () => void) {
    this.material.onBeforeCompile = shader => {
      shader.uniforms.flightSurface = this.textureUniform
      shader.uniforms.flightSurfaceReady = this.textureReady
      shader.uniforms.flightSurfaceOrigin = this.surfaceOrigin
      shader.uniforms.flightStrataPhase = this.strataPhase
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float coarseHeight; attribute float terrainBlend; attribute vec3 startNormal; attribute vec3 startColor; varying vec3 flightWorld;')
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = normalize(mix(startNormal, normal, terrainBlend));')
        .replace('#include <color_vertex>', '#include <color_vertex>\nvColor = mix(startColor, color, terrainBlend);')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y = mix(coarseHeight, position.y, terrainBlend);')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nflightWorld = (modelMatrix * vec4(transformed, 1.)).xyz;')
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D flightSurface; uniform float flightSurfaceReady; uniform vec2 flightSurfaceOrigin; uniform float flightStrataPhase; varying vec3 flightWorld;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec2 worldUV=flightWorld.xz+flightSurfaceOrigin;
          vec3 detail=texture2D(flightSurface,worldUV/32.).rgb;
          float grain=dot(detail,vec3(.3,.5,.2));
          float bands=.96+.04*sin(flightWorld.y*.3+sin(flightWorld.x*.013+flightStrataPhase)*3.);
          diffuseColor.rgb*=mix(1.,.65+grain*1.8,flightSurfaceReady*.65)*bands;`)
    }
    this.material.customProgramCacheKey = () => 'flight-terrain-morph-v1'
    this.createWorker()
    void new TextureLoader().loadAsync(new URL('../scale-encounter/assets/environments/surface-land-albedo-1024.webp', import.meta.url).href).then(texture => {
      if (this.disposed) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace; texture.wrapS = RepeatWrapping; texture.wrapT = RepeatWrapping
      this.surfaceTexture = texture; this.textureUniform.value = texture; this.textureReady.value = 1; this.wake()
    }).catch(() => { /* Vertex colours remain a complete fallback. */ })
  }
  private createWorker() {
    try {
      const worker = new Worker(new URL('./terrain.worker.ts', import.meta.url), { type: 'module' })
      const slot: Slot = { worker, job: null, started: 0 }
      worker.onmessage = (event: MessageEvent<unknown>) => {
        const job = slot.job; slot.job = null
        if (this.disposed || !job) return
        if (!validTerrainResult(event.data, job)) { this.metrics.rejected++; this.workerFailed(slot); return }
        const result = event.data, wanted = this.wanted.get(chunkKey(job.chunk))
        if (wanted?.lod !== job.lod || resultBytes(result) + this.metrics.readyBytes > 8 * 1024 * 1024 || this.prepared.length >= 8) {
          this.metrics.rejected++; return
        }
        this.metrics.generated++
        this.metrics.generationMs = result.generatedInMs
        this.prepared.push(result)
        this.metrics.readyBytes += resultBytes(result)
        this.metrics.peakReadyBytes = Math.max(this.metrics.peakReadyBytes, this.metrics.readyBytes)
        this.wake()
      }
      worker.onerror = () => this.workerFailed(slot)
      this.slots.push(slot)
    } catch { this.enterFallback() }
  }
  private workerFailed(slot: Slot) {
    slot.worker.terminate(); this.slots = this.slots.filter(s => s !== slot)
    if (this.disposed) return
    if (this.failures++ === 0) this.createWorker()
    else this.enterFallback()
    this.wake()
  }
  private enterFallback() { this.simplified = true; this.radius = 2; this.lastPlan = ''; this.onFailure() }
  plan(x: number, z: number, heading: number) {
    if (this.disposed) return
    const center = chunkAt(x, z)
    if (this.simplified) {
      this.fixedCenter ??= center
      x = (this.fixedCenter.x + .5) * CHUNK_SIZE; z = (this.fixedCenter.z + .5) * CHUNK_SIZE
    }
    const signature = `${chunkAt(x, z).x},${chunkAt(x, z).z}:${Math.round(x / 100)},${Math.round(z / 100)}:${Math.round(heading * 4)}:${this.radius}`
    if (signature === this.lastPlan) return
    this.lastPlan = signature
    this.wanted = chunkWindow(x, z, this.radius, heading, this.wanted)
    for (const [key, resident] of this.resident) if (!this.wanted.has(key)) {
      resident.mesh.removeFromParent(); resident.mesh.geometry.dispose(); this.resident.delete(key)
    }
    this.prepared = this.prepared.filter(r => this.wanted.get(chunkKey(r.chunk))?.lod === r.lod)
    this.metrics.readyBytes = this.prepared.reduce((sum, r) => sum + resultBytes(r), 0)
  }
  private job(item: WantedChunk): TerrainJob {
    return { type: 'generate', sessionId: this.sessionId, requestId: ++this.serial, world: WORLD,
      chunk: item.chunk, lod: item.lod, configHash: 'terrain-v1' }
  }
  update(delta: number, dispatch: boolean) {
    if (this.disposed || !dispatch) return
    for (const resident of this.resident.values()) if (resident.morph < 1) {
      resident.morph = Math.min(1, resident.morph + delta / .8)
      const attribute = resident.mesh.geometry.getAttribute('terrainBlend')
      ;(attribute.array as Float32Array).fill(resident.morph)
      attribute.needsUpdate = true
    }
    if (!dispatch) return
    const ordered = [...this.wanted.entries()].sort((a, b) => a[1].priority - b[1].priority)
    // One bounded coarse tile per frame fills holes first, including behind the camera.
    const missing = ordered.find(([key]) => !this.resident.has(key))
    if (missing) this.install(generateTerrain(this.job({ ...missing[1], lod: 3 })))
    else {
      const result = this.prepared.shift()
      if (result) {
        this.metrics.readyBytes -= resultBytes(result)
        if (this.wanted.get(chunkKey(result.chunk))?.lod === result.lod) this.install(result)
      }
    }
    if (this.simplified) return
    const pending = new Set([...this.slots.flatMap(s => s.job ? [chunkKey(s.job.chunk)] : []), ...this.prepared.map(r => chunkKey(r.chunk))])
    const candidates = ordered.filter(([key, item]) => this.resident.get(key)?.result.lod !== item.lod && !pending.has(key)).slice(0, this.radius === 4 ? 24 : 48)
    this.metrics.peakQueue = Math.max(this.metrics.peakQueue, candidates.length)
    for (const slot of [...this.slots]) {
      if (slot.job && performance.now() - slot.started > 8000) { this.workerFailed(slot); continue }
      if (slot.job || this.prepared.length >= 8 || this.metrics.readyBytes > 7 * 1024 * 1024) continue
      const next = candidates.shift()
      if (!next) break
      slot.job = this.job(next[1]); slot.started = performance.now()
      slot.worker.postMessage(slot.job)
    }
  }
  private install(result: TerrainResult) {
    const start = performance.now(), key = chunkKey(result.chunk), previous = this.resident.get(key)
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(result.positions, 3))
    geometry.setAttribute('normal', new BufferAttribute(result.normals, 3))
    geometry.setAttribute('color', new BufferAttribute(result.colors, 3))
    const morph = new Float32Array(result.coarseHeights.length)
    const startNormals = result.normals.slice(), startColors = result.colors.slice()
    if (previous) {
      for (let i = 0; i < morph.length; i++) {
        const sample = sampleDisplayed(previous, result.positions[i * 3]!, result.positions[i * 3 + 2]!)
        result.coarseHeights[i] = sample.height
        startNormals.set(sample.normal, i * 3); startColors.set(sample.color, i * 3)
      }
    } else { result.coarseHeights.set(result.positions.filter((_, i) => i % 3 === 1)); morph.fill(1) }
    geometry.setAttribute('startNormal', new BufferAttribute(startNormals, 3))
    geometry.setAttribute('startColor', new BufferAttribute(startColors, 3))
    geometry.setAttribute('coarseHeight', new BufferAttribute(result.coarseHeights, 1))
    geometry.setAttribute('terrainBlend', new BufferAttribute(morph, 1))
    geometry.setIndex(new BufferAttribute(result.indices, 1))
    geometry.boundingBox = new Box3(new Vector3(0, Math.min(result.bounds[1], ...result.coarseHeights), 0), new Vector3(CHUNK_SIZE, Math.max(result.bounds[4], ...result.coarseHeights), CHUNK_SIZE))
    geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new Sphere())
    const mesh = new Mesh(geometry, this.material), local = localChunkPosition(result.chunk, this.origin)
    mesh.position.set(local.x, 0, local.z); this.root.add(mesh)
    this.resident.set(key, { mesh, result, morph: previous ? 0 : 1, startNormals, startColors })
    if (previous) { previous.mesh.removeFromParent(); previous.mesh.geometry.dispose() }
    this.metrics.peakResident = Math.max(this.metrics.peakResident, this.resident.size)
    this.metrics.installMs = performance.now() - start
  }
  relocate(origin: Address) {
    this.origin = { ...origin }
    this.surfaceOrigin.value.set(origin.x % 32, origin.z % 32)
    this.strataPhase.value = (origin.x * .013) % (Math.PI * 2)
    for (const resident of this.resident.values()) {
      const local = localChunkPosition(resident.result.chunk, origin)
      resident.mesh.position.set(local.x, 0, local.z)
    }
  }
  displayedHeight(x: number, z: number) {
    const address = chunkAt(x, z), resident = this.resident.get(chunkKey(address))
    return resident ? sampleDisplayed(resident, x - address.x * CHUNK_SIZE, z - address.z * CHUNK_SIZE).height : terrainAt(x, z).height
  }
  get ready() { return this.resident.size >= this.wanted.size && this.wanted.size > 0 && (this.simplified || [...this.wanted.entries()].every(([key, item]) => item.lod > 1 || this.resident.get(key)?.result.lod === item.lod)) }
  get busy() { return !this.ready || this.prepared.length > 0 || this.slots.some(s => s.job !== null) }
  safeToEnter(x: number, z: number) {
    return [-100, 0, 100].every(dx => [-100, 0, 100].every(dz => this.resident.has(chunkKey(chunkAt(x + dx, z + dz)))))
  }
  diagnostics() {
    return { ...this.metrics, resident: this.resident.size, prepared: this.prepared.length,
      pending: this.slots.filter(s => s.job).length, sessionId: this.sessionId, simplified: this.simplified,
      geometryBytes: [...this.resident.values()].reduce((n, r) => n + resultBytes(r.result) + r.startColors.byteLength + r.startNormals.byteLength, 0) }
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.slots.forEach(s => s.worker.terminate()); this.slots = []
    this.prepared = []; this.wanted.clear(); this.metrics.readyBytes = 0
    this.resident.forEach(r => r.mesh.geometry.dispose()); this.resident.clear()
    this.root.clear(); this.root.removeFromParent(); this.material.dispose(); this.surfaceTexture?.dispose()
  }
}
