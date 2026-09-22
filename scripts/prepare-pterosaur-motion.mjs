/** Bake the bundled Pteranodon artist's coordinated motion into a compact retargeting reference.
 * Run with node --import tsx scripts/prepare-pterosaur-motion.mjs. Original GLBs are never rewritten.
 */
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { AnimationMixer, Quaternion, Vector3 } from 'three'
import { sourcePoweredMotion } from '../src/flight-experience/source-powered-motion.ts'
await MeshoptDecoder.ready
const path='src/content/animals/pteranodon/model/model.glb'
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder})
const document=await io.read(path)
for(const texture of document.getRoot().listTextures())texture.dispose()
for(const extension of document.getRoot().listExtensionsUsed())extension.dispose()
const bytes=await io.writeBinary(document)
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
const names={body:'chest9_9',neck:'neck_0312_12',head:'head15_15',tail:'pelvis91_91',leftShoulder:'LupperArm32_32',leftElbow:'LforeArm33_33',leftWrist:'Lwrist34_34',leftFinger:'Lwing0135_35',leftTip:'Lwing0236_36',rightShoulder:'RupperArm62_62',rightElbow:'RforeArm63_63',rightWrist:'Rwrist64_64',rightFinger:'Rwing0165_65',rightTip:'Rwing0266_66',leftFoot:'Lankle94_94',rightFoot:'Rankle112_112'}
const objects=Object.values(names).map(name=>gltf.scene.getObjectByName(name))
const mixer=new AnimationMixer(gltf.scene),source=gltf.animations.find(c=>c.name==='Idle')
mixer.clipAction(source).play();mixer.setTime(7);gltf.scene.updateMatrixWorld(true)
const neutral=objects.map(o=>o.getWorldQuaternion(new Quaternion()).invert())
const wingChildren={leftShoulder:'LforeArm33_33',leftElbow:'Lwrist34_34',leftWrist:'Lwing0135_35',leftFinger:'Lwing0236_36',leftTip:'Lwing0337_37',rightShoulder:'RforeArm63_63',rightElbow:'Rwrist64_64',rightWrist:'Rwing0165_65',rightFinger:'Rwing0266_66',rightTip:'Rwing0367_67'}
const spans=Object.keys(names).map((name,i)=>wingChildren[name]?gltf.scene.getObjectByName(wingChildren[name]).getWorldPosition(new Vector3()).sub(objects[i].getWorldPosition(new Vector3())).normalize():null)
const center=gltf.scene.getObjectByName('center5_5'),origin=center.getWorldPosition(new Vector3())
const axis=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),-Math.PI/2)
function sample(clip){
 mixer.stopAllAction();mixer.clipAction(clip).reset().play()
 const count=Math.round(clip.duration*30),frames=[]
 for(let i=0;i<count;i++){
  mixer.setTime(clip.duration*i/count);gltf.scene.updateMatrixWorld(true)
  const quaternions=objects.flatMap((o,j)=>{
   const q=o.getWorldQuaternion(new Quaternion()).multiply(neutral[j]).normalize()
   // Retain the authored swing. Feathering is species/proportion sensitive: a
   // full axial twist on the flatter morph meshes would crease their membranes.
   if(spans[j]){
    const v=spans[j],dot=q.x*v.x+q.y*v.y+q.z*v.z
    const twist=new Quaternion(v.x*dot,v.y*dot,v.z*dot,q.w).normalize()
    const swing=q.clone().multiply(twist.clone().invert())
    q.copy(swing.multiply(new Quaternion().slerp(twist,.18)))
   }
   q.premultiply(axis).multiply(axis.clone().invert()).normalize()
   if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w)
   return q.toArray()
  })
  const position=center.getWorldPosition(new Vector3()).sub(origin).applyQuaternion(axis).multiplyScalar(2.5)
  frames.push([...position.toArray(),...quaternions].map(v=>+v.toFixed(5)))
 }
 frames.push(frames[0])
 return {duration:clip.duration,frames}
}
const result={source:path,attribution:'Animation adapted from Pteranodon (Animated) by Chistodrako._. / Oscar López Riviello, CC-BY-4.0.',sourceUrl:'https://sketchfab.com/3d-models/pteranodon-animated-7d7683df41d1405283f160e81a5dff1b',license:'https://creativecommons.org/licenses/by/4.0/',modifications:'Sampled relative joint rotations; retargeted proportions, reduced axial feathering and translation; derived a continuous effort cycle.',sha256:crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex'),neutralTime:7,bones:Object.keys(names),idle:sample(source),powered:sample(sourcePoweredMotion(source))}
await fs.writeFile('src/viewer/pterosaur-motion-reference.json',JSON.stringify(result)+'\n')
console.log('Wrote coordinated reference',result.idle.frames.length,result.powered.frames.length)
