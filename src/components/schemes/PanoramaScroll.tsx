/**
 * Direction B: 博物学家折叠全景卷轴 (Naturalist's Pocket Panorama)
 * ============================================================================
 * Design Philosophy & Physical Papercraft Engineering:
 * 1. Physical Metaphor: Continuous accordion-folded pocket panorama (Leporello folding book / 经折装)
 *    where habitats transition naturally from zenith to abyss:
 *    [FOLIO I · 全景 Compendium] -> [FOLIO II · 苍穹 Aerosphere] -> [FOLIO III · 陆表 Geosphere] -> [FOLIO IV · 深渊 Hydrosphere]
 * 2. Alternating Mountain (凸折) and Valley (凹折) paper creases create realistic physical relief,
 *    separating each habitat panel with glance-light highlights and trough shadows.
 * 3. Specimen Cabinet Feeling: When active, a fold physically unfolds forward out of the accordion plane
 *    with paper-spring physics, blooming its mineral wash (ochre, morning azure, forest moss, Prussian navy).
 * 4. Pure Inline SVG Woodcut Engravings: Handcrafted 19th-century lithographic copperplate hatching
 *    depicting an armillary compass star, soaring pterosaur airstreams, tree-fern geological strata,
 *    and abyssal oceanic wave swells with an ammonite spiral shell.
 * 5. Multi-terminal Ergonomics:
 *    - Desktop (>=1024px): Panoramic horizontal strip across the sheet.
 *    - Tablet (768px~1023px): Tactile, tap-responsive folded ribbon (touch target >= 48px).
 *    - Mobile (<768px): Fluid horizontal scrollable pocket panorama with smooth scroll-snap.
 * 6. Extreme Restraint: Zero generic SaaS subtitles or marketing noise. Authentic naturalist taxonomy.
 */

import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import '../../styles/schemes/panorama-scroll.css'

export type HabitatKind = 'all' | 'land' | 'air' | 'water'

export interface PanoramaScrollProps {
  readonly activeHabitat: 'all' | 'land' | 'air' | 'water'
  readonly onSelectHabitat: (habitat: 'all' | 'land' | 'air' | 'water') => void
  readonly counts: {
    readonly all: number
    readonly land: number
    readonly air: number
    readonly water: number
  }
  readonly className?: string
}

interface FoldConfig {
  readonly id: HabitatKind
  readonly folio: string
  readonly defaultTitleZh: string
  readonly defaultTitleEn: string
  readonly latin: string
  readonly defaultSubtitleZh: string
  readonly defaultSubtitleEn: string
  readonly creaseAfter?: 'mountain' | 'valley'
}

const FOLDS: readonly FoldConfig[] = [
  {
    id: 'all',
    folio: 'FOL. I',
    defaultTitleZh: '全景',
    defaultTitleEn: 'Compendium',
    latin: 'COMPENDIUM',
    defaultSubtitleZh: '全馆标本总览',
    defaultSubtitleEn: 'All Specimens',
    creaseAfter: 'mountain',
  },
  {
    id: 'air',
    folio: 'FOL. II',
    defaultTitleZh: '苍穹',
    defaultTitleEn: 'Aerosphere',
    latin: 'AEROSPHERE',
    defaultSubtitleZh: '天空与翼龙飞客',
    defaultSubtitleEn: 'Sky & Flyers',
    creaseAfter: 'valley',
  },
  {
    id: 'land',
    folio: 'FOL. III',
    defaultTitleZh: '陆表',
    defaultTitleEn: 'Geosphere',
    latin: 'GEOSPHERE',
    defaultSubtitleZh: '陆生恐龙与巨兽',
    defaultSubtitleEn: 'Land Giants',
    creaseAfter: 'mountain',
  },
  {
    id: 'water',
    folio: 'FOL. IV',
    defaultTitleZh: '深渊',
    defaultTitleEn: 'Hydrosphere',
    latin: 'HYDROSPHERE',
    defaultSubtitleZh: '海怪与远古潜游',
    defaultSubtitleEn: 'Deep Swimmers',
  },
]

const HABITAT_ORDER: readonly HabitatKind[] = ['all', 'air', 'land', 'water']

/* ==========================================================================
   Pure Inline SVG Woodcut Engravings (19th-century Lithographic Intaglio)
   ========================================================================== */

