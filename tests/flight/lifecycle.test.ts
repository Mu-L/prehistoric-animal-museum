import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimationClip, BoxGeometry, Group, Mesh, MeshBasicMaterial, NormalAnimationBlendMode, Texture, TextureLoader } from 'three'
import { TerrainStream } from '../../src/flight-experience/terrain-stream'
import { generateTerrain, type TerrainJob } from '../../src/flight-experience/terrain-protocol'
import { FlightRuntime } from '../../src/flight-experience/FlightRuntime'
import type { StagedViewerModel, ViewerController, ViewerModelDescriptor } from '../../src/viewer/ViewerController'
import { disposeObject3D } from '../../src/viewer/dispose'
import { chunkKey } from '../../src/flight-experience/world'
import glide from '../../src/flight-experience/assets/pteranodon-glide.json'
class TestWorker {
  static instances: TestWorker[] = []
  onmessage: ((e: { data: unknown }) => void) | null = null
  onerror: (() => void) | null = null
  jobs: TerrainJob[] = []
  terminated = false
  constructor() { TestWorker.instances.push(this) }
  postMessage(job: TerrainJob) { this.jobs.push(job) }
  terminate() { this.terminated = true }
  finish() { const job = this.jobs.shift(); if (job) this.onmessage?.({ data: generateTerrain(job) }) }
}
beforeEach(() => {
  TestWorker.instances = []; vi.stubGlobal('Worker', TestWorker)
  vi.spyOn(TextureLoader.prototype, 'loadAsync').mockResolvedValue(new Texture())
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
describe('bounded terrain lifecycle', () => {
  it('installs a delayed result at the latest origin and rejects obsolete demands', () => {
    const stream = new TerrainStream(() => {}, () => {})
    stream.plan(0, 0, 0); stream.update(1 / 60, true)
    const worker = TestWorker.instances[0]!, job = worker.jobs[0]!
    stream.relocate({ x: 2048, z: 0 }); stream.relocate({ x: 4096, z: -2048 })
    worker.finish()
    for (let i = 0; i < 100; i++) stream.update(1 / 60, true)
    const resident = stream.resident.get(chunkKey(job.chunk))!
    expect(resident.mesh.position.x).toBe(job.chunk.x * 512 - 4096)
    expect(resident.mesh.position.z).toBe(job.chunk.z * 512 + 2048)
    stream.dispose(); worker.finish(); expect(stream.resident.size).toBe(0)
  })
  it('retries one failed Worker then uses a finite 5x5 fallback', () => {
    const failed = vi.fn(), stream = new TerrainStream(() => {}, failed)
    TestWorker.instances[0]!.onerror?.(); TestWorker.instances[1]!.onerror?.()
    expect(stream.simplified).toBe(true); expect(failed).toHaveBeenCalledTimes(1)
    stream.plan(0, 0, 0)
    for (let i = 0; i < 500; i++) stream.update(1 / 60, true)
    expect(stream.resident.size).toBe(25); expect(stream.ready).toBe(true)
    stream.plan(1e6, 1e6, 0); stream.update(1 / 60, true)
    expect(stream.safeToEnter(1e6, 1e6)).toBe(false)
    stream.dispose()
  })
  it('does not advance terrain transitions or enqueue jobs while paused', () => {
    const stream = new TerrainStream(() => {}, () => {})
    stream.plan(0, 0, 0); stream.update(1 / 60, true)
    const before = stream.diagnostics()
    for (let i = 0; i < 100; i++) stream.update(0, false)
    expect(stream.diagnostics()).toEqual(before); stream.dispose()
  })
})
describe('flight owned resources and recovery', () => {
  function host() {
    let resolve: ((value: StagedViewerModel) => void) | null = null
    const dispose = vi.fn((model: StagedViewerModel) => { disposeObject3D(model.group); model.disposed = true })
    const controller = {
      acquireExternalExperience: (runtime: FlightRuntime) => ({ invalidate: vi.fn(), release: () => runtime.dispose() }),
      stageModel: () => new Promise<StagedViewerModel>(r => { resolve = r }), disposeStagedModel: dispose,
    } as unknown as ViewerController
    return { controller, dispose, resolve: (model: StagedViewerModel) => resolve?.(model) }
  }
  function model(): StagedViewerModel {
    const root = new Group(), group = new Group(); group.add(root)
    root.add(new Mesh(new BoxGeometry(7, 1, 2), new MeshBasicMaterial()))
    return { group, modelRoot: root, disposed: false, mixer: null, action: null } as unknown as StagedViewerModel
  }
  it('disposes a model that finishes after its session closes', async () => {
    const h = host(), runtime = new FlightRuntime(h.controller, false)
    const pending = runtime.prepare({} as ViewerModelDescriptor)
    runtime.close(); const late = model(); h.resolve(late); await pending
    expect(h.dispose).toHaveBeenCalledWith(late); expect(late.disposed).toBe(true)
  })
  it('freezes simulation on pause and returns only flight-owned resources', async () => {
    const h = host(), runtime = new FlightRuntime(h.controller, false), owned = model()
    const spy = vi.spyOn((owned.modelRoot.children[0] as Mesh).geometry, 'dispose')
    const pending = runtime.prepare({} as ViewerModelDescriptor); h.resolve(owned); await pending
    for (let i = 0; i < 180; i++) { runtime.update(1 / 60); TestWorker.instances.forEach(w => w.finish()) }
    expect(runtime.getSnapshot().phase).toBe('ready')
    runtime.start(); runtime.update(1 / 60); runtime.pause('hidden')
    const time = runtime.simulation.time, pos = { ...runtime.simulation.position }
    runtime.update(10)
    expect(runtime.simulation.time).toBe(time); expect(runtime.simulation.position).toEqual(pos)
    expect(runtime.running).toBe(false)
    runtime.contextLost(); expect(runtime.getSnapshot().phase).toBe('recovering')
    runtime.contextRestored(); expect(runtime.getSnapshot().phase).toBe('paused')
    runtime.close(); runtime.close(); expect(spy).toHaveBeenCalledTimes(1)
  })
  it('installs delayed terrain while buffering without moving, and never bypasses a safety guard', async () => {
    const h = host(), runtime = new FlightRuntime(h.controller, false)
    const pending = runtime.prepare({} as ViewerModelDescriptor); h.resolve(model()); await pending
    for (let i = 0; i < 180; i++) { runtime.update(1 / 60); TestWorker.instances.forEach(w => w.finish()) }
    runtime.start()
    for (const resident of runtime.terrain.resident.values()) { resident.mesh.removeFromParent(); resident.mesh.geometry.dispose() }
    runtime.terrain.resident.clear()
    runtime.pause('terrain')
    runtime.update(1 / 60)
    expect(runtime.getSnapshot().phase).toBe('buffering')
    const position = { ...runtime.simulation.position }, time = runtime.simulation.time
    // Fixed coastal/river coverage is denser; preserve the shared per-frame budget.
    for (let i = 0; i < 600 && runtime.getSnapshot().phase==='buffering'; i++) { TestWorker.instances.forEach(w => w.finish()); runtime.update(1 / 60) }
    expect(runtime.getSnapshot().phase).toBe('paused'); expect(runtime.canResume).toBe(true)
    expect(runtime.simulation.position).toEqual(position); expect(runtime.simulation.time).toBe(time)
    runtime.simulation.safetyStop = true; runtime.start()
    expect(runtime.getSnapshot().phase).toBe('paused'); expect(runtime.simulation.safetyStop).toBe(true)
    runtime.close()
  })
  it('has a seamless non-static authored glide and no animated root translation', () => {
    const clip = AnimationClip.parse({ ...glide, blendMode: NormalAnimationBlendMode })
    expect(clip.duration).toBe(4)
    let movingTracks = 0
    for (const track of clip.tracks) {
      const stride = track.getValueSize(), first = [...track.values.slice(0, stride)], last = [...track.values.slice(-stride)]
      last.forEach((v, i) => expect(v).toBeCloseTo(first[i]!, 6))
      const moves = [...track.values].some((v, i) => Math.abs(v - first[i % stride]!) > 1e-6)
      if (moves) movingTracks++
      if (track.name.endsWith('.position')) expect(moves).toBe(false)
    }
    expect(movingTracks).toBe(4)
  })
})
