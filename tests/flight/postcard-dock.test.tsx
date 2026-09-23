import {afterEach,describe,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {PostcardDock} from '../../src/flight-experience/living/PostcardDock'
import type {FlightRuntime,FlightSnapshot} from '../../src/flight-experience/FlightRuntime'
import type {PhotoState} from '../../src/flight-experience/living/photo-service'
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})
function setup(reduced=false){
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}})
 vi.stubGlobal('matchMedia',()=>({matches:reduced,addEventListener(){},removeEventListener(){}}))
 const release=vi.fn(),request=vi.fn(()=>true),remove=vi.fn()
 const runtime={photos:{releaseCapture:release,getSnapshot:()=>({status:'idle',photos:[]}),remove},requestPhoto:request,input:{clear:vi.fn()}} as unknown as FlightRuntime
 const snapshot=(photos:PhotoState)=>({phase:'flying',photos} as FlightSnapshot)
 const view=render(<PostcardDock runtime={runtime} snapshot={snapshot({status:'idle',photos:[]})} locale="zh-CN"/> )
 return {view,runtime,snapshot,release,request,remove}
}
describe('postcard moment and pocket',()=>{
 it('separates capture from gallery, keeps explicit download and closes only the gallery on Escape',()=>{
  const {view,runtime,snapshot,request}=setup()
  fireEvent.click(screen.getByRole('button',{name:'拍张明信片'}));expect(request).toHaveBeenCalledOnce()
  view.rerender(<PostcardDock runtime={runtime} snapshot={snapshot({status:'idle',photos:[{url:'blob:1',frame:1,width:1280,height:720,sun:.4,weather:'clear'}]})} locale="zh-CN"/> )
  fireEvent.click(screen.getByRole('button',{name:'查看明信片，1张'}))
  expect(screen.getByRole('link',{name:'保存到设备'}).getAttribute('download')).toBe('prehistoric-coast.png')
  const remove=screen.getByRole('button',{name:'移除'});remove.focus();fireEvent.click(remove)
  expect(document.activeElement).toBe(screen.getByRole('button',{name:'查看明信片，1张'}))
  fireEvent.keyDown(screen.getByRole('button',{name:'关闭明信片'}),{key:'Escape'})
  expect(screen.queryByRole('link',{name:'保存到设备'})).toBeNull()
  expect(document.activeElement).toBe(screen.getByRole('button',{name:'查看明信片，1张'}))
 })
 it('moves the captured canvas itself and releases it once when resize interrupts',()=>{
  const {view,runtime,snapshot,release}=setup(),canvas=document.createElement('canvas')
  canvas.width=1280;canvas.height=720
  const animation={cancel:vi.fn(),onfinish:null as null|(()=>void)}
  canvas.animate=vi.fn(()=>animation as unknown as Animation)
  view.rerender(<PostcardDock runtime={runtime} snapshot={snapshot({status:'encoding',photos:[],capture:{id:2,canvas,frame:2}})} locale="zh-CN"/> )
  expect(document.querySelector('.flight-postcard-stage canvas')).toBe(canvas)
  expect(screen.getByRole('button',{name:'拍张明信片'})).toBeDisabled()
  void act(()=>{window.dispatchEvent(new Event('resize'))})
  expect(release).toHaveBeenCalledExactlyOnceWith(2);expect(canvas.isConnected).toBe(false)
  view.unmount();expect(release).toHaveBeenCalledOnce()
 })
 it('skips travelling animation for reduced motion while retaining the captured photo',()=>{
  const {view,runtime,snapshot,release}=setup(true),canvas=document.createElement('canvas'),animate=vi.fn();canvas.animate=animate
  view.rerender(<PostcardDock runtime={runtime} snapshot={snapshot({status:'encoding',photos:[],capture:{id:3,canvas,frame:3}})} locale="zh-CN"/> )
  expect(animate).not.toHaveBeenCalled();expect(release).toHaveBeenCalledExactlyOnceWith(3)
 })
})

it('briefly acknowledges a completed photo without opening the gallery or implying a download',async()=>{
 vi.useFakeTimers()
 try {
  const {view,runtime,snapshot}=setup(true)
  view.rerender(<PostcardDock runtime={runtime} snapshot={snapshot({status:'idle',photos:[{url:'blob:new',frame:7,width:1280,height:720,sun:.4,weather:'clear'}]})} locale="zh-CN"/> )
  await act(async()=>{})
  expect(screen.getByRole('status')).toHaveTextContent('已留住这一刻')
  expect(screen.queryByRole('link',{name:'保存到设备'})).toBeNull()
  void act(()=>vi.advanceTimersByTime(2600));expect(screen.getByRole('status',{hidden:true})).toBeEmptyDOMElement()
  expect(screen.getByRole('button',{name:'查看明信片，1张'})).toBeInTheDocument()
  view.unmount()
 } finally {vi.useRealTimers()}
})
