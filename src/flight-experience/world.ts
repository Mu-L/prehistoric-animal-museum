/** Pure, order-independent world. Metres; Y up; supported logical domain ±10,000 km. */
export const WORLD = Object.freeze({ id: 'coastal-valley', seed: 193706, generator: '1', preset: '1' })
export const CHUNK_SIZE = 512
export const SEGMENTS = [64, 32, 16, 8] as const
export interface Address { x: number; z: number }
export interface Position extends Address { y: number }
export type Lod = 0 | 1 | 2 | 3
export const clamp = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v))
const smooth = (t: number) => { const v = clamp(t, 0, 1); return v * v * (3 - 2 * v) }
export function hash(x: number, z: number, namespace = 0, seed = WORLD.seed): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed ^ Math.imul(namespace, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
export function noise(x: number, z: number, namespace = 0): number {
  const ix = Math.floor(x), iz = Math.floor(z), u = smooth(x - ix), v = smooth(z - iz)
  const a = hash(ix, iz, namespace), b = hash(ix + 1, iz, namespace)
  const c = hash(ix, iz + 1, namespace), d = hash(ix + 1, iz + 1, namespace)
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v
}
export function chunkAt(x: number, z: number): Address {
  return { x: Math.floor(x / CHUNK_SIZE), z: Math.floor(z / CHUNK_SIZE) }
}
export function chunkKey(a: Address): string { return `${WORLD.seed}:${WORLD.generator}:${WORLD.preset}:${a.x},${a.z}` }
export function coastAt(z: number): number {
  return 100 * Math.sin(z / 790) + 220 * Math.sin(z / 2300) + 95 * (noise(0, z / 900, 4) - .5)
}
export function valleyAt(z: number): number { return coastAt(z) + 650 + 200 * Math.sin(z / 1400) }
export function terrainAt(x: number, z: number) {
  const inland = x - coastAt(z)
  const land = smooth((inland + 95) / 300)
  const upland = smooth((inland - 110) / 760)
  const canyon = smooth((-z - 900) / 1200) * (.65 + .35 * noise(x / 4000, z / 4000, 13))
  const width = 280 - canyon * 125
  const valley = 1 - smooth(Math.abs(x - valleyAt(z)) / width)
  const ridge = 1 - Math.abs(noise(x / 1050, z / 1050, 9) * 2 - 1)
  const mass = 125 + ridge * 245 + 120 * noise(x / 2300, z / 2300, 11)
  const detail = 16 * (noise(x / 180, z / 180, 7) - .5)
  // Every term bounded: sea -80..-55; inland < 550m. No runtime clamping cliffs.
  const ground = 12 + upland * mass * (1 - valley * (.64 + canyon * .17)) + detail * land
  const height = (-80 + 25 * noise(x / 500, z / 500, 2)) * (1 - land) + ground * land
  const moisture = noise(x / 580, z / 580, 23)
  return { height, moisture, coastWeight: 1 - upland, uplandWeight: upland, canyonWeight: canyon * upland, valley }
}
export function normalAt(x: number, z: number): [number, number, number] {
  const dx = terrainAt(x - 2, z).height - terrainAt(x + 2, z).height
  const dz = terrainAt(x, z - 2).height - terrainAt(x, z + 2).height
  const length = Math.hypot(dx, 4, dz)
  return [dx / length, 4 / length, dz / length]
}
/** Same diagonal as the mesh, not bilinear interpolation of non-coplanar quads. */
export function meshHeight(x: number, z: number, segments: number): number {
  const step = CHUNK_SIZE / segments
  const gx = Math.floor(x / step) * step, gz = Math.floor(z / step) * step
  const u = (x - gx) / step, v = (z - gz) / step
  const a = terrainAt(gx, gz).height, b = terrainAt(gx + step, gz).height
  const c = terrainAt(gx, gz + step).height, d = terrainAt(gx + step, gz + step).height
  return u + v <= 1 ? a + u * (b - a) + v * (c - a) : d + (1 - u) * (c - d) + (1 - v) * (b - d)
}
/** Covers every resident/transition LOD plus the tallest 14m prop. */
export function safeSurface(x: number, z: number): number {
  return Math.max(0, terrainAt(x, z).height, ...SEGMENTS.map(n => meshHeight(x, z, n))) + 16
}
export function regionAt(x: number, z: number): 'coast' | 'hills' | 'valley' | 'canyon' {
  const t = terrainAt(x, z)
  if (t.uplandWeight < .35) return 'coast'
  if (t.valley > .3) return t.canyonWeight > .35 ? 'canyon' : 'valley'
  return 'hills'
}
export interface Prop { id: string; x: number; y: number; z: number; scale: number; yaw: number; kind: 'rock' | 'plant'; priority: number }
export function scatter(address: Address): Prop[] {
  const result: Prop[] = []
  const spacing = 32
  const startX = address.x * 16, startZ = address.z * 16
  for (let z = startZ; z < startZ + 16; z++) for (let x = startX; x < startX + 16; x++) {
    const wx = (x + .12 + hash(x, z, 31) * .76) * spacing
    const wz = (z + .12 + hash(x, z, 32) * .76) * spacing
    const sample = terrainAt(wx, wz), slope = normalAt(wx, wz)[1]
    if (sample.height < 7) continue
    const woodland = noise(wx / 240, wz / 240, 71)
    const kind = hash(x, z, 35) < .2 + (1 - slope) * .8 ? 'rock' : 'plant'
    if (kind === 'plant' && (slope < .82 || woodland < .43 || hash(x, z, 72) > woodland * .95)) continue
    if (kind === 'rock' && (slope < .45 || hash(x, z, 73) > .35 + (1 - slope))) continue
    result.push({ id: `${x}:${z}`, x: wx, y: sample.height, z: wz,
      scale: 2 + hash(x, z, 33) * 4, yaw: hash(x, z, 34) * Math.PI * 2,
      kind, priority: hash(x, z, 36) })
  }
  return result
}
