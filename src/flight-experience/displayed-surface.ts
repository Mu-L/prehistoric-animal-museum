import type { TerrainResult } from './terrain-protocol'
import { CHUNK_SIZE, SEGMENTS, clamp } from './world'
export interface DisplayedSurface { result: TerrainResult; morph: number; startNormals: Float32Array; startColors: Float32Array }
/** Barycentric sample of the resident's actual edge-constrained, partially morphed triangles. */
export function sampleDisplayed(surface: DisplayedSurface, x: number, z: number) {
  const { result: r, morph: m } = surface, n = SEGMENTS[r.lod]
  const gx = clamp(x / CHUNK_SIZE * n, 0, n), gz = clamp(z / CHUNK_SIZE * n, 0, n)
  const ix = Math.min(n - 1, Math.floor(gx)), iz = Math.min(n - 1, Math.floor(gz)), u = gx - ix, v = gz - iz, a = iz * (n + 1) + ix
  const ids = u + v <= 1 ? [a, a + 1, a + n + 1] : [a + n + 2, a + n + 1, a + 1]
  const weights = u + v <= 1 ? [1 - u - v, u, v] : [u + v - 1, 1 - u, 1 - v]
  let height = 0
  const normal = [0, 0, 0], color = [0, 0, 0]
  ids.forEach((id, k) => {
    const w = weights[k]!
    height += (r.coarseHeights[id]! * (1 - m) + r.positions[id * 3 + 1]! * m) * w
    for (let c = 0; c < 3; c++) {
      normal[c]! += (surface.startNormals[id * 3 + c]! * (1 - m) + r.normals[id * 3 + c]! * m) * w
      color[c]! += (surface.startColors[id * 3 + c]! * (1 - m) + r.colors[id * 3 + c]! * m) * w
    }
  })
  return { height, normal, color }
}
