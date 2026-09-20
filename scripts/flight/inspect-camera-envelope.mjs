import {orbitPose} from '../../src/flight-experience/camera-rig.ts'
// Offline source animation audit. Does not alter or re-encode source assets.
import {NodeIO} from '@gltf-transform/core'
import {ALL_EXTENSIONS} from '@gltf-transform/extensions'
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {AnimationMixer,Box3,Vector3,PerspectiveCamera} from 'three'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
await MeshoptDecoder.ready; await MeshoptEncoder.ready
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder})
const path='src/content/animals/pteranodon/model/model.glb',source=await readFile(path),doc=await io.read(path)
for(const t of doc.getRoot().listTextures())t.dispose()
for(const e of doc.getRoot().listExtensionsUsed())e.dispose()
const bytes=await io.writeBinary(doc),g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
const clip=g.animations.find(c=>c.name==='Idle')??g.animations[0],m=new AnimationMixer(g.scene),envelope=new Box3()
m.clipAction(clip).play();m.setTime(0);g.scene.updateMatrixWorld(true)
const initial=new Box3().setFromObject(g.scene,true),size=initial.getSize(new Vector3()),center=initial.getCenter(new Vector3()),scale=7/Math.max(size.x,size.z)
for(let i=0;i<=120;i++){m.setTime(i*clip.duration/120);g.scene.updateMatrixWorld(true);envelope.union(new Box3().setFromObject(g.scene,true))}
const framing=[]
for(const aspect of [320/844,390/844,844/390,16/9])for(const view of ['near','standard','wide'])for(const degrees of [0,150,165,180,-90,90]){
 const camera=new PerspectiveCamera(55,aspect,.5,6000),pose=orbitPose({x:0,y:190,z:0},0,{yaw:degrees*Math.PI/180,pitch:0},aspect,view)
 camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld(true)
 let maxX=0,maxY=0,behind=false
 for(let i=0;i<=120;i++){
  m.setTime(i*clip.duration/120);g.scene.updateMatrixWorld(true);const box=new Box3().setFromObject(g.scene,true)
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
   const point=new Vector3(x,y,z).sub(center).multiplyScalar(scale);point.x*=-1;point.z*=-1;point.y+=190;point.project(camera)
   maxX=Math.max(maxX,Math.abs(point.x));maxY=Math.max(maxY,Math.abs(point.y));behind ||= point.z>1||point.z< -1
  }
 }
 framing.push({aspect,view,degrees,maxNdcX:maxX,maxNdcY:maxY,inside:maxX<1&&maxY<1&&!behind})
}
// Bounding-box corners can be empty space. Resolve flagged compositions against
// every deformed source vertex before calling them clipped.
for(const row of framing.filter(row=>!row.inside)){
 const camera=new PerspectiveCamera(55,row.aspect,.5,6000),pose=orbitPose({x:0,y:190,z:0},0,{yaw:row.degrees*Math.PI/180,pitch:0},row.aspect,row.view)
 camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld(true)
 let maxX=0,maxY=0
 const vertex=new Vector3()
 for(let i=0;i<=120;i++){
  m.setTime(i*clip.duration/120);g.scene.updateMatrixWorld(true)
  g.scene.traverse(mesh=>{if(!mesh.isMesh)return;for(let j=0;j<mesh.geometry.attributes.position.count;j++){
   mesh.getVertexPosition(j,vertex);vertex.applyMatrix4(mesh.matrixWorld).sub(center).multiplyScalar(scale);vertex.x*=-1;vertex.z*=-1;vertex.y+=190;vertex.project(camera)
   maxX=Math.max(maxX,Math.abs(vertex.x));maxY=Math.max(maxY,Math.abs(vertex.y))
  }})
 }
 row.exactMaxNdcX=maxX;row.exactMaxNdcY=maxY;row.inside=maxX<1&&maxY<1
}
const corners=[]
for(const x of [envelope.min.x,envelope.max.x])for(const y of [envelope.min.y,envelope.max.y])for(const z of [envelope.min.z,envelope.max.z])corners.push(new Vector3(x,y,z).sub(center).multiplyScalar(scale))
const radius=Math.max(...corners.map(c=>c.length()))
console.log(JSON.stringify({path,sha256:createHash('sha256').update(source).digest('hex'),clip:clip.name,duration:clip.duration,samples:121,sourceBounds:envelope,initialCenter:center,scale,flightEnvelopeSize:envelope.getSize(new Vector3()).multiplyScalar(scale),rotationInvariantRadius:radius,framing},null,2))
