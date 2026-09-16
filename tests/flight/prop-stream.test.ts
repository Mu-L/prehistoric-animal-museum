import { afterEach, expect, it, vi } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture, TextureLoader } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { PropStream } from '../../src/flight-experience/props/prop-stream'
import { cellKey, dimensions, propLod } from '../../src/flight-experience/props/prop-lod'
import { createWorldSampler } from '../../src/flight-experience/world'
import { CLIFF_SAMPLE, landmarkTop, sampleObstacleHeight } from '../../src/flight-experience/props/prop-obstacles'
import manifest from '../../src/flight-experience/assets/landscape/manifest.json'
afterEach(() => vi.restoreAllMocks())
export function fakePropGltf() {
  const scene = new Group()
  for (const asset of manifest.assets) for (let lod = 0; lod < 3; lod++) { const mesh = new Mesh(new BoxGeometry(1, asset.physicalHeight, 1), new MeshStandardMaterial()); mesh.name = `${asset.id}-lod${lod}`; scene.add(mesh) }
  return { scene } as unknown as GLTF
}
it('keeps stable ownership and physical dimensions for positive/negative cells and every same-source LOD', () => {
  expect(cellKey(-.01, -128.01)).toBe('-1,-2')
  const sampler = createWorldSampler()
  for (const prop of sampler.scatter({ x: 2, z: -1 })) {
    const size = dimensions(prop), asset = manifest.assets.find(a => a.id === size.asset)!
    expect(size.scale * asset.physicalHeight).toBeCloseTo(size.physicalHeight, 8)
    expect(size.physicalHeight).toBeLessThanOrEqual(16)
    for (let lod = 0; lod < 3; lod++) expect(asset.lods[lod]?.name).toBe(`${size.asset}-lod${lod}`)
  }
  expect(propLod(140, 0)).toBe(0); expect(propLod(151, 0)).toBe(1)
  expect(propLod(300, 2)).toBe(2); expect(propLod(284, 2)).toBe(1)
})
it('bounds cells, pooled allocations and one-cell installation through route, quality and origins', async () => {
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockResolvedValue(fakePropGltf())
  vi.spyOn(TextureLoader.prototype, 'loadAsync').mockResolvedValue(new Texture())
  const surface = vi.fn(() => 20), stream = new PropStream(new Group(), () => {}, surface)
  await new Promise(resolve => setTimeout(resolve, 0))
  for (let frame = 0; frame < 450; frame++) {
    const quality = frame < 200 ? 'low' : 'balanced'
    stream.update(700 + frame * 3, 100, -frame * 2, quality)
    expect(stream.metrics.installedThisFrame).toBeLessThanOrEqual(1)
    expect(stream.metrics.cells).toBeLessThanOrEqual(quality === 'low' ? 81 : 169)
    expect(stream.metrics.instances).toBeLessThanOrEqual(169 * 16)
    expect(stream.metrics.bytes).toBeLessThan(4 * 1024 * 1024)
    if (frame === 150 || frame === 300) stream.relocate({ x: frame * 10, z: -frame * 10 })
  }
  for (let i = 0; i < 200; i++) stream.update(2000, 100, -900, 'balanced')
  surface.mockClear(); stream.update(2000, 100, -900, 'balanced'); expect(surface).not.toHaveBeenCalled()
  stream.markGroundDirty(['193706:1:1:3,-2']); stream.update(2000, 100, -900, 'balanced'); expect(surface.mock.calls.length).toBeLessThanOrEqual(16)
  stream.dispose(); stream.dispose(); expect(stream.root.parent).toBeNull(); expect(stream.metrics.bytes).toBe(0)
})
it('releases late resources and exits busy on asynchronous or synchronous loading failure', async () => {
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(() => { throw new Error('offline') })
  const stream = new PropStream(new Group(), () => {}, () => 0)
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(stream.metrics.failed).toBe(true); expect(stream.busy).toBe(false); stream.dispose()
})

it('uses the same conservative asset cylinder for fixed landmarks and nearby props', () => {
  const landmark = { id: 'gate', asset: 'cliff-0' as const, x: -20, y: 15, z: 10, scale: 2, yaw: 0 }
  expect(landmarkTop(landmark, -20, 10)).toBe(15 + CLIFF_SAMPLE.height * 2)
  expect(landmarkTop(landmark, -20 + CLIFF_SAMPLE.radius * 2 + .01, 10)).toBe(-Infinity)
  expect(sampleObstacleHeight({ scatter: () => [] }, -20, 10, [landmark])).toBe(15 + CLIFF_SAMPLE.height * 2)
})
it('disposes GLB results arriving after exit without starting silhouette downloads', async () => {
  let complete!: (value: GLTF) => void
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(() => new Promise(resolve => { complete = resolve }))
  const textureLoad = vi.spyOn(TextureLoader.prototype, 'loadAsync')
  const stream = new PropStream(new Group(), () => {}, () => 0)
  await Promise.resolve(); stream.dispose()
  const fixture = fakePropGltf(), mesh = fixture.scene.children[0] as Mesh
  const dispose = vi.spyOn(mesh.geometry, 'dispose')
  complete(fixture); await new Promise(resolve => setTimeout(resolve, 0))
  expect(dispose).toHaveBeenCalledOnce(); expect(textureLoad).not.toHaveBeenCalled()
})
