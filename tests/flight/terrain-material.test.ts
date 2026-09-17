import {expect,it} from 'vitest'
import {MeshStandardMaterial,Texture,Vector2} from 'three'
import {decorateMaterialTerrain} from '../../src/flight-experience/lookdev/material-terrain'
it('keeps distinct morph and far-coverage programs when sharing the terrain material library',()=>{
 const library=Array.from({length:4},()=>{const m=new MeshStandardMaterial({map:new Texture(),normalMap:new Texture()});m.userData.stochastic={gaussian:new Texture(),inverse:new Texture(),metresPerRepeat:2};return m})
 const near=new MeshStandardMaterial(),far=new MeshStandardMaterial()
 near.customProgramCacheKey=()=> 'morph';far.customProgramCacheKey=()=> 'coverage'
 const trial={method:'histogram',channel:'pbr',scale:1,layers:4} as const,origin={value:new Vector2()}
 decorateMaterialTerrain(near,library,trial,origin);decorateMaterialTerrain(far,library,trial,origin)
 expect(near.customProgramCacheKey()).not.toBe(far.customProgramCacheKey())
 expect(near.map).toBe(far.map);expect(near.normalMap).toBe(far.normalMap)
 near.dispose();far.dispose();for(const m of library){m.map?.dispose();m.normalMap?.dispose();const data=m.userData.stochastic as {gaussian:Texture;inverse:Texture};data.gaussian.dispose();data.inverse.dispose();m.dispose()}
})
