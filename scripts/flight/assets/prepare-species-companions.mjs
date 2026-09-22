// Derive same-species far geometry; preserve every original Idle sampler.
import {NodeIO} from '@gltf-transform/core'
import {ALL_EXTENSIONS} from '@gltf-transform/extensions'
import {simplify,weld} from '@gltf-transform/functions'
import {MeshoptDecoder,MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer'
import {createHash} from 'node:crypto'
import fs from 'node:fs/promises'
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready,MeshoptSimplifier.ready])
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder})
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const animationHash=root=>hash(Buffer.concat(root.listAnimations().flatMap(a=>a.listSamplers().flatMap(s=>[s.getInput(),s.getOutput()].map(a=>Buffer.from(a.getArray().buffer,a.getArray().byteOffset,a.getArray().byteLength))))))
const results=[]
for(const id of ['tupandactylus','rhamphorhynchus']){
 const source=`src/content/animals/${id}/model/model.glb`,output=`src/flight-experience/assets/companions/${id}-far.glb`
 const original=await fs.readFile(source),doc=await io.read(source),root=doc.getRoot(),animation=animationHash(root)
 const targets=root.listMeshes().flatMap(m=>m.listPrimitives().map(p=>p.listTargets().length))
 const materials=root.listMaterials().map(m=>m.getName())
 if(materials.some(name=>!name)||new Set(materials).size!==materials.length)throw new Error('Material identity is ambiguous')
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.3,error:.003,lockBorder:true}))
 if(animationHash(root)!==animation)throw new Error('Original animation changed')
 if(JSON.stringify(targets)!==JSON.stringify(root.listMeshes().flatMap(m=>m.listPrimitives().map(p=>p.listTargets().length))))throw new Error('Morph targets changed')
 for(const mesh of root.listMeshes())for(const p of mesh.listPrimitives())for(const target of p.listTargets())for(const a of target.listAttributes())if(a.getCount()!==p.getAttribute('POSITION').getCount())throw new Error('Morph remapping mismatch')
 for(const t of root.listTextures())t.dispose()
 const triangles=root.listMeshes().flatMap(m=>m.listPrimitives()).reduce((n,p)=>n+p.getIndices().getCount()/3,0)
 if(triangles>8500)throw new Error(`Far geometry exceeds triangle budget: ${id} ${triangles}`)
 await io.write(output,doc)
 const roundtrip=await io.read(output)
 if(animationHash(roundtrip.getRoot())!==animation)throw new Error('Export changed original animation')
 if(hash(await fs.readFile(source))!==hash(original))throw new Error('Source modified')
 const bytes=await fs.readFile(output)
 results.push({id,source,sourceSha256:hash(original),output,sha256:hash(bytes),bytes:bytes.length,triangles,materials,morphTargets:targets,animationHash:animation,animation:'Idle',provenanceRef:`src/content/animals/${id}/provenance.ts`,license:'CC-BY-4.0',modifications:'Meshopt index selection and vertex/morph attribute remapping, ratio0.30/error0.003/locked borders; bitwise-equal vertex welding. Original Idle samplers and node transforms retained. Textures borrowed from same source hero.',reviewStatus:'needs_review',approval:null})
}
await fs.writeFile('src/flight-experience/assets/companions/species-manifest.json',JSON.stringify({version:1,recipe:'scripts/flight/assets/prepare-species-companions.mjs',assets:results},null,2)+'\n')
console.log(JSON.stringify(results,null,2))
