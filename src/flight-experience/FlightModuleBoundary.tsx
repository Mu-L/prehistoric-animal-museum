import { Component, Suspense, lazy, useState, type ReactNode } from 'react'
import type { Locale } from '../i18n/locale'
import type { FlightExperience as Experience } from './FlightExperience'
interface Props { children: ReactNode; locale: Locale; onClose: () => void; onRetry?: () => void; onReload?: () => void }
/** Kept in the small app entry so a failed lazy download still has an exit. */
export class FlightModuleBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    const zh = this.props.locale === 'zh-CN'
    return <section className="scale-encounter-module-loading" role="dialog" aria-modal="true" aria-label={zh ? '飞行暂时不可用' : 'Flight is unavailable'}>
      <p>{zh ? '飞行画面未能载入。请重试，或返回展馆。' : 'Flight could not load. Try again or return to the museum.'}</p>
      <button type="button" onClick={this.props.onClose}>{zh ? '返回展馆' : 'Back to museum'}</button>
      <button type="button" onClick={this.props.onRetry}>{zh ? '重试' : 'Try again'}</button>
      <p>{zh ? '若重试仍无法载入，请重新加载页面。' : 'If retrying does not help, reload the page.'}</p>
      <button type="button" onClick={this.props.onReload ?? (() => window.location.reload())}>{zh ? '重新加载页面' : 'Reload page'}</button>
    </section>
  }
}
type Loader=()=>Promise<{FlightExperience:typeof Experience}>
export function FlightModule({loader,locale,onClose,experienceProps}:{loader:Loader;locale:Locale;onClose:()=>void;experienceProps:Parameters<typeof Experience>[0]}) {
  const create=()=>lazy(async()=>({default:(await loader()).FlightExperience}))
  const [attempt,setAttempt]=useState(()=>({Component:create(),epoch:0}))
  const View=attempt.Component
  return <FlightModuleBoundary key={attempt.epoch} locale={locale} onClose={onClose} onRetry={()=>setAttempt(old=>({Component:create(),epoch:old.epoch+1}))}>
    <Suspense fallback={<section className="scale-encounter-module-loading" role="dialog" aria-modal="true" aria-label={locale==='zh-CN'?'准备飞行':'Preparing flight'}>
      <p role="status">{locale==='zh-CN'?'正在准备飞行画面…':'Preparing the flight experience…'}</p>
      <button type="button" onClick={onClose}>{locale==='zh-CN'?'返回展馆':'Back to museum'}</button>
    </section>}><View {...experienceProps}/></Suspense>
  </FlightModuleBoundary>
}
