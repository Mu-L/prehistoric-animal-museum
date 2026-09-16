import { useState } from 'react'
import type { FlightRuntime } from './FlightRuntime'
export function FlightReviewControls({ runtime }: { runtime: FlightRuntime }) {
  const [, render] = useState(0)
  return <details className="flight-review"><summary>Visual diagnostics</summary>
    {(['legacy', 'detail', 'bands', 'gray', 'freezeLod'] as const).map(key => <label key={key}><input type="checkbox" checked={runtime.terrain.review[key]} onChange={e => { runtime.terrain.review[key] = e.target.checked; runtime.refreshReview(); render(n => n + 1) }}/>{key}</label>)}
    {(['hideProps', 'flatWater', 'freezeWater'] as const).map(key => <label key={key}><input type="checkbox" checked={runtime.scenery.review[key]} onChange={e => { runtime.scenery.review[key] = e.target.checked; runtime.refreshReview(); render(n => n + 1) }}/>{key}</label>)}
  </details>
}
