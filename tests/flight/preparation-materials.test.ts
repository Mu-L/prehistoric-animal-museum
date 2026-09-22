import { afterEach, expect, it, vi } from 'vitest'
import { Texture, TextureLoader } from 'three'
import { loadLookdevMaterials } from '../../src/flight-experience/lookdev/material-library'
afterEach(()=>vi.restoreAllMocks())
it('owns early and late successes when a parallel texture fails',async()=>{
 const pending:Array<{resolve:(t:Texture<HTMLImageElement>)=>void;reject:(e:Error)=>void}>=[]
 vi.spyOn(TextureLoader.prototype,'loadAsync').mockImplementation(()=>new Promise((resolve,reject)=>pending.push({resolve,reject})))
 const result=loadLookdevMaterials()
 expect(pending).toHaveLength(5)
 const early=new Texture<HTMLImageElement>(),late=new Texture<HTMLImageElement>()
 const first=vi.spyOn(early,'dispose'),last=vi.spyOn(late,'dispose')
 pending[0]!.resolve(early);await Promise.resolve()
 pending[1]!.reject(new Error('network failed'))
 await expect(result).rejects.toThrow('network failed')
 expect(first).toHaveBeenCalledOnce()
 pending[2]!.resolve(late);await Promise.resolve();await Promise.resolve()
 expect(last).toHaveBeenCalledOnce()
 pending[3]!.reject(new Error('late'));pending[4]!.reject(new Error('late'))
})
it('disposes an uncancellable image arriving after session cancellation',async()=>{
 const pending:Array<(t:Texture<HTMLImageElement>)=>void>=[]
 vi.spyOn(TextureLoader.prototype,'loadAsync').mockImplementation(()=>new Promise(resolve=>pending.push(resolve)))
 const scope=new AbortController(),result=loadLookdevMaterials(scope.signal)
 scope.abort()
 const textures=pending.map(()=>new Texture<HTMLImageElement>()),spies=textures.map(t=>vi.spyOn(t,'dispose'))
 pending.forEach((resolve,i)=>resolve(textures[i]!))
 await expect(result).rejects.toMatchObject({name:'AbortError'})
 spies.forEach(spy=>expect(spy).toHaveBeenCalledOnce())
})
