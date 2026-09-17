import stochastic from '../assets/lookdev-materials/stochastic.json'
import { MeshStandardMaterial, LinearFilter, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector2, type Texture } from 'three'
import manifest from '../assets/lookdev-materials/manifest.json'
const urls=import.meta.glob<string>('../assets/lookdev-materials/*.{webp,png}',{eager:true,query:'?url',import:'default'})
/** Shared art-trial library. Albedo is sRGB; ARM/OpenGL normals are linear data. */
export async function loadLookdevMaterials(){
 const textures:Texture[]=[],materials:MeshStandardMaterial[]=[]
 try {
  const inverse=await new TextureLoader().loadAsync(urls['../assets/lookdev-materials/inverse-all.png']!);inverse.generateMipmaps=false;inverse.minFilter=inverse.magFilter=LinearFilter;textures.push(inverse)
  for(const entry of manifest.entries){
   const channels=await Promise.all(['albedo','normal','arm'].map(async channel=>{
    const path=entry.maps[channel as keyof typeof entry.maps].path
    const texture=await new TextureLoader().loadAsync(urls[`../assets/lookdev-materials/${path}`]!);textures.push(texture)
    texture.wrapS=texture.wrapT=RepeatWrapping;texture.repeat.setScalar(24/entry.metresPerRepeat)
    texture.anisotropy=4;if(channel==='albedo')texture.colorSpace=SRGBColorSpace;return texture
   }))
   const map=channels[0]!,normalMap=channels[1]!,arm=channels[2]!
   const stat=stochastic.find(s=>s.id===entry.id)!
   const gaussian=await new TextureLoader().loadAsync(urls[`../assets/lookdev-materials/${stat.gaussianPath}`]!)
   gaussian.wrapS=gaussian.wrapT=RepeatWrapping;gaussian.anisotropy=4;textures.push(gaussian)
   materials.push(new MeshStandardMaterial({name:entry.role,map,normalMap,normalScale:new Vector2(.65,.65),aoMap:arm,roughnessMap:arm,roughness:entry.role==='wet-sand'?.72:1,metalness:0}))
   materials[materials.length-1]!.userData.stochastic={gaussian,inverse,metresPerRepeat:entry.metresPerRepeat}
  }
  return {materials,textures,dispose(){materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}}
 }catch(error){materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());throw error}
}
