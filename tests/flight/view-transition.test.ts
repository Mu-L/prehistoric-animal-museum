import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ViewTransition } from '../../src/flight-experience/viewpoints/view-transition'
const draw = vi.fn()
beforeEach(() => { draw.mockClear(); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({drawImage:draw} as unknown as CanvasRenderingContext2D) })
afterEach(() => vi.restoreAllMocks())
function source() { const c=document.createElement('canvas'); c.width=2400;c.height=1400;return c }
describe('viewpoint frame continuity',()=>{
 it('copies the completed old view before changing camera and releases only after the settled frame',()=>{
  const service=new ViewTransition(vi.fn()),input=source(),move=vi.fn(()=>expect(draw).toHaveBeenCalledWith(input,0,0,1280,746))
  service.request(move,false);expect(move).not.toHaveBeenCalled();service.completedFrame(input,true)
  expect(move).toHaveBeenCalledOnce();const held=service.canvas!;expect(held.width*held.height).toBeLessThan(1_500_000)
  service.completedFrame(input,false);expect(service.canvas).toBe(held)
  service.completedFrame(input,true);expect(service.canvas).toBeNull();expect(held.width).toBe(0)
 })
 it('keeps the same still while the user changes target or returns during preparation',()=>{
  const service=new ViewTransition(vi.fn()),input=source();service.request(vi.fn(),false);service.completedFrame(input,true)
  const held=service.canvas,latest=vi.fn();service.request(latest,true);expect(latest).toHaveBeenCalledOnce();expect(service.canvas).toBe(held);expect(draw).toHaveBeenCalledOnce()
 })
 it('cancels a queued camera command on interruption and disposal',()=>{
  const service=new ViewTransition(vi.fn()),move=vi.fn();service.request(move,false);service.cancelPending();service.completedFrame(source(),true);expect(move).not.toHaveBeenCalled()
  service.request(move,false);service.dispose();service.completedFrame(source(),true);expect(move).not.toHaveBeenCalled()
 })
 it('only executes the latest queued target and still navigates if copying fails',()=>{
  draw.mockImplementationOnce(()=>{throw Error('copy unavailable')})
  const service=new ViewTransition(vi.fn()),old=vi.fn(),latest=vi.fn();service.request(old,false);service.request(latest,false);service.completedFrame(source(),true)
  expect(old).not.toHaveBeenCalled();expect(latest).toHaveBeenCalledOnce();expect(service.canvas).toBeNull();expect(service.waiting).toBe(false)
 })
})

it('bounds a square or portrait still to 1.5 megapixels',()=>{
 const service=new ViewTransition(vi.fn()),input=source();input.width=2000;input.height=2000
 service.request(vi.fn(),false);service.completedFrame(input,true);expect(service.canvas!.width*service.canvas!.height).toBeLessThanOrEqual(1_500_000);service.dispose()
})
