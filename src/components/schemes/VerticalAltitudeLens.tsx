/**
 * Vertical Altitude/Depth Lens (生态纵深测深仪)
 * Direction A: Physical Vertical Altitude & Depth Exploration Gauge
 *
 * Physical Metaphor:
 * A precision natural history museum bathymeter / stratigraphic caliper.
 * Depicts Earth's vertical ecological stratification across 4 continuous altitude zones:
 *   +500m 苍穹 (Air / Flyers) - Soaring thermal drafts & wing aerodynamics
 *     0m 原始陆表 (Land / Terrestrial Giants) - Primeval datum horizon & tectonic strata
 *  -200m 远古深渊 (Water / Deep Swimmers) - Abyssal waves & bathymetric depth contours
 *      ⊙ 全景透镜 (All / Whole Exhibit) - Cartographic astrolabe & optical concentric loupe
 *
 * Aesthetic Standards:
 * - Pure lithographic woodcut/engraving glyphs drawn as inline SVGs (no Lucide icons).
 * - Multi-terminal ergonomics (Desktop precision gauge, iPad right-thumb comfort arc, Mobile compact edge).
 * - Restrained natural history palette (#1c382b deep moss, #fffdf7 warm cream paper, #c29b62 weathered brass).
 * - Full ARIA radiogroup accessibility and pointer scrub/drag interaction.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import '../../styles/schemes/vertical-lens.css'

export type HabitatType = 'all' | 'land' | 'air' | 'water'

export interface VerticalAltitudeLensProps {
  readonly activeHabitat: HabitatType
  readonly onSelectHabitat: (habitat: HabitatType) => void
  readonly counts: {
    readonly all: number
    readonly land: number
    readonly air: number
    readonly water: number
  }
  readonly className?: string
}

interface ZoneDefinition {
  readonly id: HabitatType
  readonly elevation: string
  readonly titleZh: string
  readonly titleEn: string
  readonly roleZh: (count: number) => string
  readonly roleEn: (count: number) => string
  readonly Glyph: () => JSX.Element
}

/* ==========================================================================
   Lithographic Woodcut / Engraving Glyphs (Pure Vector Inline SVGs)
   ========================================================================== */

/**
 * 上升流线 (Ascending Streamlines · 苍穹 · +500m)
 * Metaphor: High-altitude thermal drafts, soaring pterosaur wing arcs, and aerodynamic feather barbs.
 */
function GlyphAscendingStreamlines() {
  return (
    <svg
      aria-hidden="true"
      className="vertical-lens__glyph-svg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 32 32"
    >
      {/* Soaring arching pterosaur wing arc */}
      <path
        d="M 4 23 C 8 16 15 8 27 5 C 24 11 19 18 14 26"
        strokeWidth="1.6"
      />
      {/* Lithographic woodcut feather barbs */}
      <line strokeWidth="1.2" x1="10" x2="8" y1="17" y2="21" />
      <line strokeWidth="1.2" x1="14" x2="11.5" y1="13.5" y2="18.5" />
      <line strokeWidth="1.2" x1="18" x2="15.5" y1="10.5" y2="16" />
      <line strokeWidth="1.2" x1="22" x2="19.5" y1="8" y2="13.5" />
      <line strokeWidth="1.2" x1="25" x2="23" y1="6.5" y2="11" />
      {/* Thermodynamic ascending airstream wisps */}
      <path
        d="M 3 28 C 6 28 8 25 7 22 C 6 19 8.5 17 12 16.5"
        strokeDasharray="0.8 2.2"
        strokeWidth="1.2"
      />
      <path
        d="M 16 28 C 20 26 21 21 24 19 C 26 17 28 17.5 29 19"
        strokeWidth="1.3"
      />
      {/* Zenith altitude tick */}
      <line strokeWidth="1.1" x1="6" x2="6" y1="4" y2="8" />
      <line strokeWidth="1.1" x1="4" x2="8" y1="6" y2="6" />
    </svg>
  )
}

/**
 * 地层切线 (Stratigraphic Cross-Section · 原始陆表 · 0m)
 * Metaphor: Primeval 0m surface datum, sedimentary rock strata, and petrified ancient fern frond.
 */
