import type { Prop } from '../world'
import manifest from '../assets/landscape/manifest.json'
/** Physical metres, independent of geometry/LOD scale. Original sample trees fit the 16m safety envelope. */
export interface PropDimensions { asset: string; physicalHeight: number; scale: number; crownRadius: number }
export const PROP_CELL_SIZE = 128
export const PROP_CELL_RADII = { low: 4, balanced: 6 } as const
export const PROP_INSTANCE_CAPACITY = 512
export function cellKey(x: number, z: number) { return `${Math.floor(x / PROP_CELL_SIZE)},${Math.floor(z / PROP_CELL_SIZE)}` }
export function dimensions(prop: Prop): PropDimensions {
  const variant = Math.floor(prop.priority * (prop.kind === 'plant' ? 4 : 3))
  const asset = prop.kind === 'plant' ? `tree-${Math.floor(variant / 2)}-${variant % 2}` : `rock-${variant}`
  const source = manifest.assets.find(item => item.id === asset)!
  const authoredHeight = source.physicalHeight
  const physicalHeight = prop.kind === 'plant' ? 8 + prop.scale : prop.scale * .72
  return { asset, physicalHeight, scale: physicalHeight / authoredHeight, crownRadius: source.footprint.radius * physicalHeight / authoredHeight }
}
/** Three-dimensional distance matters when flying high above a nearby horizontal cell.
 * Hysteresis avoids rebuild churn; every representation keeps the exact same matrix. */
export function propLod(distance: number, previous?: number): 0 | 1 | 2 {
  if (previous === 0 && distance < 150) return 0
  if (previous === 1 && distance >= 115 && distance < 340) return 1
  if (previous === 2 && distance >= 285) return 2
  return distance < 130 ? 0 : distance < 310 ? 1 : 2
}
