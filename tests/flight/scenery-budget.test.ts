import { afterEach, expect, it, vi } from 'vitest'
import { Scene, Texture, TextureLoader } from 'three'
import { FlightScenery } from '../../src/flight-experience/scenery'
afterEach(() => vi.restoreAllMocks())
it('keeps bounded prop batches and replaces at most one batch per frame across movement and quality changes', async () => {
  vi.spyOn(TextureLoader.prototype, 'loadAsync').mockResolvedValue(new Texture())
  const scenery = new FlightScenery(new Scene(), () => {}, () => 0)
  await Promise.resolve()
  for (let i = 0; i < 240; i++) {
    scenery.update(i * 12, 200, -i * 20, i / 60, i < 120 ? 'low' : 'balanced')
    expect(scenery.metrics.installedThisFrame).toBeLessThanOrEqual(1)
    expect(scenery.metrics.batches).toBeLessThanOrEqual(i < 120 ? 9 : 25)
    expect(scenery.metrics.pending).toBeLessThanOrEqual(25)
    expect(scenery.metrics.bytes).toBeLessThanOrEqual(25 * 192 * 1024)
  }
  const before = scenery.metrics.batches
  scenery.update(239 * 12, 200, -239 * 20, 4, 'low')
  expect(scenery.metrics.batches).toBeGreaterThan(1)
  expect(before).toBeGreaterThan(1)
  scenery.dispose(); scenery.dispose(); expect(scenery.root.parent).toBeNull()
})
