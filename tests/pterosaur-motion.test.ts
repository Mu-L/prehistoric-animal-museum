import {expect,it} from 'vitest'
import {NodeIO} from '@gltf-transform/core'
import {ALL_EXTENSIONS} from '@gltf-transform/extensions'
import {MeshoptDecoder} from 'meshoptimizer'
import {AnimationMixer,BufferAttribute,BufferGeometry,Group,Mesh,MeshStandardMaterial,SkinnedMesh,Vector3,Quaternion,Raycaster,DoubleSide} from 'three'
import {clone as cloneSkeleton} from 'three/examples/jsm/utils/SkeletonUtils.js'
import {preparePterosaurMotion} from '../src/viewer/pterosaur-motion'
import {animationWeights} from '../src/flight-experience/flight-animation-default'
import {FlightAnimationController} from '../src/flight-experience/flight-animation'

async function load(id:string){
 await MeshoptDecoder.ready
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder})
 const d=await io.read(`src/content/animals/${id}/model/model.glb`),root=new Group()
 for(const source of d.getRoot().listMeshes())for(const primitive of source.listPrimitives()){
  const g=new BufferGeometry()
  for(const [semantic,name] of [['POSITION','position'],['NORMAL','normal']] as const){const a=primitive.getAttribute(semantic)!;g.setAttribute(name,new BufferAttribute(a.getArray()!.slice() as ConstructorParameters<typeof BufferAttribute>[0],3,a.getNormalized()))}
  if(primitive.getIndices())g.setIndex(new BufferAttribute(Uint32Array.from(primitive.getIndices()!.getArray()!),1))
  g.morphTargetsRelative=true
  for(const [semantic,name] of [['POSITION','position'],['NORMAL','normal']] as const)g.morphAttributes[name]=primitive.listTargets().map(t=>{const a=t.getAttribute(semantic)!;return new BufferAttribute(a.getArray()!.slice() as ConstructorParameters<typeof BufferAttribute>[0],3,a.getNormalized())})
  const m=new Mesh(g,new MeshStandardMaterial());const names=source.getExtras().targetNames as string[];names.forEach((name,i)=>{m.morphTargetDictionary![name]=i});root.add(m)
 }
 return root
}
it.each(['tupandactylus','rhamphorhynchus'])('rigs the real %s mesh while retaining its visible outline and material seams',async id=>{
 const root=await load(id)
 const original=root.children.map(o=>{const p=(o as Mesh).geometry.getAttribute('position');return Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)])})
 const clips=preparePterosaurMotion(root,id,[]),meshes=root.children as SkinnedMesh[]
 expect(preparePterosaurMotion(root,id,clips)).toBe(clips)
 expect(clips.map(c=>c.name)).toEqual(['Idle','FlightPowered','FlightGlide'])
 const seams=new Map<string,number[]>()
 for(const [index,m]of meshes.entries()){
  expect(m).toBeInstanceOf(SkinnedMesh)
  expect(m.skeleton.bones.length).toBe(16)
  const pos=m.geometry.getAttribute('position'),weights=m.geometry.getAttribute('skinWeight'),indices=m.geometry.getAttribute('skinIndex')
  for(let i=0;i<pos.count;i++){
   const [x,y,z]=original[index]![i]!
   expect(pos.getX(i)).toBeCloseTo(x!,6);expect(pos.getZ(i)).toBeCloseTo(z!,6)
   if(id==='tupandactylus'&&Math.abs(z!)<.07){
    expect(pos.getY(i)-y!).toBeGreaterThanOrEqual(-.018001)
    expect(pos.getY(i)-y!).toBeLessThan(1e-7)
   }else expect(pos.getY(i)).toBeCloseTo(y!,6)
  }
  for(let i=0;i<pos.count;i++){
   const ws=[weights.getX(i),weights.getY(i),weights.getZ(i),weights.getW(i)],is=[indices.getX(i),indices.getY(i),indices.getZ(i),indices.getW(i)]
   expect(ws.reduce((a,b)=>a+b,0)).toBeCloseTo(1,6)
   expect(ws.every(w=>w>=0&&w<=1)).toBe(true)
   expect(is.every(j=>j>=0&&j<m.skeleton.bones.length)).toBe(true)
   if(id==='tupandactylus'&&pos.getY(i)>-.07&&Math.abs(pos.getZ(i))<.035){
    expect(is[0]).toBe(2);expect(ws[0]).toBe(1)
   }
   const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].join(','),value=[...is,...ws]
   if(seams.has(key))expect(value).toEqual(seams.get(key));else seams.set(key,value)
   if(id==='tupandactylus'&&pos.getY(i)>=-.12){
    const jaw=m.geometry.morphAttributes.position![0]!
    expect(Math.hypot(jaw.getX(i),jaw.getY(i),jaw.getZ(i))).toBeLessThan(1e-7)
   }
  }
  const n=m.geometry.morphAttributes.normal![0]!
  expect(Array.from(n.array).every(Number.isFinite)).toBe(true)
  const jaw=m.geometry.morphAttributes.position![0]!
  for(let i=0;i<pos.count;i++)if(Math.hypot(jaw.getX(i),jaw.getY(i),jaw.getZ(i))<1e-9&&pos.getX(i)>-.10){
   expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeLessThan(1e-5)
  }
 }
 const mixer=new AnimationMixer(root),m=meshes[0]!,point=new Vector3()
 const getTip=()=>{let index=0;const p=m.geometry.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getZ(i)>p.getZ(index))index=i;return index}
 const tip=getTip()
 for(const clip of clips){
  for(const track of clip.tracks.filter(t=>t.name.includes('morphTargetInfluences'))){
   expect(Math.min(...track.values)).toBeGreaterThanOrEqual(id==='tupandactylus'?.8399:0)
   expect(Math.max(...track.values)).toBeLessThanOrEqual(1)
  }
  for(const track of clip.tracks){const n=track.getValueSize();expect(Array.from(track.values.slice(0,n))).toEqual(Array.from(track.values.slice(-n)))}
  mixer.stopAllAction();mixer.clipAction(clip).reset().play()
  for(let frame=0;frame<60;frame++){
   mixer.setTime(clip.duration*frame/60);root.updateMatrixWorld(true);m.skeleton.update()
   m.getVertexPosition(tip,point)
   expect(point.toArray().every(Number.isFinite)).toBe(true)
   expect(point.length()).toBeLessThan(1.65)
  }
 }
 const idle=clips[0]!,action=mixer.clipAction(idle);mixer.stopAllAction();action.reset().play()
 mixer.setTime(.1);root.updateMatrixWorld(true)
 const head=m.skeleton.bones[2]!.quaternion.clone(),wrist=m.skeleton.bones[6]!.quaternion.clone()
 mixer.setTime(idle.duration*.36);root.updateMatrixWorld(true)
 expect(head.angleTo(m.skeleton.bones[2]!.quaternion)).toBeGreaterThan(.03)
 expect(wrist.angleTo(m.skeleton.bones[6]!.quaternion)).toBeGreaterThan(.08)
 const sourceHead=m.skeleton.bones[2]!.quaternion.clone(),clone=cloneSkeleton(root),copy=clone.children[0] as SkinnedMesh
 const cloneMixer=new AnimationMixer(clone);cloneMixer.clipAction(idle).play();cloneMixer.setTime(.1)
 expect(copy.skeleton.bones[2]).not.toBe(m.skeleton.bones[2])
 expect(copy.skeleton.bones[2]!.quaternion.angleTo(sourceHead)).toBeGreaterThan(.03)
 expect(m.skeleton.bones[2]!.quaternion.equals(sourceHead)).toBe(true)
})
it('leaves the original skeletal Pteranodon animation untouched',()=>{
 const root=new Group(),clips:ReturnType<typeof preparePterosaurMotion>=[]
 expect(preparePterosaurMotion(root,'pteranodon',clips)).toBe(clips)
 expect(root.userData.pterosaurMotion).toBeUndefined()
})
it('sustains climb effort and releases smoothly into descent',()=>{
 const controller=new FlightAnimationController()
 for(let i=0;i<180;i++)controller.update(1/60,1,6)
 expect(controller.poweredWeight).toBe(1)
 expect(animationWeights('auto',controller.poweredWeight,0)).toEqual({source:0,powered:1,glide:0})
 controller.update(1/60,0,0);expect(controller.poweredWeight).toBe(1)
 for(let i=0;i<120;i++)controller.update(1/60,-1,-4)
 expect(animationWeights('auto',controller.poweredWeight,1)).toEqual({source:0,powered:0,glide:1})
})

