import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VerticalAltitudeLens } from '../src/components/schemes/VerticalAltitudeLens'

describe('VerticalAltitudeLens', () => {
  const defaultCounts = {
    all: 24,
    land: 14,
    air: 5,
    water: 5,
  }

  it('renders all 4 altitude zones with correct elevation markers and counts', () => {
    const onSelectHabitat = vi.fn()

    render(
      <VerticalAltitudeLens
        activeHabitat="all"
        counts={defaultCounts}
        onSelectHabitat={onSelectHabitat}
      />,
    )

    // Instrument radiogroup chassis
    const gauge = screen.getByRole('radiogroup', {
      name: /史前生态纵深测深仪/,
    })
    expect(gauge).toBeInTheDocument()

    // 4 Radio stations
    const airRadio = screen.getByRole('radio', { name: /\+500m 苍穹/ })
    const landRadio = screen.getByRole('radio', { name: /0m 原始陆表/ })
    const waterRadio = screen.getByRole('radio', { name: /-200m 远古深渊/ })
    const allRadio = screen.getByRole('radio', { name: /⊙ 全景透镜/ })

    expect(airRadio).toBeInTheDocument()
    expect(landRadio).toBeInTheDocument()
    expect(waterRadio).toBeInTheDocument()
    expect(allRadio).toBeInTheDocument()

    // Active state
    expect(allRadio).toHaveAttribute('aria-checked', 'true')
    expect(airRadio).toHaveAttribute('aria-checked', 'false')
    expect(landRadio).toHaveAttribute('aria-checked', 'false')
    expect(waterRadio).toHaveAttribute('aria-checked', 'false')

    // Specimen counts
    expect(airRadio).toHaveTextContent('5 种飞客')
    expect(landRadio).toHaveTextContent('14 种巨兽')
    expect(waterRadio).toHaveTextContent('5 种潜游者')
    expect(allRadio).toHaveTextContent('24 种全馆一览')
  })

  it('handles clicking on altitude zones to trigger onSelectHabitat', () => {
    const onSelectHabitat = vi.fn()

    render(
      <VerticalAltitudeLens
        activeHabitat="land"
        counts={defaultCounts}
        onSelectHabitat={onSelectHabitat}
      />,
    )

    const airRadio = screen.getByRole('radio', { name: /\+500m 苍穹/ })
    fireEvent.click(airRadio)
    expect(onSelectHabitat).toHaveBeenCalledWith('air')

    const waterRadio = screen.getByRole('radio', { name: /-200m 远古深渊/ })
    fireEvent.click(waterRadio)
    expect(onSelectHabitat).toHaveBeenCalledWith('water')

    const allRadio = screen.getByRole('radio', { name: /⊙ 全景透镜/ })
    fireEvent.click(allRadio)
    expect(onSelectHabitat).toHaveBeenCalledWith('all')
  })

  it('supports full keyboard navigation (ArrowDown, ArrowUp, Home, End)', () => {
    const onSelectHabitat = vi.fn()

    const { rerender } = render(
      <VerticalAltitudeLens
        activeHabitat="air"
        counts={defaultCounts}
        onSelectHabitat={onSelectHabitat}
      />,
    )

    const airRadio = screen.getByRole('radio', { name: /\+500m 苍穹/ })
    airRadio.focus()

    // ArrowDown should move from air (+500m) to land (0m)
    fireEvent.keyDown(airRadio, { key: 'ArrowDown' })
    expect(onSelectHabitat).toHaveBeenCalledWith('land')

    // Rerender with land active
    rerender(
      <VerticalAltitudeLens
        activeHabitat="land"
        counts={defaultCounts}
        onSelectHabitat={onSelectHabitat}
      />,
    )

    const landRadio = screen.getByRole('radio', { name: /0m 原始陆表/ })
    // ArrowDown from land to water (-200m)
    fireEvent.keyDown(landRadio, { key: 'ArrowDown' })
    expect(onSelectHabitat).toHaveBeenCalledWith('water')

    // End should jump to all (⊙)
    fireEvent.keyDown(landRadio, { key: 'End' })
    expect(onSelectHabitat).toHaveBeenCalledWith('all')

    // Home should jump to air (+500m)
    fireEvent.keyDown(landRadio, { key: 'Home' })
    expect(onSelectHabitat).toHaveBeenCalledWith('air')

    // ArrowUp from air should cycle to all
    fireEvent.keyDown(airRadio, { key: 'ArrowUp' })
    expect(onSelectHabitat).toHaveBeenCalledWith('all')
  })

  it('supports English localization when document lang is en', () => {
    const onSelectHabitat = vi.fn()
    document.documentElement.lang = 'en'

    render(
      <VerticalAltitudeLens
        activeHabitat="air"
        counts={defaultCounts}
        onSelectHabitat={onSelectHabitat}
      />,
    )

    expect(
      screen.getByRole('radiogroup', {
        name: /Prehistoric Altitude & Depth Lens/,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('Sky & Canopy')).toBeInTheDocument()
    expect(screen.getByText('5 Flyers')).toBeInTheDocument()
    expect(screen.getByText('Primeval Land')).toBeInTheDocument()
    expect(screen.getByText('Ancient Abyss')).toBeInTheDocument()
    expect(screen.getByText('Panoramic Lens')).toBeInTheDocument()

    // Restore lang
    document.documentElement.lang = 'zh-CN'
  })

  it('forwards custom className to root element', () => {
    const onSelectHabitat = vi.fn()

    const { container } = render(
      <VerticalAltitudeLens
        activeHabitat="land"
        className="custom-exhibition-test-class"
        counts={defaultCounts}
        onSelectHabitat={onSelectHabitat}
      />,
    )

    expect(container.firstChild).toHaveClass('vertical-lens')
    expect(container.firstChild).toHaveClass('custom-exhibition-test-class')
  })

  it('renders pure vector inline SVGs for all 4 lithographic glyphs', () => {
    const onSelectHabitat = vi.fn()

    const { container } = render(
      <VerticalAltitudeLens
        activeHabitat="air"
        counts={defaultCounts}
        onSelectHabitat={onSelectHabitat}
      />,
    )

    // Ensure 4 glyph medallions exist with SVG elements
    const svgs = container.querySelectorAll('.vertical-lens__glyph-svg')
    expect(svgs).toHaveLength(4)
  })
})
