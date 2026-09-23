import stochastic from '../assets/lookdev-materials/stochastic.json'
import { DataArrayTexture, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector2, Vector4, type Texture } from 'three'
import manifest from '../assets/lookdev-materials/manifest.json'
import inverseUrl from '../assets/lookdev-materials/inverse-all.png?url'
import albedoUrl from '../assets/lookdev-materials/albedo-atlas.webp?url'
import gaussianUrl from '../assets/lookdev-materials/gaussian-atlas.webp?url'
import normalUrl from '../assets/lookdev-materials/normal-atlas.webp?url'
import armUrl from '../assets/lookdev-materials/arm-atlas.webp?url'
import groundcoverGaussianUrl from '../assets/lookdev-materials/leafy_grass-gaussian.webp?url'
import groundcoverNormalUrl from '../assets/lookdev-materials/leafy_grass-normal.webp?url'
import groundcoverArmUrl from '../assets/lookdev-materials/leafy_grass-arm.webp?url'
import {flipRgbaRows,unpackMaterialAtlas} from './material-array'
/** Shared art-trial library. Albedo is sRGB; ARM/OpenGL normals are linear data. */
export async function loadLookdevMaterials(signal?:AbortSignal){
 const textures:Texture[]=[],materials:MeshStandardMaterial[]=[]
 let closed=false
 const dispose=()=>{closed=true;materials.splice(0).forEach(m=>m.dispose());textures.splice(0).forEach(t=>t.dispose())}
 const check=()=>{if(closed||signal?.aborted)throw new DOMException('Material preparation cancelled','AbortError')}
 signal?.addEventListener('abort',dispose,{once:true})
 const loader=new TextureLoader()
 const load=async(url:string)=>{
  check()
  const texture=await loader.loadAsync(url)
  if(closed||signal?.aborted){texture.dispose();check()}
  textures.push(texture);return texture
 }
 const release=(texture:Texture)=>{const i=textures.indexOf(texture);if(i>=0)textures.splice(i,1);texture.dispose()}
 try {
  check()
  // Five independent inputs form a fixed-size cohort; each result is owned as
  // soon as it arrives, including successes after another input has failed.
  const [inverse,albedoImage,gaussianImage,normalImage,armImage]=await Promise.all([load(inverseUrl),load(albedoUrl),load(gaussianUrl),load(normalUrl),load(armUrl)])
  check();inverse.generateMipmaps=false;inverse.minFilter=inverse.magFilter=LinearFilter
  const cell=544,columns=3,rows=Math.ceil(manifest.entries.length/columns)
  const unpack=(image:Texture)=>{
   const canvas=document.createElement('canvas');canvas.width=columns*cell;canvas.height=rows*cell
   const context=canvas.getContext('2d',{willReadFrequently:true})
   if(!context)throw new Error('2D canvas unavailable for terrain material array')
   context.drawImage(image.image as CanvasImageSource,0,0)
   const data=unpackMaterialAtlas(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,manifest.entries.length)
   const array=new DataArrayTexture(data,512,512,manifest.entries.length)
   array.wrapS=array.wrapT=RepeatWrapping;array.magFilter=LinearFilter;array.minFilter=LinearMipmapLinearFilter
   array.generateMipmaps=true;array.anisotropy=4;array.needsUpdate=true;textures.push(array)
   release(image);canvas.width=canvas.height=0
   return array
  }
  const map=unpack(albedoImage),gaussian=unpack(gaussianImage),normalMap=unpack(normalImage),arm=unpack(armImage)
  map.colorSpace=SRGBColorSpace
  for(const [index,entry] of manifest.entries.entries()){
   const stat=stochastic.find(s=>s.id===entry.id)!
   const col=index%columns,row=Math.floor(index/columns)
   const atlasRect=new Vector4((col*cell+16)/(columns*cell),((rows-row-1)*cell+16)/(rows*cell),512/(columns*cell),512/(rows*cell))
   materials.push(new MeshStandardMaterial({name:entry.role,map,normalMap,normalScale:new Vector2(.65,.65),aoMap:arm,roughnessMap:arm,roughness:entry.role==='wet-sand'?.72:entry.role==='river-mud'?.82:1,metalness:0}))
   materials[materials.length-1]!.userData.stochastic={gaussian,inverse,metresPerRepeat:entry.metresPerRepeat,atlasRect,source:stat.id}
  }
  // A0 review only: compare the same source/LUT and world UVs without the
  // multi-material atlas. Never download these extra textures in the visitor path.
  if(import.meta.env.DEV&&new URLSearchParams(location.search).get('flightA0')==='standalone'){
   const [independentGaussian,independentNormal,independentArm]=await Promise.all([
    load(groundcoverGaussianUrl),load(groundcoverNormalUrl),load(groundcoverArmUrl),
   ])
   const standalone=(texture:Texture)=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512
    const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw new Error('2D canvas unavailable for terrain A0')
    context.drawImage(texture.image as CanvasImageSource,0,0)
    const data=flipRgbaRows(context.getImageData(0,0,512,512).data,512,512)
    const array=new DataArrayTexture(data,512,512,1)
    array.wrapS=array.wrapT=RepeatWrapping;array.magFilter=LinearFilter;array.minFilter=LinearMipmapLinearFilter
    array.generateMipmaps=true;array.anisotropy=4;array.needsUpdate=true;textures.push(array);release(texture);canvas.width=canvas.height=0;return array
   }
   const groundcover=materials[5]!.userData.stochastic as {independent?:{gaussian:Texture;normal:Texture;arm:Texture}}
   groundcover.independent={gaussian:standalone(independentGaussian),normal:standalone(independentNormal),arm:standalone(independentArm)}
  }
  check();return {materials,textures,dispose}
 }catch(error){dispose();throw error}finally{signal?.removeEventListener('abort',dispose)}
}