/**
 * FOLIO I: Naturalist's Armillary Compass Star & Compendium Seal
 */
function CompendiumEngraving() {
  return (
    <svg
      aria-hidden="true"
      className="panorama-fold__svg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 44 44"
    >
      {/* Outer concentric coordinate rings */}
      <circle
        cx="22"
        cy="22"
        r="19"
        strokeOpacity="0.6"
        strokeWidth="1.1"
      />
      <circle
        cx="22"
        cy="22"
        r="16.5"
        strokeDasharray="1.5 2"
        strokeOpacity="0.75"
        strokeWidth="0.8"
      />
      {/* Celestial armillary rings */}
      <ellipse
        cx="22"
        cy="22"
        rx="16.5"
        ry="5.5"
        strokeOpacity="0.45"
        strokeWidth="0.85"
      />
      <ellipse
        cx="22"
        cy="22"
        rx="6"
        ry="16.5"
        strokeOpacity="0.45"
        strokeWidth="0.85"
      />
      {/* 8-point exploration compass star with intaglio shaded facets */}
      {/* North */}
      <polygon
        fill="currentColor"
        fillOpacity="0.85"
        points="22,7 24,20 22,22"
        strokeWidth="0.5"
      />
      <polygon points="22,7 20,20 22,22" strokeWidth="0.7" />
      {/* South */}
      <polygon
        fill="currentColor"
        fillOpacity="0.85"
        points="22,37 20,24 22,22"
        strokeWidth="0.5"
      />
      <polygon points="22,37 24,24 22,22" strokeWidth="0.7" />
      {/* East */}
      <polygon
        fill="currentColor"
        fillOpacity="0.85"
        points="37,22 24,24 22,22"
        strokeWidth="0.5"
      />
      <polygon points="37,22 24,20 22,22" strokeWidth="0.7" />
      {/* West */}
      <polygon
        fill="currentColor"
        fillOpacity="0.85"
        points="7,22 20,20 22,22"
        strokeWidth="0.5"
      />
      <polygon points="7,22 20,24 22,22" strokeWidth="0.7" />
      {/* Diagonal facets: NE, NW, SE, SW */}
      <polygon
        fill="currentColor"
        fillOpacity="0.7"
        points="31,13 23,20 22,22"
        strokeWidth="0.5"
      />
      <polygon points="31,13 24,21 22,22" strokeWidth="0.6" />
      <polygon points="13,13 21,22 22,22" strokeWidth="0.6" />
      <polygon
        fill="currentColor"
        fillOpacity="0.7"
        points="13,13 20,21 22,22"
        strokeWidth="0.5"
      />
      <polygon
        fill="currentColor"
        fillOpacity="0.7"
        points="31,31 22,22 24,23"
        strokeWidth="0.5"
      />
      <polygon points="31,31 23,24 22,22" strokeWidth="0.6" />
      <polygon points="13,31 21,24 22,22" strokeWidth="0.6" />
      <polygon
        fill="currentColor"
        fillOpacity="0.7"
        points="13,31 22,23 22,22"
        strokeWidth="0.5"
      />
      {/* Central brass exploration pivot */}
      <circle cx="22" cy="22" fill="currentColor" r="2" strokeWidth="0.8" />
      <circle cx="22" cy="22" fill="#fffdf7" r="0.7" stroke="none" />
    </svg>
  )
}

/**
 * FOLIO II: Aerodynamic Airstreams & Soaring Pterosaur Wing
 */
