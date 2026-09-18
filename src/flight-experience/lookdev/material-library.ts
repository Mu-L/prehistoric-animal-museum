import stochastic from '../assets/lookdev-materials/stochastic.json'
import { MeshStandardMaterial, LinearFilter, SRGBColorSpace, TextureLoader, Vector2, Vector4, type Texture } from 'three'
import manifest from '../assets/lookdev-materials/manifest.json'
import inverseUrl from '../assets/lookdev-materials/inverse-all.png?url'
import albedoUrl from '../assets/lookdev-materials/albedo-atlas.webp?url'
import gaussianUrl from '../assets/lookdev-materials/gaussian-atlas.webp?url'
import normalUrl from '../assets/lookdev-materials/normal-atlas.webp?url'
import armUrl from '../assets/lookdev-materials/arm-atlas.webp?url'
/** Shared art-trial library. Albedo is sRGB; ARM/OpenGL normals are linear data. */
export async function loadLookdevMaterials(){
 const textures:Texture[]=[],materials:MeshStandardMaterial[]=[]
 try {
  const loader=new TextureLoader(),inverse=await loader.loadAsync(inverseUrl);inverse.generateMipmaps=false;inverse.minFilter=inverse.magFilter=LinearFilter;textures.push(inverse)
  const [map,gaussian,normalMap,arm]=await Promise.all([loader.loadAsync(albedoUrl),loader.loadAsync(gaussianUrl),loader.loadAsync(normalUrl),loader.loadAsync(armUrl)])
  map.colorSpace=SRGBColorSpace
  for(const texture of [map,gaussian,normalMap,arm]){texture.anisotropy=4;textures.push(texture)}
  const cell=544,columns=3,rows=Math.ceil(manifest.entries.length/columns)
  for(const [index,entry] of manifest.entries.entries()){
   const stat=stochastic.find(s=>s.id===entry.id)!
   const col=index%columns,row=Math.floor(index/columns)
   const atlasRect=new Vector4((col*cell+16)/(columns*cell),((rows-row-1)*cell+16)/(rows*cell),512/(columns*cell),512/(rows*cell))
   materials.push(new MeshStandardMaterial({name:entry.role,map,normalMap,normalScale:new Vector2(.65,.65),aoMap:arm,roughnessMap:arm,roughness:entry.role==='wet-sand'?.72:entry.role==='river-mud'?.82:1,metalness:0}))
   materials[materials.length-1]!.userData.stochastic={gaussian,inverse,metresPerRepeat:entry.metresPerRepeat,atlasRect,source:stat.id}
  }
  return {materials,textures,dispose(){materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}}
 }catch(error){materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());throw error}
}
