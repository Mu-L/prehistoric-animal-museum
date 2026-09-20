import {PerspectiveCamera,Vector3} from 'three'
import {describe,expect,it} from 'vitest'
import {advanceCompanionMotion,closestApproach,hasStraightCompanionForecast,terrainAhead,nextCompanionTerrainTime,createCompanionMotion,planCompanionRoute,type CompanionRoute} from '../../src/flight-experience/living/companion-director'
import {WeatherController} from '../../src/flight-experience/environment/weather-controller'
import type {LivingContext} from '../../src/flight-experience/living/living-context'
const route=(patch:Partial<CompanionRoute>={}):CompanionRoute=>({id:1,near:true,start:{x:42,y:180,z:-60},heading:0,side:1,duration:88,speed:30,...patch})
const length=(p:{x:number;y:number;z:number})=>Math.hypot(p.x,p.y,p.z)
describe('continuous companion guidance',()=>{
 it('stays calm alongside a parallel player inside the comfort threshold',()=>{
  const r=route(),state=createCompanionMotion(r)
  for(let i=0;i<600;i++){
   const now=i/60
   advanceCompanionMotion(state,{route:r,age:now,now,player:{x:0,y:180,z:-30*now-60},playerVelocity:{x:0,y:0,z:-30},departing:false},1/60)
   expect(state.avoiding).toBe(false);expect(Math.abs(state.position.y-180)).toBeLessThan(.00001)
  }
 })
 it('uses a hold and wider release boundary instead of toggling near 65 metres',()=>{
  const r=route({start:{x:0,y:180,z:0}}),state=createCompanionMotion(r)
  advanceCompanionMotion(state,{route:r,age:0,now:0,player:{x:0,y:180,z:66},playerVelocity:{x:0,y:0,z:-36},departing:false},.1)
  expect(state.avoiding).toBe(true)
  for(let i=1;i<50;i++){
   advanceCompanionMotion(state,{route:r,age:i*.1,now:i*.1,player:{x:state.position.x,y:180,z:state.position.z+64+(i%2)*4},playerVelocity:{...state.velocity},departing:false},.1)
   expect(state.avoiding).toBe(true)
  }
  advanceCompanionMotion(state,{route:r,age:5,now:5,player:{x:state.position.x-100,y:180,z:state.position.z},playerVelocity:{...state.velocity},departing:false},.1)
  expect(state.avoiding).toBe(false)
 })
 it.each([1/60,.1])('keeps acceleration/jerk/turn bounded during a fast opposing approach at dt %s',dt=>{
  const r=route({start:{x:0,y:180,z:-440},heading:Math.PI,speed:30}),state=createCompanionMotion(r)
  let minimum=Infinity,previousAcceleration={...state.acceleration}
  for(let now=0;now<12;now+=dt){
   const player={x:0,y:180,z:-36*now}
   advanceCompanionMotion(state,{route:r,age:now,now,player,playerVelocity:{x:0,y:0,z:-36},departing:false},dt)
   minimum=Math.min(minimum,Math.hypot(state.position.x-player.x,state.position.y-player.y,state.position.z-player.z))
   expect(length(state.acceleration)).toBeLessThanOrEqual(4.501)
   expect(Math.abs(state.turnRate)).toBeLessThanOrEqual(Math.PI/18+.00001)
   expect(length({x:state.acceleration.x-previousAcceleration.x,y:state.acceleration.y-previousAcceleration.y,z:state.acceleration.z-previousAcceleration.z})/dt).toBeLessThanOrEqual(4.001)
   expect(state.position.y).toBe(180);previousAcceleration={...state.acceleration}
  }
  expect(minimum).toBeGreaterThanOrEqual(25)
 })
 it('predicts an actual closest point rather than only checking the end of the horizon',()=>{
  const approach=closestApproach({x:-40,y:0,z:0},{x:40,y:0,z:0},{x:0,y:0,z:0},{x:0,y:0,z:0},3)
  expect(approach.distance).toBe(0);expect(approach.time).toBe(1);expect(approach.closing).toBe(true)
 })
 it('starts moving encounters behind and to the side with a fixed slightly faster cruise',()=>{
  const context:LivingContext={generation:0,active:true,delta:.1,motionSeconds:0,camera:{x:0,y:195,z:11},player:{x:0,y:190,z:0},heading:0,quality:'low',gentle:false,weather:new WeatherController().serialize(),intent:{wind:false,companions:true}}
  const r=planCompanionRoute(2,true,context,()=>0,28)!
  expect(r.start.z).toBeGreaterThan(0);expect(Math.abs(r.start.x)).toBeGreaterThan(75)
  expect(r.speed/28).toBeCloseTo(1.07)
  const stationary=planCompanionRoute(2,true,context,()=>0,0)!
  expect(stationary.speed).toBe(18);expect(stationary.encounter).toBe(false)
 })
 it('integrated default encounter reaches the visible parallel window without being driven out by its own comfort policy',()=>{
  const heading=.22,context:LivingContext={generation:0,active:true,delta:1/60,motionSeconds:0,camera:{x:0,y:195,z:11},player:{x:0,y:190,z:0},heading,quality:'low',gentle:false,weather:new WeatherController().serialize(),intent:{wind:false,companions:true}}
  const r=planCompanionRoute(89,true,context,()=>0,28)!,state=createCompanionMotion(r),camera=new PerspectiveCamera(55,1.8224666142969363,.5,24000)
  camera.quaternion.set(-.15514407565764407,-.1084327744878713,-.017135015365026984,.9817734160454936)
  let visibleSeconds=0,minimum=Infinity
  for(let i=0;i<50*60;i++){
   const now=i/60,player={x:Math.sin(heading)*28*now,y:190,z:-Math.cos(heading)*28*now},velocity={x:Math.sin(heading)*28,y:0,z:-Math.cos(heading)*28}
   advanceCompanionMotion(state,{route:r,age:now,now,player,playerVelocity:velocity,departing:false},1/60)
   minimum=Math.min(minimum,Math.hypot(state.position.x-player.x,state.position.y-player.y,state.position.z-player.z))
   camera.position.set(player.x-Math.sin(heading)*11,195,player.z+Math.cos(heading)*11);camera.updateMatrixWorld(true)
   const p=new Vector3(state.position.x,state.position.y,state.position.z).project(camera)
   if(now>28&&Math.abs(p.x)<.9&&Math.abs(p.y)<.8&&p.z<1)visibleSeconds+=1/60
  }
  expect(minimum).toBeGreaterThan(25);expect(visibleSeconds).toBeGreaterThan(10)
 })

 it.each([1/60,.1])('clears a lateral interception at dt %s without a vertical jump',dt=>{
  const r=route({start:{x:0,y:180,z:0}}),state=createCompanionMotion(r)
  let minimum=Infinity
  for(let now=0;now<12;now+=dt){
   const player={x:-180+36*now,y:180,z:-150}
   advanceCompanionMotion(state,{route:r,age:now,now,player,playerVelocity:{x:36,y:0,z:0},departing:false},dt)
   minimum=Math.min(minimum,Math.hypot(state.position.x-player.x,state.position.y-player.y,state.position.z-player.z))
   expect(state.position.y).toBe(180)
  }
  expect(minimum).toBeGreaterThanOrEqual(25)
 })

 it('analytic settled patrol checks the same terrain samples as the full integrator, without state writes',()=>{
  const r=route({near:false,start:{x:0,y:180,z:0},speed:29.96}),state=createCompanionMotion(r)
  const input={route:r,age:0,now:0,player:{x:1000,y:180,z:0},playerVelocity:{x:0,y:0,z:-28},departing:false}
  expect(hasStraightCompanionForecast(state,input)).toBe(true)
  const saved=JSON.stringify(state),analytic:number[][]=[],full:number[][]=[]
  const result=terrainAhead(state,input,(x,z)=>{analytic.push([x,z]);return 0})
  const forced={...state,position:{...state.position},velocity:{...state.velocity},acceleration:{x:1e-7,y:0,z:0}}
  expect(hasStraightCompanionForecast(forced,input)).toBe(false)
  expect(terrainAhead(forced,input,(x,z)=>{full.push([x,z]);return 0})).toEqual(result)
  expect(full).toHaveLength(analytic.length)
  analytic.forEach((point,i)=>{expect(point[0]).toBeCloseTo(full[i]![0]!,7);expect(point[1]).toBeCloseTo(full[i]![1]!,7)})
  for(let i=1;i<analytic.length;i++)expect(Math.hypot(analytic[i]![0]!-analytic[i-1]![0]!,analytic[i]![1]!-analytic[i-1]![1]!)).toBeLessThanOrEqual(10)
  expect(JSON.stringify(state)).toBe(saved)
 })
 it('never uses the straight forecast for turning, a crossing, an offset lane, or an imminent departure curve',()=>{
  const r=route({near:false,start:{x:0,y:180,z:0}}),state=createCompanionMotion(r)
  const input={route:r,age:0,now:0,player:{x:1000,y:180,z:0},playerVelocity:{x:0,y:0,z:-28},departing:false}
  expect(hasStraightCompanionForecast({...state,avoidWeight:.1},input)).toBe(false)
  expect(hasStraightCompanionForecast({...state,position:{x:2,y:180,z:0}},input)).toBe(false)
  expect(hasStraightCompanionForecast(state,{...input,age:r.duration*.68-2})).toBe(false)
  expect(hasStraightCompanionForecast(state,{...input,player:{x:0,y:180,z:100},playerVelocity:{x:0,y:0,z:-42}})).toBe(false)
  const curved={...state,velocity:{x:5,y:0,z:-30},acceleration:{x:1,y:0,z:0}}
  expect(hasStraightCompanionForecast(curved,input)).toBe(false)
 })

 it('restores stable 10Hz terrain phases after a slow frame instead of permanently coalescing the cohort',()=>{
  const ids=[89,90,91,92],next=ids.map(id=>nextCompanionTerrainTime(3.047,id))
  expect(new Set(next.map(time=>time.toFixed(8))).size).toBe(4)
  for(const [i,id] of ids.entries()){
   expect(next[i]!).toBeGreaterThan(3.047);expect(next[i]!-3.047).toBeLessThanOrEqual(.1)
   // Even when all four miss their deadlines in one long frame, their next
   // deadlines return to separate original phases rather than now + 100ms.
   const recovered=nextCompanionTerrainTime(3.223,id)
   expect(recovered).toBeGreaterThan(3.223);expect(recovered-3.223).toBeLessThanOrEqual(.1)
   const periods=(recovered-next[i]!)/.1
   expect(periods).toBeCloseTo(Math.round(periods),8)
   expect(nextCompanionTerrainTime(recovered,id)-recovered).toBeCloseTo(.1,8)
  }
  const recovered=ids.map(id=>nextCompanionTerrainTime(3.223,id))
  expect(new Set(recovered.map(time=>time.toFixed(8))).size).toBe(4)
 })

})
