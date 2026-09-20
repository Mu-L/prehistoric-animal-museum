import {cameraCopy} from './camera-messages'
import type { FlightRuntime, FlightSnapshot } from './FlightRuntime'
export function CameraPanel({runtime,snapshot,locale}:{runtime:FlightRuntime;snapshot:FlightSnapshot;locale:'en'|'zh-CN'}) {
  const c=cameraCopy[locale],state=snapshot.cameraRig, fixed=state?.fixed
  const hint=fixed?c.fixed:state?.perspective==='front'?c.front:state?.perspective==='rear'?c.behind:state?.perspective==='custom'?c.custom:c.side
  const yaw=state?.resolved.yaw??0
  return <section className="flight-camera-panel" aria-label={c.title} onKeyDown={event=>{
    const delta:Record<string,[number,number]>={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}
    const step=delta[event.key];if(step){event.preventDefault();event.stopPropagation();runtime.orbitCamera(step[0],step[1])}
  }}>
    <h3>{c.title}</h3>
    {!fixed&&<div className="flight-inline-choices">{(['rear','front','left','right'] as const).map((preset,i)=><button key={preset} type="button" aria-pressed={state?.perspective===preset} onClick={()=>runtime.selectPerspective(preset)}>{c.presets[i]}</button>)}</div>}
    <div className="flight-camera-nudges" role="group" aria-label={c.title}>{([[-.15,0],[.15,0],[0,.1],[0,-.1]] as const).map((step,i)=><button key={i} type="button" onClick={()=>runtime.orbitCamera(step[0],step[1])}>{c.nudges[i]}</button>)}</div>
    <button type="button" onClick={()=>runtime.selectPerspective('rear')}>{fixed?c.fixedReset:c.reset}</button>
    {state?.rejection&&<p role="status">{c.blocked}</p>}
    <details><summary>{c.help}</summary><p>{hint}</p>{!fixed&&<svg viewBox="0 0 160 120" role="img" aria-label={c.diagram}><circle cx="80" cy="60" r="40" fill="none" stroke="currentColor" strokeDasharray="3 5"/><path d="M80 40 L87 70 L80 64 L73 70 Z" fill="currentColor"/><circle cx={80+40*Math.sin(yaw)} cy={60+40*Math.cos(yaw)} r="6" fill="#aa5432"/><path d={`M${80+32*Math.sin(yaw)} ${60+32*Math.cos(yaw)} L80 60`} stroke="#aa5432"/><text x="80" y="117" textAnchor="middle" fontSize="10" fill="currentColor">{c.diagram}</text></svg>}</details>
  </section>
}
