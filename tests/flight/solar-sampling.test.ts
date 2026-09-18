import { describe, it, expect } from 'vitest'
import { sampleEnvironment } from '../../src/flight-experience/environment/environment-state'
describe('continuous E1 sunlight in a single frame',()=>{
 it('is deterministic, finite, normalized and continuous across all daylight values',()=>{
  let previous=sampleEnvironment(.08,12,'sunset-bay')
  for(let p=.08;p<=.94;p+=.001){
   const f=sampleEnvironment(p,12,'sunset-bay',2)
   expect(f).toEqual(sampleEnvironment(p,12,'sunset-bay',2));expect(Math.hypot(...f.sunDirectionWorld)).toBeCloseTo(1,12)
   expect(Math.hypot(...f.sunDirectionWorld.map((v,i)=>v-previous.sunDirectionWorld[i]!))).toBeLessThan(.02)
   for(const values of [f.sunColor,f.skyZenith,f.horizon]) for(const v of values){expect(Number.isFinite(v)).toBe(true);expect(v).toBeGreaterThanOrEqual(0)}
   expect(f.motionSeconds).toBe(12);expect(f.revision).toBe(2);previous=f
  }
 })
 it('bounds invalid solar and motion input without nighttime wrapping',()=>{
  for(const p of [-Infinity,Infinity,NaN,-20,20]){
   const f=sampleEnvironment(p,NaN,'sunset-bay');expect(f.dayProgress).toBeGreaterThanOrEqual(.08);expect(f.dayProgress).toBeLessThanOrEqual(.94);expect(f.motionSeconds).toBe(0)
   expect(Math.hypot(...f.sunDirectionWorld)).toBeCloseTo(1)
  }
 })
 it('preserves old preset direction when the fallback is explicitly selected',()=>{
  const f=sampleEnvironment('afternoon',0,'legacy'),length=Math.hypot(.63,.65,-.43)
  expect(f.sunDirectionWorld).toEqual([.63/length,.65/length,-.43/length])
 })
})
