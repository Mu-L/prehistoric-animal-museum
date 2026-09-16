/** Local-only candidate preparation. Metadata from the official Poly Haven files API.
 * Reuses explicit metadata saved in the ignored review directory, never downloads code.
 */
import { readFile,writeFile,mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
const source='.flight-evidence/r4/material-sources', out='src/flight-experience/assets/lookdev-materials'
await mkdir(out,{recursive:true})
const entries=[]
for(const [id,role,metres] of [['rock_01','rock',1.5],['sandy_gravel_02','dry-soil',2.5],['coast_sand_01','wet-sand',2],['forest_ground_04','forest-floor',2]]){
 const metadata=JSON.parse(await readFile(`${source}/${id}.json`,'utf8'))
 const maps={}
 for(const [key,channel] of [['Diffuse','albedo'],['nor_gl','normal'],['arm','arm']]){
  const file=metadata[key]['1k'].jpg
  const response=await fetch(file.url);if(!response.ok)throw Error(`${response.status}: ${file.url}`)
  const bytes=Buffer.from(await response.arrayBuffer())
  if(createHash('md5').update(bytes).digest('hex')!==file.md5)throw Error(`source checksum ${id}/${channel}`)
  await writeFile(`${source}/${id}-${channel}.jpg`,bytes)
  const encoded=await sharp(bytes).resize(512,512).webp({quality:channel==='normal'?95:88}).toBuffer()
  const path=`${id}-${channel}.webp`;await writeFile(`${out}/${path}`,encoded)
  maps[channel]={path,sourceUrl:file.url,downloadBytes:bytes.length,bytes:encoded.length,sha256:createHash('sha256').update(encoded).digest('hex'),colorSpace:channel==='albedo'?'srgb':'linear-data'}
 }
 entries.push({id,role,source:`https://polyhaven.com/a/${id}`,license:'CC0-1.0',metresPerRepeat:metres,scaleStatus:'lookdev calibration; verify source physical scale',maps})
}
await writeFile(`${out}/manifest.json`,JSON.stringify({reviewStatus:'needs_review',approval:null,scope:'finite lookdev only; no global terrain application',licenseSource:'https://polyhaven.com/license',modifications:'512px WebP derivatives; no baked sun; OpenGL tangent normal; ARM data',estimatedGpuBytesWithMips:4*3*512*512*4*4/3,entries},null,2)+'\n')