function AerosphereEngraving() {
  return (
    <svg
      aria-hidden="true"
      className="panorama-fold__svg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 44 44"
    >
      {/* Thermal airstreams with woodcut velocity hatchings */}
      <path
        d="M 4,11 C 12,8 20,13 32,9 C 36,7.5 39,8 41,9.5"
        strokeOpacity="0.65"
        strokeWidth="1.2"
      />
      <path
        d="M 8,16 C 16,13 23,17 33,14 C 37,13 39,14 41,15"
        strokeDasharray="1 2"
        strokeOpacity="0.5"
        strokeWidth="0.8"
      />
      {/* Velocity ticks */}
      <line strokeOpacity="0.55" strokeWidth="0.8" x1="16" x2="17" y1="7" y2="10" />
      <line strokeOpacity="0.55" strokeWidth="0.8" x1="22" x2="23" y1="9" y2="12" />
      <line strokeOpacity="0.55" strokeWidth="0.8" x1="28" x2="29" y1="8" y2="11" />
      {/* Pterosaur soaring flight wing silhouette */}
      <path
        d="M 5,29 C 10,27 16,21 24,20 C 31,19 37,17 41,14 C 39,21 34,28 26,31 C 18,34 11,33 5,29 Z"
        fill="currentColor"
        fillOpacity="0.14"
        strokeWidth="1.3"
      />
      {/* Elongated leading flight finger */}
      <path
        d="M 5,29 C 10,27 16,21 24,20 C 31,19 37,17 41,14"
        strokeWidth="1.5"
      />
      {/* Wing membrane actinofibrils / structural tension striations */}
      <path
        d="M 14,24 C 14.5,27 14,30 13,32"
        strokeOpacity="0.65"
        strokeWidth="0.75"
      />
      <path
        d="M 19,22 C 20,25.5 20,28.5 19,32"
        strokeOpacity="0.65"
        strokeWidth="0.75"
      />
      <path
        d="M 24,20 C 26,23.5 26.5,27 25.5,31"
        strokeOpacity="0.65"
        strokeWidth="0.75"
      />
      <path
        d="M 30,19 C 32.5,22 33,25 31.5,28.5"
        strokeOpacity="0.65"
        strokeWidth="0.75"
      />
      <path
        d="M 35,17 C 37,19.5 37,22 36,25"
        strokeOpacity="0.65"
        strokeWidth="0.75"
      />
      {/* Trailing edge scallops */}
      <path
        d="M 5,29 C 7,31 9.5,32 12,32.5 C 15,33 18,33 21,32 C 25,30.5 29,28 32,25 C 36,22 39,18 41,14"
        strokeDasharray="2.5 1.5"
        strokeOpacity="0.6"
        strokeWidth="0.9"
      />
      {/* Low-altitude cloud wisps */}
      <path
        d="M 3,37 C 7,35 11,36 14,35 C 17,34 19,35 22,35.5"
        strokeOpacity="0.55"
        strokeWidth="0.9"
      />
      <path
        d="M 6,40 C 9,39 13,39.5 17,39"
        strokeDasharray="1 2"
        strokeOpacity="0.4"
        strokeWidth="0.6"
      />
    </svg>
  )
}

/**
 * FOLIO III: Primeval Tree Fern & Sedimentary Geological Strata
 */
function GeosphereEngraving() {
  return (
    <svg
      aria-hidden="true"
      className="panorama-fold__svg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 44 44"
    >
      {/* Bedrock geological strata layers */}
      <path d="M 4,40 Q 22,38 40,40" strokeOpacity="0.75" strokeWidth="1.2" />
      <path d="M 4,35 Q 22,37 40,34" strokeOpacity="0.6" strokeWidth="0.9" />
      <path d="M 4,31 Q 20,29 40,31" strokeOpacity="0.5" strokeWidth="0.75" />
      {/* Sedimentary rock cross-hatchings */}
      <line strokeOpacity="0.5" strokeWidth="0.65" x1="7" x2="10" y1="36" y2="39" />
      <line strokeOpacity="0.5" strokeWidth="0.65" x1="13" x2="16" y1="36" y2="39" />
      <line strokeOpacity="0.5" strokeWidth="0.65" x1="19" x2="22" y1="36" y2="39" />
      <line strokeOpacity="0.5" strokeWidth="0.65" x1="25" x2="28" y1="35" y2="39" />
      <line strokeOpacity="0.5" strokeWidth="0.65" x1="31" x2="34" y1="35" y2="38" />
      <line strokeOpacity="0.5" strokeWidth="0.65" x1="37" x2="39" y1="34" y2="37" />
      {/* Ancient Tree-Fern Frond (Cyatheales) */}
      <path
        d="M 14,35 C 15,25 21,14 31,8 C 33,6.5 35,6 36,7 C 37,8 36,10 34,11 C 32,11.5 30.5,10.5 31,9.5"
        strokeWidth="1.4"
      />
      {/* Unfurling spiral fiddlehead tip (crozier) */}
      <path
        d="M 33,8 C 34.5,6.5 37,7 36.5,9 C 36,10.5 34,10 34,8.5"
        strokeWidth="0.9"
      />
      {/* Alternate fern pinnae & leaflets */}
      <path d="M 15,27 C 10,26 8,28 7,30" strokeWidth="1.0" />
      <path
        d="M 11,26.5 C 9.5,28 8.5,29.5 8,30"
        strokeOpacity="0.6"
        strokeWidth="0.6"
      />
      <path d="M 17,25 C 22,23 25,25 27,27" strokeWidth="1.0" />
      <path
        d="M 21,24 C 23,25.5 24.5,26.5 25.5,27"
        strokeOpacity="0.6"
        strokeWidth="0.6"
      />
      <path d="M 18,21 C 13,19 11,21 10,23" strokeWidth="1.0" />
      <path
        d="M 14,20 C 12.5,21.5 11.5,22.5 11,23"
        strokeOpacity="0.6"
        strokeWidth="0.6"
      />
      <path d="M 20,19 C 25,17 28,19 30,20" strokeWidth="1.0" />
      <path
        d="M 24,18 C 26,19 27.5,19.8 28.5,20"
        strokeOpacity="0.6"
        strokeWidth="0.6"
      />
      <path d="M 22,15 C 17,14 16,15.5 15,17" strokeWidth="1.0" />
      <path d="M 24,14 C 28,12 31,13.5 32,15" strokeWidth="1.0" />
      <path d="M 26,11 C 23,10 22,11 21,12" strokeWidth="0.9" />
      <path d="M 28,10.5 C 31,9.5 33,10.5 34,11.5" strokeWidth="0.9" />
      {/* Fossilized leaf impression inside rock base */}
      <circle
        cx="9"
        cy="37.5"
        r="1.8"
        strokeDasharray="1 1"
        strokeOpacity="0.6"
        strokeWidth="0.7"
      />
    </svg>
  )
}

