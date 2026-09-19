import {afterEach,describe,expect,it,vi} from 'vitest'
import {PhotoService} from '../../src/flight-experience/living/photo-service'
afterEach(()=>vi.restoreAllMocks())
describe('completed-frame postcard ownership',()=>{
 function setup(){
  const callbacks:BlobCallback[]=[],draw=vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:draw} as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(cb=>callbacks.push(cb))
  let id=0;vi.stubGlobal('URL',Object.assign(URL,{createObjectURL:vi.fn(()=>`blob:${++id}`),revokeObjectURL:vi.fn()}))
  const service=new PhotoService(vi.fn()),canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080
  return {service,canvas,callbacks,draw}
 }
 it('copies synchronously, binds metadata and bounds twenty previews',()=>{
  const {service,canvas,callbacks,draw}=setup()
  for(let frame=0;frame<20;frame++){
   expect(service.request()).toBe(true);expect(service.request()).toBe(false)
   service.completedFrame(canvas,{frame,sun:.7,weather:'clear'})
   expect(draw).toHaveBeenCalledTimes(frame+1)
   expect(service.getSnapshot().status).toBe('encoding')
   callbacks.shift()!(new Blob(['png']))
   const p=service.getSnapshot().photos[0]!
   expect(p.frame).toBe(frame);expect(p.width).toBe(1280);expect(p.height).toBe(720)
   expect(service.getSnapshot().photos.length).toBeLessThanOrEqual(3)
  }
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(17)
  service.dispose();service.dispose();expect(URL.revokeObjectURL).toHaveBeenCalledTimes(20)
 })
 it.each(['cancel','dispose'] as const)('rejects toBlob late after %s',action=>{
  const {service,canvas,callbacks}=setup();service.request();service.completedFrame(canvas,{frame:1,sun:.2,weather:'clear'})
  service[action]();callbacks[0]!(new Blob(['png']));expect(URL.createObjectURL).not.toHaveBeenCalled()
 })
 it('recovers from null blobs and a tainted canvas without stopping travel',()=>{
  const {service,canvas,callbacks,draw}=setup();service.request();service.completedFrame(canvas,{frame:1,sun:.2,weather:'clear'})
  callbacks[0]!(null);expect(service.getSnapshot().status).toBe('error')
  draw.mockImplementation(()=>{throw new DOMException('tainted','SecurityError')})
  expect(service.request()).toBe(true);service.completedFrame(canvas,{frame:2,sun:.3,weather:'fair'})
  expect(service.getSnapshot().status).toBe('error')
 })
})