it('lets Rhamphorhynchus look both ways and lift its beak throughout sustained climbing',async()=>{
 const root=await load('rhamphorhynchus'),clips=preparePterosaurMotion(root,'rhamphorhynchus',[])
 const mixer=new AnimationMixer(root),mesh=root.children[0] as SkinnedMesh,head=mesh.skeleton.bones[2]!
 const yaw:number[]=[],climbPitch:number[]=[]
 for(const clip of clips.slice(0,2)){
  mixer.stopAllAction();mixer.clipAction(clip).reset().play()
  for(let i=0;i<120;i++){
   mixer.setTime(clip.duration*i/120);root.updateMatrixWorld(true)
   const rotation=head.getWorldQuaternion(new Quaternion()),gaze=new Vector3(-1,0,0).applyQuaternion(rotation)
   if(clip.name==='Idle')yaw.push(Math.atan2(gaze.z,-gaze.x))
   // The rest beak is angled 28 degrees down, unlike the reference animal.
   else climbPitch.push(new Vector3(-1,-Math.tan(28*Math.PI/180),0).normalize().applyQuaternion(rotation).y)
  }
 }
 expect(Math.min(...yaw)).toBeLessThan(-.15);expect(Math.max(...yaw)).toBeGreaterThan(.15)
 expect(Math.abs(yaw.reduce((a,b)=>a+b,0)/yaw.length)).toBeLessThan(.06)
 // Flight's whole-body ascent pitch adds another 13 degrees. The beak itself
 // must already be near level at the lowest point of every powered wingbeat.
 expect(Math.min(...climbPitch)).toBeGreaterThan(-.18)
 expect(Math.max(...climbPitch)).toBeGreaterThan(0)
})
it('gives the Tupandactylus tail a small balanced movement with a seamless loop',async()=>{
 const root=await load('tupandactylus'),clips=preparePterosaurMotion(root,'tupandactylus',[])
 const mixer=new AnimationMixer(root),mesh=root.children[0] as SkinnedMesh,tail=mesh.skeleton.bones[3]!,angles:number[]=[]
 mixer.clipAction(clips[0]!).play()
 for(let i=0;i<120;i++){
  mixer.setTime(clips[0]!.duration*i/120);root.updateMatrixWorld(true)
  const direction=new Vector3(1,0,0).applyQuaternion(tail.getWorldQuaternion(new Quaternion()))
  angles.push(Math.atan2(direction.z,direction.x))
 }
 expect(Math.min(...angles)).toBeLessThan(-.04);expect(Math.max(...angles)).toBeGreaterThan(.04)
 expect(Math.max(...angles)-Math.min(...angles)).toBeLessThan(.20)
})

