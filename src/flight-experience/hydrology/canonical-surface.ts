import { locateTerrainTriangle, terrainTopology } from '../terrain-patches'
import type { WorldSampler } from '../world'
/** Exact fixed LOD2 surface, including the shared 8m perimeter. Cached only while
 * constructing the finite river apron, so it joins the rendered base triangles. */
export function createCanonicalSurface(world:WorldSampler){
 const topology=terrainTopology(2),lookup=new Float64Array(6),cache=new Map<string,Float32Array>()
 return (x:number,z:number)=>{
  const px=Math.floor(x/128)*128,pz=Math.floor(z/128)*128,key=`${px},${pz}`
  let heights=cache.get(key)
  if(!heights){heights=new Float32Array(topology.verticesPerPatch);for(let i=0;i<heights.length;i++){const lx=topology.xz[i*2]!,lz=topology.xz[i*2+1]!,wx=px+lx,wz=pz+lz;heights[i]=lx===0||lx===128||lz===0||lz===128?world.meshHeight(wx,wz,64):world.terrainAt(wx,wz).height}cache.set(key,heights)}
  locateTerrainTriangle(2,x-px,z-pz,lookup,topology.indices,topology.verticesPerPatch,0,topology.nodes)
  return heights[lookup[0]!]!*lookup[3]!+heights[lookup[1]!]!*lookup[4]!+heights[lookup[2]!]!*lookup[5]!
 }
}
