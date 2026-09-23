import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DEFAULT_FLIGHT_SETTINGS } from '../../src/flight-experience/settings'
import { CameraPanel } from '../../src/flight-experience/CameraPanel'
import { FlightCameraRig } from '../../src/flight-experience/camera-rig'
import type { FlightRuntime, FlightSnapshot } from '../../src/flight-experience/FlightRuntime'
it('describes the actual rear view after a front request is rejected',()=>{
 const rig=new FlightCameraRig();rig.select('front');rig.step(.1,false,()=> 'occluded')
 render(<CameraPanel runtime={{} as FlightRuntime} snapshot={{settings:{...DEFAULT_FLIGHT_SETTINGS},cameraRig:rig.snapshot()} as FlightSnapshot} locale="en"/> )
 expect(screen.getByRole('button',{name:'In front'})).toHaveAttribute('aria-pressed','true')
 expect(screen.getByRole('status')).toHaveTextContent('Keeping the current view')
})
it('restricts arrow nudges to the expanded angle tool group',()=>{
 const orbitCamera=vi.fn(),rig=new FlightCameraRig()
 render(<CameraPanel runtime={{orbitCamera} as unknown as FlightRuntime} snapshot={{settings:{...DEFAULT_FLIGHT_SETTINGS},cameraRig:rig.snapshot()} as FlightSnapshot} locale="en"/> )
 fireEvent.keyDown(screen.getByText('Watch it fly'),{key:'ArrowRight'})
 fireEvent.keyDown(screen.getByRole('button',{name:'In front'}),{key:'ArrowRight'})
 expect(orbitCamera).not.toHaveBeenCalled()
 fireEvent.click(screen.getByText('Adjust angle'))
 fireEvent.keyDown(within(screen.getByRole('group',{name:'Adjust angle'})).getByRole('button',{name:'Orbit right'}),{key:'ArrowRight'})
 expect(orbitCamera).toHaveBeenCalledWith(.15,0)
})
