import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LightViewpointPanel } from '../../src/flight-experience/LightViewpointPanel'
import type { FlightRuntime, FlightSnapshot } from '../../src/flight-experience/FlightRuntime'
import { DEFAULT_FLIGHT_SETTINGS } from '../../src/flight-experience/settings'
const snapshot:FlightSnapshot={phase:'paused',reason:'user',simplified:false,region:'coast',gentle:false,assisted:false,quality:'low',settings:DEFAULT_FLIGHT_SETTINGS,observation:'active',viewpoint:'seaward',sceneryPaused:false,solarDayProgress:.68}
function setup(locale:'en'|'zh-CN'='en',state=snapshot){
 const runtime={enterViewpoint:vi.fn(),setSolarDayProgress:vi.fn(),toggleScenery:vi.fn(),returnFromViewpoint:vi.fn()}
 const onClose=vi.fn();render(<LightViewpointPanel runtime={runtime as unknown as FlightRuntime} snapshot={state} locale={locale} onClose={onClose}/>);return {runtime,onClose}
}
describe('product sunlight panel',()=>{
 it('exposes the full English flow without development-only controls',()=>{
  const {runtime,onClose}=setup()
  fireEvent.click(screen.getByRole('button',{name:'Cliffs · 210 m'}));expect(runtime.enterViewpoint).toHaveBeenCalledWith('cliff')
  fireEvent.click(screen.getByRole('button',{name:'Sunset'}));expect(runtime.setSolarDayProgress).toHaveBeenCalledWith(.94)
  fireEvent.change(screen.getByRole('slider',{name:'Daylight progress'}),{target:{value:'.3'}});expect(runtime.setSolarDayProgress).toHaveBeenLastCalledWith(.3)
  fireEvent.click(screen.getByRole('button',{name:'Pause scenery'}));expect(runtime.toggleScenery).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button',{name:'Return to flight position'}));expect(runtime.returnFromViewpoint).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button',{name:'Hide panel'}));expect(onClose).toHaveBeenCalledOnce()
 })
 it('provides Chinese status and keeps return available while preparing',()=>{
  const {runtime}=setup('zh-CN',{...snapshot,observation:'preparing'})
  expect(screen.getByRole('slider',{name:'白昼进度'})).toBeDisabled()
  expect(screen.getByRole('button',{name:'夕照'})).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('正在准备观景点')
  fireEvent.click(screen.getByRole('button',{name:'返回原飞行位置'}));expect(runtime.returnFromViewpoint).toHaveBeenCalledOnce()
 })
})
