import { captureBrowserMetadata, reviewContextRecovery } from './review-browser'
import { useState } from 'react'
import type { FlightRuntime } from './FlightRuntime'
import { CAPTURE_ANCHORS } from './review-anchors'
import type { SolarPreset } from './environment/environment-state'
export function FlightReviewControls({ runtime }: { runtime: FlightRuntime }) {
  const [, render] = useState(0)
  const [capture, setCapture] = useState('')
  return <details className="flight-review"><summary>Visual diagnostics</summary>
    <label>Capture anchor<select aria-label="Capture anchor" defaultValue="" onChange={e=>{const anchor=CAPTURE_ANCHORS.find(a=>a.id===e.target.value);if(anchor)runtime.applyCaptureAnchor(anchor)}}><option value="" disabled>Select view</option>{CAPTURE_ANCHORS.map(a=><option key={a.id}>{a.id}</option>)}</select></label>
    <button type="button" onClick={()=>runtime.turnReview(90)}>Turn 90°</button>
    <label>Review pitch<select aria-label="Review pitch" defaultValue="0" onChange={e=>runtime.pitchReview(Number(e.target.value))}><option value="0">Forward</option><option value=".75">Sky</option><option value="-.45">Down</option></select></label>
    <label>World seed<select aria-label="World seed" value={runtime.world.config.seed} onChange={e=>{const url=new URL(location.href);url.searchParams.set('flightSeed',e.target.value);location.assign(url.href)}}>{[193706,193707,193708].map(seed=><option key={seed}>{seed}</option>)}</select></label>
    <label>Fixed daylight<select aria-label="Fixed daylight" value={runtime.scenery.preset} onChange={e=>{runtime.setReviewPreset(e.target.value as SolarPreset);render(n=>n+1)}}>{['morning','noon','afternoon','evening'].map(p=><option key={p}>{p}</option>)}</select></label>
    {(['legacy', 'detail', 'bands', 'gray', 'freezeLod', 'normals', 'patchGrid'] as const).map(key => <label key={key}><input type="checkbox" checked={runtime.terrain.review[key]} onChange={e => { runtime.terrain.review[key] = e.target.checked; runtime.refreshReview(); render(n => n + 1) }}/>{key}</label>)}
    {(['hideProps', 'flatWater', 'freezeWater', 'oceanEdges', 'skyColors', 'shadows'] as const).map(key => <label key={key}><input type="checkbox" checked={runtime.scenery.review[key]} onChange={e => { runtime.scenery.review[key] = e.target.checked; runtime.refreshReview(); render(n => n + 1) }}/>{key}</label>)}
    <button type="button" onClick={()=>setCapture(JSON.stringify({...runtime.diagnostics(),...captureBrowserMetadata()},null,2))}>Capture metadata</button>
    <button type="button" onClick={()=>{runtime.pause('user');reviewContextRecovery()}}>Test graphics recovery</button>
    {capture && <textarea aria-label="Capture metadata JSON" readOnly value={capture}/>}
  </details>
}
