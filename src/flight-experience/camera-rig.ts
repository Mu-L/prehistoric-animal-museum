import { DEFAULT_FLIGHT_SPECIES, type FlightSpeciesProfile } from './species/profiles'
import { Vector3 } from 'three'
import { framingDistance, type FlightView } from './settings'
import type { Position } from './world'
export type Perspective = 'rear' | 'front' | 'left' | 'right' | 'custom'
export interface CameraAngles { yaw: number; pitch: number }
export interface CameraPose { position: Vector3; target: Vector3 }
export type CameraRejection = 'terrain-pending' | 'camera-clearance' | 'occluded' | 'body-clearance' | 'companion-clearance'
export const CAMERA_PRESETS = { rear: 0, front: 165 * Math.PI / 180, left: -Math.PI / 2, right: Math.PI / 2 }
// Original Idle, 121 offline samples: 7.22 x 4.74 x 3.15m, radius 4.797m.
// Padding covers sampling gaps, roll/pitch and the near plane independently.
export const HERO_RADIUS = 5.5
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
export const angleDelta = (from: number, to: number) => {
  const d = Math.atan2(Math.sin(to - from), Math.cos(to - from))
  return Math.abs(Math.abs(d) - Math.PI) < 1e-8 ? Math.PI : d
}
export function orbitPose(p: Position, heading: number, angles: CameraAngles, aspect: number, view: FlightView, framing:FlightSpeciesProfile['camera']=DEFAULT_FLIGHT_SPECIES.camera, zoom?:number): CameraPose {
  const distance = framingDistance(aspect, view,framing.span,framing.height,framing.minDistance,zoom)
  const elevation = clamp(Math.atan2(framing.offsetHeight, distance) + angles.pitch, -Math.PI * .38, Math.PI * .38)
  const radius = Math.max(framing.radius + Math.min(3,framing.span*3/7), Math.hypot(distance, framing.offsetHeight))
  const h = heading - angles.yaw, horizontal = radius * Math.cos(elevation)
  return {
    position: new Vector3(p.x - Math.sin(h) * horizontal, p.y + Math.sin(elevation) * radius, p.z + Math.cos(h) * horizontal),
    target: new Vector3(p.x, p.y, p.z),
  }
}
export function fixedTarget(position: Position, recommended: Position, angles: CameraAngles): Vector3 {
  const direction = new Vector3(recommended.x-position.x,recommended.y-position.y,recommended.z-position.z)
  const yaw = Math.atan2(direction.x, -direction.z) + angles.yaw
  const pitch = clamp(Math.atan2(direction.y, Math.hypot(direction.x,direction.z)) + angles.pitch, -Math.PI*.44, Math.PI*.44)
  return new Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(direction.length()).add(new Vector3(position.x,position.y,position.z))
}
/** Intent has no simulation access and never writes a Three camera. */
export class FlightCameraRig {
  requested: CameraAngles = { yaw: 0, pitch: 0 }
  resolved: CameraAngles = { yaw: 0, pitch: 0 }
  perspective: Perspective = 'rear'
  rejection: CameraRejection | null = null
  generation = 0
  private speed = 0
  get rear() { return Math.abs(angleDelta(0,this.resolved.yaw)) < 1e-7 && Math.abs(this.resolved.pitch)<1e-7 }
  get moving() { return Math.abs(angleDelta(this.resolved.yaw,this.requested.yaw))+Math.abs(this.requested.pitch-this.resolved.pitch)>1e-6 && this.rejection===null }
  select(preset: Exclude<Perspective,'custom'>) {
    this.perspective=preset;this.requested={yaw:this.resolved.yaw+angleDelta(this.resolved.yaw,CAMERA_PRESETS[preset]),pitch:0};this.rejection=null;this.generation++
  }
  nudge(yaw: number, pitch: number) {
    if(!Number.isFinite(yaw)||!Number.isFinite(pitch))return
    this.perspective='custom';this.requested={yaw:this.requested.yaw+yaw,pitch:clamp(this.requested.pitch+pitch,-1.2,.95)};this.rejection=null;this.generation++
  }
  cancel() { this.requested={...this.resolved};this.speed=0;this.generation++ }
  reset() { this.requested={yaw:0,pitch:0};this.resolved={...this.requested};this.perspective='rear';this.rejection=null;this.speed=0;this.generation++ }
  snapshot() { return { requested:{...this.requested},resolved:{...this.resolved},perspective:this.perspective,rejection:this.rejection,generation:this.generation } }
  restore(state: ReturnType<FlightCameraRig['snapshot']>) { this.requested={...state.resolved};this.resolved={...state.resolved};this.perspective=state.perspective;this.rejection=null;this.speed=0;this.generation++ }
  step(delta: number, gentle: boolean, accept: (from: CameraAngles, to: CameraAngles)=>CameraRejection|null) {
    if(!this.moving)return
    const dt=Number.isFinite(delta)?clamp(delta,0,1/15):0
    if(dt===0)return
    const dy=angleDelta(this.resolved.yaw,this.requested.yaw),dp=this.requested.pitch-this.resolved.pitch,distance=Math.hypot(dy,dp)
    this.speed=Math.min(2.1,this.speed+6*dt,Math.sqrt(12*distance))
    const ratio=gentle?1:Math.min(1,this.speed*dt/distance)
    const next={yaw:this.resolved.yaw+dy*ratio,pitch:this.resolved.pitch+dp*ratio}
    const rejected=accept(this.resolved,next)
    this.rejection=rejected
    if(rejected){this.speed=0;return}
    this.resolved=next
    if(!this.moving){this.resolved={...this.requested};this.speed=0}
  }
}
