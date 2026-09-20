import {useRef} from 'react'
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {useQuietHud} from '../../src/flight-experience/useQuietHud'
function Harness({blocked=false}:{blocked?:boolean}){
 const ref=useRef<HTMLElement>(null),idle=useQuietHud(ref,blocked)
 return <section ref={ref} data-testid="hud" data-idle={idle} tabIndex={-1}><button>Control</button></section>
}
afterEach(()=>{cleanup();vi.useRealTimers()})
it('fades at rest, wakes from movement over the scene, and never fades during a held touch',async()=>{
 vi.useFakeTimers();render(<Harness/>);await act(async()=>{})
 void act(()=>vi.advanceTimersByTime(4000));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','true')
 fireEvent.pointerMove(window);expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','false')
 fireEvent.pointerDown(screen.getByRole('button'));void act(()=>vi.advanceTimersByTime(5000));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','false')
 fireEvent.pointerUp(window);void act(()=>vi.advanceTimersByTime(4000));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','true')
})
it('preserves keyboard focus and gives a fresh four seconds after a panel closes',async()=>{
 vi.useFakeTimers();const view=render(<Harness/>);await act(async()=>{})
 fireEvent.keyDown(screen.getByTestId('hud'),{key:'Tab'});act(()=>screen.getByRole('button').focus())
 void act(()=>vi.advanceTimersByTime(5000));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','false')
 fireEvent.pointerDown(screen.getByRole('button'));fireEvent.pointerUp(window)
 void act(()=>vi.advanceTimersByTime(4000));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','true')
 view.rerender(<Harness blocked/>);await act(async()=>{});void act(()=>vi.advanceTimersByTime(5000));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','false')
 view.rerender(<Harness/>);await act(async()=>{});void act(()=>vi.advanceTimersByTime(3999));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','false')
 void act(()=>vi.advanceTimersByTime(1));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','true')
 view.unmount();expect(vi.getTimerCount()).toBe(0)
})

it('retains keyboard modality when an open panel closes and focus returns to its trigger',async()=>{
 vi.useFakeTimers();const view=render(<Harness blocked/>);await act(async()=>{})
 fireEvent.keyDown(screen.getByTestId('hud'),{key:'Escape'});act(()=>screen.getByRole('button').focus())
 view.rerender(<Harness/>);await act(async()=>{})
 void act(()=>vi.advanceTimersByTime(5000));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','false')
 fireEvent.pointerDown(screen.getByRole('button'));fireEvent.pointerUp(window)
 void act(()=>vi.advanceTimersByTime(4000));expect(screen.getByTestId('hud')).toHaveAttribute('data-idle','true')
})
