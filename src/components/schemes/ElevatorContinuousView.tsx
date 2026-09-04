/**
 * ElevatorContinuousView.tsx
 * Level 3: 空间连贯突破 —— 垂直生态升降梯 (Continuous Vertical Elevator)
 *
 * 核心设计哲学：
 * 1. 视窗定海神针 (Rock-Solid Fixed Stage)：外框高度恒定锁定，绝不因内容产生 1px 的高度晃动。
 * 2. 空间永续 (Spatial Permanence)：海陆空 24 只史前生物全部并存于地球垂直生态长卷中，零删卡、零卡片颠簸动效。
 * 3. 灵动生灵生态柱 (Living Creature Totem)：去字化、去 AI SaaS 药丸感，滑动信标随生境在翼龙、剑龙、鱼龙间优雅流转。
 * 4. 迟滞缓冲 (Hysteresis Tracking)：宽裕的视窗交叉判定，避免滑动几像素过早切出生境。
 * 5. 隐形轻质滚动条 (Transient Scrollbar)：接入博物馆统一的平滑浮现与淡出滚动指示。
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type UIEvent,
} from 'react'
import type { CollectionAnimal } from '../AnimalCollectionSheet'
import type { Habitat } from '../../content/types'
import { LivingCreatureBeacon } from './LivingCreatureBeacon'
import { useTransientScrollbar } from '../useTransientScrollbar'
import { TransientScrollbar } from '../TransientScrollbar'

export interface ElevatorContinuousViewProps {
  readonly animals: readonly CollectionAnimal[]
  readonly currentAnimalId?: string | null
  readonly renderCard: (animal: CollectionAnimal, index?: number) => JSX.Element
  readonly onHabitatInViewChange?: (habitat: Habitat) => void
}

interface ElevationStation {
  readonly id: Habitat
  readonly sectionId: string
  readonly nameZh: string
  readonly nameEn: string
  readonly glyph: string
}

const STATIONS: readonly ElevationStation[] = [
  {
    id: 'air',
    sectionId: 'elevator-section-air',
    nameZh: '苍穹',
    nameEn: 'Sky',
    glyph: '🪶',
  },
  {
    id: 'land',
    sectionId: 'elevator-section-land',
    nameZh: '陆表',
    nameEn: 'Land',
    glyph: '🌿',
  },
  {
    id: 'water',
    sectionId: 'elevator-section-water',
    nameZh: '深海',
    nameEn: 'Sea',
    glyph: '🌊',
  },
]

export function ElevatorContinuousView({
  animals,
  currentAnimalId,
  renderCard,
  onHabitatInViewChange,
}: ElevatorContinuousViewProps) {
  // Find current animal's habitat for initial intelligent location
  const currentAnimal = useMemo(
    () => (currentAnimalId ? animals.find((a) => a.id === currentAnimalId) : null),
    [animals, currentAnimalId],
  )
  const initialHabitat: Habitat = currentAnimal?.habitat || 'air'

  const [activeStation, setActiveStation] = useState<Habitat>(initialHabitat)
  const isProgrammaticScrollRef = useRef(false)
  const hasAutoScrolledRef = useRef(false)

  // Transient scrollbar integration
  const {
    handleScroll: handleTransientScroll,
    isScrolling,
    metrics,
    scrollRef,
  } = useTransientScrollbar(true)

  // Group animals by continuous vertical ecology
  const airAnimals = useMemo(
    () => animals.filter((a) => a.habitat === 'air'),
    [animals],
  )
  const landAnimals = useMemo(
    () => animals.filter((a) => a.habitat === 'land'),
    [animals],
  )
  const waterAnimals = useMemo(
    () => animals.filter((a) => a.habitat === 'water'),
    [animals],
  )

  // Smooth camera elevator scroll to target elevation station
  const scrollToStation = useCallback(
    (stationId: Habitat) => {
      const station = STATIONS.find((s) => s.id === stationId)
      if (!station) return

      const container = scrollRef.current
      if (!container) return

      const targetEl = container.querySelector<HTMLElement>(`#${station.sectionId}`)
      if (!targetEl) return

      isProgrammaticScrollRef.current = true
      setActiveStation(stationId)
      onHabitatInViewChange?.(stationId)

      // Calculate relative offset within the scrollable container
      const containerTop = container.getBoundingClientRect().top
      const targetTop = targetEl.getBoundingClientRect().top
      const relativeTop = targetTop - containerTop + container.scrollTop - 8

      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          top: Math.max(0, relativeTop),
          behavior: 'smooth',
        })
      } else {
        container.scrollTop = Math.max(0, relativeTop)
      }

      // Reset programmatic flag after smooth animation
      setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 550)
    },
    [onHabitatInViewChange, scrollRef],
  )

  // Initial auto-scroll to current animal on mount
  useEffect(() => {
    if (hasAutoScrolledRef.current) return
    const container = scrollRef.current
    if (!container) return

    const station = STATIONS.find((s) => s.id === initialHabitat)
    if (!station) return

    const targetEl = container.querySelector<HTMLElement>(`#${station.sectionId}`)
    if (targetEl) {
      hasAutoScrolledRef.current = true
      setActiveStation(initialHabitat)
      onHabitatInViewChange?.(initialHabitat)

      const containerTop = container.getBoundingClientRect().top
      const targetTop = targetEl.getBoundingClientRect().top
      const relativeTop = targetTop - containerTop + container.scrollTop
      container.scrollTop = Math.max(0, relativeTop)
    }
  }, [initialHabitat, onHabitatInViewChange, scrollRef])

  // Scroll listener with hysteresis buffer: track active habitat without jitter
  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      handleTransientScroll(e)

      if (isProgrammaticScrollRef.current) return
      const container = scrollRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const vTop = containerRect.top
      const vBottom = containerRect.bottom
      const vHeight = containerRect.height

      // Measure visible overlap height of each section
      let dominantStation: Habitat = activeStation
      let maxOverlap = 0
      let currentActiveOverlap = 0

      for (const s of STATIONS) {
        const el = container.querySelector<HTMLElement>(`#${s.sectionId}`)
        if (!el) continue

        const rect = el.getBoundingClientRect()
        const overlapTop = Math.max(vTop, rect.top)
        const overlapBottom = Math.min(vBottom, rect.bottom)
        const visibleH = Math.max(0, overlapBottom - overlapTop)

        if (s.id === activeStation) {
          currentActiveOverlap = visibleH
        }

        if (visibleH > maxOverlap) {
          maxOverlap = visibleH
          dominantStation = s.id
        }
      }

      // Hysteresis threshold: if current active section still occupies >= 38% of viewport,
      // retain it to prevent premature flicking when slightly scrolling
      const currentActiveRatio = currentActiveOverlap / vHeight
      if (currentActiveRatio >= 0.38) {
        return
      }

      if (dominantStation !== activeStation) {
        setActiveStation(dominantStation)
        onHabitatInViewChange?.(dominantStation)
      }
    },
    [activeStation, handleTransientScroll, onHabitatInViewChange, scrollRef],
  )

  // Determine active index for beacon positioning (0: Air, 1: Land, 2: Water)
  const stationIndex = STATIONS.findIndex((s) => s.id === activeStation)

  return (
    <div className="elevator-layout">
      {/* 1. Continuous Vertical Strata Viewport with Transient Scrollbar */}
      <div className="elevator-viewport-wrapper">
        <div
          aria-label="史前地球垂直生态长卷"
          className="elevator-scrollable"
          onScroll={handleScroll}
          ref={scrollRef}
        >
          {/* +500m Sky Zone */}
          <section
            aria-labelledby="elevator-heading-air"
            className="elevator-zone elevator-zone--air"
            id="elevator-section-air"
          >
            <header className="elevator-zone__header">
              <div className="elevator-zone__badge">
                <span aria-hidden="true" className="elevator-zone__icon">🪶</span>
                <h3 id="elevator-heading-air">苍穹展区</h3>
              </div>
              <span className="elevator-zone__count">
                {airAnimals.length} 位天空飞客
              </span>
            </header>
            <div className="collection-grid" data-habitat="air" role="list">
              {airAnimals.map((animal, idx) => renderCard(animal, idx))}
            </div>
          </section>

          {/* Strata Horizon Divider: Sky to Earth */}
          <div aria-hidden="true" className="elevator-strata-divider elevator-strata-divider--air-land">
            <span className="elevator-strata-line" />
            <span className="elevator-strata-tag">地平线界线 · DATUM 0m</span>
            <span className="elevator-strata-line" />
          </div>

          {/* 0m Primeval Land Zone */}
          <section
            aria-labelledby="elevator-heading-land"
            className="elevator-zone elevator-zone--land"
            id="elevator-section-land"
          >
            <header className="elevator-zone__header">
              <div className="elevator-zone__badge">
                <span aria-hidden="true" className="elevator-zone__icon">🌿</span>
                <h3 id="elevator-heading-land">原始陆表</h3>
              </div>
              <span className="elevator-zone__count">
                {landAnimals.length} 位陆行恐龙与巨兽
              </span>
            </header>
            <div className="collection-grid" data-habitat="land" role="list">
              {landAnimals.map((animal, idx) => renderCard(animal, idx))}
            </div>
          </section>

          {/* Strata Horizon Divider: Land to Sea */}
          <div aria-hidden="true" className="elevator-strata-divider elevator-strata-divider--land-water">
            <span className="elevator-strata-line" />
            <span className="elevator-strata-tag">大陆架下潜界线 · SUB-SURFACE</span>
            <span className="elevator-strata-line" />
          </div>

          {/* -200m Abyss Ocean Zone */}
          <section
            aria-labelledby="elevator-heading-water"
            className="elevator-zone elevator-zone--water"
            id="elevator-section-water"
          >
            <header className="elevator-zone__header">
              <div className="elevator-zone__badge">
                <span aria-hidden="true" className="elevator-zone__icon">🌊</span>
                <h3 id="elevator-heading-water">远古深渊</h3>
              </div>
              <span className="elevator-zone__count">
                {waterAnimals.length} 位海怪与水生潜游
              </span>
            </header>
            <div className="collection-grid" data-habitat="water" role="list">
              {waterAnimals.map((animal, idx) => renderCard(animal, idx))}
            </div>
          </section>
        </div>

        {/* Elegant Transient Scrollbar (fades in on scroll, out when idle) */}
        <TransientScrollbar isScrolling={isScrolling} metrics={metrics} />
      </div>

      {/* 2. Kid-Friendly Living Creature Totem Guide (De-textified & Tactile) */}
      <aside
        aria-label="生态海拔升降梯操纵轨"
        className="elevator-totem-shaft"
      >
        <div className="elevator-totem-shaft__track">
          {/* Moving Living Creature Beacon */}
          <div
            className="elevator-totem-shaft__slider"
            style={{
              transform: `translateY(${Math.max(0, stationIndex) * 64}px)`,
            }}
          >
            <LivingCreatureBeacon currentHabitat={activeStation} />
          </div>

          {/* Habitat Waypoint Buttons */}
          <div className="elevator-totem-shaft__nodes">
            {STATIONS.map((station) => {
              const active = activeStation === station.id

              return (
                <button
                  aria-current={active ? 'true' : undefined}
                  aria-label={`前往${station.nameZh}展区`}
                  className="elevator-totem-shaft__node-btn"
                  data-active={active}
                  key={station.id}
                  onClick={() => scrollToStation(station.id)}
                  title={`${station.nameZh}生态展区`}
                  type="button"
                >
                  <span className="elevator-totem-shaft__node-glyph" aria-hidden="true">
                    {station.glyph}
                  </span>
                  <span className="elevator-totem-shaft__node-label">
                    {station.nameZh}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}
