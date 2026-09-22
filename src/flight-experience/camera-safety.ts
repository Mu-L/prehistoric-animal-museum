import { Vector3 } from 'three'
import { HERO_RADIUS, type CameraPose, type CameraRejection } from './camera-rig'
import type { Position } from './world'
export interface CameraSphere { position: Position; radius: number }
export function nearPlaneRadius(near: number, fov: number, aspect: number) {
  return Math.max(.75,near*Math.sqrt(1+Math.tan(fov*Math.PI/360)**2*(1+aspect**2)))
}
export function segmentPointDistance(from: Position,to: Position,p: Position) {
  const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z
  const t=Math.max(0,Math.min(1,((p.x-from.x)*dx+(p.y-from.y)*dy+(p.z-from.z)*dz)/Math.max(1e-12,dx*dx+dy*dy+dz*dz)))
  return Math.hypot(from.x+dx*t-p.x,from.y+dy*t-p.y,from.z+dz*t-p.z)
}
function clearLine(from:Position,to:Position,radius:number,surface:(x:number,z:number)=>number): CameraRejection|null {
  const length=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z),steps=Math.max(1,Math.ceil(length/2))
  if(steps>96)return 'camera-clearance'
  for(let i=0;i<=steps;i++){
    const t=i/steps,x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t,z=from.z+(to.z-from.z)*t
    // Visibility is a center ray; the landscape proxy already includes a 2m
    // obstacle margin. Only the swept lens volume needs lateral samples.
    const offsets=radius<=.25?[[0,0]]:[[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius]]
    for(const [dx,dz] of offsets){
      const h=surface(x+dx!,z+dz!)
      if(!Number.isFinite(h))return 'terrain-pending'
      if(y-radius<h)return 'camera-clearance'
    }
  }
  return null
}
/** Collision, body separation and visibility are deliberately independent. */
export function cameraSafety(from:Position,pose:CameraPose,hero:Position,surface:(x:number,z:number)=>number,radius:number,companions:readonly CameraSphere[]=[],bodyRadius=HERO_RADIUS,previousHero:Position=hero):CameraRejection|null {
  // The camera and animal translate together. Test body separation in the
  // animal's relative frame; keep terrain and visibility sweeps in world space.
  const relativeFrom={x:from.x+hero.x-previousHero.x,y:from.y+hero.y-previousHero.y,z:from.z+hero.z-previousHero.z}
  if(segmentPointDistance(relativeFrom,pose.position,hero)<bodyRadius+radius)return 'body-clearance'
  for(const sphere of companions)if(segmentPointDistance(from,pose.position,sphere.position)<sphere.radius+radius)return 'companion-clearance'
  const swept=clearLine(from,pose.position,radius,surface)
  if(swept)return swept
  const sight=clearLine(new Vector3(hero.x,hero.y,hero.z),pose.position,.2,surface)
  return sight==='camera-clearance'?'occluded':sight
}
