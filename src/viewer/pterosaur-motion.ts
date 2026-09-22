import {
  AnimationClip, Bone, Float32BufferAttribute, Matrix3, Mesh, NumberKeyframeTrack,
  Quaternion, QuaternionKeyframeTrack, Skeleton, SkinnedMesh, Uint16BufferAttribute,
  Vector3, VectorKeyframeTrack, type BufferGeometry, type KeyframeTrack, type Object3D,
} from 'three'
import reference from './pterosaur-motion-reference.json'

const smooth = (lo:number,hi:number,x:number) => {
  const t=Math.max(0,Math.min(1,(x-lo)/(hi-lo)));return t*t*(3-2*t)
}
const identity=new Quaternion()
const up=new Vector3(0,1,0),side=new Vector3(0,0,1)
interface Joint { name:string; parent:number; point:Vector3 }

/** The two morph-only source animals receive a lightweight articulated rig.
 * Source coordinates are head -X, dorsal +Y, wings ±Z. Only the hidden
 * intersecting wing attachment is inset; source GLB files remain untouched.
 * Motion is retargeted from the bundled Pteranodon's authored animation, including
 * independent left/right recovery, wrist feathering and gaze stabilization.
 */
export function preparePterosaurMotion(root:Object3D,id:string,source:AnimationClip[]):AnimationClip[] {
  if(id!=='tupandactylus'&&id!=='rhamphorhynchus')return source
  if(root.userData.pterosaurMotion)return root.animations
  const originals:Mesh[]=[]
  root.traverse(o=>{if(o instanceof Mesh&&o.morphTargetDictionary?.MotionPositive!==undefined)originals.push(o as Mesh)})
  if(!originals.length)return source
  const tupa=id==='tupandactylus',bodyX=tupa?0:-.20,bodyY=tupa?-.18:.02
  const joints:Joint[]=[]
  const joint=(name:string,parent:number,x:number,y:number,z:number)=>joints.push({name,parent,point:new Vector3(x,y,z)})-1
  joint('body',-1,bodyX,bodyY,0)
  joint('neck',0,tupa?-.075:-.38,tupa?-.155:.025,0)
  joint('head',1,tupa?-.20:-.47,tupa?-.08:.025,0)
  joint('tail',0,tupa?.15:.02,bodyY,0)
  for(const [side,sign]of [['left',1],['right',-1]] as const){
    const shoulder=joint(`${side}Shoulder`,0,tupa?-.025:-.29,tupa?-.14:.03,sign*.075)
    joint(`${side}Elbow`,shoulder,tupa?-.045:-.31,tupa?-.13:.035,sign*.20)
    joint(`${side}Wrist`,shoulder+1,tupa?-.13:-.35,tupa?-.12:.045,sign*.39)
    joint(`${side}Finger`,shoulder+2,tupa?-.155:-.31,tupa?-.16:.03,sign*.64)
    joint(`${side}Tip`,shoulder+3,tupa?-.145:-.275,tupa?-.21:.023,sign*.82)
  }
  joint('leftFoot',0,tupa?.12:0,bodyY,.11)
  joint('rightFoot',0,tupa?.12:0,bodyY,-.11)
  const meshes:SkinnedMesh[]=[]
  for(const [index,original]of originals.entries()){
    const geometry=original.geometry
    if(tupa)insetWingRoots(geometry)
    const position=geometry.getAttribute('position'),count=position.count
    const indices=new Uint16Array(count*4),weights=new Float32Array(count*4)
    for(let i=0;i<count;i++){
      const x=position.getX(i),y=position.getY(i),z=position.getZ(i),span=Math.abs(z)
      const w=Array<number>(joints.length).fill(0)
      // The tall crest is part of the rigid skull, including its rearward edge.
      const crest=tupa?smooth(-.14,-.07,y)*(1-smooth(.045,.11,span)):0
      // Keep the shoulder/back surface on the torso. Extending neck weights
      // to x=-.025 deformed this dorsal patch whenever the head turned.
      const head=Math.max(crest,(1-smooth(tupa?-.17:-.45,tupa?-.09:-.32,x))*(1-smooth(.10,.22,span)))
      const headJoint=Math.max(crest,1-smooth(tupa?-.24:-.51,tupa?-.14:-.42,x))
      w[1]=head*(1-headJoint);w[2]=head*headJoint
      const tail=smooth(tupa?.16:.03,tupa?.29:.30,x)*(1-smooth(.045,.11,span))
      w[3]=tail*(1-head)
      const foot=smooth(tupa?.08:-.10,tupa?.18:.02,x)*smooth(.035,.085,span)*(1-smooth(.15,.23,span))*(1-tail)
      w[z>=0?14:15]=foot
      const wing=smooth(.045,.125,span)*(1-head)*(1-tail)*(1-foot)
      const first=z>=0?4:9
      let remaining=wing
      for(let j=0;j<4;j++){
        const at=joints[first+j+1]!.point.z*(z>=0?1:-1)
        const next=smooth(at-.065,at+.065,span)
        w[first+j]=remaining*(1-next);remaining*=next
      }
      w[first+4]=remaining
      w[0]=Math.max(0,1-w.reduce((a,b)=>a+b,0))
      // Smooth spatial weights agree across duplicate UV/material seam vertices.
      const selected=w.map((weight,bone)=>({weight,bone})).sort((a,b)=>b.weight-a.weight).slice(0,4)
      const total=selected.reduce((sum,v)=>sum+v.weight,0)
      selected.forEach((v,j)=>{indices[i*4+j]=v.bone;weights[i*4+j]=v.weight/total})
    }
    geometry.setAttribute('skinIndex',new Uint16BufferAttribute(indices,4))
    geometry.setAttribute('skinWeight',new Float32BufferAttribute(weights,4))
    prepareJaw(original,tupa)
    const mesh=new SkinnedMesh(geometry,original.material)
    mesh.name=`${id}-motion-${index}`
    mesh.position.copy(original.position);mesh.quaternion.copy(original.quaternion);mesh.scale.copy(original.scale)
    mesh.castShadow=original.castShadow;mesh.receiveShadow=original.receiveShadow;mesh.userData={...original.userData}
    mesh.morphTargetDictionary={...(original.morphTargetDictionary??{})}
    mesh.morphTargetInfluences=[...(original.morphTargetInfluences??[])]
    const bones=joints.map((j,i)=>{const b=new Bone();b.name=`${mesh.name}-${j.name}`;b.position.copy(j.point);if(j.parent>=0)b.position.sub(joints[j.parent]!.point);b.userData.jointIndex=i;return b})
    bones.forEach((b,i)=>{const p=joints[i]!.parent;if(p<0)mesh.add(b);else bones[p]!.add(b)})
    const parent=original.parent!;parent.add(mesh);parent.remove(original)
    root.updateMatrixWorld(true);mesh.bind(new Skeleton(bones))
    // Runtime bounds cannot assume the static, spread-wing morph geometry.
    mesh.frustumCulled=false
    meshes.push(mesh)
  }
  const duration=reference.idle.duration/(tupa?1:1.22),steps=320
  const times=Array.from({length:steps+1},(_,i)=>duration*i/steps)
  const sample=(frames:number[][],phase:number)=>{
    const f=(phase%1)*(frames.length-1),a=Math.floor(f),t=f-a
    const lo=frames[a]!,hi=frames[a+1]!
    const position=new Vector3().fromArray(lo).lerp(new Vector3().fromArray(hi),t)
    const rotations=joints.map(j=>{
      const offset=3+reference.bones.indexOf(j.name)*4
      return new Quaternion().fromArray(lo,offset).slerp(new Quaternion().fromArray(hi,offset),t)
    })
    return {position,rotations}
  }
  const make=(name:string,mode:'cruise'|'climb'|'descend')=>{
    const values=joints.map(()=>({rotation:[] as number[],position:[] as number[]})),mouth:number[]=[]
    for(let frame=0;frame<=steps;frame++){
      const phase=(frame%steps)/steps
      const pose=sample(mode==='climb'?reference.powered.frames:reference.idle.frames,mode==='climb'?phase*7:phase)
      const globals=pose.rotations.map((q,i)=>{
        let strength=i===0?.65:i===1||i===2?(tupa?.65:.9):i===3?.5:1
        if(mode==='descend'&&i>=4&&i<=13)strength=.09
        return identity.clone().slerp(q,strength)
      })
      if(!tupa){
        // The reference head rests about 20° to one side. Recenter its gaze,
        // retaining the authored look-around rather than adding another cycle.
        globals[2]!.premultiply(new Quaternion().setFromAxisAngle(up,-.30))
        if(mode==='climb'){
          // This animal's beak slopes down in its rest mesh. Lift the neck and
          // skull together so the gaze follows ascent, without changing wingbeats.
          globals[1]!.premultiply(new Quaternion().setFromAxisAngle(side,-.30))
          globals[2]!.premultiply(new Quaternion().setFromAxisAngle(side,-.60))
        }
      }else{
        // A small, slow balancing response at the tail, independent of wingbeats.
        // Uneven rests keep it from reading as a metronomic side-to-side wag.
        const sweep=smooth(.08,.25,phase)-2*smooth(.35,.64,phase)+smooth(.78,.96,phase)
        globals[3]!.premultiply(new Quaternion().setFromAxisAngle(up,.075*sweep))
        globals[3]!.premultiply(new Quaternion().setFromAxisAngle(side,.025*sweep))
      }
      for(let i=0;i<joints.length;i++){
        const parent=joints[i]!.parent
        const q=parent<0?globals[i]!:globals[parent]!.clone().invert().multiply(globals[i]!)
        values[i]!.rotation.push(...q.toArray())
      }
      values[0]!.position.push(bodyX+pose.position.x*.45,bodyY+pose.position.y*(mode==='descend'?.15:.6),pose.position.z*.45)
      // A brief, unhurried opening during the glide phrase, never a permanently open mouth.
      const open=smooth(.55,.60,phase)*(1-smooth(.65,.72,phase))
      mouth.push(tupa?1-.16*open:open*.6)
    }
    const tracks:KeyframeTrack[]=[]
    for(const mesh of meshes){
      joints.forEach((j,i)=>tracks.push(new QuaternionKeyframeTrack(`${mesh.name}-${j.name}.quaternion`,times,values[i]!.rotation)))
      tracks.push(new VectorKeyframeTrack(`${mesh.name}-body.position`,times,values[0]!.position))
      tracks.push(new NumberKeyframeTrack(`${mesh.name}.morphTargetInfluences[0]`,times,mouth))
    }
    return new AnimationClip(name,duration,tracks)
  }
  const result=[make('Idle','cruise'),make('FlightPowered','climb'),make('FlightGlide','descend')]
  root.animations=result;root.userData.pterosaurMotion=true
  return result
}

