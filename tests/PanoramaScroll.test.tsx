import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PanoramaScroll } from '../src/components/schemes/PanoramaScroll'
import { I18nProvider } from '../src/i18n/I18nProvider'

const mockCounts = {
  all: 24,
  air: 6,
  land: 12,
  water: 6,
}

describe('PanoramaScroll (Direction B: Naturalist\'s Pocket Panorama)', () => {
  it('renders all 4 accordion folds with correct taxonomic titles and counts in zh-CN', () => {
    const onSelect = vi.fn()

    render(
      <I18nProvider initialState={{ locale: 'zh-CN', preference: 'zh-CN' }}>
        <PanoramaScroll
          activeHabitat="all"
          counts={mockCounts}
          onSelectHabitat={onSelect}
        />
      </I18nProvider>,
    )

    // Verify Tablist role
    const tablist = screen.getByRole('tablist', { name: /生境探索折页/ })
    expect(tablist).toBeInTheDocument()

    // Verify All 4 Folds exist
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)

    // Check titles & counts
    expect(screen.getByText('全景')).toBeInTheDocument()
    expect(screen.getByText('苍穹')).toBeInTheDocument()
    expect(screen.getByText('陆表')).toBeInTheDocument()
    expect(screen.getByText('深渊')).toBeInTheDocument()

    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()

    // Check active state
    const allTab = screen.getByRole('tab', { name: /全景/ })
    expect(allTab).toHaveAttribute('aria-selected', 'true')
    expect(allTab).toHaveAttribute('tabIndex', '0')

    const landTab = screen.getByRole('tab', { name: /陆表/ })
    expect(landTab).toHaveAttribute('aria-selected', 'false')
    expect(landTab).toHaveAttribute('tabIndex', '-1')
  })

  it('triggers onSelectHabitat when a fold is clicked', () => {
    const onSelect = vi.fn()

    render(
      <I18nProvider initialState={{ locale: 'zh-CN', preference: 'zh-CN' }}>
        <PanoramaScroll
          activeHabitat="all"
          counts={mockCounts}
          onSelectHabitat={onSelect}
        />
      </I18nProvider>,
    )

    const airTab = screen.getByRole('tab', { name: /苍穹/ })
    fireEvent.click(airTab)
    expect(onSelect).toHaveBeenCalledWith('air')

    const waterTab = screen.getByRole('tab', { name: /深渊/ })
    fireEvent.click(waterTab)
    expect(onSelect).toHaveBeenCalledWith('water')
  })

  it('supports full keyboard navigation (Arrow keys, Home, End)', () => {
    const onSelect = vi.fn()

    render(
      <I18nProvider initialState={{ locale: 'zh-CN', preference: 'zh-CN' }}>
        <PanoramaScroll
          activeHabitat="all"
          counts={mockCounts}
          onSelectHabitat={onSelect}
        />
      </I18nProvider>,
    )

    const tablist = screen.getByRole('tablist')

    // ArrowRight from 'all' -> 'air'
    fireEvent.keyDown(tablist, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenCalledWith('air')

    // ArrowDown from 'all' -> 'air'
    fireEvent.keyDown(tablist, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('air')

    // ArrowLeft from 'all' wraps to 'water'
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenCalledWith('water')

    // End key jumps to 'water'
    fireEvent.keyDown(tablist, { key: 'End' })
    expect(onSelect).toHaveBeenCalledWith('water')

    // Home key jumps to 'all'
    fireEvent.keyDown(tablist, { key: 'Home' })
    expect(onSelect).toHaveBeenCalledWith('all')
  })

  it('renders correctly in English locale', () => {
    const onSelect = vi.fn()

    render(
      <I18nProvider initialState={{ locale: 'en', preference: 'en' }}>
        <PanoramaScroll
          activeHabitat="land"
          counts={mockCounts}
          onSelectHabitat={onSelect}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Compendium')).toBeInTheDocument()
    expect(screen.getByText('Aerosphere')).toBeInTheDocument()
    expect(screen.getByText('Geosphere')).toBeInTheDocument()
    expect(screen.getByText('Hydrosphere')).toBeInTheDocument()

    const landTab = screen.getByRole('tab', { name: /Geosphere/ })
    expect(landTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders standalone gracefully without I18nProvider without throwing', () => {
    const onSelect = vi.fn()

    const { container } = render(
      <PanoramaScroll
        activeHabitat="air"
        counts={mockCounts}
        onSelectHabitat={onSelect}
      />,
    )

    expect(container.querySelector('.panorama-scroll-root')).toBeInTheDocument()
    expect(screen.getByText('苍穹')).toBeInTheDocument()
  })

  it('renders inline SVG woodcut engravings without Lucide icon dependencies', () => {
    const onSelect = vi.fn()

    const { container } = render(
      <PanoramaScroll
        activeHabitat="all"
        counts={mockCounts}
        onSelectHabitat={onSelect}
      />,
    )

    const svgs = container.querySelectorAll('svg.panorama-fold__svg')
    expect(svgs).toHaveLength(4)
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('viewBox', '0 0 44 44')
    })
  })
})