/**
 * FOLIO IV: Antique Ocean Swells, Abyssal Ripples & Ammonite Spiral
 */
function HydrosphereEngraving() {
  return (
    <svg
      aria-hidden="true"
      className="panorama-fold__svg"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 44 44"
    >
      {/* Rolling wave crests */}
      <path
        d="M 3,18 C 8,18 11,11 17,11 C 21,11 23,15 27,13 C 31,11 34,13 36,15 C 38,17 40,16 41,15"
        strokeWidth="1.3"
      />
      {/* Foam spray hooks */}
      <path
        d="M 17,11 C 18.5,12 18,14 16.5,13.5"
        strokeOpacity="0.7"
        strokeWidth="0.8"
      />
      <path
        d="M 27,13 C 28,14 27.8,15.5 26.5,15"
        strokeOpacity="0.7"
        strokeWidth="0.8"
      />
      {/* Secondary swell layer */}
      <path
        d="M 3,24 C 9,23 13,27 20,25 C 26,23 31,27 38,24 C 39.5,23.5 40.5,24 41,24.5"
        strokeOpacity="0.7"
        strokeWidth="1.0"
      />
      {/* Woodblock wave face shading lines */}
      <line strokeOpacity="0.55" strokeWidth="0.7" x1="11" x2="13" y1="16" y2="19" />
      <line strokeOpacity="0.55" strokeWidth="0.7" x1="14" x2="16" y1="15" y2="18" />
      <line strokeOpacity="0.55" strokeWidth="0.7" x1="22" x2="24" y1="15" y2="18" />
      <line strokeOpacity="0.55" strokeWidth="0.7" x1="32" x2="34" y1="15" y2="18" />
      {/* Deep abyssal current ripple lines */}
      <path
        d="M 5,30 C 12,31 18,29 25,30 C 31,31 36,30 40,29.5"
        strokeOpacity="0.6"
        strokeWidth="0.85"
      />
      <path
        d="M 4,35 C 10,34.5 15,36 21,35"
        strokeDasharray="1.5 2"
        strokeOpacity="0.45"
        strokeWidth="0.75"
      />
      <path
        d="M 24,39 C 30,38 35,39.5 40,38.5"
        strokeOpacity="0.45"
        strokeWidth="0.75"
      />
      {/* Ancient Ammonite spiral shell in the abyss */}
      <path
        d="M 14,40 C 9,40 5,36 5,31 C 5,26 9.5,22 15,22 C 20,22 23.5,25.5 23.5,30 C 23.5,33.5 21,36.5 17.5,36.5 C 14.5,36.5 12,34.5 12,32 C 12,29.8 13.8,28 16,28 C 17.8,28 19,29.2 19,30.8 C 19,32 18,32.8 17,32.8 C 16.2,32.8 15.5,32.2 15.5,31.5"
        strokeWidth="1.1"
      />
      {/* Septal suture ribs */}
      <line strokeOpacity="0.6" strokeWidth="0.7" x1="7" x2="10" y1="30" y2="30.5" />
      <line strokeOpacity="0.6" strokeWidth="0.7" x1="8" x2="11" y1="26" y2="27.5" />
      <line strokeOpacity="0.6" strokeWidth="0.7" x1="11" x2="13" y1="23" y2="25.5" />
      <line strokeOpacity="0.6" strokeWidth="0.7" x1="15" x2="16" y1="22.2" y2="25" />
      <line strokeOpacity="0.6" strokeWidth="0.7" x1="19" x2="18.5" y1="23.5" y2="26" />
      <line strokeOpacity="0.6" strokeWidth="0.7" x1="22" x2="20" y1="26.5" y2="28" />
      <line strokeOpacity="0.6" strokeWidth="0.7" x1="23" x2="20.5" y1="30.5" y2="31" />
      <line strokeOpacity="0.6" strokeWidth="0.7" x1="21" x2="19" y1="34.5" y2="33.5" />
      {/* Abyssal bioluminescent bubbles */}
      <circle cx="30" cy="35" r="1" strokeOpacity="0.5" strokeWidth="0.6" />
      <circle cx="35" cy="32" r="1.5" strokeOpacity="0.5" strokeWidth="0.6" />
    </svg>
  )
}