/** Keep the inspected jaw closure. Skin and mouth lining use exactly the same
 * deformation and transported split normals; skinning then moves the whole head. */
function prepareJaw(mesh:Mesh,tupa:boolean){
  const geometry=mesh.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal')
  const deform=(x:number,y:number,z:number)=>{
    if(!tupa){
      const w=(1-smooth(-.53,-.44,x))*(1-smooth(-.036,-.012,y))*(1-smooth(.055,.10,Math.abs(z)))
      return new Vector3(x+.002*w,y-.012*w,z)
    }
    const w=(1-smooth(-.285,-.21,x))*(1-smooth(-.15,-.12,y))
    const a=-.65*w,c=Math.cos(a),s=Math.sin(a),dx=x+.225,dy=y+.12
    const corner=.042*Math.exp(-Math.pow((x+.255)/.032,2))*(1-smooth(-.15,-.12,y))
    const raised=-.12+dx*s+dy*c+corner,above=Math.max(0,raised+.125)
    return new Vector3(-.225+dx*c-dy*s,raised-w*(above-above/(1+above/.003)),z)
  }
  const dp=new Float32Array(position.count*3),dn=new Float32Array(position.count*3),eps=1e-4
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i),v=deform(x,y,z)
    dp.set([v.x-x,v.y-y,v.z-z],i*3)
    if(normal){
      const a=deform(x+eps,y,z).sub(deform(x-eps,y,z)).multiplyScalar(.5/eps)
      const b=deform(x,y+eps,z).sub(deform(x,y-eps,z)).multiplyScalar(.5/eps)
      const c=deform(x,y,z+eps).sub(deform(x,y,z-eps)).multiplyScalar(.5/eps)
      const matrix=new Matrix3().set(a.x,b.x,c.x,a.y,b.y,c.y,a.z,b.z,c.z).invert().transpose()
      const n0=new Vector3(normal.getX(i),normal.getY(i),normal.getZ(i)).normalize()
      const n=n0.clone().applyMatrix3(matrix).normalize().sub(n0)
      dn.set(n.toArray(),i*3)
    }
  }
  const name=tupa?'MouthClose':'JawOpen'
  const p=new Float32BufferAttribute(dp,3);p.name=name
  const n=new Float32BufferAttribute(dn,3);n.name=name
  geometry.morphAttributes={position:[p],normal:[n]};geometry.morphTargetsRelative=true
  mesh.updateMorphTargets();mesh.morphTargetDictionary={[name]:0}
  mesh.morphTargetInfluences=[tupa?1:0]
}

