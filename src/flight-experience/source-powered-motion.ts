import { AnimationClip, Quaternion, type Interpolant, type KeyframeTrack } from 'three'

// One large source beat: raised wings → downstroke → folded recovery → raised.
// The earlier 1.78–3.74 excerpt crossed into the next downstroke; crossfading
// its cut created an extra short beat. Periodic interpolation joins the poses
// with matching velocity, so there is exactly one effort cycle per loop.
const sourcePoses=[3.53,3.78,4.02,4.28,4.56,4.80]
export function sourcePoweredMotion(source:AnimationClip):AnimationClip {
 const duration=1.5,steps=120
 const times=Array.from({length:steps+1},(_,i)=>duration*i/steps)
 const tracks=source.tracks.map(track=>{
  const interpolate=(track as KeyframeTrack & {createInterpolant():Interpolant}).createInterpolant()
  const poses=sourcePoses.map(time=>Array.from(interpolate.evaluate(time))),size=track.getValueSize(),values:number[]=[]
  if(track.ValueTypeName==='quaternion')for(let i=0;i<poses.length;i++){
   const q=new Quaternion().fromArray(poses[i]!).normalize()
   if(i && q.dot(new Quaternion().fromArray(poses[i-1]!))<0)q.set(-q.x,-q.y,-q.z,-q.w)
   poses[i]=q.toArray()
  }
  for(let frame=0;frame<=steps;frame++){
   const phase=(frame%steps)/steps*poses.length,index=Math.floor(phase),t=phase-index
   const sample=(offset:number)=>poses[(index+offset+poses.length)%poses.length]!
   const a=sample(-1),b=sample(0),c=sample(1),d=sample(2),value:number[]=[]
   for(let j=0;j<size;j++)value.push(.5*((2*b[j]!)+(-a[j]!+c[j]!)*t+(2*a[j]!-5*b[j]!+4*c[j]!-d[j]!)*t*t+(-a[j]!+3*b[j]!-3*c[j]!+d[j]!)*t*t*t))
   values.push(...(track.ValueTypeName==='quaternion'?new Quaternion().fromArray(value).normalize().toArray():value))
  }
  const result=track.clone();result.times=Float32Array.from(times);result.values=Float32Array.from(values);return result
 })
 return new AnimationClip('SourcePoweredFlap',duration,tracks)
}
