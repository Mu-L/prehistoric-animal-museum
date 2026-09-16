import { CHUNK_SIZE, SEGMENTS, type WorldConfig, createWorldSampler, type Address, type Lod } from './world'
export interface TerrainJob {
  type: 'generate'; sessionId: number; requestId: number
  world: WorldConfig; chunk: Address; lod: Lod; configHash: 'terrain-v1' | 'terrain-v2'
}
export interface TerrainResult extends Omit<TerrainJob, 'type'> {
  type: 'generated'
  positions: Float32Array; normals: Float32Array; colors: Float32Array
  indices: Uint16Array; boundaryHeights: Float32Array; coarseHeights: Float32Array
  bounds: readonly [number, number, number, number, number, number]; generatedInMs: number
}
export function generateTerrain(job: TerrainJob): TerrainResult {
  const start = performance.now(), n = SEGMENTS[job.lod], count = (n + 1) ** 2 + 4 * (64 - n) + (n < 64 ? 4 * n - 4 : 0)
  const { meshHeight, normalAt, terrainAt } = createWorldSampler(job.world)
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3), triangleIndices: number[] = []
  const boundaryHeights = new Float32Array((n + 1) * 4), coarseHeights = new Float32Array(count)
  let min = Infinity, max = -Infinity
  for (let iz = 0; iz <= n; iz++) for (let ix = 0; ix <= n; ix++) {
    const i = iz * (n + 1) + ix, x = ix * CHUNK_SIZE / n, z = iz * CHUNK_SIZE / n
    const wx = job.chunk.x * CHUNK_SIZE + x, wz = job.chunk.z * CHUNK_SIZE + z
    const t = terrainAt(wx, wz), normal = normalAt(wx, wz)
    // Actual 8m edge samples survive every LOD; a boundary transition fan
    // connects coarse interior cells to the common high-resolution perimeter.
    const edge = ix === 0 || iz === 0 || ix === n || iz === n
    const h = t.height
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
      void k
      if (n === 64 || (ix > 0 && iz > 0 && ix < n - 1 && iz < n - 1)) triangleIndices.push(i, i + n + 1, i + 1, i + 1, i + n + 1, i + n + 2)
    }
  }
  if (n < 64) {
    let next = (n + 1) ** 2
    const edgeVertex = new Map<string, number>()
    const add = (x: number, z: number) => {
      const key = `${x},${z}`, found = edgeVertex.get(key)
      if (found !== undefined) return found
      const ix = x / CHUNK_SIZE * n, iz = z / CHUNK_SIZE * n
      if (Number.isInteger(ix) && Number.isInteger(iz)) return iz * (n + 1) + ix
      const id = next++, wx = job.chunk.x * CHUNK_SIZE + x, wz = job.chunk.z * CHUNK_SIZE + z
      const t = terrainAt(wx, wz), normal = normalAt(wx, wz)
      positions.set([x, t.height, z], id * 3); normals.set(normal, id * 3)
      coarseHeights[id] = t.height
      // Interpolate material attributes from the same generating field.
      const rock = Math.min(1, Math.max(0, (1-normal[1])*3.8+t.canyonWeight*.35)), sand = Math.max(0,1-Math.abs(t.height-3)/22)
      const green=[.16+t.moisture*.035,.24+t.moisture*.065,.12+t.moisture*.015], stone=[.42,.37,.29], beach=[.58,.51,.36]
      for(let c=0;c<3;c++)colors[id*3+c]=(green[c]!*(1-rock)+stone[c]!*rock)*(1-sand)+beach[c]!*sand
      min=Math.min(min,t.height);max=Math.max(max,t.height);edgeVertex.set(key,id);return id
    }
    const step=CHUNK_SIZE/n, fine=CHUNK_SIZE/64
    for(let iz=0;iz<n;iz++)for(let ix=0;ix<n;ix++) {
      if(ix>0&&iz>0&&ix<n-1&&iz<n-1)continue
      const x=ix*step,z=iz*step, ring:number[]=[]
      // Clockwise in XZ: triangles face +Y. Fine perimeter is shared by every LOD.
      for(let k=0;k<step;k+=ix===0?fine:step)ring.push(add(x,z+k))
      for(let k=0;k<step;k+=iz===n-1?fine:step)ring.push(add(x+k,z+step))
      for(let k=0;k<step;k+=ix===n-1?fine:step)ring.push(add(x+step,z+step-k))
      for(let k=0;k<step;k+=iz===0?fine:step)ring.push(add(x+step-k,z))
      const center=add(x+step/2,z+step/2)
      for(let k=0;k<ring.length;k++)triangleIndices.push(center,ring[k]!,ring[(k+1)%ring.length]!)
    }
  }
  const indices = new Uint16Array(triangleIndices)
  return { ...job, type: 'generated', positions, normals, colors, indices, boundaryHeights, coarseHeights,
    bounds: [0, min, 0, CHUNK_SIZE, max, CHUNK_SIZE], generatedInMs: performance.now() - start }
}
export function resultBytes(r: TerrainResult): number {
  return r.positions.byteLength + r.normals.byteLength + r.colors.byteLength + r.indices.byteLength + r.boundaryHeights.byteLength + r.coarseHeights.byteLength
}
export function validTerrainResult(value: unknown, job: TerrainJob): value is TerrainResult {
  if (!value || typeof value !== 'object') return false
  const r = value as Partial<TerrainResult>, n = SEGMENTS[job.lod], vertices = (n + 1) ** 2 + 4 * (64 - n) + (n < 64 ? 4 * n - 4 : 0)
  if (r.type !== 'generated' || r.sessionId !== job.sessionId || r.requestId !== job.requestId ||
    r.lod !== job.lod || r.chunk?.x !== job.chunk.x || r.chunk?.z !== job.chunk.z || r.configHash !== job.configHash ||
    JSON.stringify(r.world) !== JSON.stringify(job.world)) return false
  for (const array of [r.positions, r.normals, r.colors]) {
    if (!(array instanceof Float32Array) || array.length !== vertices * 3 || !array.every(Number.isFinite)) return false
  }
  return r.indices instanceof Uint16Array && r.indices.length > 0 && r.indices.length <= 64 * 64 * 6 + 3072 && r.indices.length % 3 === 0 && r.indices.every(i => i < vertices) &&
    r.coarseHeights instanceof Float32Array && r.coarseHeights.length === vertices && r.coarseHeights.every(Number.isFinite) &&
    r.boundaryHeights instanceof Float32Array && r.boundaryHeights.length === (n + 1) * 4 && r.boundaryHeights.every(Number.isFinite) &&
    Array.isArray(r.bounds) && r.bounds.length === 6 && r.bounds.every(Number.isFinite) && Number.isFinite(r.generatedInMs)
}
