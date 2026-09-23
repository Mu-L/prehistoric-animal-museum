import { TransientScrollbar } from '../../components/TransientScrollbar'
import { useTransientScrollbar } from '../../components/useTransientScrollbar'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import type { FlightRuntime } from '../FlightRuntime'
import { observationCards } from './observation-content'

/** Optional reading, not a discovery checklist. Opening a note explicitly pauses. */
export function ObservationNotes({ runtime, locale }: { runtime: FlightRuntime; locale: 'en' | 'zh-CN' }) {
 const zh = locale === 'zh-CN', [card, setCard] = useState<number | null>(null)
 const { scrollRef, handleScroll, isScrolling, metrics } = useTransientScrollbar(card !== null)
 const cardRoot = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
 const titles = zh ? ['水面的光', '移动的云影', '飞过的同伴'] : ['Light on water', 'Moving cloud shadows', 'Passing companions']
 const conditions = zh ? ['迎着阳光看水面时', '云影清楚可辨时', '同伴从远处经过时'] : ['When sunlight catches the water', 'When cloud shadows are visible', 'When companions pass nearby']
 useEffect(() => { if (card !== null) cardRoot.current?.querySelector<HTMLButtonElement>('button')?.focus() }, [card])
 useEffect(() => () => runtime.setObservationCard(false), [runtime])
 const closeCard = () => { setCard(null); runtime.setObservationCard(false); trigger.current?.focus() }
 return <details className="flight-observation-notes">
  <summary><BookOpen size={18} aria-hidden="true"/><span>{zh ? '看看这片风景' : 'Look a little closer'}<small>{zh ? '给好奇的你，三段小小的说明' : 'Three short notes for curious minds'}</small></span></summary>
  <div className="flight-note-topics">{titles.map((title, index) => <button type="button" key={title} onClick={event => { trigger.current = event.currentTarget; runtime.setObservationCard(true); setCard(index) }}><span>{title}<small>{conditions[index]}</small></span><span aria-hidden="true">↗</span></button>)}</div>
  {card !== null && createPortal(<div className="flight-observation-backdrop"><section ref={cardRoot} className="flight-observation-card" role="dialog" aria-modal="true" aria-label={observationCards[locale][card]!.title} onKeyDown={event => {
   if (event.key === 'Escape') { event.preventDefault(); closeCard() }
   if (event.key === 'Tab') {
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button,summary,a[href]')].filter(element => !element.closest('details:not([open])') || element.tagName === 'SUMMARY')
    const first = focusable[0], last = focusable.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
   }
   event.stopPropagation()
  }}>
   <div className="flight-card__heading"><span className="flight-eyebrow">{zh ? '风景手记' : 'COASTAL NOTES'}</span><button type="button" aria-label={zh ? '关闭，保持暂停' : 'Close and stay paused'} onClick={closeCard}><X size={19}/></button></div>
   <div className="flight-note-scroll-shell" data-scrollable={metrics.isScrollable}><div ref={scrollRef} className="flight-note-scroll museum-scrollbar" onScroll={handleScroll} onWheel={event=>event.stopPropagation()}><div className="flight-note-body">
   <p className="flight-note-paused">{zh ? '景色已暂停，声音已静音' : 'Scenery paused and sound muted'}</p>
   <h3>{observationCards[locale][card]!.title}</h3><p>{observationCards[locale][card]!.body}</p>
   <details><summary>{zh ? '给家长的说明' : 'For grown-ups'}</summary><p>{observationCards[locale][card]!.parent}</p>{observationCards[locale][card]!.url ? <a href={observationCards[locale][card]!.url} target="_blank" rel="noreferrer">{observationCards[locale][card]!.source}</a> : <small>{observationCards[locale][card]!.source}</small>}</details>
   <p className="flight-note-paused">{zh ? '关闭后仍会停在这里，准备好再继续飞翔。' : 'Closing keeps you paused. Resume flying when you are ready.'}</p>
   </div></div><TransientScrollbar isScrolling={isScrolling} metrics={metrics}/></div>
  </section></div>, document.querySelector('.flight-experience') ?? document.body)}
 </details>
}
