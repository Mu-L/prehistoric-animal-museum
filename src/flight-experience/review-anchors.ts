import { WORLD, type Position, type WorldConfig } from './world'
import type { FlightView } from './settings'
import type { SolarPreset } from './environment/environment-state'
export interface CaptureAnchor {
  id: string; world: WorldConfig; position: Position; heading: number
  view: FlightView; pitch: number; presentationSeconds: number; preset: SolarPreset
}
/** Approximate compositions, not recovered metadata from the user's three screenshots. */
export const CAPTURE_ANCHORS: readonly CaptureAnchor[] = [
  { id: 'coast-oblique', world: WORLD, position: {x:-160,y:100,z:350}, heading:.22, view:'standard',pitch:0,presentationSeconds:0,preset:'afternoon' },
  { id: 'shore-overlook', world: WORLD, position: {x:100,y:350,z:350}, heading:Math.PI/2, view:'wide',pitch:-.18,presentationSeconds:0,preset:'afternoon' },
  { id: 'ocean-high', world: WORLD, position: {x:-300,y:1400,z:350}, heading:-Math.PI/2, view:'wide',pitch:0,presentationSeconds:0,preset:'afternoon' },
  { id: 'valley-side', world: WORLD, position: {x:270,y:160,z:-1450}, heading:.3, view:'near',pitch:-.12,presentationSeconds:0,preset:'afternoon' },
]
