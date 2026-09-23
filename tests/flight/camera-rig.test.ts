import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { FlightCameraRig, orbitPose, angleDelta, fixedTarget, HERO_RADIUS } from '../../src/flight-experience/camera-rig'
import { followOffset } from '../../src/flight-experience/camera'
import { framingDistance } from '../../src/flight-experience/settings'
const p={x:4096,y:190,z:-8192}
describe('flight camera intent and geometry',()=>{
  it('retains the rear offset while keeping a continuous animal-centered look target',()=>{
    for(const aspect of [.4,1,2.2])for(const view of ['near','standard','wide'] as const){
      const pose=orbitPose(p,.7,{yaw:0,pitch:0},aspect,view)
      expect(pose.position.distanceTo(followOffset(new Vector3(),.7,framingDistance(aspect,view),0).add(new Vector3(p.x,p.y,p.z)))).toBeLessThan(1e-10)
      expect(pose.target.toArray()).toEqual([p.x,p.y,p.z])
    }
  })
  it('keeps the target in front across every direction and aspect outside the rear composition blend',()=>{
    for(const aspect of [.4,.5625,1,16/9,2.2])for(const yaw of [-Math.PI,-Math.PI/2,Math.PI/2,150*Math.PI/180,165*Math.PI/180,Math.PI])for(const view of ['near','standard','wide'] as const){
      const pose=orbitPose(p,0,{yaw,pitch:0},aspect,view)
      expect(pose.target.clone().sub(pose.position).dot(new Vector3(p.x,p.y,p.z).sub(pose.position))).toBeGreaterThan(0)
      expect(pose.position.distanceTo(new Vector3(p.x,p.y,p.z))).toBeGreaterThan(HERO_RADIUS+2)
    }
    const front=orbitPose(p,0,{yaw:Math.PI,pitch:0},16/9,'standard')
    expect(new Vector3(p.x,p.y-5,p.z-20).sub(front.position).dot(new Vector3(p.x,p.y,p.z).sub(front.position))).toBeLessThan(0)
  })
  it('travels an arc without chord collapse, converges at 30/60/120Hz, and never writes the player',()=>{
    for(const hz of [30,60,120]){
      const rig=new FlightCameraRig();rig.select('front');let min=Infinity,maximumVelocity=0,previous=0
      for(let i=0;i<hz*3;i++){
        rig.step(1/hz,false,()=>null)
        maximumVelocity=Math.max(maximumVelocity,Math.abs(rig.resolved.yaw-previous)*hz);previous=rig.resolved.yaw
        min=Math.min(min,orbitPose(p,0,rig.resolved,16/9,'standard').position.distanceTo(new Vector3(p.x,p.y,p.z)))
      }
      expect(min).toBeGreaterThan(10);expect(rig.moving).toBe(false);expect(maximumVelocity).toBeLessThanOrEqual(2.10001)
    }
    expect(p).toEqual({x:4096,y:190,z:-8192})
  })
  it('wraps pi deterministically, rejects unavailable angles and supersedes old requests',()=>{
    expect(angleDelta(0,-Math.PI)).toBe(Math.PI)
    expect(angleDelta(Math.PI-.1,-Math.PI+.1)).toBeCloseTo(.2)
    const rig=new FlightCameraRig();rig.select('front');rig.step(.1,false,()=> 'terrain-pending')
    expect(rig.resolved.yaw).toBe(0);expect(rig.moving).toBe(false)
    rig.select('left');rig.step(NaN,false,()=>null);expect(rig.resolved.yaw).toBe(0)
    rig.step(1/60,true,()=>null);expect(rig.resolved.yaw).toBe(-Math.PI/2)
    rig.select('rear');rig.select('right');rig.cancel();expect(rig.moving).toBe(false)
  })
  it('turns at a fixed viewpoint without changing its position, and restores complete rig state',()=>{
    const fixed={x:20,y:1.6,z:10},before={...fixed}
    expect(fixedTarget(fixed,{x:20,y:1.6,z:-10},{yaw:Math.PI,pitch:0}).z).toBeCloseTo(30)
    expect(fixed).toEqual(before)
    const rig=new FlightCameraRig();rig.select('left');rig.step(.01,true,()=>null);const saved=rig.snapshot()
    rig.reset();rig.restore(saved);expect(rig.resolved).toEqual(saved.resolved);expect(rig.moving).toBe(false)
  })
})

it('keeps the look target and height continuous through rear and permits a safe underside orbit',()=>{
 for(const yaw of [-.02,0,.02,Math.PI/2,Math.PI]){
  const pose=orbitPose(p,0,{yaw,pitch:0},16/9,'standard')
  expect(pose.target.toArray()).toEqual([p.x,p.y,p.z])
  expect(pose.position.y).toBeCloseTo(p.y+5)
 }
 const rig=new FlightCameraRig();rig.nudge(0,-2);rig.step(.016,true,()=>null)
 const low=orbitPose(p,0,rig.resolved,16/9,'standard')
 expect(low.position.y).toBeLessThan(p.y-5)
 expect(low.position.distanceTo(low.target)).toBeGreaterThan(HERO_RADIUS+2)
})
