import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import type { CollectionUxMode } from './AnimalCollectionSheet'

interface CollectionUxDevDockProps {
  readonly currentMode: CollectionUxMode
  readonly onChange: (mode: CollectionUxMode) => void
}

const MODES: readonly {
  readonly id: CollectionUxMode
  readonly label: string
  readonly desc: string
}[] = [
  { id: 'lens', label: '🔭 测深仪', desc: '方向 A：生态纵深测深仪（垂直高度/深度物理探索仪）' },
  { id: 'panorama', label: '📜 全景卷轴', desc: '方向 B：博物学家折叠全景卷轴（纸艺经折装）' },
  { id: 'classic', label: '📐 经典平铺', desc: '基线对照组：原始 24 卡片无分类平铺' },
  { id: 'tabs', label: '胶囊筛选', desc: '旧方案 1：常规 Web 顶栏胶囊' },
  { id: 'cards', label: '绘本大卡', desc: '旧方案 3：常规功能性卡片' },
]

export function CollectionUxDevDock({
  currentMode,
  onChange,
}: CollectionUxDevDockProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      aria-label="全馆图鉴体验方案对比"
      className="collection-dev-dock"
      data-collapsed={collapsed}
    >
      <div className="collection-dev-dock__header">
        <SlidersHorizontal aria-hidden="true" size={13} strokeWidth={2.4} />
        <span className="collection-dev-dock__title">方案对比</span>
        <button
          aria-label={collapsed ? '展开方案对比面板' : '收起方案对比面板'}
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
            return (
              <button
                aria-checked={active}
                className="collection-dev-dock__btn"
                data-active={active}
                key={mode.id}
                onClick={() => onChange(mode.id)}
                role="radio"
                title={mode.desc}
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
