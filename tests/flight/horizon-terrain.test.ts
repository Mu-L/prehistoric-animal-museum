import { expect, it, vi } from 'vitest'
import type { Mesh } from 'three'
import { HorizonTerrain, HORIZON_RADIUS } from '../../src/flight-experience/horizon-terrain'
import { createWorldSampler } from '../../src/flight-experience/world'
import { FrameWorkBudget } from '../../src/flight-experience/frame-work-budget'
it('keeps distant world geometry bounded, budgeted and continuous while moving and rebasing', () => {
 const world=createWorldSampler(),layer=new HorizonTerrain(world,()=>{}),budget=new FrameWorkBudget(()=>0)
 for(let i=0;i<129;i++){budget.begin(i);layer.update(0,0,budget);expect(layer.metrics.preparedRows).toBeLessThanOrEqual(1)}
 expect(layer.ready).toBe(true);expect(layer.metrics.pending).toBe(0)
 expect(layer.metrics.vertices).toBe(9409);expect(layer.metrics.triangles).toBe(18432);expect(layer.metrics.bytes).toBeLessThan(500000)
 const first=layer.root.children[0] as Mesh,position=first.geometry.getAttribute('position')
 expect(position.getY(0)).toBeCloseTo(world.terrainAt(-HORIZON_RADIUS,-HORIZON_RADIUS).height-8,3)
 const dispose=vi.spyOn(first.geometry,'dispose')
 budget.begin(130);layer.update(2500,0,budget);expect(layer.root.children[0]).toBe(first);expect(dispose).not.toHaveBeenCalled()
 layer.relocate({x:2048,z:-2048});expect(first.position.x).toBe(-2048);expect(first.position.z).toBe(2048)
 for(let i=131;i<260;i++){budget.begin(i);layer.update(2500,0,budget)}
 expect(layer.root.children).toHaveLength(1);expect(dispose).toHaveBeenCalledOnce();expect(layer.metrics.pending).toBe(0)
 layer.dispose();expect(layer.root.children).toHaveLength(0)
})
