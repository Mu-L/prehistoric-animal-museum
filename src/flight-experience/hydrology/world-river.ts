import { createCoastalRiverCandidate, type RiverStation } from './coastal-river-candidate'
/** The approved finite graph follows this world's valley, rather than cutting a
 * 300m trench through unrelated ridges. Its downstream profile never rises. */
export function createWorldRiver(seed:number,outlet:{x:number;z:number},valleyAt:(z:number)=>number,baseHeight:(x:number,z:number)=>number) {
 const feature=createCoastalRiverCandidate(seed),points:RiverStation[]=[],bins=new Map<string,number[]>()
 const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)}
 let previous=Infinity
 for(let i=0;i<=300;i++){
  const s=i*10,profile=feature.station(s),z=outlet.z-2880+s*.96,estuary=smooth((s-2400)/600)
  const x=(valleyAt(z)+24*Math.sin(s/145))*(1-estuary)+outlet.x*estuary
  const level=Math.max(-.7,Math.min(profile.waterLevel,baseHeight(x,z)-1.2,previous))
  previous=level
  points.push({...profile,x,z,waterLevel:level,bedLevel:level-(profile.waterLevel-profile.bedLevel)})
 }
 for(let i=0;i<300;i++){
  const a=points[i]!,b=points[i+1]!,length=Math.hypot(b.x-a.x,b.z-a.z);a.tangent={x:(b.x-a.x)/length,z:(b.z-a.z)/length}
  for(let z=Math.floor((Math.min(a.z,b.z)-160)/256);z<=Math.floor((Math.max(a.z,b.z)+160)/256);z++)for(let x=Math.floor((Math.min(a.x,b.x)-160)/256);x<=Math.floor((Math.max(a.x,b.x)+160)/256);x++){const k=`${x},${z}`,list=bins.get(k)??[];list.push(i);bins.set(k,list)}
 }
 points[300]!.tangent={...points[299]!.tangent}
 const station=(s:number):RiverStation=>{s=Math.max(0,Math.min(3000,s));const i=Math.min(299,Math.floor(s/10)),a=points[i]!,b=points[i+1]!,t=s/10-i;return{...a,chainage:s,x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,waterLevel:a.waterLevel+(b.waterLevel-a.waterLevel)*t,bedLevel:a.bedLevel+(b.bedLevel-a.bedLevel)*t,halfWidth:a.halfWidth+(b.halfWidth-a.halfWidth)*t}}
 function query(x:number,z:number){
  const candidates=bins.get(`${Math.floor(x/256)},${Math.floor(z/256)}`);if(!candidates)return null
  let best=Infinity,chainage=0,lateralMetres=0
  for(const i of candidates){const a=points[i]!,b=points[i+1]!,dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),px=x-a.x-dx*t,pz=z-a.z-dz*t,d=px*px+pz*pz;if(d<best){best=d;chainage=(i+t)*10;lateralMetres=(dx*pz-dz*px)/Math.sqrt(l2)}}
  const s=station(chainage),distance=Math.sqrt(best)
  if(distance>s.halfWidth+120)return null
  const u=distance/s.halfWidth,depth=s.waterLevel-s.bedLevel
  const bedLevel=u<=1?s.waterLevel-depth*(1-u*u):s.waterLevel+(u-1)*2.2
  return {chainage,lateralMetres,waterLevel:s.waterLevel,bedLevel,depth:Math.max(0,s.waterLevel-bedLevel),signedBankDistance:distance-s.halfWidth,wetness:1-Math.max(0,Math.min(1,(distance-s.halfWidth)/8))}
 }
 const bounds={minX:Math.min(...points.map(p=>p.x))-160,minZ:Math.min(...points.map(p=>p.z))-160,maxX:Math.max(...points.map(p=>p.x))+160,maxZ:Math.max(...points.map(p=>p.z))+160}
 return {feature,outlet,station,query,bounds,
  height(x:number,z:number,base:number,q=query(x,z)){if(!q)return base;const blend=smooth((q.signedBankDistance-16)/96);return Math.min(base,q.bedLevel*(1-blend)+base*blend)}
 }
}
