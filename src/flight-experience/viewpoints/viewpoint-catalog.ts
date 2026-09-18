import { WORLD, type Position } from '../world'
export interface Viewpoint { readonly id: 'seaward' | 'cliff'; readonly position: Position; readonly target: Position; readonly heading: number }
/** G0 direction approved; heights raised by user to 120/210m above sea level. */
export const VIEWPOINT_WORLD = WORLD
export const VIEWPOINTS: readonly Viewpoint[] = [
  {id:'seaward',position:{x:160,y:119.3,z:500},target:{x:-397,y:50,z:-330},heading:-.59},
  {id:'cliff',position:{x:-160,y:209.3,z:350},target:{x:420,y:120,z:-550},heading:.57},
]