function GlyphStratigraphicStrata() {
  return (
    <svg
      aria-hidden="true"
      className="vertical-lens__glyph-svg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 32 32"
    >
      {/* Primeval 0m Datum Horizon Line */}
      <line strokeWidth="1.8" x1="3" x2="29" y1="17" y2="17" />
      {/* Ancient petrified fern frond ascending above the horizon */}
      <path d="M 10 17 C 11 12 14 7 19 4" strokeWidth="1.5" />
      {/* Delicate fern pinnules */}
      <path d="M 11.5 14.5 C 8.5 14 6 15 5 15.5" strokeWidth="1.2" />
      <path d="M 12.5 13 C 15.5 11.5 18.5 12 20 12.5" strokeWidth="1.2" />
      <path d="M 14 10.5 C 11.5 9.5 9.5 10 8.5 10.5" strokeWidth="1.2" />
      <path d="M 15.5 8.5 C 18 7 20.5 7.5 22 8" strokeWidth="1.2" />
      <path d="M 17 6 C 15.5 4.5 14 5 13.5 5.5" strokeWidth="1.2" />
      {/* Sedimentary strata beneath 0m */}
      <line
        strokeDasharray="3 2"
        strokeWidth="1.2"
        x1="3"
        x2="29"
        y1="21.5"
        y2="21.5"
      />
      <line strokeWidth="1.5" x1="3" x2="29" y1="26" y2="26" />
      {/* Geological rock cleavage hatching */}
      <line strokeWidth="1.1" x1="6" x2="5" y1="18.5" y2="21.5" />
      <line strokeWidth="1.1" x1="12" x2="11" y1="18.5" y2="21.5" />
      <line strokeWidth="1.1" x1="19" x2="18" y1="18.5" y2="21.5" />
      <line strokeWidth="1.1" x1="25" x2="24" y1="18.5" y2="21.5" />
      <line strokeWidth="1.1" x1="9" x2="10" y1="22.5" y2="25.5" />
      <line strokeWidth="1.1" x1="16" x2="17" y1="22.5" y2="25.5" />
      <line strokeWidth="1.1" x1="23" x2="24" y1="22.5" y2="25.5" />
      {/* Primeval datum marker diamond */}
      <polygon
        fill="currentColor"
        points="27,15.5 28.5,17 27,18.5 25.5,17"
        strokeWidth="0"
      />
    </svg>
  )
}

/**
 * 古海浪纹 (Bathymetric Ocean Waves · 远古深渊 · -200m)
 * Metaphor: Archaic bathymetric ocean depth contours, curling woodblock wave crests, and sounding plumb-line.
 */
function GlyphBathymetricWaves() {
  return (
    <svg
      aria-hidden="true"
      className="vertical-lens__glyph-svg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 32 32"
    >
      {/* Bathymetric sounding line & lead weight */}
      <line
        strokeDasharray="1.5 1.5"
        strokeWidth="1.2"
        x1="16"
        x2="16"
        y1="2"
        y2="7.5"
      />
      <polygon
        fill="currentColor"
        points="14.5,7.5 17.5,7.5 16,10.5"
        strokeWidth="0"
      />
      {/* Primary curling sea wave crest */}
      <path
        d="M 3 13 C 6.5 13 8.5 10 11.5 10 C 14.5 10 16 14 19 14 C 22 14 24 9.5 27 9.5 C 28.5 9.5 29.5 10.5 30 11.5"
        strokeWidth="1.5"
      />
      {/* Secondary abyssal wave swell */}
      <path
        d="M 2 18 C 6 18 8 15 12.5 15 C 17 15 19 19 23.5 19 C 26.5 19 28.5 17 30 17"
        strokeWidth="1.3"
      />
      {/* Deep ocean pressure contour */}
      <path
        d="M 3 23 C 7.5 23 10.5 21 15.5 21 C 20.5 21 23.5 24 29 24"
        strokeDasharray="4 2"
        strokeWidth="1.4"
      />
      {/* Abyssal floor contour */}
      <path
        d="M 4 28 C 9 28 13.5 26.5 19 26.5 C 23.5 26.5 26.5 28 29 28"
        strokeWidth="1.5"
      />
      {/* Depth stipples */}
      <path
        d="M 8.5 13.5 C 9.5 12 10.5 11.5 11.5 11.5"
        strokeWidth="1.1"
      />
      <path
        d="M 22 12.5 C 23 11 24 10.5 25 10.5"
        strokeWidth="1.1"
      />
    </svg>
  )
}

