import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import { Check, Footprints, X } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { IconButton } from './IconButton'
import { LanguageMenu } from './LanguageMenu'

export interface CollectionAnimal {
  readonly classification: string
  readonly id: string
  readonly name: string
  readonly thumbnail: string
}

interface AnimalCollectionSheetProps {
  readonly animals: readonly CollectionAnimal[]
  readonly currentAnimalId: string
  readonly loadingAnimalId: string | null
  readonly loadingPhase: 'checking-cache' | 'downloading' | 'preparing' | null
  readonly loadingPercent: number | null
  readonly onClose: () => void
  readonly onSelect: (animalId: string) => void
  readonly open: boolean
  readonly returnFocusTo: React.RefObject<HTMLElement | null>
}

const focusableSelector = [
  'button:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function AnimalCollectionSheet({
  animals,
  currentAnimalId,
  loadingAnimalId,
  loadingPhase,
  loadingPercent,
  onClose,
  onSelect,
  open,
  returnFocusTo,
}: AnimalCollectionSheetProps) {
  const { messages } = useI18n()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const returnTarget = returnFocusTo.current
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }
      const controls = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
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
  }, [currentAnimalId, open, returnFocusTo])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="collection-layer">
      <div
        aria-hidden="true"
        className="collection-backdrop"
        onMouseDown={(event) => {
          if (event.currentTarget === event.target) {
            onClose()
          }
        }}
      />
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="collection-sheet"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div aria-hidden="true" className="collection-sheet__handle" />
        <header className="collection-sheet__header">
          <div>
            <p className="collection-sheet__eyebrow">
              <Footprints aria-hidden="true" size={17} strokeWidth={2.2} />
              {messages.collection.friends(animals.length)}
            </p>
            <h2 id={titleId}>{messages.collection.title}</h2>
            <p>{messages.collection.intro}</p>
          </div>
          <div className="collection-sheet__actions">
            <LanguageMenu />
            <IconButton
              hideTooltipOnFocus
              icon={X}
              label={messages.collection.close}
              onClick={onClose}
              ref={closeButtonRef}
            />
          </div>
        </header>
        <div className="collection-grid" role="list">
          {animals.map((animal, index) => {
            const current = animal.id === currentAnimalId
            const loading = animal.id === loadingAnimalId
            return (
              <div key={animal.id} role="listitem">
                <button
                  aria-current={current ? 'true' : undefined}
                  aria-label={messages.collection.cardLabel(animal.name, current)}
                  className="collection-card"
                  data-collection-animal-id={animal.id}
                  data-current={current}
                  data-loading={loading}
                  onClick={() => onSelect(animal.id)}
                  type="button"
                >
                  <span className="collection-card__number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="collection-card__image">
                    <img
                      alt=""
                      decoding="async"
                      loading="eager"
                      src={animal.thumbnail}
                    />
                  </span>
                  <span className="collection-card__copy">
                    <strong>{animal.name}</strong>
                    <small>{animal.classification}</small>
                  </span>
                  {current ? (
                    <span className="collection-card__state">
                      <Check aria-hidden="true" size={15} strokeWidth={2.5} />
                      {messages.collection.current}
                    </span>
                  ) : loading ? (
                    <span className="collection-card__state">
                      {loadingPhase === 'preparing'
                        ? messages.collection.opening
                        : loadingPercent === null
                          ? messages.collection.preparing
                          : messages.collection.downloading(loadingPercent)}
                    </span>
                  ) : null}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>,
    document.body,
  )
}
