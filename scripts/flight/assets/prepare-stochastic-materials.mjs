import fs from 'node:fs/promises'
import sharp from 'sharp'
import crypto from 'node:crypto'
const base='src/flight-experience/assets/lookdev-materials',manifest=JSON.parse(await fs.readFile(`${base}/manifest.json`,'utf8')),reports=[]
const normalCDF=x=>{const t=1/(1+.2316419*Math.abs(x)),d=.39894228*Math.exp(-x*x/2),p=1-d*t*(.31938153+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x<0?1-p:p}
const inverseCDF=p=>{let lo=-3,hi=3;for(let i=0;i<24;i++){const m=(lo+hi)/2;if(normalCDF(m)<p)lo=m;else hi=m}return (lo+hi)/2}
for(const e of manifest.entries){
 const {data,info}=await sharp(`${base}/${e.maps.albedo.path}`).removeAlpha().raw().toBuffer({resolveWithObject:true}),pixels=info.width*info.height,hist=Array.from({length:3},()=>new Uint32Array(256))
 for(let i=0;i<data.length;i++)hist[i%3][data[i]]++
 const transform=hist.map(h=>{let n=0;return Array.from(h,(count)=>{const p=(n+count*.5)/pixels;n+=count;return Math.round(255*(.5+inverseCDF(Math.max(.001,Math.min(.999,p)))/6))})}),gauss=Buffer.from(data.map((v,i)=>transform[i%3][v]))
 const gaussianPath=`${e.id}-gaussian.webp`,lutPath=`${e.id}-inverse.png`
 await sharp(gauss,{raw:{width:info.width,height:info.height,channels:3}}).webp({lossless:true}).toFile(`${base}/${gaussianPath}`)
 const levels=10,lut=Buffer.alloc(256*levels*3)
 for(let level=0;level<levels;level++){
  const size=Math.max(1,info.width>>level),original=await sharp(data,{raw:{width:info.width,height:info.height,channels:3}}).resize(size,size,{kernel:'cubic'}).raw().toBuffer(),g=await sharp(gauss,{raw:{width:info.width,height:info.height,channels:3}}).resize(size,size,{kernel:'cubic'}).raw().toBuffer()
  for(let c=0;c<3;c++){
   const o=[],a=[];for(let i=c;i<original.length;i+=3){o.push(original[i]);a.push(g[i])}o.sort((a,b)=>a-b);a.sort((a,b)=>a-b)
   let rank=0;for(let v=0;v<256;v++){while(rank<a.length-1&&a[rank]<v)rank++;lut[(level*256+v)*3+c]=o[rank]}
  }
 }
 await sharp(lut,{raw:{width:256,height:levels,channels:3}}).png().toFile(`${base}/${lutPath}`)
 const hash=async p=>crypto.createHash('sha256').update(await fs.readFile(`${base}/${p}`)).digest('hex')
 reports.push({id:e.id,gaussianPath,lutPath,gaussianSha256:await hash(gaussianPath),lutSha256:await hash(lutPath),metresPerRepeat:e.metresPerRepeat,levels,method:'per-channel Gaussian rank transform; inverse CDF prefiltered per mip; no RGB eigenspace decorrelation',reviewStatus:'needs_review'})
}
await fs.writeFile(`${base}/stochastic.json`,JSON.stringify(reports,null,2)+'\n')

await sharp({create:{width:256,height:40,channels:3,background:'#000'}}).composite(reports.map((r,i)=>({input:`${base}/${r.lutPath}`,left:0,top:i*10}))).png().toFile(`${base}/inverse-all.png`)
