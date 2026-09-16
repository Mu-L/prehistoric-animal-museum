import { riverApronSeam } from './river-apron-seam'
import { createCanonicalSurface } from './canonical-surface'
import { BufferAttribute, BufferGeometry, DoubleSide, DataTexture, Group, LinearFilter, Mesh, MeshStandardMaterial, RedFormat, UnsignedByteType, Vector2, Vector4, type Material, type WebGLProgramParametersWithUniforms } from 'three'
import type { Address, WorldSampler } from '../world'
/** A fine, fixed river bed replaces the coarse terrain only inside its corridor.
 * The overlap apron stays outside the cut; water and banks share one cross section. */
export class RiverScene {
 readonly root=new Group()
 busy=true
 error:string|null=null
 private released=false
 private terrainSource:{material:MeshStandardMaterial;compile:Material['onBeforeCompile']} | null=null
 useTerrainMaterial(material:MeshStandardMaterial){this.terrainSource={material,compile:material.onBeforeCompile.bind(material)}}
 private readonly materials:MeshStandardMaterial[]=[]
 private readonly geometries:BufferGeometry[]=[]
 private readonly origin={value:new Vector2()}
 private readonly maskRect:{value:Vector4}
 private readonly ready={value:0}
 private readonly mask:DataTexture
 private readonly clips:{material:Material;compile:Material['onBeforeCompile'];key:Material['customProgramCacheKey']}[]=[]
 constructor(private readonly world:WorldSampler,decorate:(m:Material)=>void,wake:()=>void){
  this.root.name='static-river-and-riparian-banks'
  const b=world.river.bounds,w=Math.ceil((b.maxX-b.minX)/4),h=Math.ceil((b.maxZ-b.minZ)/4)
  this.mask=new DataTexture(new Uint8Array(w*h),w,h,RedFormat,UnsignedByteType);this.mask.minFilter=this.mask.magFilter=LinearFilter;this.mask.generateMipmaps=false
  this.maskRect={value:new Vector4(b.minX,b.minZ,w*4,h*4)}
  void this.prepare(decorate).catch(e=>{this.error=String(e)}).finally(()=>{this.busy=false;wake()})
 }
 decorateTerrain(material:Material,keepInside=false){
  const compile=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material)
  this.clips.push({material,compile,key})
  material.onBeforeCompile=(shader:WebGLProgramParametersWithUniforms,renderer)=>{
   compile.call(material,shader,renderer)
   Object.assign(shader.uniforms,{riverMask:{value:this.mask},riverMaskRect:this.maskRect,riverMaskReady:this.ready,riverOrigin:this.origin})
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 riverOrigin; varying vec2 riverWorldXZ;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nriverWorldXZ=(modelMatrix*vec4(transformed,1.0)).xz+riverOrigin;')
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D riverMask; uniform vec4 riverMaskRect; uniform float riverMaskReady; varying vec2 riverWorldXZ;').replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nvec2 riverUV=(riverWorldXZ-riverMaskRect.xy)/riverMaskRect.zw; if(riverMaskReady>.5 && all(greaterThanEqual(riverUV,vec2(0.0))) && all(lessThanEqual(riverUV,vec2(1.0))) && texture2D(riverMask,riverUV).r ${keepInside?'<': '>'} .5)discard;`)
  }
  material.customProgramCacheKey=()=>`${key.call(material)}-river-corridor-v1-${keepInside}`;material.needsUpdate=true
 }
 private async prepare(decorate:(m:Material)=>void){
  const {width,height,data}=this.mask.image as {width:number;height:number;data:Uint8Array},rect=this.maskRect.value
  for(let z=0;z<height;z++){
   if(this.released)return
   for(let x=0;x<width;x++){const q=this.world.river.query(rect.x+(x+.5)*4,rect.y+(z+.5)*4);data[z*width+x]=q&&q.chainage>8&&q.chainage<2992&&q.signedBankDistance<80?255:0}
   if(z%16===15)await new Promise<void>(resolve=>setTimeout(resolve,0))
  }
  if(this.released)return
  const canonicalHeight=createCanonicalSurface(this.world)
  const positions:number[]=[],normals:number[]=[],colors:number[]=[],indices:number[]=[],water:number[]=[],waterIndices:number[]=[]
  // Near-bank samples are sub-metre; the distant apron relaxes toward the base surface.
  const columns=[-112,-96,-88,-80,-72,-64,-40,-20,-8,-2,-1,-.7,-.35,0,.35,.7,1,2,8,20,40,64,72,80,88,96,112]
  const rows=601,n=columns.length
  for(let row=0;row<rows;row++){
   const s=this.world.river.station(row*5),nx=-s.tangent.z,nz=s.tangent.x
   for(const c of columns){const lateral=Math.abs(c)<=1?c*s.halfWidth:Math.sign(c)*(s.halfWidth+Math.abs(c)),x=s.x+nx*lateral,z=s.z+nz*lateral,t=this.world.terrainAt(x,z)
    positions.push(x,Math.abs(c)>=64?canonicalHeight(x,z):t.height,z)
    const normal=this.world.normalAt(x,z);normals.push(...normal)
    const rock=Math.min(1,Math.max(0,(1-normal[1])*3.8+t.canyonWeight*.35)),sand=Math.max(0,1-Math.abs(t.height-3)/22)
    const green=[.16+t.moisture*.035,.24+t.moisture*.065,.12+t.moisture*.015],stone=[.42,.37,.29],beach=[.58,.51,.36]
    for(let k=0;k<3;k++)colors.push((green[k]!*(1-rock)+stone[k]!*rock)*(1-sand)+beach[k]!*sand)
   }
   if(row%24===23){await new Promise<void>(resolve=>setTimeout(resolve,0));if(this.released)return}
   // Stop at the actual bank contour; no floating tube or river laid over hills.
   for(const side of [-1,1])water.push(s.x+nx*s.halfWidth*side,s.waterLevel+.025,s.z+nz*s.halfWidth*side)
   if(row<rows-1){for(let c=0;c<n-1;c++){const a=row*n+c;indices.push(a,a+1,a+n,a+1,a+n+1,a+n)}const a=row*2;waterIndices.push(a,a+1,a+2,a+1,a+3,a+2)}
  }
  const bedMaterial=this.terrainSource?.material.clone()??new MeshStandardMaterial({vertexColors:true,roughness:1})
  if(this.terrainSource)bedMaterial.onBeforeCompile=this.terrainSource.compile
  bedMaterial.polygonOffset=true;bedMaterial.polygonOffsetFactor=-1;bedMaterial.polygonOffsetUnits=-1
  bedMaterial.customProgramCacheKey=()=> 'river-bed-shared-terrain-v1'
  this.decorateTerrain(bedMaterial,true)
  const waterMaterial=new MeshStandardMaterial({color:'#477f7b',roughness:.2,metalness:.18,transparent:true,opacity:.87,depthWrite:false})
  waterMaterial.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float riverChainage;varying float estuaryFade;').replace('#include <begin_vertex>','#include <begin_vertex>\nestuaryFade=1.0-smoothstep(2750.0,2990.0,riverChainage);')
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float estuaryFade;').replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=estuaryFade;')
  }
  waterMaterial.customProgramCacheKey=()=> 'river-estuary-fade-v1'
  for(const material of [bedMaterial,waterMaterial]){if(material===waterMaterial||!this.terrainSource)decorate(material);this.materials.push(material)}
  for(const [p,i,m,c] of [[positions,indices,bedMaterial,colors],[water,waterIndices,waterMaterial,null]] as const){const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));if(c)g.setAttribute('color',new BufferAttribute(new Float32Array(c),3));g.setIndex([...i]);if(!c)g.setAttribute('riverChainage',new BufferAttribute(Float32Array.from({length:rows*2},(_,j)=>Math.floor(j/2)*5),1));g.computeVertexNormals();if(c){g.setAttribute('normal',new BufferAttribute(new Float32Array(normals),3));g.setAttribute('startNormal',new BufferAttribute(new Float32Array(normals),3));g.setAttribute('startColor',new BufferAttribute(new Float32Array(colors),3));g.setAttribute('coarseHeight',new BufferAttribute(Float32Array.from(p.filter((_,i)=>i%3===1)),1));g.setAttribute('terrainBlend',new BufferAttribute(new Float32Array(p.length/3).fill(1),1))}g.computeBoundingSphere();this.geometries.push(g);const mesh=new Mesh(g,m);mesh.receiveShadow=true;this.root.add(mesh)}
  const seam=await riverApronSeam({data,width,height,minX:rect.x,minZ:rect.y,positions,columns:n,rows,chainage:(x,z)=>this.world.river.query(x,z)?.chainage??null,baseHeight:canonicalHeight,released:()=>this.released})
  if(this.released)return
  const seamGeometry=new BufferGeometry(),seamNormals:number[]=[],seamColors:number[]=[]
  for(let i=0;i<seam.vertices.length;i+=3){const x=seam.vertices[i]!,z=seam.vertices[i+2]!,t=this.world.terrainAt(x,z),normal=this.world.normalAt(x,z);seamNormals.push(...normal)
   const rock=Math.min(1,Math.max(0,(1-normal[1])*3.8+t.canyonWeight*.35)),sand=Math.max(0,1-Math.abs(t.height-3)/22),green=[.16+t.moisture*.035,.24+t.moisture*.065,.12+t.moisture*.015],stone=[.42,.37,.29],beach=[.58,.51,.36]
   for(let k=0;k<3;k++)seamColors.push((green[k]!*(1-rock)+stone[k]!*rock)*(1-sand)+beach[k]!*sand)
  }
  seamGeometry.setAttribute('position',new BufferAttribute(new Float32Array(seam.vertices),3));seamGeometry.setAttribute('normal',new BufferAttribute(new Float32Array(seamNormals),3));seamGeometry.setAttribute('color',new BufferAttribute(new Float32Array(seamColors),3));seamGeometry.setAttribute('startNormal',new BufferAttribute(new Float32Array(seamNormals),3));seamGeometry.setAttribute('startColor',new BufferAttribute(new Float32Array(seamColors),3));seamGeometry.setAttribute('coarseHeight',new BufferAttribute(Float32Array.from(seam.vertices.filter((_,i)=>i%3===1)),1));seamGeometry.setAttribute('terrainBlend',new BufferAttribute(new Float32Array(seam.vertices.length/3).fill(1),1));seamGeometry.setIndex(seam.indices);seamGeometry.computeBoundingSphere()
  const seamMaterial=this.terrainSource?.material.clone()??new MeshStandardMaterial({vertexColors:true});if(this.terrainSource)seamMaterial.onBeforeCompile=this.terrainSource.compile;else decorate(seamMaterial)
  seamMaterial.side=DoubleSide;seamMaterial.customProgramCacheKey=()=> 'river-apron-seam-v1';this.materials.push(seamMaterial);this.geometries.push(seamGeometry);this.root.add(new Mesh(seamGeometry,seamMaterial))
  this.mask.needsUpdate=true;this.ready.value=1
 }
 relocate(origin:Address){this.root.position.set(-origin.x,0,-origin.z);this.origin.value.set(origin.x,origin.z)}
 dispose(){if(this.released)return;this.released=true;this.root.removeFromParent();this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.mask.dispose();for(const c of this.clips){c.material.onBeforeCompile=c.compile;c.material.customProgramCacheKey=c.key;c.material.needsUpdate=true}}
}
