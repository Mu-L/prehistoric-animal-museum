import { CHUNK_SIZE, WORLD, type WorldConfig, type WorldSampler, SEGMENTS, createWorldSampler, chunkAt, chunkKey, type Address, type Lod } from './world'
/** Sampled geometric error, metres, against the finest mesh; not a global mathematical bound. */
export function terrainLodError(sampler: WorldSampler, chunk: Address, lod: Lod) {
  if(lod===0)return 0
  let error=0
  for(const [u,v] of [[.19,.23],[.43,.61],[.73,.37],[.31,.83],[.87,.79]]){
    const x=(chunk.x+u!)*CHUNK_SIZE,z=(chunk.z+v!)*CHUNK_SIZE
    error=Math.max(error,Math.abs(sampler.meshHeight(x,z,SEGMENTS[lod])-sampler.meshHeight(x,z,64)))
  }
  return error
}
export interface WantedChunk { chunk: Address; lod: Lod; priority: number }
export function chunkWindow(x: number, z: number, radius: number, heading = 0,
  previous: ReadonlyMap<string, WantedChunk> = new Map(), world: WorldConfig = WORLD, altitude = 0): Map<string, WantedChunk> {
  const sampler = createWorldSampler(world)
  const center = chunkAt(x, z), result = new Map<string, WantedChunk>()
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
    const chunk = { x: center.x + dx, z: center.z + dz }, key = chunkKey(chunk, world)
    const ground = sampler.terrainAt((chunk.x+.5)*CHUNK_SIZE,(chunk.z+.5)*CHUNK_SIZE).height
    const distance = Math.hypot(Math.max(Math.abs((chunk.x + .5) - x / CHUNK_SIZE), Math.abs((chunk.z + .5) - z / CHUNK_SIZE)), Math.max(0,altitude-ground)/CHUNK_SIZE)
    let lod: Lod = distance < 1.6 ? 0 : distance < 2.7 ? 1 : distance < 4.2 ? 2 : 3
    // Approximate 600px focal scale; preserve the route-based near allocation and
    // refine curved distant slopes when their sampled projected error exceeds 2px.
    while(lod>0 && terrainLodError(sampler,chunk,lod)*600/Math.max(128,distance*CHUNK_SIZE)>2)lod=(lod-1) as Lod
    const old = previous.get(key)
    if (old && old.lod < lod && distance < ([1.6, 2.7, 4.2, Infinity][old.lod] ?? Infinity) * 1.15) lod = old.lod
    const forward = dx * Math.sin(heading) - dz * Math.cos(heading)
    result.set(key, { chunk, lod, priority: dx * dx + dz * dz - forward * .3 })
  }
  // A hard cap prevents sampled errors on distant ridges from multiplying near draw calls.
  const near=[...result.values()].filter(item=>item.lod===0).sort((a,b)=>a.priority-b.priority)
  for(const item of near.slice(16))item.lod=1
  // A quality change must still keep neighbours within one subdivision level.
  for (let pass = 0; pass < 3; pass++) for (const item of result.values()) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const neighbour = result.get(chunkKey({ x: item.chunk.x + dx!, z: item.chunk.z + dz! }, world))
      if (neighbour && item.lod > neighbour.lod + 1) item.lod = (neighbour.lod + 1) as Lod
    }
  }
  return result
}
export function localChunkPosition(chunk: Address, origin: Address): Address {
  return { x: chunk.x * CHUNK_SIZE - origin.x, z: chunk.z * CHUNK_SIZE - origin.z }
}
