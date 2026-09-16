import type { TerrainResult } from './terrain-protocol'
import { CHUNK_SIZE, clamp } from './world'
export const TERRAIN_PATCH_SIZE = 128
export const MAX_PATCHES_PER_TILE = 16
/** 128m render index ranges retain one 512m generation/cache identity and vertex buffer. */
export function groupTerrainPatches(result: TerrainResult) {
  if(result.lod>0)return {indices:result.indices,groups:[{start:0,count:result.indices.length,materialIndex:0}]}
  const bins=Array.from({length:MAX_PATCHES_PER_TILE},()=>[] as number[])
  for(let i=0;i<result.indices.length;i+=3){
    const ids=[result.indices[i]!,result.indices[i+1]!,result.indices[i+2]!]
    const x=ids.reduce((s,id)=>s+result.positions[id*3]!,0)/3,z=ids.reduce((s,id)=>s+result.positions[id*3+2]!,0)/3
    bins[Math.min(3,Math.floor(z/128))*4+Math.min(3,Math.floor(x/128))]!.push(...ids)
  }
  let start=0;const groups=bins.filter(bin=>bin.length).map(bin=>{const group={start,count:bin.length,materialIndex:0};start+=bin.length;return group})
  return {indices:new Uint16Array(bins.flat()),groups}
}
/** Smooth 128m delay field, shared at patch joins. Tile perimeter stays exact at all times. */
export function patchBlend(x: number,z: number,progress: number) {
  if(x===0||z===0||x===CHUNK_SIZE||z===CHUNK_SIZE)return 1
  const delay=.24*(.5+.5*Math.sin(x/128*Math.PI*.5)*Math.sin(z/128*Math.PI*.5))
  const t=clamp((progress-delay)/(1-delay),0,1)
  return t*t*(3-2*t)
}
