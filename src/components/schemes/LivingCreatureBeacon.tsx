/**
 * LivingCreatureBeacon.tsx
 * Level 3 空间连贯方案：灵动生态生灵信标 (Living Creature Beacon)
 *
 * 核心设计哲学：
 * 1. 拟生隐喻：用儿童一目了然的史前生物剪影（苍穹翼龙、大地剑龙、深渊鱼龙）替代枯燥的 SaaS 文字与冰冷参数。
 * 2. 流动演化：伴随生境切换，生灵在信标内产生流体姿态变化与环境微光（风羽/蕨叶/水纹）。
 * 3. 极简自然：摒弃 AI 式的“大圆角套小圆角药丸”，融入博物馆的暖纸与自然矿物色彩体系。
 */

import type { Habitat } from '../../content/types'

export interface LivingCreatureBeaconProps {
  readonly currentHabitat: Habitat
  readonly className?: string
}

export function LivingCreatureBeacon({
  currentHabitat,
  className = '',
}: LivingCreatureBeaconProps) {
  return (
    <div
      aria-label={`当前生态信标：${
        currentHabitat === 'air'
          ? '苍穹飞客（翼龙）'
          : currentHabitat === 'land'
            ? '原始陆兽（剑龙）'
            : '深海潜游（鱼龙）'
      }`}
      className={`living-creature-beacon ${className}`.trim()}
      data-habitat={currentHabitat}
    >
      <div className="living-creature-beacon__halo" aria-hidden="true" />
      <div className="living-creature-beacon__vessel">
        {/* 1. Air Habitat: Soaring Pteranodon with Wind Trails */}
        <div
          aria-hidden={currentHabitat !== 'air'}
          className="creature-figure creature-figure--air"
          data-active={currentHabitat === 'air'}
        >
          <svg
            className="creature-svg creature-svg--pterosaur"
            viewBox="0 0 64 64"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Wind breeze trail */}
            <path
              className="creature-air-wind"
              d="M6 24 C14 22, 22 25, 30 23"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.4"
            />
            <path
              className="creature-air-wind creature-air-wind--delay"
              d="M10 40 C18 38, 26 41, 34 39"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Pteranodon body & wings */}
            <path
              d="M56 16 C53 19, 47 21, 41 23 C35 24, 27 21, 14 13 C12 11, 8 10, 6 12 C5 14, 9 18, 14 24 C20 30, 27 34, 33 34 C35 34, 37 32, 38 30 L40 37 C41 40, 43 43, 46 45 C48 46, 50 45, 50 43 C49 39, 47 34, 46 31 C51 29, 58 24, 60 19 C61 17, 59 14, 56 16 Z"
            />
            {/* Head crest */}
            <path d="M46 22 C49 17, 53 13, 58 10 C56 14, 53 18, 50 21 Z" opacity="0.85" />
            {/* Eye point */}
            <circle cx="48" cy="23" r="1.5" fill="#fffdf7" />
          </svg>
        </div>

        {/* 2. Land Habitat: Walking Stegosaurus with Dorsal Plates */}
        <div
          aria-hidden={currentHabitat !== 'land'}
          className="creature-figure creature-figure--land"
          data-active={currentHabitat === 'land'}
        >
          <svg
            className="creature-svg creature-svg--stegosaurus"
            viewBox="0 0 64 64"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ground ripples / fern speckle */}
            <path
              d="M8 50 C18 49, 46 49, 56 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Dorsal Plates (dermal armor) */}
            <path
              d="M20 25 L23 16 L27 24 M27 23 L31 13 L36 22 M36 23 L41 15 L45 25 M15 28 L17 21 L20 27"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Stegosaurus stout body */}
            <ellipse cx="32" cy="34" rx="17" ry="11" />
            {/* Small head & neck */}
            <path
              d="M45 32 C48 31, 53 32, 57 34 C58 35, 57 38, 54 38 C50 38, 47 36, 44 36 Z"
            />
            <circle cx="53" cy="34" r="1.2" fill="#fffdf7" />
            {/* Sturdy legs */}
            <path
              d="M21 41 L20 48 M27 41 L27 48 M37 41 L37 48 M43 41 L44 48"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Tail & Thagomizer spikes */}
            <path
              d="M17 33 C12 34, 8 36, 6 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M8 35 L5 32 M8 38 L4 41"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 3. Water Habitat: Gliding Ichthyosaur with Marine Currents */}
        <div
          aria-hidden={currentHabitat !== 'water'}
          className="creature-figure creature-figure--water"
          data-active={currentHabitat === 'water'}
        >
          <svg
            className="creature-svg creature-svg--ichthyosaur"
            viewBox="0 0 64 64"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Water wake curves */}
            <path
              className="creature-water-wave"
              d="M6 46 C16 43, 26 49, 36 45 C46 41, 54 45, 58 43"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.35"
            />
            {/* Ichthyosaur streamlined body */}
            <path
              d="M58 28 C53 26, 47 24, 38 25 C28 26, 17 32, 10 33 C8 30, 6 25, 4 23 C5 28, 6 36, 5 41 C7 38, 9 35, 12 35 C18 35, 27 34, 38 32 C48 31, 54 30, 58 28 Z"
            />
            {/* Dorsal Fin */}
            <path d="M30 25 L34 16 L37 25 Z" />
            {/* Front flipper */}
            <path d="M39 32 L36 43 L42 34 Z" opacity="0.9" />
            {/* Rear flipper */}
            <path d="M22 34 L20 40 L24 35 Z" opacity="0.8" />
            {/* Eye point */}
            <circle cx="50" cy="27" r="1.4" fill="#fffdf7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
