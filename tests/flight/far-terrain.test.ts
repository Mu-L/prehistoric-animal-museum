import { expect,it } from 'vitest'
import { FarTerrain } from '../../src/flight-experience/far-terrain'
import { FrameWorkBudget } from '../../src/flight-experience/frame-work-budget'
import { createWorldSampler } from '../../src/flight-experience/world'
it('prepares bounded far strips incrementally and preserves origin geometry',()=>{
 const ring=new FarTerrain(createWorldSampler(),()=>{}),budget=new FrameWorkBudget(()=>0)
 for(let i=0;i<160;i++){budget.begin(i);ring.update(0,0,3000,2048,budget);expect(ring.metrics.preparedRows).toBeLessThanOrEqual(1)}
 expect(ring.metrics.pending).toBe(0);expect(ring.metrics.strips).toBe(12);// Conforming 8m tile boundaries add finite edge triangles, not a global fine grid.
 expect(ring.metrics.triangles).toBeLessThan(60000)
 const before=ring.root.children[0]!.position.clone();ring.relocate({x:512,z:-512});expect(ring.root.children[0]!.position.x).toBe(before.x-512)
 for(let i=0;i<200;i++){budget.begin(i);ring.update(3000,3000,3000,2048,budget);expect(ring.metrics.strips).toBeLessThanOrEqual(14)}
 ring.dispose();expect(ring.root.children).toHaveLength(0)
})
it('reports only installed cells and retains their ownership during a streaming shift',()=>{
 const ring=new FarTerrain(createWorldSampler(),()=>{}),budget=new FrameWorkBudget(()=>0)
 for(let i=0;i<160;i++){budget.begin(i);ring.update(0,0,3000,2048,budget)}
 const before=ring.coveredChunks
 expect(before.some(a=>a.x===4&&a.z===0)).toBe(true)
 expect(before.some(a=>a.x===0&&a.z===0)).toBe(false)
 budget.begin(161);ring.update(513,0,3000,2048,budget)
 expect(ring.metrics.pending).toBeGreaterThan(0)
 expect(ring.coveredChunks).toEqual(before)
 ring.dispose();expect(ring.coveredChunks).toEqual([])
})

it('rebuilds every retained row when the north-south ownership hole moves',()=>{
 const ring=new FarTerrain(createWorldSampler(),()=>{}),budget=new FrameWorkBudget(()=>0)
 for(let i=0;i<160;i++){budget.begin(i);ring.update(0,0,3000,2048,budget)}
 expect(ring.coveredChunks.some(a=>a.x===0&&a.z===-3)).toBe(false)
 for(let i=160;i<320;i++){budget.begin(i);ring.update(0,513,3000,2048,budget)}
 expect(ring.metrics.pending).toBe(0)
 expect(ring.coveredChunks.some(a=>a.x===0&&a.z===-3)).toBe(true)
 expect(ring.coveredChunks.some(a=>a.x===0&&a.z===3)).toBe(false)
 ring.dispose()
})

it.each([[513,0],[-513,0],[0,513],[0,-513],[513,513],[513,-513],[-513,513],[-513,-513]])('preserves published fallback across shift and reversal (%i,%i)',(x,z)=>{
 const ring=new FarTerrain(createWorldSampler(),()=>{}),budget=new FrameWorkBudget(()=>0)
 let frame=0
 const settle=(cx:number,cz:number)=>{for(let i=0;i<180;i++){budget.begin(frame++);ring.update(cx,cz,3000,1900,budget)}expect(ring.metrics.pending).toBe(0)}
 try {
  settle(0,0)
  const original=ring.coveredChunks
  budget.begin(frame++);ring.update(x,z,3000,1900,budget)
  const stillRequired=original.filter(a=>a.z*512>=Math.floor(z/512)*512-3584&&a.z*512<Math.floor(z/512)*512+3584)
  const published=new Set(ring.coveredChunks.map(a=>`${a.x},${a.z}`))
  for(const cell of stillRequired)expect(published.has(`${cell.x},${cell.z}`)).toBe(true)
  const originalKeys=new Set(original.map(a=>`${a.x},${a.z}`))
  for(const key of published)expect(originalKeys.has(key)).toBe(true)
  settle(x,z)
  const cx=Math.floor(x/512)*512,cz=Math.floor(z/512)*512,inner=1900-512
  for(const cell of ring.coveredChunks){
   // Only64m cells with centres outside the omitted square have geometry.
   for(let dx=32;dx<512;dx+=64)for(let dz=32;dz<512;dz+=64)
    expect(Math.max(Math.abs(cell.x*512+dx-cx),Math.abs(cell.z*512+dz-cz))).toBeGreaterThanOrEqual(inner)
  }
  settle(0,0)
  // Retirement deliberately retains one guard row beyond the requested ring.
  const requested=ring.coveredChunks.filter(a=>a.x>=-6&&a.x<6&&a.z>=-6&&a.z<6)
  expect(new Set(requested.map(a=>`${a.x},${a.z}`))).toEqual(new Set(original.map(a=>`${a.x},${a.z}`)))
  expect(ring.metrics.strips).toBeLessThanOrEqual(14)
  for(const cell of ring.coveredChunks)expect(cell.z).toBeGreaterThanOrEqual(-7)
  for(const cell of ring.coveredChunks)expect(cell.z).toBeLessThan(7)
 }finally{ring.dispose()}
})
