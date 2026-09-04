import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  AnimalCollectionSheet,
  type CollectionAnimal,
} from '../src/components/AnimalCollectionSheet'
import { CollectionUxDevDock } from '../src/components/CollectionUxDevDock'
import { I18nProvider } from '../src/i18n/I18nProvider'

const mockAnimals: CollectionAnimal[] = [
  { id: 'stegosaurus', name: '剑龙', classification: '装甲类恐龙', thumbnail: '/stego.webp', habitat: 'land' },
  { id: 'tyrannosaurus-rex', name: '霸王龙', classification: '兽脚类恐龙', thumbnail: '/trex.webp', habitat: 'land' },
  { id: 'pteranodon', name: '无齿翼龙', classification: '翼龙目', thumbnail: '/pteranodon.webp', habitat: 'air' },
  { id: 'tupandactylus', name: '古神翼龙', classification: '翼龙目', thumbnail: '/tupan.webp', habitat: 'air' },
  { id: 'ichthyosaur', name: '鱼龙', classification: '鱼龙目', thumbnail: '/ichthyo.webp', habitat: 'water' },
  { id: 'mosasaurus', name: '沧龙', classification: '有鳞目海生爬行动物', thumbnail: '/mosa.webp', habitat: 'water' },
]

describe('AnimalCollectionSheet', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  function renderSheet(props: Partial<Parameters<typeof AnimalCollectionSheet>[0]> = {}) {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const returnFocusTo = { current: null }

    const result = render(
      <I18nProvider initialState={{ locale: 'zh-CN', preference: 'zh-CN' }}>
        <AnimalCollectionSheet
          animals={mockAnimals}
          currentAnimalId="stegosaurus"
          loadingAnimalId={null}
          loadingPhase={null}
          loadingPercent={null}
          onClose={onClose}
          onSelect={onSelect}
          open={true}
          returnFocusTo={returnFocusTo}
          {...props}
        />
      </I18nProvider>,
    )

    return { ...result, onSelect, onClose }
  }

  it('renders default elevator mode with continuous ecological zones and altitude rail', () => {
    renderSheet()

    expect(screen.getByRole('heading', { name: '全馆图鉴' })).toBeInTheDocument()
    expect(screen.getByLabelText('史前地球垂直生态长卷')).toBeInTheDocument()
    expect(screen.getByLabelText('生态海拔升降梯操纵轨')).toBeInTheDocument()

    // Check elevator zones
    expect(screen.getByRole('heading', { name: /苍穹展区/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /原始陆表/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /远古深渊/ })).toBeInTheDocument()

    // In elevator mode, all 6 cards exist simultaneously without layout destruction
    const cards = screen.getAllByRole('button', { name: /展台/ })
    expect(cards).toHaveLength(6)

    // Living creature beacon exists
    expect(screen.getByLabelText(/当前生态信标/)).toBeInTheDocument()
  })

  it('intelligently initializes to water habitat when current animal is an ocean creature', () => {
    renderSheet({ currentAnimalId: 'ichthyosaur' })

    const sheet = screen.getByRole('dialog')
    expect(sheet).toHaveAttribute('data-habitat', 'water')
    expect(screen.getByLabelText(/当前生态信标：深海/)).toBeInTheDocument()
  })

  it('switches living creature beacon when clicking habitat totem nodes', () => {
    renderSheet({ currentAnimalId: 'stegosaurus' })

    // Stegosaurus is land
    expect(screen.getByLabelText(/当前生态信标：原始陆兽/)).toBeInTheDocument()

    // Click Sea waypoint
    const seaNode = screen.getByRole('button', { name: /海洋/ })
    fireEvent.click(seaNode)

    expect(screen.getByLabelText(/当前生态信标：深海/)).toBeInTheDocument()
  })

  it('renders tabs mode with habitat counts and filters animals smoothly', () => {
    renderSheet({ uxMode: 'tabs' })

    expect(screen.getByRole('heading', { name: '全馆图鉴' })).toBeInTheDocument()
    
    // Check tabs
    const allTab = screen.getByRole('tab', { name: /全部/ })
    const landTab = screen.getByRole('tab', { name: /陆地/ })
    const airTab = screen.getByRole('tab', { name: /天空/ })
    const waterTab = screen.getByRole('tab', { name: /海洋/ })

    expect(allTab).toHaveAttribute('aria-selected', 'true')
    expect(landTab).toHaveTextContent('2')
    expect(airTab).toHaveTextContent('2')
    expect(waterTab).toHaveTextContent('2')

    // Click sky tab
    fireEvent.click(airTab)

    const skyCards = screen.getAllByRole('button', { name: /展台/ })
    expect(skyCards).toHaveLength(2)
    expect(screen.getByText('无齿翼龙')).toBeInTheDocument()
    expect(screen.getByText('古神翼龙')).toBeInTheDocument()
    expect(screen.queryByText('剑龙')).not.toBeInTheDocument()

    // Click water tab
    fireEvent.click(screen.getByRole('tab', { name: /海洋/ }))

    const waterCards = screen.getAllByRole('button', { name: /展台/ })
    expect(waterCards).toHaveLength(2)
    expect(screen.getByText('鱼龙')).toBeInTheDocument()
    expect(screen.getByText('沧龙')).toBeInTheDocument()
    expect(screen.queryByText('无齿翼龙')).not.toBeInTheDocument()
  })

  it('renders grouped pavilion mode with section headings and anchor buttons', () => {
    renderSheet({ uxMode: 'grouped' })

    expect(screen.getByRole('heading', { name: '陆地展区' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '天空展区' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '海洋展区' })).toBeInTheDocument()

    // Anchor buttons exist
    expect(screen.getByRole('button', { name: /陆地展区/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /天空展区/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /海洋展区/ })).toBeInTheDocument()
  })

  it('renders classic flat mode without tabs or anchor bars', () => {
    renderSheet({ uxMode: 'classic' })

    // No habitat tabs or anchors in classic mode
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()

    // All 6 cards are present
    const cards = screen.getAllByRole('button', { name: /展台/ })
    expect(cards).toHaveLength(6)
  })

  it('renders story cards mode and filters animals when a story card is clicked', () => {
    renderSheet({ uxMode: 'cards' })

    expect(screen.getByRole('tab', { name: /陆地之森/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /辽阔苍穹/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /蔚蓝深海/ })).toBeInTheDocument()

    // Click sky story card
    fireEvent.click(screen.getByRole('tab', { name: /辽阔苍穹/ }))

    const skyCards = screen.getAllByRole('button', { name: /展台/ })
    expect(skyCards).toHaveLength(2)
    expect(screen.getByText('无齿翼龙')).toBeInTheDocument()
    expect(screen.getByText('古神翼龙')).toBeInTheDocument()
    expect(screen.queryByText('剑龙')).not.toBeInTheDocument()
  })

  it('calls onSelect when an animal card is clicked', () => {
    const { onSelect } = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: /前往无齿翼龙展台/ }))
    expect(onSelect).toHaveBeenCalledWith('pteranodon')
  })

  it('renders lens mode with VerticalAltitudeLens and filters on altitude selection', () => {
    renderSheet({ uxMode: 'lens' })

    expect(screen.getByLabelText('生态纵深测深仪')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /\+500m/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^0m/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /-200m/ })).toBeInTheDocument()

    // Click +500m (air)
    fireEvent.click(screen.getByRole('radio', { name: /\+500m/ }))
    expect(screen.getByText('无齿翼龙')).toBeInTheDocument()
    expect(screen.queryByText('剑龙')).not.toBeInTheDocument()
  })

  it('renders panorama mode with PanoramaScroll and filters on fold selection', () => {
    renderSheet({ uxMode: 'panorama' })

    expect(screen.getByLabelText('博物学家折叠全景卷轴')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /苍穹/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /深渊/ })).toBeInTheDocument()

    // Click deep sea fold
    fireEvent.click(screen.getByRole('tab', { name: /深渊/ }))
    expect(screen.getByText('沧龙')).toBeInTheDocument()
    expect(screen.queryByText('剑龙')).not.toBeInTheDocument()
  })

  it('renders stage mode with StageCuratedView and filters on horizon selection', () => {
    renderSheet({ uxMode: 'stage' })

    expect(screen.getByLabelText('远古生态视窗展台')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /全部/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /天空/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /陆地/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /海洋/ })).toBeInTheDocument()

    // Initially all 6 cards are rendered
    expect(screen.getAllByRole('button', { name: /展台/ })).toHaveLength(6)

    // Click air horizon
    fireEvent.click(screen.getByRole('tab', { name: /天空/ }))
    expect(screen.getAllByRole('button', { name: /展台/ })).toHaveLength(2)
    expect(screen.getByText('无齿翼龙')).toBeInTheDocument()
    expect(screen.queryByText('剑龙')).not.toBeInTheDocument()
  })

  it('handles mode changes via CollectionUxDevDock', () => {
    const onChange = vi.fn()
    render(<CollectionUxDevDock currentMode="tabs" onChange={onChange} />)

    expect(screen.getByText('设计演进脉络')).toBeInTheDocument()
    const elevatorBtn = screen.getByRole('radio', { name: /垂直升降梯/ })
    fireEvent.click(elevatorBtn)
    expect(onChange).toHaveBeenCalledWith('elevator')
  })
})
