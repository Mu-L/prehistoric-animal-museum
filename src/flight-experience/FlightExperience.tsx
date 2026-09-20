import { LanguageMenu } from '../components/LanguageMenu'
import {FlightToggle} from './FlightToggle'
import {useQuietHud} from './useQuietHud'
import { ViewPreparation } from './viewpoints/ViewPreparation'
import { PostcardDock } from './living/PostcardDock'
import { TransientScrollbar } from '../components/TransientScrollbar'
import { useTransientScrollbar } from '../components/useTransientScrollbar'
import { ObservationNotes } from './living/ObservationNotes'
import { NaturePanel } from './living/NaturePanel'
import {DEFAULT_LIVING_INTENT,type LivingIntent} from './living/living-context'
import { WeatherPanel } from './WeatherPanel'
import type { WeatherState } from './environment/weather-controller'
import { LightViewpointPanel } from './LightViewpointPanel'
import { WORLD } from './world'
import { DEFAULT_FLIGHT_SETTINGS, type FlightSettings } from './settings'
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, Pause, Play, Settings2, Sun, Binoculars, Feather, CloudSun, Waves, X } from 'lucide-react'
import type { ViewerController, ViewerModelDescriptor } from 'virtual:viewer-controller'
import { useI18n } from '../i18n/I18nProvider'
import { FlightRuntime, type FlightSnapshot } from './FlightRuntime'
import { isFlightShortcutTarget } from './input'
import { flightMessages } from './messages'
import './flight.css'
import { FlightReviewControls } from './FlightReviewControls'
const initial: FlightSnapshot = { phase: 'preparing', reason: null, simplified: false, region: 'coast', gentle: false, assisted: false, quality: 'low', settings: { ...DEFAULT_FLIGHT_SETTINGS } }
const noSubscription = () => () => {}
const initialSnapshot = () => initial
interface Props { controller: ViewerController; descriptor: ViewerModelDescriptor; onClose: () => void; narrationActive?:boolean }
export function FlightExperience({ controller, descriptor, onClose, narrationActive=false }: Props) {
  const { locale } = useI18n(), copy = flightMessages[locale]
  const [runtime, setRuntime] = useState<FlightRuntime | null>(null)
  const [retry, setRetry] = useState(0), [settings, setSettings] = useState(false), [observe, setObserve] = useState(false), [galleryOpen,setGalleryOpen]=useState(false)
  const [section,setSection] = useState<'scenery'|'viewpoints'|'flight'>('scenery')
  const { handleScroll, isScrolling, metrics, scrollRef } = useTransientScrollbar(settings)
  const scrollPositions = useRef({scenery:0,viewpoints:0,flight:0})
  const selectSection = (next:typeof section) => { if(scrollRef.current)scrollPositions.current[section]=scrollRef.current.scrollTop;setSection(next) }
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollPositions.current[section]},[section,settings,scrollRef])
  const settingsTrigger=useRef<HTMLButtonElement>(null)
  const closeSettings=()=>{setSettings(false);settingsTrigger.current?.focus()}
  const root = useRef<HTMLElement>(null), nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descriptorRef = useRef(descriptor)
  const chosenLiving = useRef<LivingIntent>({...DEFAULT_LIVING_INTENT})
  const chosenWeather = useRef<WeatherState | null>(null)
  const chosenSunlight = useRef<number | null>(null)
  const chosenSettings = useRef<FlightSettings>({ ...DEFAULT_FLIGHT_SETTINGS })
  const [draft, setDraft] = useState<FlightSettings>({ ...DEFAULT_FLIGHT_SETTINGS })
  const snapshot = useSyncExternalStore(runtime?.subscribe ?? noSubscription, runtime?.getSnapshot ?? initialSnapshot, initialSnapshot)
  useEffect(()=>{runtime?.setNarrationActive(narrationActive)},[runtime,narrationActive])
  const previousObservation = useRef(snapshot.observation)
  useEffect(() => {
    if (previousObservation.current && previousObservation.current !== 'inactive' && snapshot.observation === 'inactive') settingsTrigger.current?.focus()
    previousObservation.current = snapshot.observation
  }, [snapshot.observation])
  useEffect(() => {
    const instance = new FlightRuntime(controller, window.matchMedia('(prefers-reduced-motion: reduce)').matches, chosenSettings.current, import.meta.env.DEV && [193706,193707,193708].includes(Number(new URLSearchParams(location.search).get('flightSeed'))) ? {...WORLD,seed:Number(new URLSearchParams(location.search).get('flightSeed'))} : WORLD)
    Object.assign(instance.livingIntent,chosenLiving.current)
    if(chosenWeather.current)instance.weather.restore(chosenWeather.current)
    if(chosenSunlight.current!==null)instance.setSolarDayProgress(chosenSunlight.current)
    let active = true
    queueMicrotask(() => { if (active) setRuntime(instance) })
    root.current?.focus()
    instance.setVisibilityState(!document.hidden); instance.setFocusState(document.hasFocus())
    void instance.prepare(descriptorRef.current)
    return () => { active = false; instance.close(); if (nudgeTimer.current) clearTimeout(nudgeTimer.current) }
  }, [controller, retry])
  useEffect(() => {
    if (!runtime) return
    const clear = () => runtime.setFocusState(false)
    const focus = () => runtime.setFocusState(true)
    const visibility = () => runtime.setVisibilityState(!document.hidden)
    const keydown = (event: KeyboardEvent) => {
      if(event.defaultPrevented)return
      if (event.code === 'Escape') {
        event.preventDefault(); event.stopPropagation()
        if (galleryOpen) { setGalleryOpen(false); root.current?.querySelector<HTMLButtonElement>('button[aria-controls="flight-postcard-gallery"]')?.focus(); return }
        if (snapshot.reason === 'error') { onClose(); return }
        if (settings) closeSettings(); else if (snapshot.observation && snapshot.observation !== 'inactive') runtime.navigateBack(); else if (observe) setObserve(false); else onClose()
        return
      }
      if (event.code === 'Tab') {
        const buttons = [...(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select,input,a[href],summary,[tabindex="0"]') ?? [])].filter(e => e.getClientRects().length > 0)
        const first = buttons[0], last = buttons.at(-1)
        if (event.shiftKey && (document.activeElement === first || document.activeElement === root.current)) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        return
      }
      if (isFlightShortcutTarget(event.target)) return
      if(snapshot.observation && snapshot.observation!=='inactive') {if(event.code==='Space'){event.preventDefault();if(!event.repeat)runtime.toggleScenery()}return}
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault(); if (snapshot.phase === 'flying') runtime.pause(); else runtime.start()
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault(); runtime.input.key(event.code, true)
      }
    }
    const keyup = (event: KeyboardEvent) => runtime.input.key(event.code, false)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => { if (reduced.matches) runtime.setGentle(true) }
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup)
    window.addEventListener('blur', clear); window.addEventListener('focus', focus); document.addEventListener('visibilitychange', visibility)
    reduced.addEventListener('change', changed)
    return () => {
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', clear); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visibility)
      reduced.removeEventListener('change', changed); runtime.input.clear()
    }
  }, [runtime, snapshot.phase, snapshot.reason, snapshot.observation, onClose, settings, observe, galleryOpen])
  useEffect(() => {
    if (!runtime || !root.current) return
    const element = root.current
    // Local review telemetry; bounded by the runtime, never sent anywhere.
    const report = () => { element.dataset.flightDiagnostics = JSON.stringify(runtime.diagnostics()) }
    report(); const timer = window.setInterval(report, 2000)
    return () => window.clearInterval(timer)
  }, [runtime])
  const inViewpoint=snapshot.reason !== 'error' && Boolean(snapshot.observation && snapshot.observation!=='inactive')
  const preparingView=snapshot.viewTransition?.waiting||snapshot.observation==='preparing'||snapshot.observation==='returning'||snapshot.observation==='failed'
  const flying = snapshot.phase === 'flying'
  const hudIdle=useQuietHud(root,settings||galleryOpen||Boolean(preparingView)||Boolean(snapshot.photos?.capture)||['waiting','encoding','error'].includes(snapshot.photos?.status??'')||(!observe&&!flying&&!inViewpoint&&snapshot.phase!=='paused')||(!observe&&Boolean(snapshot.reason&&snapshot.reason!=='user')))
  const start = () => { setObserve(false); runtime?.start(); root.current?.focus() }
  const stopPointer = (event: PointerEvent<HTMLButtonElement>) => runtime?.input.release(event.pointerId)
  const direction = (event: PointerEvent<HTMLButtonElement>, turn: number, climb: number) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); runtime?.input.point(turn, climb, event.pointerId)
  }
  const configure = (next: FlightSettings) => { setDraft(next); chosenSettings.current = next; runtime?.configure(next) }
  const restart = (next = draft, resetSunlight = false) => { chosenLiving.current=resetSunlight?{...DEFAULT_LIVING_INTENT}:{...runtime?.livingIntent??DEFAULT_LIVING_INTENT}; if(!resetSunlight&&runtime){runtime.weather.restart();chosenWeather.current=runtime.weather.serialize()}else chosenWeather.current=null; chosenSunlight.current=resetSunlight?null:runtime?.environmentClock.solarDayProgress??null; chosenSettings.current = next; setDraft(next); setSettings(false); setGalleryOpen(false); setObserve(false); setRetry(n => n + 1) }
  const reason = snapshot.reason === 'terrain' ? copy.terrain : ['safety', 'camera'].includes(snapshot.reason ?? '') ? copy.safety : snapshot.reason === 'context' ? copy.context : snapshot.reason === 'hidden' ? copy.hidden : copy.quiet
  return <section ref={root} className="flight-experience" role="dialog" aria-modal="true" aria-label={copy.title} tabIndex={-1} data-flight-phase={snapshot.phase} data-hud-idle={hudIdle}>
    <header className="flight-toolbar">
      <button type="button" aria-label={copy.back} onClick={onClose}><ChevronLeft size={20}/><span>{copy.back}</span></button>
      <div className="flight-toolbar__right">
        {inViewpoint && <button className="flight-travel-return" type="button" disabled={snapshot.observation==='returning'} onClick={()=>runtime?.navigateBack()}><ArrowLeft size={18}/><span>{locale==='zh-CN'?'回到飞行':'Back to flight'}</span></button>}
        {!inViewpoint && (['flying', 'paused'].includes(snapshot.phase)||(observe&&snapshot.phase==='ready')) && <button type="button" aria-label={flying?copy.pause:snapshot.phase==='ready'?copy.start:copy.resume} disabled={!flying && !runtime?.canResume} onClick={() => flying ? runtime?.pause() : start()}>{flying ? <Pause size={19}/> : <Play size={19}/>}<span>{flying ? copy.pause : snapshot.phase==='ready'?copy.start:copy.resume}</span></button>}
        <button className="flight-settings-trigger" title={locale==='zh-CN'?'飞行与风景':'Flight & scenery'} type="button" ref={settingsTrigger} disabled={snapshot.phase==='preparing'||snapshot.phase==='recovering'} aria-label={locale==='zh-CN'?'飞行与风景':'Flight & scenery'} aria-controls="flight-settings-panel" aria-expanded={settings} onClick={()=>{runtime?.input.clear();setGalleryOpen(false);setSettings(v=>!v)}}><Settings2 size={20}/><span>{locale==='zh-CN'?'飞行与风景':'Flight & scenery'}</span></button>
        {runtime&&<PostcardDock key={retry} runtime={runtime} snapshot={snapshot} locale={locale} onCapture={()=>setSettings(false)} galleryOpen={galleryOpen} onGalleryChange={open=>{setGalleryOpen(open);if(open)setSettings(false)}}/>}
      </div>
    </header>
    <div className="flight-place" aria-live="polite"><span>{copy.title}</span><strong>{copy.regions[snapshot.region]}</strong>{snapshot.simplified && <small>{copy.simplified}</small>}</div>
    {(preparingView||snapshot.viewTransition?.canvas) && <ViewPreparation snapshot={snapshot} zh={locale==='zh-CN'}/>}

    {snapshot.reason === 'error' ? <section className="flight-card" role="alert"><h1>{copy.error}</h1>{runtime?.canReturnToTravel&&<button type="button" onClick={()=>runtime.navigateBack()}>{locale==='zh-CN'?'返回原飞行位置':'Return to flight position'}</button>}<button type="button" onClick={()=>restart()}>{copy.retry}</button><button type="button" onClick={onClose}>{copy.back}</button></section> : settings ? <section id="flight-settings-panel" className="flight-card flight-settings" aria-label={locale==='zh-CN'?'飞行与风景':'Flight & scenery'}>
      <div className="flight-settings-heading"><div className="flight-card__heading"><div><h2>{locale==='zh-CN'?'飞行与风景':'Flight & scenery'}</h2></div><div className="flight-language"><LanguageMenu/></div><button type="button" aria-label={copy.close} onClick={closeSettings}><X size={20}/></button></div>
</div>
      <div className="flight-panel-sections" role="tablist" aria-label={locale==='zh-CN'?'风景面板分区':'Scenery panel sections'}>{(['scenery','viewpoints','flight'] as const).map((value,i)=>{const Icon=[Sun,Binoculars,Feather][i]!;return <button key={value} id={`flight-tab-${value}`} type="button" role="tab" aria-selected={section===value} aria-controls={`flight-section-${value}`} tabIndex={section===value?0:-1} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3;const target=(['scenery','viewpoints','flight'] as const)[next]!;selectSection(target);document.getElementById(`flight-tab-${target}`)?.focus()}}} onClick={()=>selectSection(value)}><Icon size={18} aria-hidden="true"/><span>{(locale==='zh-CN'?['风景','观景','飞行']:['Scenery','Views','Flight'])[i]}</span></button>})}</div>
      <div className="flight-settings-scroll-shell" data-scrollable={metrics.isScrollable}>
      {metrics.isScrollable&&<span className="flight-scroll-cue" aria-hidden="true">{locale==='zh-CN'?'滑动查看更多 ↕':'Scroll to explore ↕'}</span>}
      <div ref={scrollRef} className="flight-settings-scroll museum-scrollbar" onScroll={handleScroll} onWheel={event=>event.stopPropagation()} onPointerDown={()=>runtime?.input.clear()}>
      <div className="flight-settings-body">
      <div id="flight-section-scenery" className="flight-tabpanel" role="tabpanel" aria-labelledby="flight-tab-scenery" hidden={section!=='scenery'}>
       <section className="flight-scenery-group flight-scenery-group--light"><h3><Sun size={18} aria-hidden="true"/>{locale==='zh-CN'?'光线':'Light'}</h3>{runtime&&<LightViewpointPanel runtime={runtime} snapshot={snapshot} locale={locale} mode="sunlight"/>}</section>
       <section className="flight-scenery-group flight-scenery-group--weather"><h3><CloudSun size={18} aria-hidden="true"/>{locale==='zh-CN'?'天气':'Weather'}</h3>{runtime&&<WeatherPanel runtime={runtime} snapshot={snapshot} locale={locale}/>}</section>
       <section className="flight-scenery-group flight-scenery-group--nature"><h3><Waves size={18} aria-hidden="true"/>{locale==='zh-CN'?'环境':'Coastal life'}</h3>{runtime&&<NaturePanel runtime={runtime} snapshot={snapshot} locale={locale}/>}</section>
      </div>
      <div id="flight-section-viewpoints" className="flight-tabpanel" role="tabpanel" aria-labelledby="flight-tab-viewpoints" hidden={section!=='viewpoints'}>
       <h3 className="flight-view-heading">{locale==='zh-CN'?'推荐观景位':'A few favourite views'}</h3>
       {runtime&&<LightViewpointPanel runtime={runtime} snapshot={snapshot} locale={locale} mode="viewpoints"/>}
       <details className="flight-new-start"><summary>{locale==='zh-CN'?'重新选择出发位置':'Choose a new starting point'} <span aria-hidden="true">→</span></summary>
        <div className="flight-start-places" role="group" aria-label={copy.startPlace}>{(['coast','valley','overview'] as const).map((place,i)=><button type="button" key={place} aria-pressed={draft.start===place} onClick={()=>setDraft({...draft,start:place})}><svg viewBox="0 0 96 54" aria-hidden="true"><path d={['M0 35 Q24 40 40 28 T96 18 L96 54 H0Z','M0 38 L24 12 49 43 73 15 96 37 V54 H0Z','M0 42 L28 22 45 36 69 12 96 38 V54 H0Z'][i]}/><path className="flight-start-route" d={['M12 43 Q38 50 50 31 T84 16','M40 52 Q66 42 52 31 T47 6','M8 18 Q50 4 87 17'][i]}/></svg><span>{copy.starts[i]}<small>{(locale==='zh-CN'?['沿着海陆交界飞行','顺着山谷向前探索','从高处俯瞰山与海']:['Follow the coastline','Explore along the valley','See the land from above'])[i]}</small></span></button>)}</div>
        <div className="flight-setting flight-choice-setting"><span>{copy.height}</span><div className="flight-inline-choices" role="group" aria-label={copy.height}>{([100,190,350] as const).map((v,i)=><button type="button" key={v} aria-pressed={draft.height===v} onClick={()=>setDraft({...draft,height:v})}>{copy.heights[i]}</button>)}</div></div>
        <p className="flight-start-notice">{locale==='zh-CN'?'会重新准备风景，并清空尚未保存的明信片。':'Prepares a new landscape and clears unsaved postcards.'}</p><button className="flight-primary" type="button" onClick={()=>restart()}>{locale==='zh-CN'?`从${copy.starts[(['coast','valley','overview'] as const).indexOf(draft.start)]}出发`:`Start from ${copy.starts[(['coast','valley','overview'] as const).indexOf(draft.start)]}`}</button>
        <details className="flight-more"><summary>{locale==='zh-CN'?'恢复初始设置':'Restore initial settings'}</summary><button type="button" onClick={()=>restart({...DEFAULT_FLIGHT_SETTINGS},true)}>{copy.defaults}</button></details>
       </details>
       {runtime&&<ObservationNotes runtime={runtime} locale={locale}/>}

      </div>
      <div id="flight-section-flight" className="flight-tabpanel" role="tabpanel" aria-labelledby="flight-tab-flight" hidden={section!=='flight'}>
      <FlightToggle label={copy.gentle} checked={snapshot.gentle} onChange={gentle=>configure({...draft,quality:snapshot.quality,gentle})}/>
      <label className="flight-setting flight-comfort-range"><span>{locale==='zh-CN'?'飞行速度':'Flight speed'}</span><span><input aria-label={copy.speed} aria-valuetext={(locale==='zh-CN'?['慢慢飞','自在飞','快一些']:['Slow','Steady','Faster'])[([18,28,36] as const).indexOf(draft.speed)]} type="range" min="0" max="2" step="1" value={([18,28,36] as const).indexOf(draft.speed)} onChange={e=>configure({...draft,quality:snapshot.quality,gentle:snapshot.gentle,speed:([18,28,36] as const)[Number(e.target.value)]!})}/><small><span>{locale==='zh-CN'?'慢':'Slow'}</span><span>{locale==='zh-CN'?'快':'Fast'}</span></small></span></label>
      <label className="flight-setting flight-comfort-range"><span>{locale==='zh-CN'?'镜头':'Camera'}</span><span><input aria-label={copy.camera} aria-valuetext={copy.views[(['near','standard','wide'] as const).indexOf(draft.view)]} type="range" min="0" max="2" step="1" value={(['near','standard','wide'] as const).indexOf(draft.view)} onChange={e=>configure({...draft,quality:snapshot.quality,gentle:snapshot.gentle,view:(['near','standard','wide'] as const)[Number(e.target.value)]!})}/><small><span>{locale==='zh-CN'?'跟近一点':'Closer'}</span><span>{locale==='zh-CN'?'看远一点':'Wider'}</span></small></span></label>
      <details className="flight-fine-tune"><summary>{locale==='zh-CN'?'画面质量':'Picture quality'}</summary><div className="flight-setting flight-choice-setting"><span>{copy.quality}<small>{locale==='zh-CN'?'切换时会短暂停留':'Changing quality briefly stops flight'}</small></span><div className="flight-inline-choices" role="group" aria-label={copy.quality}>{(['low','balanced'] as const).map(quality=><button type="button" key={quality} disabled={inViewpoint} aria-pressed={snapshot.quality===quality} onClick={()=>configure({...draft,gentle:snapshot.gentle,quality})}>{quality==='low'?copy.low:copy.balanced}</button>)}</div></div></details>

      </div>
      {!inViewpoint&&snapshot.phase==='ready'&&runtime?.canResume&&<button type="button" className="flight-primary flight-panel-return" onClick={()=>{closeSettings();start()}}>{copy.start}</button>}
      </div></div><TransientScrollbar isScrolling={isScrolling} metrics={metrics}/></div>
    </section> : !flying && !inViewpoint && !galleryOpen && !(observe&&['ready','paused'].includes(snapshot.phase)&&runtime?.canResume) && (snapshot.phase!=='paused'||Boolean(snapshot.reason&&snapshot.reason!=='user')) && <section className="flight-card flight-intro" aria-live="polite">
      <span className="flight-eyebrow">{copy.title} · PTERANODON</span>
      <h1>{snapshot.phase === 'buffering' ? copy.terrain : snapshot.phase === 'preparing' ? copy.preparing : snapshot.phase === 'recovering' ? copy.error : snapshot.phase === 'ready' ? copy.ready : copy.paused}</h1>
      <p>{snapshot.phase === 'ready' ? copy.subtitle : reason}</p>
      {snapshot.phase === 'ready' && <p className="flight-instructions">{copy.instruction}</p>}
      {snapshot.phase !== 'preparing' && <div className="flight-card__actions">
        {runtime?.canResume && <button type="button" className="flight-primary" onClick={start}><Play size={18}/>{snapshot.phase === 'ready' ? copy.start : copy.resume}</button>}
        {(snapshot.phase === 'recovering' || ['safety', 'camera', 'terrain'].includes(snapshot.reason ?? '')) && <button type="button" className="flight-primary" onClick={() => restart()}>{copy.retry}</button>}
        <button type="button" disabled={!runtime?.canResume} onClick={() => {setObserve(true);root.current?.focus()}}>{copy.static}</button>
      </div>}
      <small>{copy.art}</small>
    </section>}
    {import.meta.env.DEV && runtime && !inViewpoint && !settings && !galleryOpen && <FlightReviewControls runtime={runtime}/>}
    {flying && !settings && !galleryOpen && <>
      <div className="flight-direction-pad" role="group" aria-label={copy.directions}>
        {([{ label: copy.up, icon: ArrowUp, turn: 0, climb: 1, position: 'up' }, { label: copy.left, icon: ArrowLeft, turn: -1, climb: 0, position: 'left' }, { label: copy.down, icon: ArrowDown, turn: 0, climb: -1, position: 'down' }, { label: copy.right, icon: ArrowRight, turn: 1, climb: 0, position: 'right' }]).map(({ label, icon: Icon, turn, climb, position }) => <button type="button" key={position} className={`flight-direction flight-direction--${position}`} aria-label={label}
          onPointerDown={e => direction(e, turn, climb)} onPointerUp={stopPointer} onPointerCancel={stopPointer} onLostPointerCapture={stopPointer}
          onClick={e => { if (e.detail === 0) { runtime?.input.point(turn, climb); if (nudgeTimer.current) clearTimeout(nudgeTimer.current); nudgeTimer.current = setTimeout(() => runtime?.input.release(-1), 300) } }}><Icon size={24}/></button>)}
      </div>
      <div className="flight-assist"><button type="button" onClick={() => { runtime?.assist(); root.current?.focus() }}>{copy.assist}</button>{snapshot.assisted && <small>{copy.assisting}</small>}</div>
    </>}
  </section>
}
