import type { FlightRuntime, FlightSnapshot } from '../FlightRuntime'
import {FlightToggle} from '../FlightToggle'
export function NaturePanel({ runtime, snapshot, locale }: { runtime: FlightRuntime; snapshot: FlightSnapshot; locale: 'en' | 'zh-CN' }) {
 const zh = locale === 'zh-CN', sound = runtime.soundscape.getSnapshot()
 return <div className="flight-nature">
  <FlightToggle label={zh?'海岸声音':'Coastal sounds'} checked={sound.enabled} onChange={enabled=>{if(enabled)void runtime.enableSound();else runtime.disableSound()}}/>
  {(sound.status==='loading'||sound.status==='retry')&&<p className="flight-nature-status" role="status">{sound.status==='loading'?(zh?'声音正在准备':'Preparing sounds'):(zh?'声音暂时不可用':'Sounds unavailable')}{sound.status==='retry'&&<button className="flight-text-action" type="button" onClick={()=>void runtime.enableSound()}>{zh?'重试':'Retry'}</button>}</p>}
  {sound.enabled && <label className="flight-light-range">{zh ? '音量' : 'Volume'}<input type="range" aria-label={zh ? '声音音量' : 'Sound volume'} min="0" max="1" step="0.05" value={sound.volume} onChange={event => runtime.setSoundVolume(Number(event.target.value))}/></label>}
  <FlightToggle label={zh?'植被微风':'Vegetation breeze'} checked={runtime.livingIntent.wind} onChange={enabled=>runtime.setLivingIntent('wind',enabled)}/>
  {runtime.species.companions?<FlightToggle label={zh?'同类同行':'Flying companions'} checked={runtime.livingIntent.companions} onChange={enabled=>runtime.setLivingIntent('companions',enabled)}/>:<p>{zh?'这种生物的同伴仍在准备中。':'Companions for this species are still being prepared.'}</p>}
  {runtime.livingIntent.companions && ['loading','degraded'].includes(snapshot.companions?.status??'') && <p className="flight-nature-status" role="status">{snapshot.companions?.status === 'degraded' ? (zh ? '同伴暂时没有准备好，可关闭后重新开启' : 'Companions could not load. Turn off and on to retry.') : (zh ? '同伴正在准备' : 'Preparing companions')}</p>}
 </div>
}
