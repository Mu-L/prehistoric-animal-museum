import type { TerrainResult } from './terrain-protocol'
import { clamp, type Lod } from './world'
export const TERRAIN_PATCH_SIZE=128
export const MAX_PATCHES_PER_TILE=16
export const TOPOLOGY_VERSION='nested-bisection-128-v1'
export const topologyLayoutId=(lod:Lod)=>`${TOPOLOGY_VERSION}:lod${lod}`
export interface TerrainTopology {id:string;level:number;verticesPerPatch:number;trianglesPerPatch:number;xz:Float32Array;indices:Uint16Array;nodes:Int16Array}
interface Face {a:number;b:number;c:number;node:number}
const cache=new Map<Lod,TerrainTopology>()
let builds=0
const coordinates:number[]=[],vertexIds=new Map<string,number>(),faces=new Map<number,Face>(),nodes:number[]=[]
function vertex(x:number,z:number){const key=`${x},${z}`,old=vertexIds.get(key);if(old!==undefined)return old;const id=coordinates.length/2;coordinates.push(x,z);vertexIds.set(key,id);return id}
function addFace(a:number,b:number,c:number){const node=nodes.length/4;nodes.push(-1,-1,-1,-1);faces.set(node,{a,b,c,node});return node}
function initialize(){if(nodes.length)return;const center=vertex(64,64),ring=(i:number):[number,number]=>{const side=Math.floor(i/16)%4,t=i%16*8;return side===0?[0,t]:side===1?[t,128]:side===2?[128,128-t]:[128-t,0]};for(let i=0;i<64;i++){const a=ring(i),b=ring((i+1)%64);addFace(center,vertex(a[0],a[1]),vertex(b[0],b[1]))}}
function refine(maxLength:number){
  for(;;){
    let u=-1,v=-1,longest=maxLength*maxLength+1e-8
    for(const face of faces.values())for(const [a,b] of [[face.a,face.b],[face.b,face.c],[face.c,face.a]]){
      const length=(coordinates[a!*2]!-coordinates[b!*2]!)**2+(coordinates[a!*2+1]!-coordinates[b!*2+1]!)**2
      if(length>longest){longest=length;u=a!;v=b!}
    }
    if(u<0)return
    const middle=vertex((coordinates[u*2]!+coordinates[v*2]!)/2,(coordinates[u*2+1]!+coordinates[v*2+1]!)/2)
    // Split BOTH incident faces. No hanging edge vertices; every prior crease survives.
    const incident=[...faces.values()].filter(f=>[f.a,f.b,f.c].includes(u)&&[f.a,f.b,f.c].includes(v))
    for(const f of incident){
      faces.delete(f.node);let edge:number,left:number,right:number
      if((f.a===u&&f.b===v)||(f.a===v&&f.b===u)){edge=0;left=addFace(f.a,middle,f.c);right=addFace(middle,f.b,f.c)}
      else if((f.b===u&&f.c===v)||(f.b===v&&f.c===u)){edge=1;left=addFace(f.a,f.b,middle);right=addFace(f.a,middle,f.c)}
      else{edge=2;left=addFace(f.a,f.b,middle);right=addFace(middle,f.b,f.c)}
      nodes[f.node*4]=edge;nodes[f.node*4+1]=left;nodes[f.node*4+2]=right
    }
  }
}
/** Worker-built conforming hierarchy; main-thread queries use the returned compact nodes. */
export function terrainTopology(lod:Lod):TerrainTopology{
  const existing=cache.get(lod);if(existing)return existing
  initialize()
  if(lod<3){terrainTopology((lod+1) as Lod);refine([8,16,32,Infinity][lod]!)}
  const indices:number[]=[],snapshot=nodes.slice()
  for(const face of faces.values()){snapshot[face.node*4+3]=indices.length/3;indices.push(face.a,face.b,face.c)}
  const result={id:topologyLayoutId(lod),level:3-lod,verticesPerPatch:coordinates.length/2,trianglesPerPatch:indices.length/3,xz:new Float32Array(coordinates),indices:new Uint16Array(indices),nodes:new Int16Array(snapshot)}
  cache.set(lod,result);builds++;return result
}
export function topologyDiagnostics(){return {layouts:cache.size,builds}}
/** Allocation-free lookup: one analytic parent fan and bounded binary descent. */
export function locateTerrainTriangle(lod:Lod,x:number,z:number,output:Float64Array,indices?:Uint16Array,verticesPerPatch?:number,patchIndex?:number,nodeTable?:Int16Array){
  const px=patchIndex===undefined?clamp(Math.floor(x/128),0,3):patchIndex%4,pz=patchIndex===undefined?clamp(Math.floor(z/128),0,3):Math.floor(patchIndex/4)
  const lx=clamp(x-px*128,0,128),lz=clamp(z-pz*128,0,128),dx=lx-64,dz=lz-64
  let side:number,t:number
  if(Math.abs(dx)>=Math.abs(dz)&&dx!==0){side=dx<0?0:2;t=dx<0?64+dz*64/-dx:64-dz*64/dx}
  else if(dz!==0){side=dz>0?1:3;t=dz>0?64+dx*64/dz:64-dx*64/-dz}
  else{side=0;t=0}
  const segment=clamp(Math.floor(t/8),0,15),v=segment*8
  let bx:number,bz:number,cx:number,cz:number
  if(side===0){bx=0;bz=v;cx=0;cz=v+8}else if(side===1){bx=v;bz=128;cx=v+8;cz=128}else if(side===2){bx=128;bz=128-v;cx=128;cz=120-v}else{bx=128-v;bz=0;cx=120-v;cz=0}
  const denominator=(bz-cz)*(64-cx)+(cx-bx)*(64-cz)
  let a=((bz-cz)*(lx-cx)+(cx-bx)*(lz-cz))/denominator,b=((cz-64)*(lx-cx)+(64-cx)*(lz-cz))/denominator,c=1-a-b,node=side*16+segment
  const topology=cache.get(lod),table=nodeTable??topology?.nodes
  if(!table)throw new Error('Terrain topology missing')
  for(let depth=0;depth<32;depth++){
    const edge=table[node*4]!
    if(edge<0)break
    if(edge===0){if(a>=b){node=table[node*4+1]!;a-=b;b*=2}else{node=table[node*4+2]!;b-=a;a*=2}}
    else if(edge===1){if(b>=c){node=table[node*4+1]!;b-=c;c*=2}else{node=table[node*4+2]!;c-=b;b*=2}}
    else if(a>=c){node=table[node*4+1]!;a-=c;c*=2}else{node=table[node*4+2]!;c-=a;a*=2}
  }
  const triangle=table[node*4+3]!,patch=pz*4+px
  if(indices&&verticesPerPatch){const perTriangles=indices.length/3/(patchIndex===undefined?16:1),index=((patch-(patchIndex??0))*perTriangles+triangle)*3;output[0]=indices[index]!;output[1]=indices[index+1]!;output[2]=indices[index+2]!}
  else{if(!topology)throw new Error('Terrain topology missing');const offset=patch*topology.verticesPerPatch,index=triangle*3;output[0]=offset+topology.indices[index]!;output[1]=offset+topology.indices[index+1]!;output[2]=offset+topology.indices[index+2]!}
  output[3]=a;output[4]=b;output[5]=c
}
export function groupTerrainPatches(result:TerrainResult){const count=result.indices.length/16;return {indices:result.indices,groups:Array.from({length:16},(_,i)=>({start:i*count,count,materialIndex:0}))}}
export function patchBlend(_x:number,_z:number,progress:number){return clamp(progress,0,1)}
