import {expect,it} from 'vitest'
import {Vector3} from 'three'
import {cameraSafety,nearPlaneRadius} from '../../src/flight-experience/camera-safety'
const hero={x:0,y:20,z:0},pose={position:new Vector3(21,20,0),target:new Vector3(0,20,0)},from={x:20,y:20,z:0}
it('distinguishes a safe camera sweep from a wall hiding the animal',()=>{
 expect(cameraSafety(from,pose,hero,(x)=>x>8&&x<12?40:0,1)).toBe('occluded')
 expect(cameraSafety(from,pose,hero,(x)=>x>20?40:0,1)).toBe('camera-clearance')
 expect(cameraSafety(from,pose,hero,()=>NaN,1)).toBe('terrain-pending')
})
it('keeps the swept near-plane outside the full animal and nearby companions',()=>{
 expect(cameraSafety({x:-20,y:20,z:0},pose,hero,()=>0,1)).toBe('body-clearance')
 expect(cameraSafety(from,pose,hero,()=>0,1,[{position:{x:24,y:20,z:0},radius:5}])).toBe('companion-clearance')
 expect(cameraSafety(from,pose,hero,()=>0,1)).toBeNull()
 expect(nearPlaneRadius(.5,55,3)).toBeGreaterThan(nearPlaneRadius(.5,55,.5))
})
