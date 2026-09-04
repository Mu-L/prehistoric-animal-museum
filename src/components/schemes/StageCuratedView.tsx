/**
 * StageCuratedView.tsx
 * Level 3: 空间连贯突破 —— 固定舞台流光漫幕 (Fixed Pedestal Stage)
 *
 * 核心设计哲学：
 * 1. 视窗定海神针 (Invariant Viewport)：无论展出 5 只还是 24 只，舞台面积绝对恒定，绝不随内容高度抽搐。
 * 2. 空灵策展留白 (Curated Negative Space)：5 只深海或天空生物居中陈列，周围尽显生境光影与意境留白。
 * 3. 舞台换幕交融 (Theatrical Cross-Dissolve)：生境切换如大剧场换幕，旧景渐隐，新幕平滑漫入。
 */

import { useMemo, type JSX } from 'react'
import type { CollectionAnimal, HabitatFilter } from '../AnimalCollectionSheet'
import { useI18n } from '../../i18n/I18nProvider'

export interface StageCuratedViewProps {
  readonly animals: readonly CollectionAnimal[]
  readonly activeHabitat: HabitatFilter
  readonly onSelectHabitat: (habitat: HabitatFilter) => void
  readonly renderCard: (animal: CollectionAnimal, index?: number) => JSX.Element
}

interface StageSegment {
  readonly id: HabitatFilter
  readonly label: string
  readonly glyph: string
  readonly count: number
}

export function StageCuratedView({
  animals,
  activeHabitat,
  onSelectHabitat,
  renderCard,
}: StageCuratedViewProps) {
  const { messages } = useI18n()

  const habitatCounts = useMemo(() => {
    const counts = { all: animals.length, land: 0, air: 0, water: 0 }
    for (const a of animals) {
      if (a.habitat in counts) {
        counts[a.habitat]++
      }
    }
    return counts
  }, [animals])

  const segments: readonly StageSegment[] = useMemo(
    () => [
      {
        id: 'all',
        label: messages.collection.all,
        glyph: '🏛️',
        count: habitatCounts.all,
      },
      {
        id: 'air',
        label: messages.collection.habitatAir,
        glyph: '🪶',
        count: habitatCounts.air,
      },
      {
        id: 'land',
        label: messages.collection.habitatLand,
        glyph: '🌿',
        count: habitatCounts.land,
      },
      {
        id: 'water',
        label: messages.collection.habitatWater,
        glyph: '🌊',
        count: habitatCounts.water,
      },
    ],
    [habitatCounts, messages],
  )

  const displayedAnimals = useMemo(() => {
    if (activeHabitat === 'all') return animals
    return animals.filter((a) => a.habitat === activeHabitat)
  }, [activeHabitat, animals])

  const isSparse = displayedAnimals.length <= 6

  return (
    <div className="stage-curated-layout">
      {/* 1. Minimalist Architectural Stage Horizon Bar */}
      <nav aria-label="展厅生境调度" className="stage-horizon-nav" role="tablist">
        <div className="stage-horizon-track">
          {segments.map((seg) => {
            const active = activeHabitat === seg.id
            return (
              <button
                aria-selected={active}
                className="stage-horizon-btn"
                data-active={active}
                key={seg.id}
                onClick={() => onSelectHabitat(seg.id)}
                role="tab"
                type="button"
              >
                <span className="stage-horizon-btn__glyph" aria-hidden="true">
                  {seg.glyph}
                </span>
                <span className="stage-horizon-btn__label">{seg.label}</span>
                <span className="stage-horizon-btn__count">({seg.count})</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* 2. Invariant Pedestal Stage Canvas (Height Never Resizes) */}
      <div
        aria-label="远古生态视窗展台"
        className="stage-canvas-viewport"
        data-habitat={activeHabitat}
        data-sparse={isSparse ? 'true' : 'false'}
      >
        <div
          className={`collection-grid stage-grid ${isSparse ? 'stage-grid--sparse' : ''}`.trim()}
          data-habitat={activeHabitat}
          key={`stage-${activeHabitat}`}
          role="list"
        >
          {displayedAnimals.map((animal, idx) => renderCard(animal, idx))}
        </div>
      </div>
    </div>
  )
}
