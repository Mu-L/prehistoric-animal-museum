import means from '../assets/lookdev-materials/surface-means.json'
import { classifySurface, surfaceContext } from './surface-context'
import type { WorldSampler } from '../world'
/** Four fixed footprint samples suppress sub-pixel colour noise. No new texture,
 * sun, terrain seed or high-frequency PBR path is introduced for the horizon. */
export function horizonColor(world:WorldSampler,x:number,z:number,footprint:number):[number,number,number]{
 const color:[number,number,number]=[0,0,0]
 const radius=footprint/4
 for(const [dx,dz] of [[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius]]){
  const context=surfaceContext(world,x+dx!,z+dz!),surface=classifySurface(context)
  for(let layer=0;layer<6;layer++)for(let c=0;c<3;c++){
   color[c]!+=means.entries[layer]!.linearMean[c]!*surface.weights[layer]!*(1-surface.wetness*.12)/4
  }
 }
 return color
}
