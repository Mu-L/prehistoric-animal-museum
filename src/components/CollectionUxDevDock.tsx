import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import type { CollectionUxMode } from './AnimalCollectionSheet'

interface CollectionUxDevDockProps {
  readonly currentMode: CollectionUxMode
  readonly onChange: (mode: CollectionUxMode) => void
}

interface ModeOption {
  readonly id: CollectionUxMode
  readonly label: string
  readonly level: string
  readonly desc: string
}

const MODES: readonly ModeOption[] = [
  // Level 3: 空间连贯突破 (解决高度跳动硬伤)
  {
    id: 'elevator',
    label: '🛗 垂直升降梯',
    level: 'Level 3 · 连贯突破',
    desc: '推荐方案 A：高度恒定锁定，海陆空垂直连续长卷，镜头平滑升降漫游（空间永续零删卡）',
  },
  {
    id: 'stage',
    label: '🎭 固定舞台漫幕',
    level: 'Level 3 · 连贯突破',
    desc: '推荐方案 B：高度恒定锁定，恒定展台与空灵留白呼吸，换幕式流光交融',
  },

  // Level 2: 拟物隐喻阶段 (视觉华丽但存在容器高度坍缩缺陷)
  {
    id: 'lens',
    label: '🔭 生态测深仪',
    level: 'Level 2 · 拟物隐喻',
    desc: '探索阶段 2：侧边游标控制台与生境光影（保留容器高度跳动作为对照）',
  },
  {
    id: 'panorama',
    label: '📜 全景折页',
    level: 'Level 2 · 拟物隐喻',
    desc: '探索阶段 2：博物学家经折装手风琴折页（保留作为对照）',
  },

  // Level 1: 传统 Web 筛选原型
  {
    id: 'tabs',
    label: '🏷️ 常用胶囊',
    level: 'Level 1 · Web筛选',
    desc: '探索阶段 1：常规 Web 顶部药丸筛选（频繁高度跳动）',
  },
  {
    id: 'cards',
    label: '🎴 绘本大卡',
    level: 'Level 1 · Web筛选',
    desc: '探索阶段 1：顶部大块功能性卡片',
  },

  // 基线对照
  {
    id: 'classic',
    label: '📐 原始平铺',
    level: '基线对照',
    desc: '基准对照组：原始 24 卡片无分类平铺网格',
  },
]

export function CollectionUxDevDock({
  currentMode,
  onChange,
}: CollectionUxDevDockProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      aria-label="全馆图鉴设计演进对比坞"
      className="collection-dev-dock"
      data-collapsed={collapsed}
    >
      <div className="collection-dev-dock__header">
        <Layers aria-hidden="true" size={13} strokeWidth={2.4} />
        <span className="collection-dev-dock__title">设计演进脉络</span>
        <button
          aria-label={collapsed ? '展开设计演进对比面板' : '收起设计演进对比面板'}
          className="collection-dev-dock__toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          type="button"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
      {!collapsed && (
        <div className="collection-dev-dock__body" role="radiogroup">
          {MODES.map((mode) => {
            const active = currentMode === mode.id
            const isLevel3 = mode.id === 'elevator' || mode.id === 'stage'

            return (
              <button
                aria-checked={active}
                className={`collection-dev-dock__btn ${isLevel3 ? 'collection-dev-dock__btn--highlight' : ''}`.trim()}
                data-active={active}
                data-level3={isLevel3 ? 'true' : 'false'}
                key={mode.id}
                onClick={() => onChange(mode.id)}
                role="radio"
                title={`${mode.level}：${mode.desc}`}
                type="button"
              >
                {active && <Check aria-hidden="true" size={11} strokeWidth={3} />}
                <span>{mode.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}
