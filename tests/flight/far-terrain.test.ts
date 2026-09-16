import { expect,it } from 'vitest'
import { FarTerrain } from '../../src/flight-experience/far-terrain'
import { FrameWorkBudget } from '../../src/flight-experience/frame-work-budget'
import { createWorldSampler } from '../../src/flight-experience/world'
it('prepares bounded far strips incrementally and preserves origin geometry',()=>{
 const ring=new FarTerrain(createWorldSampler(),()=>{}),budget=new FrameWorkBudget(()=>0)
 for(let i=0;i<160;i++){budget.begin(i);ring.update(0,0,3000,2048,budget);expect(ring.metrics.preparedRows).toBeLessThanOrEqual(1)}
 expect(ring.metrics.pending).toBe(0);expect(ring.metrics.strips).toBe(12);expect(ring.metrics.triangles).toBeLessThan(20000)
 const before=ring.root.children[0]!.position.clone();ring.relocate({x:512,z:-512});expect(ring.root.children[0]!.position.x).toBe(before.x-512)
 for(let i=0;i<200;i++){budget.begin(i);ring.update(3000,3000,3000,2048,budget);expect(ring.metrics.strips).toBeLessThanOrEqual(14)}
 ring.dispose();expect(ring.root.children).toHaveLength(0)
})