/**
 * 全景同心透镜 (Panoramic Concentric Ocular Lens · ⊙ · 全景透镜)
 * Metaphor: Brass astronomical astrolabe, surveying reticle, and concentric optical loupe.
 */
function GlyphPanoramicOcular() {
  return (
    <svg
      aria-hidden="true"
      className="vertical-lens__glyph-svg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 32 32"
    >
      {/* Outer brass ocular bezel ring */}
      <circle cx="16" cy="16" r="13.5" strokeWidth="1.5" />
      {/* Inner optical lens frame ring */}
      <circle
        cx="16"
        cy="16"
        r="9"
        strokeDasharray="3 1.5"
        strokeWidth="1.2"
      />
      {/* Central optical aperture */}
      <circle cx="16" cy="16" r="3.2" strokeWidth="1.4" />
      <circle cx="16" cy="16" fill="currentColor" r="1.1" strokeWidth="0" />
      {/* Cardinal optical crosshairs */}
      <line strokeWidth="1.4" x1="16" x2="16" y1="2.5" y2="6.5" />
      <line strokeWidth="1.4" x1="16" x2="16" y1="25.5" y2="29.5" />
      <line strokeWidth="1.4" x1="2.5" x2="6.5" y1="16" y2="16" />
      <line strokeWidth="1.4" x1="25.5" x2="29.5" y1="16" y2="16" />
      {/* Astrolabe quadrant tick marks */}
      <line strokeWidth="1.2" x1="7" x2="8.8" y1="7" y2="8.8" />
      <line strokeWidth="1.2" x1="25" x2="23.2" y1="7" y2="8.8" />
      <line strokeWidth="1.2" x1="7" x2="8.8" y1="25" y2="23.2" />
      <line strokeWidth="1.2" x1="25" x2="23.2" y1="25" y2="23.2" />
      {/* Lithographic corner registration brackets */}
      <path d="M 2 5 L 2 2 L 5 2" strokeWidth="1.1" />
      <path d="M 30 5 L 30 2 L 27 2" strokeWidth="1.1" />
      <path d="M 2 27 L 2 30 L 5 30" strokeWidth="1.1" />
      <path d="M 30 27 L 30 30 L 27 30" strokeWidth="1.1" />
    </svg>
  )
}

/* ==========================================================================
   Zone Configuration (Ordered Along Continuous Physical Altitude Axis)
   ========================================================================== */

const ZONES: readonly ZoneDefinition[] = [
  {
    id: 'air',
    elevation: '+500m',
    titleZh: '苍穹',
    titleEn: 'Sky & Canopy',
    roleZh: (c) => `${c} 种飞客`,
    roleEn: (c) => `${c} Flyers`,
    Glyph: GlyphAscendingStreamlines,
  },
  {
    id: 'land',
    elevation: '0m',
    titleZh: '原始陆表',
    titleEn: 'Primeval Land',
    roleZh: (c) => `${c} 种巨兽`,
    roleEn: (c) => `${c} Giants`,
    Glyph: GlyphStratigraphicStrata,
  },
  {
    id: 'water',
    elevation: '-200m',
    titleZh: '远古深渊',
    titleEn: 'Ancient Abyss',
    roleZh: (c) => `${c} 种潜游者`,
    roleEn: (c) => `${c} Swimmers`,
    Glyph: GlyphBathymetricWaves,
  },
  {
    id: 'all',
    elevation: '⊙',
    titleZh: '全景透镜',
    titleEn: 'Panoramic Lens',
    roleZh: (c) => `${c} 种全馆一览`,
    roleEn: (c) => `${c} Whole Exhibit`,
    Glyph: GlyphPanoramicOcular,
  },
]