/** The source wings are separate sheets intersecting the torso at almost the
 * same depth. Sink only their hidden inner attachment, leaving the body, visible
 * wing outline and authored motion intact. Weld UV seams for component identity.
 */
function insetWingRoots(geometry:BufferGeometry){
  const p=geometry.getAttribute('position'),index=geometry.index
  if(!index)return
  const parents=Array.from({length:p.count},(_,i)=>i),seams=new Map<string,number>()
  const find=(i:number):number=>parents[i]===i?i:(parents[i]=find(parents[i]!))
  const join=(a:number,b:number)=>{parents[find(a)]=find(b)}
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].join(',')
    if(seams.has(key))join(i,seams.get(key)!);else seams.set(key,i)
  }
  for(let i=0;i<index.count;i+=3){join(index.getX(i),index.getX(i+1));join(index.getX(i),index.getX(i+2))}
  const spans=new Map<number,{min:number;max:number}>()
  for(let i=0;i<p.count;i++){
    const root=find(i),z=p.getZ(i),span=spans.get(root)??{min:Infinity,max:-Infinity}
    span.min=Math.min(span.min,z);span.max=Math.max(span.max,z);spans.set(root,span)
  }
  const wings=new Set([...spans].filter(([,s])=>s.min*s.max>0&&Math.max(Math.abs(s.min),Math.abs(s.max))>.5).map(([i])=>i))
  const points=new Float32Array(p.count*3)
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i)
    const inset=wings.has(find(i))?.018*(1-smooth(.025,.070,Math.abs(z))):0
    points.set([x,y-inset,z],i*3)
  }
  geometry.setAttribute('position',new Float32BufferAttribute(points,3))
}
