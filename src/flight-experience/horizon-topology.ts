import {SEA_LEVEL,type WorldSampler} from './world'
/** Coarse cells remain two triangles. Up to 128 coast cells get 128m samples, and their
 * neighbours inherit matching edge vertices. Sampling never raises seabed. */
export function horizonTopology(world:WorldSampler,step:number,focus={x:0,z:0}){
 const cache=new Map<string,boolean>()
 let refinedCount=0
 const refined=(x:number,z:number)=>{
  const key=`${x},${z}`,known=cache.get(key);if(known!==undefined)return known
  // Spend the fixed detail allowance around the current published centre,
  // rather than consuming it on the first remote rows of the 24km grid.
  if(Math.abs(x+step/2-focus.x)>4096||Math.abs(z+step/2-focus.z)>4096){cache.set(key,false);return false}
  const heights=[[0,0],[step,0],[0,step],[step,step],[step/2,step/2]].map(([dx,dz])=>world.terrainAt(x+dx!,z+dz!).height)
  const mixed=heights.some(h=>h>SEA_LEVEL)&&heights.some(h=>h<=SEA_LEVEL)
  const coasts=[world.coastAt(z),world.coastAt(z+step/2),world.coastAt(z+step)]
  const coastCrosses=Math.min(...coasts)<=x+step&&Math.max(...coasts)>=x
  // Bound added vertices/triangles, including neighbour edge fans.
  // 128 * (9 vertices * 36 bytes + 18 triangles * 6 bytes) fits the
  // remaining upload budget above the 449316-byte regular grid.
  const result=refinedCount<128&&(mixed||coastCrosses)
  if(result)refinedCount++
  cache.set(key,result);return result
 }
 return (x:number,z:number):{points:number[];indices:number[]}=>{
  const points:number[]=[],indices:number[]=[]
  if(refined(x,z)){
   for(let r=0;r<=2;r++)for(let c=0;c<=2;c++)points.push(c*step/2,r*step/2)
   for(let r=0;r<2;r++)for(let c=0;c<2;c++){const i=r*3+c;indices.push(i,i+3,i+1,i+1,i+3,i+4)}
  }else{
   const edges=[[0,0,0,step,-step,0],[0,step,step,step,0,step],[step,step,step,0,step,0],[step,0,0,0,0,-step]]
   const split=edges.map(e=>refined(x+e[4]!,z+e[5]!))
   if(!split.some(Boolean))return {points:[0,0,0,step,step,0,step,step],indices:[0,1,2,2,1,3]}
   points.push(step/2,step/2)
   edges.forEach(([ax,az,bx,bz],edge)=>{const n=split[edge]?2:1;for(let i=0;i<n;i++)points.push(ax!+(bx!-ax!)*i/n,az!+(bz!-az!)*i/n)})
   const count=points.length/2;for(let i=1;i<count;i++)indices.push(0,i,i===count-1?1:i+1)
  }
  return {points,indices}
 }
}
