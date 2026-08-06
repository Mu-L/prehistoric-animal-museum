import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import { Code2, ExternalLink, X } from 'lucide-react'
import { GITHUB_LICENSING_URL, GITHUB_REPOSITORY_URL } from '../github'
import { IconButton } from './IconButton'

interface AboutDrawerProps {
  readonly onClose: () => void
  readonly open: boolean
  readonly returnFocusTo: React.RefObject<HTMLElement | null>
}

const focusableSelector = [
  'button:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function AboutDrawer({
  onClose,
  open,
  returnFocusTo,
}: AboutDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const titleId = useId()

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
        className="parent-drawer about-drawer"
        ref={drawerRef}
        role="dialog"
      >
        <div className="drawer-handle" aria-hidden="true" />
        <header className="drawer-header">
          <div>
            <p className="drawer-eyebrow">Leon做了个</p>
            <h2 id={titleId}>关于这座博物馆</h2>
          </div>
          <IconButton
            hideTooltipOnFocus
            icon={X}
            label="关闭关于这座博物馆"
            onClick={onClose}
            ref={closeButtonRef}
          />
        </header>
        <div className="drawer-scroll about-drawer__scroll">
          <div className="about-drawer__body">
            <section className="about-story">
              <h3>一个程序员爸爸，为女儿做的小博物馆</h3>
              <p>
                我是 Leon，一个程序员爸爸。女儿三岁时会害怕电视里的恐龙追逐，
                所以我给她做了这座可以安静观察、想听再听的 3D 史前动物博物馆。
              </p>
              <p>
                这里免费访问，不用注册，没有广告，也不做访问统计。一次发现一个
                有趣的细节，就已经足够。
              </p>
            </section>
            <div className="about-links">
              <a
                className="about-link about-link--primary"
                href={GITHUB_REPOSITORY_URL}
                rel="noreferrer"
                target="_blank"
              >
                <Code2 aria-hidden="true" size={20} strokeWidth={2.1} />
                <span>在 GitHub 查看源码</span>
                <ExternalLink aria-hidden="true" size={16} strokeWidth={2} />
              </a>
              <a
                className="about-link about-link--secondary"
                href={GITHUB_LICENSING_URL}
                rel="noreferrer"
                target="_blank"
              >
                <span>查看许可与素材说明</span>
                <ExternalLink aria-hidden="true" size={16} strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  )
}
