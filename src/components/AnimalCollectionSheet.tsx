import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import { Check, Footprints, X } from 'lucide-react'
import { IconButton } from './IconButton'

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
              {animals.length === 9
                ? '九位史前朋友'
                : `${animals.length} 位史前朋友`}
            </p>
            <h2 id={titleId}>全馆图鉴</h2>
            <p>选一位朋友，马上前往它的 3D 展台。</p>
          </div>
          <IconButton
            hideTooltipOnFocus
            icon={X}
            label="关闭全馆图鉴"
            onClick={onClose}
            ref={closeButtonRef}
          />
        </header>
        <div className="collection-grid" role="list">
          {animals.map((animal, index) => {
            const current = animal.id === currentAnimalId
            const loading = animal.id === loadingAnimalId
            return (
              <div key={animal.id} role="listitem">
                <button
                  aria-current={current ? 'true' : undefined}
                  aria-label={`${current ? '当前展台，' : ''}前往${animal.name}展台`}
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
                      当前
                    </span>
                  ) : loading ? (
                    <span className="collection-card__state">
                      {loadingPhase === 'preparing'
                        ? '正在打开'
                        : loadingPercent === null
                          ? '准备中'
                          : `下载中 ${loadingPercent}%`}
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
