import {NodeIO} from '@gltf-transform/core'
import {ALL_EXTENSIONS} from '@gltf-transform/extensions'
import {MeshoptDecoder} from 'meshoptimizer'
import {createHash} from 'node:crypto'
import fs from 'node:fs/promises'
await MeshoptDecoder.ready
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder})
const hash=b=>createHash('sha256').update(b).digest('hex')
const animationHash=root=>hash(Buffer.concat(root.listAnimations().flatMap(a=>a.listSamplers().flatMap(s=>[s.getInput(),s.getOutput()].map(a=>Buffer.from(a.getArray().buffer,a.getArray().byteOffset,a.getArray().byteLength))))))
const manifest=JSON.parse(await fs.readFile('src/flight-experience/assets/companions/species-manifest.json','utf8'))
for(const asset of manifest.assets){
 for(const [file,expected] of [[asset.source,asset.sourceSha256],[asset.output,asset.sha256]])if(hash(await fs.readFile(file))!==expected)throw new Error(`Hash mismatch ${file}`)
 const source=(await io.read(asset.source)).getRoot(),derived=(await io.read(asset.output)).getRoot()
 if(animationHash(source)!==animationHash(derived)||animationHash(derived)!==asset.animationHash)throw new Error('Idle samples changed')
 if(derived.listTextures().length)throw new Error('Companion duplicated textures')
 const sp=source.listMeshes().flatMap(m=>m.listPrimitives()),dp=derived.listMeshes().flatMap(m=>m.listPrimitives())
 if(sp.length!==dp.length)throw new Error('Primitive mapping changed')
 let triangles=0
 for(let p=0;p<sp.length;p++){
  const a=sp[p],b=dp[p]
  if(a.getMaterial().getName()!==b.getMaterial().getName()||a.listTargets().length!==b.listTargets().length)throw new Error('Material/morph mapping changed')
  // Every retained vertex has the same base and all morph displacements. This
  // validates animation deformation, rather than only the unchanged keyframes.
  const streams=prim=>[...prim.listAttributes(),...prim.listTargets().flatMap(t=>t.listAttributes())]
  const key=(streams,index)=>streams.map(a=>Array.from(a.getArray().slice(index*a.getElementSize(),(index+1)*a.getElementSize())).join(',')).join('|')
  const aa=streams(a),bb=streams(b),sourceKeys=new Set(Array.from({length:a.getAttribute('POSITION').getCount()},(_,i)=>key(aa,i)))
  for(let i=0;i<b.getAttribute('POSITION').getCount();i++)if(!sourceKeys.has(key(bb,i)))throw new Error('Derived vertex lost source morph correspondence')
  triangles+=b.getIndices().getCount()/3
 }
 if(triangles!==asset.triangles||triangles>8500)throw new Error('Triangle budget mismatch')
 console.log(`${asset.id}: ${triangles} triangles; source hashes, original Idle, material identity and every retained morph vertex verified`)
}
