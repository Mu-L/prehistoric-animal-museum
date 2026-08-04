import { createPortal } from 'react-dom'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { IconButton } from './IconButton'

export interface ParentReviewFacts {
  readonly badge: string
  readonly checks: readonly string[]
  readonly displayLabel: string
  readonly note: string
  readonly packageStatus: 'published' | 'draft'
  readonly stateLabel: '已听审' | '草稿'
  readonly status: string
}

export interface ParentFacts {
  assetCredits: Array<{
    attribution: string
    licenseName: string
    licenseUrl: string
    sourceTitle: string
    sourceUrl?: string
  }>
  classification: string
  classificationNote: string
  diet: string
  discoveryRegions: string[]
  size: string
  sizeLabel: string
  narrationScript: readonly [string, string]
  period: string
  review?: ParentReviewFacts
  sources: Array<{
    title: string
    url: string
  }>
}

interface ParentDrawerProps {
  facts: ParentFacts
  onClose: () => void
  open: boolean
  returnFocusTo: React.RefObject<HTMLElement | null>
  showReviewDetails?: boolean
}

const focusableSelector = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function displaySourceTitle(title: string): string {
  return title.replace(/[—–]/g, '-')
}

export function ParentDrawer({
  facts,
  onClose,
  open,
  returnFocusTo,
  showReviewDetails = false,
}: ParentDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollCue, setShowScrollCue] = useState(false)
  const scrollHintId = useId()
  const titleId = useId()
  const review = showReviewDetails ? facts.review : undefined

  const updateScrollCue = useCallback(() => {
    const scroll = scrollRef.current
    if (!scroll) {
      setShowScrollCue(false)
      return
    }
    const remaining =
      scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight
    setShowScrollCue(scroll.scrollHeight > scroll.clientHeight + 2 && remaining > 4)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const returnTarget = returnFocusTo.current
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !drawerRef.current) {
        return
      }
      const controls = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      )
      const first = controls[0]
      const last = controls.at(-1)
      if (!first || !last) {
        return
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      returnTarget?.focus()
    }
  }, [open, returnFocusTo])

  useEffect(() => {
    if (!open) {
      return
    }
    const scroll = scrollRef.current
    if (!scroll) {
      return
    }
    const timer = window.setTimeout(updateScrollCue, 0)
    scroll.addEventListener('scroll', updateScrollCue, { passive: true })
    window.addEventListener('resize', updateScrollCue)
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateScrollCue)
    observer?.observe(scroll)
    if (scroll.firstElementChild) {
      observer?.observe(scroll.firstElementChild)
    }

    return () => {
      window.clearTimeout(timer)
      scroll.removeEventListener('scroll', updateScrollCue)
      window.removeEventListener('resize', updateScrollCue)
      observer?.disconnect()
    }
  }, [facts, open, updateScrollCue])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="drawer-layer">
      <div
        aria-hidden="true"
        className="drawer-backdrop"
        onMouseDown={(event) => {
          if (event.currentTarget === event.target) {
            onClose()
          }
        }}
      />
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="parent-drawer"
        ref={drawerRef}
        role="dialog"
      >
        <div className="drawer-handle" aria-hidden="true" />
        <header className="drawer-header">
          <div>
            <p className="drawer-eyebrow">一起了解更多</p>
            <h2 id={titleId}>给家长的资料</h2>
          </div>
          <IconButton
            hideTooltipOnFocus
            icon={X}
            label="关闭家长资料"
            onClick={onClose}
            ref={closeButtonRef}
          />
        </header>
        <div
          aria-describedby={showScrollCue ? scrollHintId : undefined}
          className="drawer-scroll"
          ref={scrollRef}
        >
          <div>
            <dl className="fact-grid">
              <div>
                <dt>生活时期</dt>
                <dd>{facts.period}</dd>
              </div>
              <div>
                <dt>发现地区</dt>
                <dd>{facts.discoveryRegions.join('、')}</dd>
              </div>
              <div>
                <dt>{facts.sizeLabel}</dt>
                <dd>{facts.size}</dd>
              </div>
              <div>
                <dt>食性</dt>
                <dd>{facts.diet}</dd>
              </div>
              <div className="fact-grid__wide">
                <dt>分类提示</dt>
                <dd>
                  {facts.classification}。{facts.classificationNote}
                </dd>
              </div>
            </dl>
            {review ? (
              <section
                aria-label="本地评审记录"
                className="review-note"
                data-package-status={review.packageStatus}
              >
                <details>
                  <summary>
                    <span>评审备注（仅本地可见）</span>
                    <span>{review.displayLabel}</span>
                  </summary>
                  <div className="review-note__body">
                    <h3>{review.status}</h3>
                    <p>{review.note}</p>
                    <h4>本轮检查</h4>
                    <ul>
                      {review.checks.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ul>
                  </div>
                </details>
              </section>
            ) : null}
            <div className="narration-transcript">
              <p className="drawer-eyebrow">一起听的时候也能看</p>
              <h3>介绍文稿</h3>
              <p>{facts.narrationScript.join('')}</p>
            </div>
            <details className="source-disclosure">
              <summary>内容参考</summary>
              <div className="source-list">
                <ul>
                  {facts.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} rel="noreferrer" target="_blank">
                        {displaySourceTitle(source.title)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
            <details className="source-disclosure">
              <summary>模型素材与许可</summary>
              <div className="source-list">
                <ul>
                  {facts.assetCredits.map((credit) => (
                    <li key={`${credit.sourceTitle}:${credit.licenseUrl}`}>
                      {credit.sourceUrl ? (
                        <a href={credit.sourceUrl} rel="noreferrer" target="_blank">
                          {displaySourceTitle(credit.sourceTitle)}
                        </a>
                      ) : (
                        displaySourceTitle(credit.sourceTitle)
                      )}
                      ：{credit.attribution}{' '}
                      <a href={credit.licenseUrl} rel="noreferrer" target="_blank">
                        {credit.licenseName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
            <details className="source-disclosure">
              <summary>开源代码与分层许可</summary>
              <div className="source-list">
                <p>
                  开源代码允许依 AGPL-3.0 商业使用；原创博物馆内容按
                  CC BY-NC-SA 4.0 非商业共享；品牌只独立防止冒充官方，
                  第三方素材沿用原许可。{' '}
                  <a
                    href="https://github.com/s010s/prehistoric-animal-museum/blob/main/LICENSING.md"
                    rel="noreferrer"
                    target="_blank"
                  >
                    查看源代码和完整许可
                  </a>
                </p>
              </div>
            </details>
          </div>
        </div>
        <p className="sr-only" id={scrollHintId}>
          资料还可以继续向上滑动。
        </p>
        <div
          aria-hidden="true"
          className="drawer-scroll-cue"
          data-visible={showScrollCue}
        >
          <ChevronDown size={17} strokeWidth={2.2} />
          <span>向上滑动查看更多</span>
        </div>
      </section>
    </div>,
    document.body,
  )
}
