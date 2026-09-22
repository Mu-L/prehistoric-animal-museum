import {expect,it,vi} from 'vitest'
import {Texture} from 'three'
import {ExperienceWarmup} from '../../src/viewer/experience-warmup'
it('waits for compilation then uploads one distinct texture per host frame',async()=>{
 let finish!:()=>void
 const a=new Texture(),b=new Texture(),upload=vi.fn<(texture:Texture)=>void>()
 const warmup=new ExperienceWarmup([a,b,a],()=>new Promise<void>(resolve=>{finish=resolve}))
 await Promise.resolve();expect(warmup.step(upload)).toBe(true);expect(upload).not.toHaveBeenCalled()
 finish();await new Promise<void>(resolve=>queueMicrotask(resolve));await Promise.resolve()
 warmup.step(upload);expect(upload).toHaveBeenCalledTimes(1);expect(warmup.done).toBe(false)
 warmup.step(upload);await warmup.promise;expect(upload.mock.calls.map(c=>c[0])).toEqual([a,b]);expect(warmup.step(upload)).toBe(false)
})
it('rejects cancellation and never uploads after a late compilation result',async()=>{
 let finish!:()=>void
 const warmup=new ExperienceWarmup([new Texture()],()=>new Promise<void>(resolve=>{finish=resolve})),upload=vi.fn<(texture:Texture)=>void>()
 const rejected=expect(warmup.promise).rejects.toMatchObject({name:'AbortError'})
 await Promise.resolve();warmup.cancel();finish();await rejected;await Promise.resolve()
 expect(warmup.step(upload)).toBe(false);expect(upload).not.toHaveBeenCalled()
})
it('recompiles after context restore and discards the obsolete compile completion',async()=>{
 const finishes:Array<()=>void>=[],upload=vi.fn<(texture:Texture)=>void>()
 const warmup=new ExperienceWarmup([new Texture()],()=>new Promise<void>(resolve=>finishes.push(resolve)))
 await Promise.resolve();warmup.restart();await Promise.resolve()
 finishes[0]!();await new Promise<void>(resolve=>queueMicrotask(resolve));await Promise.resolve()
 warmup.step(upload);expect(upload).not.toHaveBeenCalled()
 finishes[1]!();await new Promise<void>(resolve=>queueMicrotask(resolve));await Promise.resolve()
 warmup.step(upload);await warmup.promise;expect(upload).toHaveBeenCalledOnce()
})
