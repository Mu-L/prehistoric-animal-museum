import { CHUNK_SIZE, SEGMENTS, type WORLD, meshHeight, normalAt, terrainAt, type Address, type Lod } from './world'
export interface TerrainJob {
  type: 'generate'; sessionId: number; requestId: number
  world: typeof WORLD; chunk: Address; lod: Lod; configHash: 'terrain-v1'
}
export interface TerrainResult extends Omit<TerrainJob, 'type'> {
  type: 'generated'
  positions: Float32Array; normals: Float32Array; colors: Float32Array
  indices: Uint16Array; boundaryHeights: Float32Array; coarseHeights: Float32Array
  bounds: readonly [number, number, number, number, number, number]; generatedInMs: number
}
export function generateTerrain(job: TerrainJob): TerrainResult {
  const start = performance.now(), n = SEGMENTS[job.lod], count = (n + 1) ** 2
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3), indices = new Uint16Array(n * n * 6)
  const boundaryHeights = new Float32Array((n + 1) * 4), coarseHeights = new Float32Array(count)
  let min = Infinity, max = -Infinity
  for (let iz = 0; iz <= n; iz++) for (let ix = 0; ix <= n; ix++) {
    const i = iz * (n + 1) + ix, x = ix * CHUNK_SIZE / n, z = iz * CHUNK_SIZE / n
    const wx = job.chunk.x * CHUNK_SIZE + x, wz = job.chunk.z * CHUNK_SIZE + z
    const t = terrainAt(wx, wz), normal = normalAt(wx, wz)
    // Common edge polyline at 8 subdivisions. Both sides share the same positions
    // at every LOD; fine vertices lie exactly on coarse edge segments.
    const edge = ix === 0 || iz === 0 || ix === n || iz === n
    const h = edge ? meshHeight(wx, wz, 8) : t.height
    positions.set([x, h, z], i * 3); normals.set(normal, i * 3)
    coarseHeights[i] = edge ? h : meshHeight(wx, wz, Math.max(8, n / 2))
    min = Math.min(min, h); max = Math.max(max, h)
    const rock = Math.min(1, Math.max(0, (1 - normal[1]) * 3.8 + (t.canyonWeight * .35)))
    const sand = Math.max(0, 1 - Math.abs(t.height - 3) / 22)
    const green = [.16 + t.moisture * .035, .24 + t.moisture * .065, .12 + t.moisture * .015]
    const stone = [.42, .37, .29], beach = [.58, .51, .36]
    for (let c = 0; c < 3; c++) colors[i * 3 + c] = ((green[c] ?? 0) * (1 - rock) + (stone[c] ?? 0) * rock) * (1 - sand) + (beach[c] ?? 0) * sand
    if (iz === 0) boundaryHeights[ix] = h
    if (ix === n) boundaryHeights[n + 1 + iz] = h
    if (iz === n) boundaryHeights[2 * (n + 1) + ix] = h
    if (ix === 0) boundaryHeights[3 * (n + 1) + iz] = h
    if (ix < n && iz < n) {
      const k = (iz * n + ix) * 6
      indices.set([i, i + n + 1, i + 1, i + 1, i + n + 1, i + n + 2], k)
    }
  }
  return { ...job, type: 'generated', positions, normals, colors, indices, boundaryHeights, coarseHeights,
    bounds: [0, min, 0, CHUNK_SIZE, max, CHUNK_SIZE], generatedInMs: performance.now() - start }
}
export function resultBytes(r: TerrainResult): number {
  return r.positions.byteLength + r.normals.byteLength + r.colors.byteLength + r.indices.byteLength + r.boundaryHeights.byteLength + r.coarseHeights.byteLength
}
export function validTerrainResult(value: unknown, job: TerrainJob): value is TerrainResult {
  if (!value || typeof value !== 'object') return false
  const r = value as Partial<TerrainResult>, n = SEGMENTS[job.lod], vertices = (n + 1) ** 2
  if (r.type !== 'generated' || r.sessionId !== job.sessionId || r.requestId !== job.requestId ||
    r.lod !== job.lod || r.chunk?.x !== job.chunk.x || r.chunk?.z !== job.chunk.z || r.configHash !== job.configHash ||
    JSON.stringify(r.world) !== JSON.stringify(job.world)) return false
  for (const array of [r.positions, r.normals, r.colors]) {
    if (!(array instanceof Float32Array) || array.length !== vertices * 3 || !array.every(Number.isFinite)) return false
  }
  return r.indices instanceof Uint16Array && r.indices.length === n * n * 6 && r.indices.every(i => i < vertices) &&
    r.coarseHeights instanceof Float32Array && r.coarseHeights.length === vertices && r.coarseHeights.every(Number.isFinite) &&
    r.boundaryHeights instanceof Float32Array && r.boundaryHeights.length === (n + 1) * 4 && r.boundaryHeights.every(Number.isFinite) &&
    Array.isArray(r.bounds) && r.bounds.length === 6 && r.bounds.every(Number.isFinite) && Number.isFinite(r.generatedInMs)
}
