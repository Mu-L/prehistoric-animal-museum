import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { FlightModule, FlightModuleBoundary } from '../../src/flight-experience/FlightModuleBoundary'
import type { FlightExperience } from '../../src/flight-experience/FlightExperience'
it('replaces a rejected lazy instance and invokes the loader again without navigating',async()=>{
 const error=vi.spyOn(console,'error').mockImplementation(()=>{})
 try {
  const loader=vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({FlightExperience:()=> <p>Prepared scene</p>})
  const onClose=vi.fn()
  await act(async()=>{await Promise.resolve();render(<FlightModule loader={loader} locale="en" onClose={onClose} experienceProps={{} as Parameters<typeof FlightExperience>[0]}/>)})
  expect(screen.getByText(/Flight could not load/)).toBeVisible()
  await act(async()=>{await Promise.resolve();fireEvent.click(screen.getByRole('button',{name:'Try again'}))})
  expect(screen.getByText('Prepared scene')).toBeVisible()
  expect(loader).toHaveBeenCalledTimes(2);expect(onClose).not.toHaveBeenCalled()
 }finally{error.mockRestore()}
})

it('keeps an explicit page recovery and museum exit when the module keeps rejecting',()=>{
 const error=vi.spyOn(console,'error').mockImplementation(()=>{})
 const onClose=vi.fn(),onReload=vi.fn()
 function FailedModule():never {throw new Error('cached chunk failure')}
 try {
  render(<FlightModuleBoundary locale="en" onClose={onClose} onReload={onReload}><FailedModule/></FlightModuleBoundary>)
  fireEvent.click(screen.getByRole('button',{name:'Reload page'}))
  expect(onReload).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button',{name:'Back to museum'}))
  expect(onClose).toHaveBeenCalledOnce()
 }finally{error.mockRestore()}
})
