/** Join the fine river ribbon to the fixed base triangles along the exact clipping
 * field. A vertical seam closes interpolation cracks without moving the coastline. */
export async function riverApronSeam(options:{data:Uint8Array;width:number;height:number;minX:number;minZ:number;positions:readonly number[];columns:number;rows:number;chainage:(x:number,z:number)=>number|null;baseHeight:(x:number,z:number)=>number;released:()=>boolean}){
 const o=options,vertices:number[]=[],indices:number[]=[]
 function bed(x:number,z:number){
  const chainage=o.chainage(x,z);if(chainage===null)return o.baseHeight(x,z)
  const row=Math.floor(chainage/5)
  for(let r=Math.max(0,row-3);r<Math.min(o.rows-1,row+4);r++)for(let c=0;c<o.columns-1;c++){
   const a=r*o.columns+c
   for(const [ia,ib,ic] of [[a,a+1,a+o.columns],[a+1,a+o.columns+1,a+o.columns]]){
    const ax=o.positions[ia!*3]!,az=o.positions[ia!*3+2]!,bx=o.positions[ib!*3]!,bz=o.positions[ib!*3+2]!,cx=o.positions[ic!*3]!,cz=o.positions[ic!*3+2]!
    const d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(d)<1e-10)continue
    const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d,w=1-u-v
    if(Math.min(u,v,w)<-1e-5)continue
    return o.positions[ia!*3+1]!*u+o.positions[ib!*3+1]!*v+o.positions[ic!*3+1]!*w
   }
  }
  return o.baseHeight(x,z)
 }
 const add=(a:[number,number],b:[number,number])=>{
  const start=vertices.length/3
  for(const [x,z] of [a,b]){const base=o.baseHeight(x,z),fine=bed(x,z);vertices.push(x,Math.max(base,fine)+.015,z,x,Math.min(base,fine)-.015,z)}
  indices.push(start,start+1,start+2,start+2,start+1,start+3)
 }
 for(let z=0;z<o.height-1;z++){
  if(o.released())return {vertices:[],indices:[]}
  for(let x=0;x<o.width-1;x++){
   const v=[o.data[z*o.width+x]!/255,o.data[z*o.width+x+1]!/255,o.data[(z+1)*o.width+x+1]!/255,o.data[(z+1)*o.width+x]!/255]
   if(v.every(n=>n===0)||v.every(n=>n===1))continue
   const sample=(u:number,t:number)=>v[0]!*(1-u)*(1-t)+v[1]!*u*(1-t)+v[2]!*u*t+v[3]!*(1-u)*t
   // Four subcells follow the bilinear mask rather than making a coarse diagonal cut.
   for(let j=0;j<4;j++)for(let i=0;i<4;i++){
    const corners:[[number,number],[number,number],[number,number],[number,number]]=[[i/4,j/4],[(i+1)/4,j/4],[(i+1)/4,(j+1)/4],[i/4,(j+1)/4]],edges:[number,number][]=[]
    for(let e=0;e<4;e++){const a=corners[e]!,b=corners[(e+1)%4]!,va=sample(...a),vb=sample(...b);if((va>.5)===(vb>.5))continue;const t=(.5-va)/(vb-va);edges.push([o.minX+(x+.5+a[0]+(b[0]-a[0])*t)*4,o.minZ+(z+.5+a[1]+(b[1]-a[1])*t)*4])}
    for(let e=0;e+1<edges.length;e+=2)add(edges[e]!,edges[e+1]!)
   }
  }
  if(z%16===15)await new Promise<void>(resolve=>setTimeout(resolve,0))
 }
 return {vertices,indices}
}
