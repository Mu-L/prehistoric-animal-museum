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
  { id: 'ridge-seam-check', world: WORLD, position: {x:745.23,y:540,z:-1032.93}, heading:-.09, view:'near',pitch:-.12,presentationSeconds:65,preset:'afternoon' },
  { id: 'river-mouth', world: WORLD, position: {x:240,y:85,z:490}, heading:0, view:'wide',pitch:-.18,presentationSeconds:0,preset:'afternoon' },
  { id: 'river-valley', world: WORLD, position: {x:145,y:90,z:-350}, heading:0, view:'wide',pitch:-.15,presentationSeconds:0,preset:'afternoon' },
]

/** Approximate feedback routes, never claimed to recover the user's screenshot coordinates. */
export const REVIEW_ROUTES = [
  { id:'A-shoreline', anchor:{...CAPTURE_ANCHORS[0]!,id:'A-shoreline'}, turnAt:45,turn:0 },
  { id:'B-cliff', anchor:{...CAPTURE_ANCHORS[3]!,id:'B-cliff',position:{x:290,y:185,z:-1250},heading:0},turnAt:40,turn:.18 },
  { id:'C-tree-return',anchor:{...CAPTURE_ANCHORS[3]!,id:'C-tree-return',position:{x:150,y:140,z:-1050},heading:Math.PI},turnAt:25,turn:.65 },
  { id:'E-river-mouth',anchor:{...CAPTURE_ANCHORS[5]!,id:'E-river-mouth'},turnAt:28,turn:.65 },
  { id:'D-ridge',anchor:{...CAPTURE_ANCHORS[3]!,id:'D-ridge',position:{x:1770,y:540,z:-760},heading:-Math.PI/2},turnAt:40,turn:.15 },
] as const