it('keeps the inner wing sheet below the Tupandactylus dorsal surface',async()=>{
 const root=await load('tupandactylus');preparePterosaurMotion(root,'tupandactylus',[]);root.updateMatrixWorld(true)
 const mesh=root.children[0] as SkinnedMesh;(mesh.material as MeshStandardMaterial).side=DoubleSide
 // Probe the actual intersecting shoulder surfaces, on both sides of the back.
 for(const x of [-.075,-.070,-.065])for(const z of [-.03,.03]){
  const hits=new Raycaster(new Vector3(x,1,z),new Vector3(0,-1,0)).intersectObject(mesh,false)
  expect(hits.length).toBeGreaterThanOrEqual(2)
  expect(hits[0]!.point.y-hits[1]!.point.y).toBeGreaterThan(.006)
 }
})
it('keeps dorsal shoulder skin stable while the Tupandactylus turns its neck',async()=>{
 const root=await load('tupandactylus');preparePterosaurMotion(root,'tupandactylus',[]);root.updateMatrixWorld(true)
 const mesh=root.children[0] as SkinnedMesh,p=mesh.geometry.getAttribute('position')
 const back:Array<readonly[number,Vector3]>=[]
 for(let i=0;i<p.count;i++)if(p.getX(i)>-.09&&p.getX(i)<.06&&Math.abs(p.getZ(i))<.03&&p.getY(i)>-.19&&p.getY(i)<-.14)back.push([i,mesh.getVertexPosition(i,new Vector3())])
 expect(back.length).toBeGreaterThan(300)
 for(const turn of [-.35,.35]){
  mesh.skeleton.bones[1]!.rotation.set(0,turn,-.25)
  mesh.skeleton.bones[2]!.rotation.set(0,-turn*.5,.1)
  root.updateMatrixWorld(true)
  for(const [i,rest]of back)expect(mesh.getVertexPosition(i,new Vector3()).distanceTo(rest)).toBeLessThan(1e-7)
 }
})
