import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Texture, TextureLoader } from 'three'
import { writeFileSync } from 'node:fs'
import { TerrainStream } from '../../src/flight-experience/terrain-stream'
import { generateTerrain, type TerrainJob } from '../../src/flight-experience/terrain-protocol'
import { CHUNK_SIZE } from '../../src/flight-experience/world'
class WorkerStub {
  static instances: WorkerStub[]=[]
  onmessage: ((event:{data:unknown})=>void)|null=null
  onerror: (()=>void)|null=null
  jobs:TerrainJob[]=[]
  constructor(){WorkerStub.instances.push(this)}
  postMessage(job:TerrainJob){this.jobs.push(job)}
  terminate(){}
  finish(){const job=this.jobs.shift();if(job)this.onmessage?.({data:generateTerrain(job)})}
}
beforeEach(()=>{
  WorkerStub.instances=[];vi.stubGlobal('Worker',WorkerStub)
  vi.spyOn(TextureLoader.prototype,'loadAsync').mockResolvedValue(new Texture())
})
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})
function step(stream:TerrainStream,delta=1/60){WorkerStub.instances.forEach(w=>w.finish());stream.update(delta,true)}
function settle(stream:TerrainStream){for(let i=0;i<500;i++)step(stream);expect(stream.ready).toBe(true)}
function assertDrawBound(stream:TerrainStream){
  const split=[...stream.resident.values()].filter(r=>Array.isArray(r.mesh.material))
  expect(split.length).toBeLessThanOrEqual(4)
  expect(split.reduce((sum,r)=>sum+r.mesh.geometry.groups.length,0)).toBeLessThanOrEqual(64)
  expect(stream.diagnostics().renderPatches).toBeLessThanOrEqual(stream.resident.size+60)
}
describe('R3 terrain scheduling, morph ownership and CPU accounting',()=>{
  it('keeps only four nearest split tiles through a turn, two origins and an unfinished quality change',()=>{
    const stream=new TerrainStream(()=>{},()=>{});stream.plan(1600,-700,0,400);settle(stream)
    assertDrawBound(stream)
    const nearest=[...stream.resident.values()].filter(r=>r.result.lod===0).sort((a,b)=>
      Math.hypot((a.result.chunk.x+.5)*512-1600,(a.result.chunk.z+.5)*512+700)-Math.hypot((b.result.chunk.x+.5)*512-1600,(b.result.chunk.z+.5)*512+700)).slice(0,4)
    expect(nearest.every(r=>Array.isArray(r.mesh.material))).toBe(true)
    const originalHeight=stream.displayedHeight(1704,-650)
    stream.relocate({x:2048,z:-2048});stream.relocate({x:4096,z:-4096})
    expect(stream.displayedHeight(1704,-650)).toBe(originalHeight)
    for(const resident of stream.resident.values()){
      expect(resident.mesh.position.x).toBe(resident.result.chunk.x*512-4096)
      expect(resident.mesh.position.z).toBe(resident.result.chunk.z*512+4096)
    }
    stream.plan(2600,-700,Math.PI,400)
    let transition=false
    for(let i=0;i<300;i++){
      step(stream);assertDrawBound(stream)
      if([...stream.resident.values()].some(r=>r.replacement&&r.morph<1)){transition=true;break}
    }
    expect(transition).toBe(true)
    const samples=[...stream.resident.values()].filter(r=>r.morph<1).map(r=>{
      const x=r.result.chunk.x*CHUNK_SIZE+240,z=r.result.chunk.z*CHUNK_SIZE+232
      return {x,z,height:stream.displayedHeight(x,z)}
    })
    stream.radius=6;stream.plan(2600,-700,0,400)
    samples.forEach(p=>expect(stream.displayedHeight(p.x,p.z)).toBeCloseTo(p.height,5))
    settle(stream);assertDrawBound(stream)
    stream.radius=4;stream.plan(1600,-700,Math.PI,400);settle(stream);assertDrawBound(stream)
    expect(stream.resident.size).toBe(81);expect(stream.diagnostics().prepared).toBeLessThanOrEqual(8)
    stream.dispose()
  },30_000)
  it('freezes a paused morph while accepting a delayed result, then installs during zero-time buffering',()=>{
    const stream=new TerrainStream(()=>{},()=>{});stream.plan(800,-900,0,250)
    for(let i=0;i<100;i++)stream.update(1/60,true)
    const worker=WorkerStub.instances[0]!
    expect(worker.jobs.length).toBeGreaterThan(0)
    worker.finish()
    const before=stream.diagnostics(),weights=[...stream.resident.values()].map(r=>r.vertexBlend?.slice())
    for(let i=0;i<50;i++)stream.update(1/60,false)
    expect(stream.diagnostics()).toEqual(before)
    expect([...stream.resident.values()].map(r=>r.vertexBlend)).toEqual(weights)
    const generated=stream.metrics.generated
    for(let i=0;i<180;i++)step(stream,0)
    expect(stream.metrics.generated).toBeGreaterThan(generated)
    expect(stream.ready).toBe(true)
    expect([...stream.resident.values()].some(r=>r.morph===0)).toBe(true)
    const frame=stream.diagnostics();expect(frame.morphUploadBytes).toBe(0)
    for(let i=0;i<60;i++)step(stream)
    expect([...stream.resident.values()].every(r=>r.morph===1)).toBe(true)
    stream.dispose()
  },30_000)
  it('records fallback generation, worker generation, morph uploads and atomic CPU overrun evidence',()=>{
    const stream=new TerrainStream(()=>{},()=>{}),frames:ReturnType<TerrainStream['diagnostics']>[]=[]
    stream.plan(1400,-1400,0,400)
    for(let i=0;i<360;i++){step(stream);frames.push(stream.diagnostics())}
    expect(stream.metrics.fallbackGenerated).toBe(81)
    expect(stream.metrics.peakFallbackGenerationMs).toBeGreaterThan(0)
    expect(stream.metrics.peakGenerationMs).toBeGreaterThan(0)
    expect(frames.some(f=>f.installBytes>0)).toBe(true)
    expect(frames.some(f=>f.morphUploadBytes>0)).toBe(true)
    expect(stream.metrics.peakUpdateMs).toBeGreaterThanOrEqual(stream.metrics.peakInstallMs)
    for(const frame of frames){
      expect(frame.updateMs).toBeGreaterThanOrEqual(frame.fallbackGenerationMs)
      expect(frame.renderPatches).toBeLessThanOrEqual(frame.resident+60)
    }
    if(process.env.FLIGHT_BUDGET_REPORT)writeFileSync(process.env.FLIGHT_BUDGET_REPORT,JSON.stringify({environment:'Node/jsdom CPU, not browser/GPU/device evidence',metrics:stream.diagnostics(),frames},null,2))
    stream.dispose()
  },30_000)
})
