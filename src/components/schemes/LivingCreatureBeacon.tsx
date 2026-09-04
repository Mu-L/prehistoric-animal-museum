/**
 * LivingCreatureBeacon.tsx
 * Level 3 空间连贯方案：灵动生态生灵信标 (Living Creature Beacon)
 *
 * 核心设计哲学：
 * 1. 拟生隐喻：用儿童一目了然的史前生物剪影（苍穹飞鸟、大地剑龙、深渊游鱼）替代枯燥的 SaaS 文字与冰冷参数。
 * 2. 流动演化：伴随生境切换，生灵在信标内产生流体姿态变化与环境微光（气流/大地/水纹）。
 * 3. 极简自然：融入博物馆暖纸质感与多语言无障碍标签。
 */

import type { Habitat } from '../../content/types'
import { useI18n } from '../../i18n/I18nProvider'

export interface LivingCreatureBeaconProps {
  readonly currentHabitat: Habitat
  readonly className?: string
}

export function LivingCreatureBeacon({
  currentHabitat,
  className = '',
}: LivingCreatureBeaconProps) {
  const { messages } = useI18n()

  const beaconLabel =
    currentHabitat === 'air'
      ? messages.collection.elevatorBeaconAir
      : currentHabitat === 'land'
        ? messages.collection.elevatorBeaconLand
        : messages.collection.elevatorBeaconWater

  return (
    <div
      aria-label={beaconLabel}
      className={`living-creature-beacon ${className}`.trim()}
      data-habitat={currentHabitat}
    >
      <div className="living-creature-beacon__halo" aria-hidden="true" />
      <div className="living-creature-beacon__vessel">
        {/* 1. Air Habitat: Soaring Bird / Pterosaur with unmistakable outstretched wings */}
        <div
          aria-hidden={currentHabitat !== 'air'}
          className="creature-figure creature-figure--air"
          data-active={currentHabitat === 'air'}
        >
          <svg
            className="creature-svg creature-svg--bird"
            viewBox="0 0 64 64"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Wind breeze trail */}
            <path
              className="creature-air-wind"
              d="M8 20 C18 17, 28 22, 38 19"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.4"
            />
            <path
              className="creature-air-wind creature-air-wind--delay"
              d="M12 44 C22 41, 32 46, 42 43"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Recognizable Soaring Bird Silhouette */}
            {/* Head & Beak pointing up-forward */}
            <path
              d="M32 12 C34 12, 37 14, 40 17 L48 18 C45 21, 41 22, 38 23 C37 25, 36 28, 35 32 C35 37, 36 43, 37 48 L32 54 L27 48 C28 43, 29 37, 29 32 C28 28, 27 25, 26 23 C23 22, 19 21, 16 18 L24 17 C27 14, 30 12, 32 12 Z"
            />
            {/* Left Outspread Wing with layered feathers */}
            <path
              d="M27 25 C20 19, 11 16, 5 18 C3 23, 7 30, 15 34 C20 36, 25 36, 28 34 Z"
            />
            <path
              d="M6 19 C10 24, 15 28, 22 30"
              fill="none"
              stroke="#fffdf7"
              strokeWidth="1.2"
              opacity="0.4"
            />
            {/* Right Outspread Wing with layered feathers */}
            <path
              d="M37 25 C44 19, 53 16, 59 18 C61 23, 57 30, 49 34 C44 36, 39 36, 36 34 Z"
            />
            <path
              d="M58 19 C54 24, 49 28, 42 30"
              fill="none"
              stroke="#fffdf7"
              strokeWidth="1.2"
              opacity="0.4"
            />
            {/* Eye points */}
            <circle cx="34" cy="18" r="1.3" fill="#fffdf7" />
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
            {/* Ground ripples / mountain ridge */}
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

        {/* 3. Water Habitat: Gliding Ichthyosaur / Marine Fish */}
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
            {/* Fish / Ichthyosaur streamlined body */}
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