function renderFoldEngraving(habitat: HabitatKind) {
  switch (habitat) {
    case 'all':
      return <CompendiumEngraving />
    case 'air':
      return <AerosphereEngraving />
    case 'land':
      return <GeosphereEngraving />
    case 'water':
      return <HydrosphereEngraving />
  }
}

/* ==========================================================================
   Master Component: PanoramaScroll
   ========================================================================== */

export function PanoramaScroll({
  activeHabitat,
  onSelectHabitat,
  counts,
  className = '',
}: PanoramaScrollProps) {
  // Graceful i18n hook resolution (never crashes if rendered outside I18nProvider)
  let i18nContext: ReturnType<typeof useI18n> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    i18nContext = useI18n()
  } catch {
    // Graceful fallback for standalone component renders
  }

  const locale = i18nContext?.locale ?? 'zh-CN'
  const isEn = locale === 'en'
  const messages = i18nContext?.messages

  const foldButtonRefs = useRef<Record<HabitatKind, HTMLButtonElement | null>>({
    all: null,
    air: null,
    land: null,
    water: null,
  })

  // Keyboard arrow navigation between folds (Accessibility ARIA tablist contract)
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = HABITAT_ORDER.indexOf(activeHabitat)
      if (currentIndex === -1) return

      let targetIndex: number

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        targetIndex = (currentIndex + 1) % HABITAT_ORDER.length
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        targetIndex = (currentIndex - 1 + HABITAT_ORDER.length) % HABITAT_ORDER.length
      } else if (event.key === 'Home') {
        event.preventDefault()
        targetIndex = 0
      } else if (event.key === 'End') {
        event.preventDefault()
        targetIndex = HABITAT_ORDER.length - 1
      } else {
        return
      }

      const nextHabitat = HABITAT_ORDER[targetIndex]
      if (!nextHabitat) return

      onSelectHabitat(nextHabitat)
      foldButtonRefs.current[nextHabitat]?.focus()
    },
    [activeHabitat, onSelectHabitat],
  )

  // Mobile ergonomics: smooth scroll active fold into view upon selection
  useEffect(() => {
    const activeBtn = foldButtonRefs.current[activeHabitat]
    if (activeBtn && typeof window !== 'undefined') {
      const isReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      if (typeof activeBtn.scrollIntoView === 'function') {
        activeBtn.scrollIntoView({
          behavior: isReduced ? 'auto' : 'smooth',
          inline: 'center',
          block: 'nearest',
        })
      }
    }
  }, [activeHabitat])

  // Specimen labels & taxonomic copies
  const foldItems = useMemo(() => {
    return FOLDS.map((fold) => {
      const count = counts[fold.id] ?? 0
      let title = isEn ? fold.defaultTitleEn : fold.defaultTitleZh
      let subtitle = isEn ? fold.defaultSubtitleEn : fold.defaultSubtitleZh

      if (messages?.collection) {
        if (fold.id === 'all') {
          title = isEn ? 'Compendium' : '全景'
          subtitle = isEn ? 'All Specimens' : '全馆图鉴总览'
        } else if (fold.id === 'air') {
          title = isEn ? 'Aerosphere' : '苍穹'
          subtitle = isEn ? messages.collection.storyCardAirSubtitle : '天空与翼龙飞客'
        } else if (fold.id === 'land') {
          title = isEn ? 'Geosphere' : '陆表'
          subtitle = isEn ? messages.collection.storyCardLandSubtitle : '恐龙与陆生巨兽'
        } else if (fold.id === 'water') {
          title = isEn ? 'Hydrosphere' : '深渊'
          subtitle = isEn ? messages.collection.storyCardWaterSubtitle : '海怪与远古潜游'
        }
      }

      const countUnit = isEn ? (count === 1 ? 'item' : 'items') : '卷'

      return {
        ...fold,
        title,
        subtitle,
        count,
        countUnit,
      }
    })
  }, [counts, isEn, messages])

  return (
    <section
      aria-label={isEn ? "Naturalist's Pocket Panorama" : '博物学家折叠全景卷轴'}
      className={`panorama-scroll-root ${className}`.trim()}
    >
      <div
        aria-label={isEn ? 'Habitat Panorama Folds' : '生境探索折页'}
        className="panorama-ribbon"
        onKeyDown={handleKeyDown}
        role="tablist"
      >
        {/* Continuous paper mineral backdrop wash */}
        <div aria-hidden="true" className="panorama-ribbon__backdrop-wash" />

        {/* Top and bottom archival measurement alignment ticks */}
        <div aria-hidden="true" className="panorama-ribbon__ruler panorama-ribbon__ruler--top" />
        <div aria-hidden="true" className="panorama-ribbon__ruler panorama-ribbon__ruler--bottom" />

        {/* The 4 Connected Accordion Folds */}
        {foldItems.map((fold) => {
          const isActive = activeHabitat === fold.id

          return (
            <div className="panorama-fold-item" key={fold.id}>
              <button
                aria-controls={`panorama-panel-${fold.id}`}
                aria-selected={isActive}
                className="panorama-fold"
                data-active={isActive}
                data-habitat={fold.id}
                id={`panorama-tab-${fold.id}`}
                onClick={() => onSelectHabitat(fold.id)}
                ref={(el) => {
                  foldButtonRefs.current[fold.id] = el
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                {/* Woodcut Intaglio Engraving Specimen Well */}
                <div aria-hidden="true" className="panorama-fold__visual">
                  {renderFoldEngraving(fold.id)}
                </div>

                {/* Naturalist Archival Taxonomic Plaque */}
                <div className="panorama-fold__info">
                  <div className="panorama-fold__meta-row">
                    <span className="panorama-fold__folio" aria-hidden="true">
                      {fold.folio}
                    </span>
                    <span className="panorama-fold__latin" aria-hidden="true">
                      {fold.latin}
                    </span>
                  </div>

                  <div className="panorama-fold__title-row">
                    <strong className="panorama-fold__title">{fold.title}</strong>
                    <span
                      aria-label={`${fold.count} ${fold.countUnit}`}
                      className="panorama-fold__count-badge"
                    >
                      <span className="panorama-fold__count-num">{fold.count}</span>
                      <span className="panorama-fold__count-unit" aria-hidden="true">
                        {fold.countUnit}
                      </span>
                    </span>
                  </div>

                  <span className="panorama-fold__subtitle" title={fold.subtitle}>
                    {fold.subtitle}
                  </span>
                </div>

                {/* Active Gold Foil Specimen Clip */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="panorama-fold__active-clip"
                  />
                )}
              </button>

              {/* Physical Paper Crease between panels (Mountain or Valley fold) */}
              {fold.creaseAfter && (
                <div
                  aria-hidden="true"
                  className={`panorama-crease panorama-crease--${fold.creaseAfter}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
