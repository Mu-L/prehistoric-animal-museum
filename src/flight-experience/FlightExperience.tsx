import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, Pause, Play, Settings2, X } from 'lucide-react'
import type { ViewerController, ViewerModelDescriptor } from 'virtual:viewer-controller'
import { useI18n } from '../i18n/I18nProvider'
import { FlightRuntime, type FlightSnapshot } from './FlightRuntime'
import { isFlightShortcutTarget } from './input'
import { flightMessages } from './messages'
import './flight.css'
const initial: FlightSnapshot = { phase: 'preparing', reason: null, simplified: false, region: 'coast', gentle: false, assisted: false, quality: 'low' }
const noSubscription = () => () => {}
const initialSnapshot = () => initial
interface Props { controller: ViewerController; descriptor: ViewerModelDescriptor; onClose: () => void }
export function FlightExperience({ controller, descriptor, onClose }: Props) {
  const { locale, setPreference } = useI18n(), copy = flightMessages[locale]
  const [runtime, setRuntime] = useState<FlightRuntime | null>(null)
  const [retry, setRetry] = useState(0), [settings, setSettings] = useState(false), [observe, setObserve] = useState(false)
  const root = useRef<HTMLElement>(null), nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descriptorRef = useRef(descriptor)
  const snapshot = useSyncExternalStore(runtime?.subscribe ?? noSubscription, runtime?.getSnapshot ?? initialSnapshot, initialSnapshot)
  useEffect(() => {
    const instance = new FlightRuntime(controller, window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    let active = true
    queueMicrotask(() => { if (active) setRuntime(instance) })
    void instance.prepare(descriptorRef.current)
    root.current?.focus()
    return () => { active = false; instance.close(); if (nudgeTimer.current) clearTimeout(nudgeTimer.current) }
  }, [controller, retry])
  useEffect(() => {
    if (!runtime) return
    const clear = () => { runtime.input.clear(); runtime.pause('hidden') }
    const visibility = () => { if (document.hidden) clear() }
    const keydown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.preventDefault(); event.stopPropagation()
        if (settings) setSettings(false); else if (observe) setObserve(false); else onClose()
        return
      }
      if (event.code === 'Tab') {
        const buttons = [...(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select,input,[tabindex="0"]') ?? [])].filter(e => e.getClientRects().length > 0)
        const first = buttons[0], last = buttons.at(-1)
        if (event.shiftKey && (document.activeElement === first || document.activeElement === root.current)) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        return
      }
      if (isFlightShortcutTarget(event.target)) return
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
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', visibility)
    reduced.addEventListener('change', changed)
    return () => {
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', visibility)
      reduced.removeEventListener('change', changed); runtime.input.clear()
    }
  }, [runtime, snapshot.phase, onClose, settings, observe])
  useEffect(() => {
    if (!runtime || !root.current) return
    const element = root.current
    // Local review telemetry; bounded by the runtime, never sent anywhere.
    const report = () => { element.dataset.flightDiagnostics = JSON.stringify(runtime.diagnostics()) }
    report(); const timer = window.setInterval(report, 2000)
    return () => window.clearInterval(timer)
  }, [runtime])
  const flying = snapshot.phase === 'flying'
  const start = () => { setObserve(false); runtime?.start(); root.current?.focus() }
  const stopPointer = () => runtime?.input.point(0, 0)
  const direction = (event: PointerEvent<HTMLButtonElement>, turn: number, climb: number) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); runtime?.input.point(turn, climb)
  }
  const reason = snapshot.reason === 'terrain' ? copy.terrain : ['safety', 'camera'].includes(snapshot.reason ?? '') ? copy.safety : snapshot.reason === 'context' ? copy.context : snapshot.reason === 'hidden' ? copy.hidden : copy.quiet
  return <section ref={root} className="flight-experience" role="dialog" aria-modal="true" aria-label={copy.title} tabIndex={-1} data-flight-phase={snapshot.phase}>
    <header className="flight-toolbar">
      <button type="button" onClick={onClose}><ChevronLeft size={20}/><span>{copy.back}</span></button>
      <div className="flight-toolbar__right">
        {['flying', 'paused'].includes(snapshot.phase) && <button type="button" onClick={() => flying ? runtime?.pause() : start()}>{flying ? <Pause size={19}/> : <Play size={19}/>}<span>{flying ? copy.pause : copy.resume}</span></button>}
        <button type="button" aria-label={copy.settings} aria-expanded={settings} onClick={() => { runtime?.pause('settings'); setSettings(v => !v) }}><Settings2 size={20}/></button>
      </div>
    </header>
    <div className="flight-place" aria-live="polite"><span>{copy.title}</span><strong>{copy.regions[snapshot.region]}</strong>{snapshot.simplified && <small>{copy.simplified}</small>}</div>
    {settings ? <section className="flight-card flight-settings" aria-label={copy.settings}>
      <div className="flight-card__heading"><h2>{copy.settings}</h2><button type="button" aria-label={copy.close} onClick={() => setSettings(false)}><X size={20}/></button></div>
      <label className="flight-setting"><span>{copy.gentle}<small>{copy.gentleHelp}</small></span><input type="checkbox" checked={snapshot.gentle} onChange={e => runtime?.setGentle(e.target.checked)}/></label>
      <label className="flight-setting">{copy.quality}<select value={snapshot.quality} onChange={e => runtime?.setQuality(e.target.value === 'balanced' ? 'balanced' : 'low')}><option value="low">{copy.low}</option><option value="balanced">{copy.balanced}</option></select></label>
      <label className="flight-setting">{copy.language}<select value={locale} onChange={e => setPreference(e.target.value === 'en' ? 'en' : 'zh-CN')}><option value="zh-CN">简体中文</option><option value="en">English</option></select></label>
      <p>{copy.art}</p><button type="button" className="flight-primary" onClick={() => { setSettings(false); start() }}>{copy.resume}</button>
    </section> : !flying && <section className="flight-card flight-intro" aria-live="polite">
      <span className="flight-eyebrow">{copy.title} · PTERANODON</span>
      <h1>{snapshot.phase === 'preparing' ? copy.preparing : snapshot.phase === 'recovering' ? copy.error : observe ? copy.observation : snapshot.phase === 'ready' ? copy.ready : copy.paused}</h1>
      <p>{observe ? copy.observeText : snapshot.phase === 'ready' ? copy.subtitle : reason}</p>
      {snapshot.phase === 'ready' && <p className="flight-instructions">{copy.instruction}</p>}
      {snapshot.phase !== 'preparing' && <div className="flight-card__actions">
        {snapshot.phase !== 'recovering' && !['safety', 'camera'].includes(snapshot.reason ?? '') && <button type="button" className="flight-primary" onClick={start}><Play size={18}/>{snapshot.phase === 'ready' ? copy.start : copy.resume}</button>}
        {(snapshot.phase === 'recovering' || ['safety', 'camera', 'terrain'].includes(snapshot.reason ?? '')) && <button type="button" className="flight-primary" onClick={() => setRetry(v => v + 1)}>{copy.retry}</button>}
        <button type="button" onClick={() => setObserve(v => !v)}>{copy.static}</button>
      </div>}
      <small>{copy.art}</small>
    </section>}
    {flying && <>
      <div className="flight-direction-pad" role="group" aria-label={copy.directions}>
        {([{ label: copy.up, icon: ArrowUp, turn: 0, climb: 1, position: 'up' }, { label: copy.left, icon: ArrowLeft, turn: -1, climb: 0, position: 'left' }, { label: copy.down, icon: ArrowDown, turn: 0, climb: -1, position: 'down' }, { label: copy.right, icon: ArrowRight, turn: 1, climb: 0, position: 'right' }]).map(({ label, icon: Icon, turn, climb, position }) => <button type="button" key={position} className={`flight-direction flight-direction--${position}`} aria-label={label}
          onPointerDown={e => direction(e, turn, climb)} onPointerUp={stopPointer} onPointerCancel={stopPointer} onLostPointerCapture={stopPointer}
          onClick={e => { if (e.detail === 0) { runtime?.input.point(turn, climb); if (nudgeTimer.current) clearTimeout(nudgeTimer.current); nudgeTimer.current = setTimeout(stopPointer, 300) } }}><Icon size={24}/></button>)}
      </div>
      <div className="flight-assist"><button type="button" onClick={() => { runtime?.assist(); root.current?.focus() }}>{copy.assist}</button>{snapshot.assisted && <small>{copy.assisting}</small>}</div>
    </>}
  </section>
}
