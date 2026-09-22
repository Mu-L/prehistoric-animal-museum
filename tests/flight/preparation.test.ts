import { expect, it } from 'vitest'
import { FlightPreparation } from '../../src/flight-experience/preparation'
it('excludes background time from active preparation without hiding elapsed milestone time',()=>{
 const p=new FlightPreparation(0)
 expect(p.tick(10000,true)).toBe(false)
 expect(p.tick(90000,false)).toBe(false)
 expect(p.tick(100000,true)).toBe(false)
 expect(p.tick(100001,true)).toBe(true)
 p.mark('preview',100001);p.mark('preview',100010)
 expect(p.snapshot()).toMatchObject({activeElapsed:20001,milestones:{preview:100001}})
})

it('budgets each active phase independently and keeps cumulative work visible',()=>{
 const p=new FlightPreparation(0)
 p.tick(19000,true);p.mark('world',19000)
 expect(p.tick(38000,true)).toBe(false)
 expect(p.snapshot()).toMatchObject({activeElapsed:38000,phaseElapsed:19000})
 expect(p.tick(39001,true)).toBe(true)
})
