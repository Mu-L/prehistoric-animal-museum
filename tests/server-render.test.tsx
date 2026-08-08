/** @vitest-environment node */

import { renderToString } from 'react-dom/server'

import { App } from '../src/App'
import { renderMuseumApp } from '../src/entry-server'

describe('museum server rendering', () => {
  it('renders a deterministic English museum first frame without browser globals', () => {
    const html = renderToString(
      <App
        initialState={{
          animalId: 'stegosaurus',
          locale: 'en',
          pageKind: 'museum',
          preference: 'en',
        }}
      />,
    )

    expect(html).toContain('id="museum-experience"')
    expect(html).toContain('data-locale="en"')
    expect(html).toContain('data-requested-animal-id="stegosaurus"')
    expect(html).toContain('Prehistoric Animal Museum')
    expect(html).toContain('Stegosaurus')
    expect(html.match(/data-animal-detail-link=""/g)).toHaveLength(3)
    expect(html).toContain('href="./animals/mosasaurus/"')
    expect(html).not.toContain('seo-static-shell')
  })

  it('exposes the same deterministic markup through the build-time server entry', () => {
    const html = renderMuseumApp({
      animalId: 'stegosaurus',
      locale: 'zh-CN',
      pageKind: 'museum',
      preference: 'zh-CN',
    })

    expect(html).toContain('id="museum-experience"')
    expect(html).toContain('data-locale="zh-CN"')
    expect(html).toContain('data-requested-animal-id="stegosaurus"')
    expect(html).toContain('史前动物博物馆')
    expect(html).toContain('剑龙')
  })

  it('renders fallback links toward canonical localized detail pages', () => {
    const html = renderMuseumApp({
      animalId: 'stegosaurus',
      locale: 'zh-CN',
      pageKind: 'museum',
      preference: 'zh-CN',
      rootFallback: true,
    })

    expect(html).toContain('href="./zh-CN/animals/mosasaurus/"')
    expect(html).not.toContain('href="./animals/mosasaurus/"')
  })

  it('renders an animal deep link as the matching museum exhibit', () => {
    const html = renderMuseumApp({
      animalId: 'mosasaurus',
      locale: 'en',
      pageKind: 'animal-detail',
      preference: 'en',
    })

    expect(html).toContain('id="museum-experience"')
    expect(html).toContain('data-locale="en"')
    expect(html).toContain('data-page-kind="animal-detail"')
    expect(html).toContain('data-requested-animal-id="mosasaurus"')
    expect(html).toContain('Prehistoric Animal Museum')
    expect(html).toContain('<h1 class="animal-title">Mosasaurus</h1>')
    expect(html).toContain(
      'data-museum-return="" href="../../../en/?animal=mosasaurus"',
    )
    expect(html).toContain('href="../stegosaurus/"')
    expect(html).toContain('href="../tyrannosaurus-rex/"')
    expect(html).not.toContain('seo-static-shell')
  })
})
