/**
 * ElevatorContinuousView.tsx
 * Level 3: 空间连贯突破 —— 垂直生态升降梯 (Continuous Vertical Elevator)
 *
 * 核心设计哲学：
 * 1. 视窗定海神针 (Rock-Solid Fixed Stage)：外框高度恒定锁定，绝不因内容产生 1px 的高度晃动。
 * 2. 空间永续 (Spatial Permanence)：海陆空 24 只史前生物全部并存于地球垂直生态长卷中，绝不删减卡片。
 * 3. 镜头漫游 (Camera Gliding Travel)：切换不是数据过滤，而是驱动考察升降梯平滑升降穿梭。
 */

import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import type { CollectionAnimal } from '../AnimalCollectionSheet'
import type { Habitat } from '../../content/types'

export interface ElevatorContinuousViewProps {
  readonly animals: readonly CollectionAnimal[]
  readonly renderCard: (animal: CollectionAnimal, index?: number) => JSX.Element
  readonly onHabitatInViewChange?: (habitat: Habitat) => void
}

interface ElevationStation {
  readonly id: Habitat
  readonly sectionId: string
  readonly altitude: string
  readonly titleZh: string
  readonly titleEn: string
  readonly roleZh: (count: number) => string
  readonly roleEn: (count: number) => string
  readonly glyph: string
}

const STATIONS: readonly ElevationStation[] = [
  {
    id: 'air',
    sectionId: 'elevator-section-air',
    altitude: '+500m',
    titleZh: '苍穹展区',
    titleEn: 'Sky & Canopy',
    roleZh: (c) => `${c} 种飞客`,
    roleEn: (c) => `${c} Flyers`,
    glyph: '🪶',
  },
  {
    id: 'land',
    sectionId: 'elevator-section-land',
    altitude: '0m',
    titleZh: '原始陆表',
    titleEn: 'Primeval Land',
    roleZh: (c) => `${c} 种巨兽`,
    roleEn: (c) => `${c} Giants`,
    glyph: '🌿',
  },
  {
    id: 'water',
    sectionId: 'elevator-section-water',
    altitude: '-200m',
    titleZh: '远古深渊',
    titleEn: 'Ancient Abyss',
    roleZh: (c) => `${c} 种潜游`,
    roleEn: (c) => `${c} Swimmers`,
    glyph: '🌊',
  },
]

export function ElevatorContinuousView({
  animals,
  renderCard,
  onHabitatInViewChange,
}: ElevatorContinuousViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeStation, setActiveStation] = useState<Habitat>('air')
  const isProgrammaticScrollRef = useRef(false)

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

  const counts: Record<Habitat, number> = useMemo(
    () => ({
      air: airAnimals.length,
      land: landAnimals.length,
      water: waterAnimals.length,
    }),
    [airAnimals.length, landAnimals.length, waterAnimals.length],
  )

  // Smooth camera elevator scroll to target elevation station
  const scrollToStation = useCallback(
    (stationId: Habitat) => {
      const station = STATIONS.find((s) => s.id === stationId)
      if (!station) return

      const container = scrollContainerRef.current
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

      container.scrollTo({
        top: Math.max(0, relativeTop),
        behavior: 'smooth',
      })

      // Reset programmatic flag after smooth animation
      setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 550)
    },
    [onHabitatInViewChange],
  )

  // Intersection Observer / Scroll listener to track active altitude station while freely roaming
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return

      const containerRect = container.getBoundingClientRect()
      const centerY = containerRect.top + containerRect.height * 0.35

      let closestStation: Habitat = 'air'
      let minDistance = Number.POSITIVE_INFINITY

      for (const s of STATIONS) {
        const el = container.querySelector<HTMLElement>(`#${s.sectionId}`)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const dist = Math.abs(rect.top - centerY)
        if (dist < minDistance) {
          minDistance = dist
          closestStation = s.id
        }
      }

      if (closestStation !== activeStation) {
        setActiveStation(closestStation)
        onHabitatInViewChange?.(closestStation)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [activeStation, onHabitatInViewChange])

  return (
    <div className="elevator-layout">
      {/* 1. Continuous Vertical Strata Viewport */}
      <div
        aria-label="史前地球垂直生态长卷"
        className="elevator-scrollable"
        ref={scrollContainerRef}
      >
        {/* +500m Sky Zone */}
        <section
          aria-labelledby="elevator-heading-air"
          className="elevator-zone elevator-zone--air"
          id="elevator-section-air"
        >
          <header className="elevator-zone__header">
            <div className="elevator-zone__badge">
              <span aria-hidden="true">🪶</span>
              <span className="elevator-zone__elevation">+500m</span>
              <h3 id="elevator-heading-air">苍穹展区 · 天空飞客</h3>
            </div>
            <span className="elevator-zone__count">
              共 {airAnimals.length} 位翼龙与羽翼探索者
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
              <span aria-hidden="true">🌿</span>
              <span className="elevator-zone__elevation">0m</span>
              <h3 id="elevator-heading-land">原始陆表 · 史前巨兽</h3>
            </div>
            <span className="elevator-zone__count">
              共 {landAnimals.length} 位陆行恐龙与巨兽
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
              <span aria-hidden="true">🌊</span>
              <span className="elevator-zone__elevation">-200m</span>
              <h3 id="elevator-heading-water">远古深渊 · 沧海潜游</h3>
            </div>
            <span className="elevator-zone__count">
              共 {waterAnimals.length} 位海怪与远古巨潜
            </span>
          </header>
          <div className="collection-grid" data-habitat="water" role="list">
            {waterAnimals.map((animal, idx) => renderCard(animal, idx))}
          </div>
        </section>
      </div>

      {/* 2. Precision Elevation Altitude Elevator Control Rail */}
      <aside
        aria-label="生态海拔升降梯操纵轨"
        className="elevator-console"
      >
        <div className="elevator-console__track">
          <div
            aria-hidden="true"
            className="elevator-console__indicator"
            data-active={activeStation}
          />
          {STATIONS.map((station) => {
            const active = activeStation === station.id
            const count = counts[station.id]

            return (
              <button
                aria-current={active ? 'true' : undefined}
                className="elevator-console__btn"
                data-active={active}
                key={station.id}
                onClick={() => scrollToStation(station.id)}
                type="button"
              >
                <div className="elevator-console__btn-glyph" aria-hidden="true">
                  {station.glyph}
                </div>
                <div className="elevator-console__btn-meta">
                  <span className="elevator-console__altitude">
                    {station.altitude}
                  </span>
                  <strong className="elevator-console__title">
                    {station.titleZh}
                  </strong>
                  <small className="elevator-console__count">
                    {count} 种
                  </small>
                </div>
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
