import { createPortal } from 'react-dom'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Feather,
  Footprints,
  Layers,
  Trees,
  Waves,
  X,
} from 'lucide-react'
import type { Habitat } from '../content/types'
import { useI18n } from '../i18n/I18nProvider'
import { IconButton } from './IconButton'
import { LanguageMenu } from './LanguageMenu'
import { VerticalAltitudeLens } from './schemes/VerticalAltitudeLens'
import { PanoramaScroll } from './schemes/PanoramaScroll'
import { ElevatorContinuousView } from './schemes/ElevatorContinuousView'
import { StageCuratedView } from './schemes/StageCuratedView'

export type HabitatFilter = 'all' | Habitat
export type CollectionUxMode =
  | 'elevator'
  | 'stage'
  | 'lens'
  | 'panorama'
  | 'tabs'
  | 'grouped'
  | 'cards'
  | 'classic'

export interface CollectionAnimal {
  readonly classification: string
  readonly id: string
  readonly name: string
  readonly thumbnail: string
  readonly habitat: Habitat
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
  readonly uxMode?: CollectionUxMode
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
  uxMode = 'elevator',
}: AnimalCollectionSheetProps) {
  const { messages } = useI18n()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const contentBodyRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const currentAnimalHabitat = useMemo(() => {
    if (!currentAnimalId) return null
    return animals.find((a) => a.id === currentAnimalId)?.habitat || null
  }, [animals, currentAnimalId])

  const [activeHabitat, setActiveHabitat] = useState<HabitatFilter>(() => {
    if (uxMode === 'elevator' && currentAnimalHabitat) {
      return currentAnimalHabitat
    }
    return 'all'
  })
  const lastHeightRef = useRef<number | null>(null)

  useEffect(() => {
    if (open && uxMode === 'elevator' && currentAnimalHabitat) {
      setActiveHabitat(currentAnimalHabitat)
    }
  }, [open, uxMode, currentAnimalHabitat])

  const handleHabitatSelect = (habitat: HabitatFilter) => {
    if (habitat === activeHabitat) return
    const sheet = dialogRef.current
    if (sheet) {
      lastHeightRef.current = sheet.getBoundingClientRect().height
    }
    setActiveHabitat(habitat)
  }

  useLayoutEffect(() => {
    const sheet = dialogRef.current
    const startHeight = lastHeightRef.current
    lastHeightRef.current = null

    if (
      !sheet ||
      startHeight === null ||
      typeof window === 'undefined' ||
      uxMode === 'elevator' ||
      uxMode === 'stage' ||
      uxMode === 'lens' ||
      uxMode === 'panorama'
    ) {
      return
    }

    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches
    if (prefersReducedMotion) return

    // Set to start height with no animation to freeze initial frame
    sheet.style.transition = 'none'
    sheet.style.height = `${startHeight}px`

    // Measure target natural height
    sheet.style.height = 'auto'
    const targetHeight = sheet.getBoundingClientRect().height
    sheet.style.height = `${startHeight}px`

    if (
      startHeight <= 0 ||
      targetHeight <= 0 ||
      Math.abs(targetHeight - startHeight) < 2
    ) {
      sheet.style.height = ''
      sheet.style.transition = ''
      return
    }

    let frameId2: number
    const frameId1 = requestAnimationFrame(() => {
      frameId2 = requestAnimationFrame(() => {
        sheet.style.transition = 'height 280ms cubic-bezier(0.16, 1, 0.3, 1)'
        sheet.style.height = `${targetHeight}px`

        const onEnd = (event: TransitionEvent) => {
          if (event.target === sheet && event.propertyName === 'height') {
            sheet.style.height = ''
            sheet.style.transition = ''
            sheet.removeEventListener('transitionend', onEnd)
          }
        }
        sheet.addEventListener('transitionend', onEnd)
      })
    })

    return () => {
      cancelAnimationFrame(frameId1)
      cancelAnimationFrame(frameId2)
      sheet.style.height = ''
      sheet.style.transition = ''
    }
  }, [activeHabitat])

  const habitatCounts = useMemo(() => {
    const counts = { all: animals.length, land: 0, air: 0, water: 0 }
    for (const animal of animals) {
      if (animal.habitat in counts) {
        counts[animal.habitat]++
      }
    }
    return counts
  }, [animals])

  const animalNumberMap = useMemo(() => {
    const map = new Map<string, string>()
    animals.forEach((animal, index) => {
      map.set(animal.id, String(index + 1).padStart(2, '0'))
    })
    return map
  }, [animals])

  const habitatTabs = useMemo(
    () => [
      {
        id: 'all' as const,
        label: messages.collection.all,
        icon: Layers,
        count: habitatCounts.all,
      },
      {
        id: 'land' as const,
        label: messages.collection.habitatLand,
        icon: Trees,
        count: habitatCounts.land,
      },
      {
        id: 'air' as const,
        label: messages.collection.habitatAir,
        icon: Feather,
        count: habitatCounts.air,
      },
      {
        id: 'water' as const,
        label: messages.collection.habitatWater,
        icon: Waves,
        count: habitatCounts.water,
      },
    ],
    [habitatCounts, messages],
  )

  const pavilions = useMemo(
    () => [
      {
        habitat: 'land',
        id: 'pavilion-land',
        label: messages.collection.pavilionLand,
        icon: Trees,
        animals: animals.filter((a) => a.habitat === 'land'),
      },
      {
        habitat: 'air',
        id: 'pavilion-air',
        label: messages.collection.pavilionAir,
        icon: Feather,
        animals: animals.filter((a) => a.habitat === 'air'),
      },
      {
        habitat: 'water',
        id: 'pavilion-water',
        label: messages.collection.pavilionWater,
        icon: Waves,
        animals: animals.filter((a) => a.habitat === 'water'),
      },
    ],
    [animals, messages],
  )

  const displayedAnimals = useMemo(() => {
    if (
      (uxMode !== 'tabs' &&
        uxMode !== 'cards' &&
        uxMode !== 'lens' &&
        uxMode !== 'panorama') ||
      activeHabitat === 'all'
    ) {
      return animals
    }
    return animals.filter((a) => a.habitat === activeHabitat)
  }, [activeHabitat, animals, uxMode])

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

  const renderCard = (animal: CollectionAnimal, index = 0) => {
    const current = animal.id === currentAnimalId
    const loading = animal.id === loadingAnimalId
    const number = animalNumberMap.get(animal.id) ?? ''

    return (
      <div
        key={animal.id}
        role="listitem"
        style={{ '--card-index': Math.min(index, 11) } as React.CSSProperties}
      >
        <button
          aria-current={current ? 'true' : undefined}
          aria-label={messages.collection.cardLabel(animal.name, current)}
          className="collection-card"
          data-collection-animal-id={animal.id}
          data-current={current}
          data-habitat={animal.habitat}
          data-loading={loading}
          onClick={() => onSelect(animal.id)}
          type="button"
        >
          <span className="collection-card__number" aria-hidden="true">
            {number}
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
  }

  const scrollToPavilion = (pavilionId: string) => {
    const target = contentBodyRef.current?.querySelector(`#${pavilionId}`)
    if (target && target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
        data-habitat={activeHabitat}
        data-ux-mode={uxMode}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div aria-hidden="true" className="collection-atmosphere">
          <div className="collection-atmosphere__sky-rays" />
          <div className="collection-atmosphere__caustics" />
          <div className="collection-atmosphere__strata" />
          <div className="collection-atmosphere__vignette" />
        </div>
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

        {uxMode === 'tabs' && (
          <div
            aria-label={messages.collection.title}
            className="collection-habitat-tabs"
            role="tablist"
          >
            {habitatTabs.map((tab) => {
              const active = activeHabitat === tab.id
              const IconComponent = tab.icon
              return (
                <button
                  aria-selected={active}
                  className="collection-habitat-pill"
                  data-active={active}
                  key={tab.id}
                  onClick={() => handleHabitatSelect(tab.id)}
                  role="tab"
                  type="button"
                >
                  <IconComponent
                    aria-hidden="true"
                    className="collection-habitat-pill__icon"
                    size={15}
                    strokeWidth={2.2}
                  />
                  <span>{tab.label}</span>
                  <span className="collection-habitat-pill__count">
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {uxMode === 'cards' && (
          <div
            aria-label="生境探索"
            className="collection-story-cards"
            role="tablist"
          >
            <button
              aria-selected={activeHabitat === 'all'}
              className="collection-story-card collection-story-card--all"
              data-active={activeHabitat === 'all'}
              onClick={() => handleHabitatSelect('all')}
              role="tab"
              type="button"
            >
              <div className="collection-story-card__visual">
                <Layers aria-hidden="true" size={20} strokeWidth={2.3} />
              </div>
              <div className="collection-story-card__info">
                <strong>{messages.collection.storyCardAll}</strong>
                <span className="collection-story-card__count">
                  {messages.collection.habitatCount(habitatCounts.all)}
                </span>
              </div>
            </button>

            <button
              aria-selected={activeHabitat === 'land'}
              className="collection-story-card collection-story-card--land"
              data-active={activeHabitat === 'land'}
              onClick={() => handleHabitatSelect('land')}
              role="tab"
              type="button"
            >
              <div className="collection-story-card__visual">
                <Trees aria-hidden="true" size={22} strokeWidth={2.3} />
              </div>
              <div className="collection-story-card__info">
                <strong>{messages.collection.storyCardLandTitle}</strong>
                <small>{messages.collection.storyCardLandSubtitle}</small>
                <span className="collection-story-card__count">
                  {messages.collection.habitatCount(habitatCounts.land)}
                </span>
              </div>
            </button>

            <button
              aria-selected={activeHabitat === 'air'}
              className="collection-story-card collection-story-card--air"
              data-active={activeHabitat === 'air'}
              onClick={() => handleHabitatSelect('air')}
              role="tab"
              type="button"
            >
              <div className="collection-story-card__visual">
                <Feather aria-hidden="true" size={22} strokeWidth={2.3} />
              </div>
              <div className="collection-story-card__info">
                <strong>{messages.collection.storyCardAirTitle}</strong>
                <small>{messages.collection.storyCardAirSubtitle}</small>
                <span className="collection-story-card__count">
                  {messages.collection.habitatCount(habitatCounts.air)}
                </span>
              </div>
            </button>

            <button
              aria-selected={activeHabitat === 'water'}
              className="collection-story-card collection-story-card--water"
              data-active={activeHabitat === 'water'}
              onClick={() => handleHabitatSelect('water')}
              role="tab"
              type="button"
            >
              <div className="collection-story-card__visual">
                <Waves aria-hidden="true" size={22} strokeWidth={2.3} />
              </div>
              <div className="collection-story-card__info">
                <strong>{messages.collection.storyCardWaterTitle}</strong>
                <small>{messages.collection.storyCardWaterSubtitle}</small>
                <span className="collection-story-card__count">
                  {messages.collection.habitatCount(habitatCounts.water)}
                </span>
              </div>
            </button>
          </div>
        )}

        {uxMode === 'grouped' && (
          <div className="collection-anchor-bar">
            <span className="collection-anchor-bar__label">
              {messages.collection.pavilionLand.slice(2)}：
            </span>
            {pavilions.map((pavilion) => {
              const IconComponent = pavilion.icon
              return (
                <button
                  className="collection-anchor-btn"
                  key={pavilion.id}
                  onClick={() => scrollToPavilion(pavilion.id)}
                  type="button"
                >
                  <IconComponent
                    aria-hidden="true"
                    size={14}
                    strokeWidth={2.2}
                  />
                  <span>{pavilion.label}</span>
                  <span className="collection-anchor-btn__count">
                    ({pavilion.animals.length})
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {uxMode === 'panorama' && (
          <PanoramaScroll
            activeHabitat={activeHabitat}
            counts={habitatCounts}
            onSelectHabitat={handleHabitatSelect}
          />
        )}

        {uxMode === 'elevator' ? (
          <ElevatorContinuousView
            animals={animals}
            currentAnimalId={currentAnimalId}
            onHabitatInViewChange={setActiveHabitat}
            renderCard={renderCard}
          />
        ) : uxMode === 'stage' ? (
          <StageCuratedView
            activeHabitat={activeHabitat}
            animals={animals}
            onSelectHabitat={handleHabitatSelect}
            renderCard={renderCard}
          />
        ) : (
          <div
            className="collection-sheet__scrollable"
            ref={contentBodyRef}
          >
          {uxMode === 'lens' ? (
            <div className="collection-lens-workspace">
              <div className="collection-lens-grid-area">
                <div
                  className="collection-grid"
                  data-habitat={activeHabitat}
                  data-ux-mode="lens"
                  key={`lens-${activeHabitat}`}
                  role="list"
                >
                  {displayedAnimals.map((animal, idx) =>
                    renderCard(animal, idx),
                  )}
                </div>
              </div>
              <aside
                aria-label="生态纵深测深仪"
                className="collection-lens-rail-area"
              >
                <VerticalAltitudeLens
                  activeHabitat={activeHabitat}
                  counts={habitatCounts}
                  onSelectHabitat={handleHabitatSelect}
                />
              </aside>
            </div>
          ) : uxMode === 'grouped' ? (
            <div className="collection-pavilions">
              {pavilions.map((pavilion) => {
                const IconComponent = pavilion.icon
                return (
                  <section
                    className="collection-pavilion-section"
                    id={pavilion.id}
                    key={pavilion.id}
                  >
                    <header className="collection-pavilion-header">
                      <div className="collection-pavilion-header__badge">
                        <IconComponent
                          aria-hidden="true"
                          size={17}
                          strokeWidth={2.4}
                        />
                        <h3>{pavilion.label}</h3>
                      </div>
                      <span className="collection-pavilion-header__summary">
                        {messages.collection.habitatCount(
                          pavilion.animals.length,
                        )}
                      </span>
                    </header>
                    <div className="collection-grid" role="list">
                      {pavilion.animals.map((animal, idx) =>
                        renderCard(animal, idx),
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : (
            <div
              className="collection-grid"
              data-habitat={activeHabitat}
              data-ux-mode={uxMode}
              key={`${uxMode}-${activeHabitat}`}
              role="list"
            >
              {displayedAnimals.map((animal, idx) => renderCard(animal, idx))}
            </div>
          )}
        </div>
      )}
      </section>
    </div>,
    document.body,
  )
}
