// Arithmetic mean in linear light, derived from the exact delivered albedos.
import sharp from 'sharp'
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const directory='src/flight-experience/assets/lookdev-materials/'
const manifest=JSON.parse(await readFile(directory+'manifest.json','utf8'))
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4
const entries=[]
for(const entry of manifest.entries){
 const path=entry.maps.albedo.path,bytes=await readFile(directory+path)
 const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true})
 const sum=[0,0,0];for(let i=0;i<data.length;i+=info.channels)for(let c=0;c<3;c++)sum[c]+=linear(data[i+c]/255)
 entries.push({id:entry.id,role:entry.role,path,sha256:createHash('sha256').update(bytes).digest('hex'),linearMean:sum.map(v=>v/(info.width*info.height))})
}
await writeFile(directory+'surface-means.json',JSON.stringify({schema:'linear-albedo-means-v1',entries},null,2)+'\n')
