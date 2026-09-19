import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Texture, TextureLoader } from 'three'
import { FlightExperience } from '../../src/flight-experience/FlightExperience'
import type { FlightRuntime } from '../../src/flight-experience/FlightRuntime'
import { TerrainStream } from '../../src/flight-experience/terrain-stream'
import { I18nProvider } from '../../src/i18n/I18nProvider'
import type { ViewerController, ViewerModelDescriptor, StagedViewerModel } from '../../src/viewer/ViewerController'

class IdleWorker { postMessage() {} terminate() {} }
beforeEach(() => {
 vi.stubGlobal('Worker', IdleWorker)
 vi.spyOn(TextureLoader.prototype, 'loadAsync').mockResolvedValue(new Texture())
 vi.spyOn(TerrainStream.prototype, 'previewReady', 'get').mockReturnValue(true)
 vi.spyOn(TerrainStream.prototype, 'ready', 'get').mockReturnValue(true)
 vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({drawImage() {},getImageData: (_x:number,_y:number,w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)})})) as unknown as typeof HTMLCanvasElement.prototype.getContext)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function mount() {
 const instances: FlightRuntime[] = []
 const root = new Group(), group = new Group(); group.add(root); root.add(new Mesh(new BoxGeometry(7,1,2),new MeshBasicMaterial()))
 const controller = {
  acquireExternalExperience: (runtime:FlightRuntime) => { instances.push(runtime); return {invalidate:vi.fn(),release:()=>runtime.dispose()} },
  stageModel: () => Promise.resolve({group,modelRoot:root,mixer:null,action:null,disposed:false} as unknown as StagedViewerModel),
  disposeStagedModel:vi.fn(),
 } as unknown as ViewerController
 const descriptor={} as ViewerModelDescriptor, onClose=vi.fn()
 const element=<I18nProvider initialState={{locale:'en',preference:'en'}}><FlightExperience controller={controller} descriptor={descriptor} onClose={onClose}/></I18nProvider>
 const view=render(element)
 await waitFor(()=>expect(instances).toHaveLength(1))
 const runtime=instances[0]!
 // Allow the actual asynchronous model/material attach to finish.
 await waitFor(()=>expect(runtime.pose.children).toHaveLength(1))
 act(()=>runtime.update(0))
 return {runtime,instances,view,element,onClose}
}
describe('whole FlightExperience events with the actual Runtime (GPU/worker readiness stubbed)',()=>{
 it('keeps mode and movement on panel/rerender/language changes and isolates range keyboard shortcuts',async()=>{
  const {runtime,instances,view,element}=await mount()
  act(()=>runtime.start())
  fireEvent.click(screen.getByRole('button',{name:'Flight & scenery'}))
  fireEvent.click(screen.getByRole('button',{name:'Automatic daylight'}))
  expect(runtime.environmentClock.solarMode).toBe('auto')
  expect(runtime.getSnapshot().phase).toBe('flying')
  const key=vi.spyOn(runtime.input,'key')
  fireEvent.keyDown(screen.getByRole('slider'),{code:'ArrowRight',key:'ArrowRight'})
  expect(key).not.toHaveBeenCalled()
  view.rerender(element);expect(instances).toHaveLength(1)
  fireEvent.click(screen.getByRole('button',{name:'Flying'}))
  fireEvent.change(screen.getByRole('combobox',{name:/Language/}),{target:{value:'zh-CN'}})
  expect(instances).toHaveLength(1);expect(runtime.environmentClock.solarMode).toBe('auto')
  expect(runtime.getSnapshot().phase).toBe('flying')
  fireEvent.keyDown(window,{code:'Escape',key:'Escape'})
  expect(screen.getByRole('button',{name:'飞行与风景'})).toHaveFocus()
  expect(runtime.getSnapshot().phase).toBe('flying')
  view.unmount();expect(runtime.running).toBe(false)
 })
 it.each(['entry','return'])('restores only necessary %s preparation after DOM hidden/focus events and preserves error UI',async(direction)=>{
  const {runtime,view}=await mount()
  act(()=>{runtime.enterViewpoint('seaward');if(direction==='return')runtime.returnFromViewpoint();runtime.setSolarMode('auto')})
  vi.spyOn(document,'hidden','get').mockReturnValue(true)
  fireEvent(document,new Event('visibilitychange'));fireEvent(window,new Event('blur'))
  act(()=>{runtime.contextLost();runtime.contextRestored()})
  expect(runtime.running).toBe(false)
  vi.spyOn(document,'hidden','get').mockReturnValue(false)
  fireEvent(document,new Event('visibilitychange'));expect(runtime.running).toBe(false)
  fireEvent(window,new Event('focus'));expect(runtime.running).toBe(true)
  expect(runtime.observation.sceneryPaused).toBe(true)
  expect(runtime.getSnapshot().daylight?.status).toBe('suspended')
  vi.spyOn(console,'error').mockImplementation(()=>{})
  act(()=>runtime.fail(new Error('injected update fault')))
  expect(screen.getByRole('alert')).toBeVisible();expect(runtime.running).toBe(false)
  fireEvent(window,new Event('focus'));expect(runtime.running).toBe(false)
  view.unmount()
 })
})
