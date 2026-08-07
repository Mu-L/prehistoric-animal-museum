import { Check, Languages } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { systemLocale, type LocalePreference } from '../i18n/locale'

const choices: readonly LocalePreference[] = ['system', 'zh-CN', 'en']

export function LanguageMenu() {
  const { locale, messages, preference, setPreference } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef(new Map<LocalePreference, HTMLButtonElement>())

  const labelFor = (choice: LocalePreference): ReactNode => {
    if (choice === 'system') {
      const resolved = systemLocale(
        navigator.languages.length > 0
          ? navigator.languages
          : [navigator.language],
      )
      const resolvedLabel =
        resolved === 'zh-CN'
          ? messages.language.chinese
          : messages.language.english
      const fullLabel = messages.language.systemResolved(resolvedLabel)
      const resolvedLabelStart = fullLabel.indexOf(resolvedLabel)
      return (
        <span lang={locale}>
          {fullLabel.slice(0, resolvedLabelStart)}
          <span lang={resolved}>{resolvedLabel}</span>
          {fullLabel.slice(resolvedLabelStart + resolvedLabel.length)}
        </span>
      )
    }
    return (
      <span lang={choice}>
        {choice === 'zh-CN'
          ? messages.language.chinese
          : messages.language.english}
      </span>
    )
  }

  const close = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) {
      queueMicrotask(() => triggerRef.current?.focus())
    }
  }

  const openAt = (choice: LocalePreference) => {
    setOpen(true)
    queueMicrotask(() => itemRefs.current.get(choice)?.focus())
  }

  useEffect(() => {
    if (!open) {
      return
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const handleMenuKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    const currentIndex = choices.findIndex(
      (choice) => itemRefs.current.get(choice) === document.activeElement,
    )
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close(true)
      return
    }
    if (event.key === 'Tab') {
      queueMicrotask(() => close())
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const choice = event.key === 'Home' ? choices[0] : choices.at(-1)
      if (choice) itemRefs.current.get(choice)?.focus()
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }
    event.preventDefault()
    const offset = event.key === 'ArrowDown' ? 1 : -1
    const index =
      currentIndex < 0
        ? 0
        : (currentIndex + offset + choices.length) % choices.length
    const choice = choices[index]
    if (choice) itemRefs.current.get(choice)?.focus()
  }

  return (
    <div className="language-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={messages.language.buttonLabel}
        className="language-menu__trigger"
        onClick={() => {
          if (open) close()
          else openAt(preference)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openAt(
              event.key === 'ArrowDown' ? choices[0]! : choices.at(-1)!,
            )
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <Languages aria-hidden="true" size={20} strokeWidth={2.1} />
        <span>{locale === 'zh-CN' ? '中' : 'EN'}</span>
      </button>
      {open ? (
        <div
          aria-label={messages.language.menuLabel}
          className="language-menu__popover"
          onKeyDown={handleMenuKeyDown}
          role="menu"
        >
          {choices.map((choice) => (
            <button
              aria-checked={preference === choice}
              className="language-menu__choice"
              key={choice}
              onClick={() => {
                setPreference(choice)
                close(true)
              }}
              ref={(element) => {
                if (element) itemRefs.current.set(choice, element)
                else itemRefs.current.delete(choice)
              }}
              role="menuitemradio"
              tabIndex={-1}
              type="button"
            >
              <span aria-hidden="true" className="language-menu__radio" />
              <span>{labelFor(choice)}</span>
              <span
                aria-hidden="true"
                className="language-menu__selected-mark"
              >
                <Check size={17} strokeWidth={3} />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
