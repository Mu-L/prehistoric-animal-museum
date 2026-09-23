// HTTP delivery checks only; visual interaction is verified in headed Chrome.
import fs from 'node:fs/promises'
const [base,distribution,mode]=process.argv.slice(2)
if(!base||!distribution||!['enabled','disabled'].includes(mode))throw new Error('Usage: node smoke-static.mjs BASE_URL DIST enabled|disabled')
const results=[]
for(const path of ['zh-CN/','en/','zh-CN/animals/tupandactylus/','en/animals/rhamphorhynchus/']){
 const url=new URL(path,base),response=await fetch(url),html=await response.text()
 if(response.status!==200||!html.includes('<html'))throw new Error(`Page delivery failed ${url}`)
 for(const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)){
  const scriptUrl=new URL(match[1],url),script=await fetch(scriptUrl)
  if(!script.ok||!(script.headers.get('content-type')??'').includes('javascript'))throw new Error(`Script delivery failed ${scriptUrl}`)
 }
 results.push({path,status:response.status})
}
const manifest=JSON.parse(await fs.readFile(`${distribution}/.vite/manifest.json`,'utf8'))
const flight=Object.entries(manifest).filter(([key])=>key.includes('flight-experience'))
if((mode==='enabled')!==(flight.length>0))throw new Error('Capability gate mismatch')
for(const [,entry] of flight){const response=await fetch(new URL(entry.file,base));if(!response.ok)throw new Error(`Missing candidate asset ${entry.file}`)}
const stale=await fetch(new URL('assets/FlightExperience-r1-stale.js',base))
if(stale.status!==404)throw new Error('Stale chunk must return404, not the app shell')
console.log(JSON.stringify({mode,base,pages:results,flightManifestEntries:flight.length,staleChunkStatus:stale.status,scope:'HTTP delivery only, no browser or GPU emulation'},null,2))