/* ==========================================================================
   Component Implementation
   ========================================================================== */

export function VerticalAltitudeLens({
  activeHabitat,
  onSelectHabitat,
  counts,
  className = '',
}: VerticalAltitudeLensProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stationsContainerRef = useRef<HTMLDivElement>(null)
  const stationRefs = useRef<Map<HabitatType, HTMLButtonElement>>(new Map())
  const [isDragging, setIsDragging] = useState(false)

  // Detect locale gracefully without hard dependency on context provider
  const isEnglish = useMemo(() => {
    if (typeof document === 'undefined') return false
    return (
      document.documentElement.lang === 'en' ||
      document.documentElement.dataset.locale === 'en'
    )
  }, [])

  // Precise Vernier cursor position updates
  const updateCursorPosition = useCallback(() => {
    const container = stationsContainerRef.current
    const activeBtn = stationRefs.current.get(activeHabitat)
    if (!container || !activeBtn) return

    const containerRect = container.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()

    const top = btnRect.top - containerRect.top
    const height = btnRect.height
    const left = btnRect.left - containerRect.left
    const width = btnRect.width

    container.style.setProperty('--cursor-top', `${Math.round(top)}px`)
    container.style.setProperty('--cursor-height', `${Math.round(height)}px`)
    container.style.setProperty('--cursor-left', `${Math.round(left)}px`)
    container.style.setProperty('--cursor-width', `${Math.round(width)}px`)
  }, [activeHabitat])

  useLayoutEffect(() => {
    updateCursorPosition()
  }, [updateCursorPosition])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => updateCursorPosition()
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [updateCursorPosition])

  // Map pointer client coordinates to closest altitude station
  const selectClosestStation = useCallback(
    (clientX: number, clientY: number) => {
      let closestId: HabitatType = activeHabitat
      let minDistance = Number.POSITIVE_INFINITY

      for (const zone of ZONES) {
        const btn = stationRefs.current.get(zone.id)
        if (!btn) continue
        const rect = btn.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        // Weight vertical distance higher for precision vertical rail scrubbing
        const dx = clientX - centerX
        const dy = clientY - centerY
        const distance = Math.hypot(dx, dy)

        if (distance < minDistance) {
          minDistance = distance
          closestId = zone.id
        }
      }

      if (closestId !== activeHabitat) {
        onSelectHabitat(closestId)
      }
    },
    [activeHabitat, onSelectHabitat],
  )

  // Fluid scrub gesture handling
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    setIsDragging(true)
    containerRef.current?.setPointerCapture(e.pointerId)
    selectClosestStation(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    selectClosestStation(e.clientX, e.clientY)
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false)
      if (containerRef.current?.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId)
      }
    }
  }

  // W3C ARIA Radiogroup keyboard ergonomics
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = ZONES.findIndex((z) => z.id === activeHabitat)
    if (currentIndex === -1) return

    let targetIndex: number

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        targetIndex = (currentIndex + 1) % ZONES.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        targetIndex = (currentIndex - 1 + ZONES.length) % ZONES.length
        break
      case 'Home':
        targetIndex = 0
        break
      case 'End':
        targetIndex = ZONES.length - 1
        break
      default:
        return
    }

    e.preventDefault()
    const targetZone = ZONES[targetIndex]
    if (targetZone) {
      onSelectHabitat(targetZone.id)
      const nextBtn = stationRefs.current.get(targetZone.id)
      nextBtn?.focus()
    }
  }

  return (
    <nav
      aria-label={
        isEnglish
          ? 'Prehistoric Altitude & Depth Lens'
          : '史前生态纵深测深仪（垂直高度与水深标尺）'
      }
      className={`vertical-lens ${className}`.trim()}
      data-active-habitat={activeHabitat}
      data-dragging={isDragging ? 'true' : 'false'}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={containerRef}
      role="radiogroup"
    >
      {/* Precision Instrument Header Plate */}
      <header className="vertical-lens__header">
        <div className="vertical-lens__header-meta">
          <span className="vertical-lens__instrument-label">
            {isEnglish ? 'Depth Gauge' : 'ALTITUDE / DEPTH'}
          </span>
          <span className="vertical-lens__instrument-title">
            {isEnglish ? 'Stratum Lens' : '生态纵深测深仪'}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="vertical-lens__rivet"
          title="Brass calibration finial"
        />
      </header>

      <div className="vertical-lens__body">
        {/* Physical Graduation Rail with Lithographic Caliper Ticks */}
        <div aria-hidden="true" className="vertical-lens__rail">
          <div className="vertical-lens__rail-track" />
          <div className="vertical-lens__ticks">
            <div className="vertical-lens__tick-group">
              <span className="vertical-lens__tick vertical-lens__tick--major" />
              <span className="vertical-lens__tick vertical-lens__tick--minor" />
              <span className="vertical-lens__tick vertical-lens__tick--medium" />
            </div>
            <div className="vertical-lens__tick-group">
              <span className="vertical-lens__tick vertical-lens__tick--minor" />
              <span className="vertical-lens__tick vertical-lens__tick--major" />
              <span className="vertical-lens__tick vertical-lens__tick--minor" />
            </div>
            <div className="vertical-lens__tick-group">
              <span className="vertical-lens__tick vertical-lens__tick--medium" />
              <span className="vertical-lens__tick vertical-lens__tick--minor" />
              <span className="vertical-lens__tick vertical-lens__tick--major" />
            </div>
            <div className="vertical-lens__tick-group">
              <span className="vertical-lens__tick vertical-lens__tick--minor" />
              <span className="vertical-lens__tick vertical-lens__tick--major" />
            </div>
          </div>
        </div>

        {/* Stations Container with Sliding Vernier Cursor */}
        <div
          className="vertical-lens__stations"
          ref={stationsContainerRef}
        >
          {/* Vernier Cursor with Hairline Index Pointer */}
          <div aria-hidden="true" className="vertical-lens__cursor">
            <div className="vertical-lens__cursor-notch" />
          </div>

          {/* Altitude Stations */}
          {ZONES.map((zone) => {
            const active = activeHabitat === zone.id
            const count = counts[zone.id]
            const title = isEnglish ? zone.titleEn : zone.titleZh
            const role = isEnglish ? zone.roleEn(count) : zone.roleZh(count)
            const GlyphComponent = zone.Glyph

            return (
              <button
                aria-checked={active}
                aria-label={`${zone.elevation} ${title}，${role}`}
                className="vertical-lens__station"
                key={zone.id}
                onClick={() => onSelectHabitat(zone.id)}
                onKeyDown={handleKeyDown}
                ref={(el) => {
                  if (el) {
                    stationRefs.current.set(zone.id, el)
                  } else {
                    stationRefs.current.delete(zone.id)
                  }
                }}
                role="radio"
                tabIndex={active ? 0 : -1}
                type="button"
              >
                {/* Woodcut Engraving Glyph Medallion */}
                <div aria-hidden="true" className="vertical-lens__glyph-plate">
                  <GlyphComponent />
                </div>

                {/* Altitude Metaphor and Specimen Count */}
                <div className="vertical-lens__station-meta">
                  <div className="vertical-lens__title-row">
                    <span className="vertical-lens__elevation">
                      {zone.elevation}
                    </span>
                    <strong className="vertical-lens__station-title">
                      {title}
                    </strong>
                  </div>
                  <div className="vertical-lens__count-row">
                    <span className="vertical-lens__count-badge">
                      {role}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lithographic Instrument Footer with Stratum Coordinates */}
      <footer aria-hidden="true" className="vertical-lens__footer">
        <div className="vertical-lens__footer-axis">
          <svg viewBox="0 0 10 10">
            <circle cx="5" cy="5" fill="#8c8270" r="2" />
            <line stroke="#8c8270" x1="5" x2="5" y1="0" y2="10" />
            <line stroke="#8c8270" x1="0" x2="10" y1="5" y2="5" />
          </svg>
          <span>DATUM 0m</span>
        </div>
        <span>PREHISTORIC BIOSPHERE</span>
      </footer>
    </nav>
  )
}
