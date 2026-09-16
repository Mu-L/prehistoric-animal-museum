import { CHUNK_SIZE, chunkAt, chunkKey, type Address, type Lod } from './world'
export interface WantedChunk { chunk: Address; lod: Lod; priority: number }
export function chunkWindow(x: number, z: number, radius: number, heading = 0,
  previous: ReadonlyMap<string, WantedChunk> = new Map()): Map<string, WantedChunk> {
  const center = chunkAt(x, z), result = new Map<string, WantedChunk>()
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
    const chunk = { x: center.x + dx, z: center.z + dz }, key = chunkKey(chunk)
    const distance = Math.max(Math.abs((chunk.x + .5) - x / CHUNK_SIZE), Math.abs((chunk.z + .5) - z / CHUNK_SIZE))
    let lod: Lod = distance < 1.6 ? 0 : distance < 2.7 ? 1 : distance < 4.2 ? 2 : 3
    const old = previous.get(key)
    if (old && old.lod < lod && distance < ([1.6, 2.7, 4.2, Infinity][old.lod] ?? Infinity) * 1.15) lod = old.lod
    const forward = dx * Math.sin(heading) - dz * Math.cos(heading)
    result.set(key, { chunk, lod, priority: dx * dx + dz * dz - forward * .3 })
  }
  // A quality change must still keep neighbours within one subdivision level.
  for (let pass = 0; pass < 3; pass++) for (const item of result.values()) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const neighbour = result.get(chunkKey({ x: item.chunk.x + dx!, z: item.chunk.z + dz! }))
      if (neighbour && item.lod > neighbour.lod + 1) item.lod = (neighbour.lod + 1) as Lod
    }
  }
  return result
}
export function localChunkPosition(chunk: Address, origin: Address): Address {
  return { x: chunk.x * CHUNK_SIZE - origin.x, z: chunk.z * CHUNK_SIZE - origin.z }
}
