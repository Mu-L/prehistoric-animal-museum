import { decorateShadowFade } from './environment/shadow-fade'
import { coastValleyLandmarks, createLandscapeSurface, scenicRouteAnchors } from './world-presets/coast-valley'
import { DEFAULT_FLIGHT_SETTINGS, framingDistance, spawnState, type FlightSettings } from './settings'
import { NormalAnimationBlendMode, AnimationClip, type AnimationAction, Box3, Mesh, type Material, type BufferGeometry, Fog, Group, PerspectiveCamera, Scene, Vector3 } from 'three'
import type { StagedViewerModel, ViewerController, ViewerModelDescriptor } from 'virtual:viewer-controller'
import type { ExperienceLease, ExternalExperience } from '../viewer/external-experience'
import { FlightInputState } from './input'
import { FlightSimulation, type RenderState } from './simulation'
import { cameraPathSafe, followOffset } from './camera'
import { CHUNK_SIZE, WORLD, createWorldSampler, type WorldConfig, type WorldSampler, type Address } from './world'
import type { SolarPreset } from './environment/environment-state'
import type { CaptureAnchor } from './review-anchors'
import { FlightScenery } from './scenery'
import { TerrainStream } from './terrain-stream'
import glideData from './assets/pteranodon-glide.json'
export type FlightPhase = 'preparing' | 'buffering' | 'ready' | 'flying' | 'paused' | 'recovering' | 'closed'
export type PauseReason = 'user' | 'hidden' | 'settings' | 'terrain' | 'safety' | 'camera' | 'context' | 'error'
export interface FlightSnapshot {
  phase: FlightPhase; reason: PauseReason | null; simplified: boolean
  region: ReturnType<WorldSampler['regionAt']>; gentle: boolean; assisted: boolean; quality: 'low' | 'balanced'; settings: FlightSettings
}
export class FlightRuntime implements ExternalExperience {
  readonly scene = new Scene()
  readonly camera = new PerspectiveCamera(55, 1, .5, 6000)
  readonly input = new FlightInputState()
  readonly simulation: FlightSimulation
  readonly world: WorldSampler
  private readonly safeSurface: (x:number,z:number)=>number
  readonly shadowsEnabled = true
  private reviewPitch = 0
  private renderMetrics = { cpuMs:0,calls:0,triangles:0,geometries:0,textures:0 }
  private readonly cpuTimes: number[] = []
  private readonly gpuTimes: number[] = []
  readonly root = new Group()
  readonly pose = new Group()
  readonly terrain: TerrainStream
  readonly scenery: FlightScenery
  private readonly abort = new AbortController()
  private lease: ExperienceLease | null = null
  private model: StagedViewerModel | null = null
  private glideAction: AnimationAction | null = null
  private glideWeight = 0
  private disposed = false
  private origin: Address = { x: 0, z: 0 }
  private cameraInitialized = false
  private contextAvailable = true
  private snapshot: FlightSnapshot = { phase: 'preparing', reason: null, simplified: false, region: 'coast', gentle: false, assisted: false, quality: 'low', settings: { ...DEFAULT_FLIGHT_SETTINGS } }
  private readonly listeners = new Set<() => void>()
  private readonly frameTimes: number[] = []
  private slowSeconds = 0
  private reportingSeconds = 0
  private originShifts = 0
  private cameraOffset = new Vector3(0, 5, 17)
  private animationTime = 0
  private readonly followPosition = new Vector3()
  private readonly lookPosition = new Vector3()
  constructor(private readonly controller: ViewerController, gentle: boolean, settings: FlightSettings = DEFAULT_FLIGHT_SETTINGS, worldConfig: WorldConfig = WORLD) {
    this.world = createWorldSampler(worldConfig)
    const landmarks=coastValleyLandmarks(this.world)
    this.safeSurface=createLandscapeSurface(this.world,landmarks)
    this.simulation = new FlightSimulation(this.safeSurface, scenicRouteAnchors(this.world))
    this.snapshot.settings = { ...settings }
    const spawn = spawnState(settings, this.world); Object.assign(this.simulation.position, spawn.position); this.simulation.heading = spawn.heading
    this.simulation.cruiseSpeed = settings.speed; this.simulation.speed = settings.speed; this.simulation.clearAccumulator()
    this.snapshot.gentle = gentle || settings.gentle; this.simulation.gentle = this.snapshot.gentle
    this.scene.fog = new Fog('#b8d0d3', 750, 1650)
    this.root.add(this.pose); this.scene.add(this.root)
    this.scenery = new FlightScenery(this.scene, () => this.lease?.invalidate(), (x, z) => this.terrain.displayedHeight(x, z), this.world)
    this.scenery.props.setLandmarks(landmarks)
    this.terrain = new TerrainStream(() => this.lease?.invalidate(), () => this.publish({ simplified: true }), worldConfig)
    this.scenery.environment.fog.decorate(this.terrain.material)
    this.scene.add(this.terrain.root)
    this.setQuality(settings.quality, false)
  }
  async prepare(descriptor: ViewerModelDescriptor) {
    const timeout = window.setTimeout(() => { this.abort.abort(); this.fail(new Error('flight-model-timeout')) }, 20000)
    try {
      this.lease = this.controller.acquireExternalExperience(this)
      this.terrain.plan(this.simulation.position.x, this.simulation.position.z, this.simulation.heading, this.simulation.position.y)
      const model = await this.controller.stageModel(descriptor, this.abort.signal)
      if (this.disposed) { this.controller.disposeStagedModel(model); return }
      this.model = model
      if (model.mixer && model.action) {
        this.glideAction = model.mixer.clipAction(AnimationClip.parse({ ...glideData, blendMode: NormalAnimationBlendMode }))
        this.glideAction.setEffectiveWeight(0).play()
      }
      model.modelRoot.rotation.set(0, 0, 0); model.modelRoot.updateMatrixWorld(true)
      const bounds = new Box3().setFromObject(model.modelRoot, true), size = bounds.getSize(new Vector3())
      const correction = new Group(); correction.scale.setScalar(7 / Math.max(size.x, size.z))
      correction.rotation.y = Math.PI
      model.modelRoot.position.sub(bounds.getCenter(new Vector3()))
      correction.add(model.group); this.pose.add(correction)
      model.group.traverse(object => { if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true;const mesh=object as Mesh<BufferGeometry,Material|Material[]>; for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){ decorateShadowFade(material); this.scenery.environment.fog.decorate(material) } } })
      this.lease.invalidate()
    } catch (error) { if (!this.disposed) this.fail(error) } finally { window.clearTimeout(timeout) }
  }
  get pixelRatio() { return this.snapshot.quality === 'low' ? 1 : 1.5 }
  get running() { return !this.disposed && (this.snapshot.phase === 'flying' || this.snapshot.phase === 'preparing' || this.snapshot.phase === 'buffering' || (['ready','paused'].includes(this.snapshot.phase) && this.snapshot.reason !== 'hidden' && this.contextAvailable && this.scenery.busy)) }
  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  private publish(patch: Partial<FlightSnapshot>) {
    if (this.disposed) return
    const next = { ...this.snapshot, ...patch }
    if (JSON.stringify(next) === JSON.stringify(this.snapshot)) return
    this.snapshot = next; this.listeners.forEach(l => l())
  }
  get canResume() {
    return ['ready', 'paused'].includes(this.snapshot.phase) && this.contextAvailable &&
      !this.simulation.safetyStop && !['camera', 'safety', 'error'].includes(this.snapshot.reason ?? '') && this.terrain.ready
  }
  start() {
    if (!this.canResume) {
      if (['ready', 'paused'].includes(this.snapshot.phase) && this.contextAvailable && !this.terrain.ready && !this.simulation.safetyStop)
        this.publish({ phase: 'buffering', reason: 'terrain' })
      this.lease?.invalidate(); return
    }
    this.input.clear(); this.simulation.clearAccumulator(); this.animationTime = this.simulation.time
    this.publish({ phase: 'flying', reason: null }); this.lease?.invalidate()
  }
  pause(reason: PauseReason = 'user') {
    this.input.clear(); this.simulation.clearAccumulator(); this.animationTime = this.simulation.time
    if (this.snapshot.phase === 'flying' || this.snapshot.phase === 'buffering')
      this.publish({ phase: reason === 'terrain' ? 'buffering' : 'paused', reason })
  }
  turnReview(degrees: number) {
    const state = this.simulation.renderState()
    this.applyCaptureAnchor({id:'heading-check',world:this.world.config,position:state.position,heading:state.heading+degrees*Math.PI/180,view:this.snapshot.settings.view,pitch:this.reviewPitch,presentationSeconds:state.time,preset:this.scenery.preset})
  }
  pitchReview(pitch: number) { this.reviewPitch=pitch;this.refreshReview() }
  setReviewPreset(preset: SolarPreset) { this.scenery.preset = preset; this.refreshReview() }
  refreshReview() { this.terrain.update(0, false); this.lease?.invalidate() }
  configure(settings: FlightSettings) { this.simulation.cruiseSpeed = settings.speed; this.setGentle(settings.gentle); if (settings.quality !== this.snapshot.quality) this.setQuality(settings.quality); this.publish({ settings: { ...settings, start: this.snapshot.settings.start, height: this.snapshot.settings.height } }); this.lease?.invalidate() }
  setGentle(gentle: boolean) { this.simulation.gentle = gentle; this.publish({ gentle }) }
  assist() { this.simulation.assisted = true; this.publish({ assisted: true }); this.start() }
  setQuality(quality: 'low' | 'balanced', pause = true) {
    if (pause) this.pause('settings'); this.terrain.radius = this.terrain.simplified ? 2 : quality === 'low' ? 4 : 6
    const fog = this.scene.fog as Fog
    fog.near = quality === 'low' ? 750 : 1200; fog.far = quality === 'low' ? 1650 : 2400
    if (pause && ['ready', 'paused'].includes(this.snapshot.phase)) {
      const p = this.simulation.position; this.terrain.plan(p.x, p.z, this.simulation.heading, this.simulation.position.y)
      this.publish({ phase: 'buffering', reason: 'terrain' })
    }
    this.publish({ quality }); this.lease?.invalidate()
  }
  update(deltaSeconds: number) {
    if (this.disposed) return
    const preparing = this.snapshot.phase === 'preparing', buffering = this.snapshot.phase === 'buffering', flying = this.snapshot.phase === 'flying'
    const p = this.simulation.position
    if (preparing || flying || buffering) {
      this.terrain.plan(p.x, p.z, this.simulation.heading, this.simulation.position.y)
      this.terrain.update(buffering ? 0 : deltaSeconds, true)
    }
    if (buffering && this.terrain.ready) this.publish({ phase: 'paused', reason: null })
    if (preparing && this.model && this.terrain.ready) this.publish({ phase: 'ready' })
    if (flying) {
      const horizon = Math.max(120, this.simulation.speed * 6)
      const aheadX = p.x + Math.sin(this.simulation.heading) * horizon
      const aheadZ = p.z - Math.cos(this.simulation.heading) * horizon
      if (!this.terrain.safeToEnter(aheadX, aheadZ)) this.pause('terrain')
      else {
        this.simulation.advance(deltaSeconds, this.input.read())
        const render = this.simulation.renderState()
        const advanced = Math.max(0, render.time - this.animationTime)
        this.animationTime = render.time
        if (this.glideAction && this.model?.action) {
          const glideTarget = render.climbRate > 1 ? 0 : Math.sin(render.time * .23) > -.3 ? .95 : 0
          this.glideWeight += (glideTarget - this.glideWeight) * (1 - Math.exp(-advanced * 1.8))
          this.glideAction.setEffectiveWeight(this.glideWeight)
          this.model.action.setEffectiveWeight(1 - this.glideWeight)
        }
        this.model?.mixer?.update(advanced)
        if (this.simulation.safetyStop) this.pause('safety')
      }
      this.frameTimes.push(deltaSeconds * 1000)
      if (this.frameTimes.length > 3600) this.frameTimes.shift()
      this.slowSeconds = deltaSeconds > .036 ? this.slowSeconds + deltaSeconds : Math.max(0, this.slowSeconds - deltaSeconds * .3)
      if (this.slowSeconds > 8 && this.snapshot.quality === 'balanced') { this.setQuality('low', false); this.slowSeconds = 0 }
    }
    if (Math.max(Math.abs(p.x - this.origin.x), Math.abs(p.z - this.origin.z)) > 2048) {
      const next = { x: Math.floor(p.x / CHUNK_SIZE) * CHUNK_SIZE, z: Math.floor(p.z / CHUNK_SIZE) * CHUNK_SIZE }
      this.camera.position.x -= next.x - this.origin.x; this.camera.position.z -= next.z - this.origin.z
      this.origin = next; this.originShifts++; this.terrain.relocate(next); this.scenery.relocate(next)
    }
    const render = this.simulation.renderState(), rp = render.position
    this.root.position.set(rp.x - this.origin.x, rp.y, rp.z - this.origin.z)
    this.root.rotation.y = -render.heading
    this.pose.rotation.z = -render.turnRate * (this.snapshot.gentle ? .6 : .78)
    this.pose.rotation.x = render.climbRate * .025
    this.updateCamera(render, flying ? Math.min(deltaSeconds, 1 / 15) : 0)
    this.scenery.props.markGroundDirty(this.terrain.consumeGroundDirty())
    this.scenery.update(rp.x, rp.y, rp.z, render.time, this.snapshot.quality, this.camera)
    if (this.scenery.metrics.failed) this.publish({simplified:true})
    const environment = this.scenery.environment.frame
    ;(this.scene.fog as Fog).color.setRGB(...environment.horizon)
    for (const resident of this.terrain.resident.values()) {
      const bounds = resident.mesh.geometry.boundingSphere
      resident.mesh.receiveShadow = true
      resident.mesh.castShadow = Math.hypot(resident.mesh.position.x + (bounds?.center.x ?? 256) - this.root.position.x, resident.mesh.position.z + (bounds?.center.z ?? 256) - this.root.position.z) < 600
    }
    this.reportingSeconds += deltaSeconds
    if (this.reportingSeconds > 1 || preparing) {
      this.reportingSeconds = 0
      this.publish({ region: this.world.regionAt(p.x, p.z), assisted: this.simulation.assisted })
    }
  }
  private updateCamera(render: RenderState, delta: number) {
    const p = render.position, heading = render.heading
    const distance = framingDistance(this.camera.aspect, this.snapshot.settings.view)
    if (!this.cameraInitialized || delta > 0) this.cameraOffset = followOffset(this.cameraOffset, heading, distance, this.cameraInitialized ? delta : 0)
    this.followPosition.copy(this.cameraOffset).add(new Vector3(p.x, p.y, p.z))
    const from = this.cameraInitialized ? { x: this.camera.position.x + this.origin.x, y: this.camera.position.y, z: this.camera.position.z + this.origin.z } : this.followPosition
    let safe = cameraPathSafe(from, this.followPosition, this.safeSurface)
    if (!safe && this.cameraInitialized) for (const side of [0, -6, 6]) {
      const candidate = new Vector3(p.x - Math.sin(heading) * distance * .65 + Math.cos(heading) * side, p.y + 5,
        p.z + Math.cos(heading) * distance * .65 + Math.sin(heading) * side)
      if (cameraPathSafe(from, candidate, this.safeSurface)) { this.followPosition.copy(candidate); safe = true; break }
    }
    if (safe) {
      this.camera.position.set(this.followPosition.x - this.origin.x, this.followPosition.y, this.followPosition.z - this.origin.z)
      this.cameraInitialized = true
    } else { this.pause('camera'); return }
    this.lookPosition.set(p.x - this.origin.x + Math.sin(heading) * 20, p.y - 5, p.z - this.origin.z - Math.cos(heading) * 20)
    this.camera.up.set(0, 1, 0); this.camera.lookAt(this.lookPosition)
    if (import.meta.env.DEV && this.reviewPitch) this.camera.rotateX(this.reviewPitch)
  }
  resize(width: number, height: number) { this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.cameraInitialized = false }
  contextLost() { this.contextAvailable = false; this.pause('context'); this.publish({ phase: 'recovering', reason: 'context' }) }
  contextRestored() { this.contextAvailable = true; this.publish({ phase: this.model ? 'paused' : 'recovering', reason: 'context' }) }
  fail(error: unknown) { console.error('Flight experience:', error); this.input.clear(); this.publish({ phase: 'recovering', reason: 'error' }) }
  diagnostics() {
    const sorted = [...this.frameTimes].sort((a, b) => a - b)
    const percentile = (p: number) => sorted[Math.floor((sorted.length - 1) * p)] ?? null
    return { world: this.world.config, phase: this.snapshot.phase, quality: this.snapshot.quality,
      position: { ...this.simulation.position }, heading: this.simulation.heading, time: this.simulation.time,
      commands: { ...this.simulation.commands, mode: this.simulation.avoidance, vY: this.simulation.climbRate, aY: this.simulation.verticalAcceleration },
      origin: this.origin, originShifts: this.originShifts, droppedSeconds: this.simulation.droppedSeconds,
      frameTimeMs: { samples: sorted.length, p50: percentile(.5), p95: percentile(.95), p99: percentile(.99), spikes100: sorted.filter(n => n > 100).length },
      camera: { position: this.camera.position.toArray(), quaternion: this.camera.quaternion.toArray(), aspect:this.camera.aspect, view:this.snapshot.settings.view, pitch:this.reviewPitch, far:this.camera.far }, environment: this.scenery.environment.frame, environmentResources: {...this.scenery.environment.metrics}, render: {...this.renderMetrics}, cpuTimeMs: this.percentiles(this.cpuTimes), gpuTimeMs:this.percentiles(this.gpuTimes),
      props: { ...this.scenery.metrics }, terrain: this.terrain.diagnostics() }
  }
  recordRender(data: typeof this.renderMetrics) {
    this.renderMetrics = data
    if (this.snapshot.phase === 'flying') { this.cpuTimes.push(data.cpuMs); if (this.cpuTimes.length > 3600) this.cpuTimes.shift() }
  }
  recordGpu(milliseconds: number) { if(this.snapshot.phase === 'flying') { this.gpuTimes.push(milliseconds);if(this.gpuTimes.length>240)this.gpuTimes.shift() } }
  private percentiles(values: number[]) {
    const sorted = [...values].sort((a,b)=>a-b)
    return { samples:sorted.length,p50:sorted[Math.floor(sorted.length*.5)]??null,p95:sorted[Math.floor(sorted.length*.95)]??null,p99:sorted[Math.floor(sorted.length*.99)]??null }
  }
  applyCaptureAnchor(anchor: CaptureAnchor) {
    if (!import.meta.env.DEV) return
    this.pause('user'); this.input.clear()
    Object.assign(this.simulation.position,anchor.position);this.simulation.heading=anchor.heading
    this.simulation.time=anchor.presentationSeconds;this.simulation.turnRate=0;this.simulation.climbRate=0;this.simulation.verticalAcceleration=0;this.simulation.safetyStop=false;this.simulation.clearAccumulator()
    this.reviewPitch=anchor.pitch;this.scenery.preset=anchor.preset;this.cameraInitialized=false
    this.publish({settings:{...this.snapshot.settings,view:anchor.view},phase:'buffering',reason:'terrain'})
    this.terrain.plan(anchor.position.x,anchor.position.z,anchor.heading,anchor.position.y);this.lease?.invalidate()
  }
  close() { if (this.lease) this.lease.release(); else this.dispose(); this.lease = null }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.abort.abort(); this.input.clear(); this.terrain.dispose(); this.scenery.dispose()
    if (this.model) this.controller.disposeStagedModel(this.model)
    this.model = null; this.scene.clear(); this.listeners.clear(); this.frameTimes.length = 0; this.cpuTimes.length = 0; this.gpuTimes.length = 0
  }
}
