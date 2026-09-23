import {afterEach,expect,it,vi} from 'vitest'
import {CameraInput} from '../../src/flight-experience/camera-input'
import {FlightInputState} from '../../src/flight-experience/input'
afterEach(()=>{document.body.replaceChildren();vi.restoreAllMocks()})
function fixture(){
 const element=document.createElement('div');document.body.append(element)
 const capture=new Set<number>();element.setPointerCapture=id=>{capture.add(id)};element.hasPointerCapture=id=>capture.has(id);element.releasePointerCapture=id=>{capture.delete(id)}
 vi.spyOn(element,'getBoundingClientRect').mockReturnValue({width:400,height:800} as DOMRect)
 const move=vi.fn(),finish=vi.fn(),input=new CameraInput(element,move,finish)
 const event=(type:string,values:Partial<PointerEvent>={})=>element.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:2,pointerType:'mouse',button:0,buttons:1,clientX:10,clientY:10,...values}))
 return {element,move,finish,input,event,capture}
}
it('ignores clicks and UI starts; holds capture after crossing the scene and releases lost buttons',()=>{
 const f=fixture();f.event('pointerdown');f.event('pointermove',{clientX:13});expect(f.move).not.toHaveBeenCalled()
 f.event('pointermove',{clientX:50});expect(f.move).toHaveBeenCalledOnce();expect(f.capture.has(2)).toBe(true)
 f.event('pointermove',{buttons:0});expect(f.finish).toHaveBeenCalledOnce();expect(f.capture.size).toBe(0)
 const button=document.createElement('button');f.element.append(button);button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:3}));expect(f.capture.size).toBe(0);f.input.dispose()
})
it('allows a secondary touch while flight has the primary, ignores third fingers and cancels idempotently',()=>{
 const f=fixture(),flight=new FlightInputState();flight.point(0,1,1)
 f.event('pointerdown',{pointerType:'touch',isPrimary:false});f.event('pointermove',{pointerType:'touch',isPrimary:false,clientX:100})
 expect(f.move).toHaveBeenCalledOnce();expect(flight.read().climb).toBe(1)
 f.event('pointerdown',{pointerId:3,pointerType:'touch'});f.event('pointerup',{pointerId:3});expect(f.capture.has(2)).toBe(true)
 f.event('pointercancel');f.event('lostpointercapture');expect(f.finish).toHaveBeenCalledOnce();expect(flight.read().climb).toBe(1)
 f.input.dispose();f.event('pointerdown');expect(f.capture.size).toBe(0)
})

it('zooms only the scene, normalizes wheel units, preserves browser pinch zoom and removes its listener',()=>{
 const element=document.createElement('div');document.body.append(element);const zoom=vi.fn()
 const input=new CameraInput(element,vi.fn(),vi.fn(),zoom)
 const wheel=(deltaY:number,extra:WheelEventInit={})=>{const e=new WheelEvent('wheel',{deltaY,bubbles:true,cancelable:true,...extra});element.dispatchEvent(e);return e}
 expect(wheel(100).defaultPrevented).toBe(true);expect(zoom).toHaveBeenLastCalledWith(.15)
 wheel(-1,{deltaMode:1});expect(zoom).toHaveBeenLastCalledWith(-.024)
 expect(wheel(100,{ctrlKey:true}).defaultPrevented).toBe(false);expect(zoom).toHaveBeenCalledTimes(2)
 const button=document.createElement('button');element.append(button);button.dispatchEvent(new WheelEvent('wheel',{deltaY:100,bubbles:true}));expect(zoom).toHaveBeenCalledTimes(2)
 input.dispose();wheel(100);expect(zoom).toHaveBeenCalledTimes(2)
})
