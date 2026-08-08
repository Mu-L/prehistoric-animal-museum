import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'
import sharp from 'sharp'

import {
  createSeoSocialCardManifest,
  createMultilingualSeoArtifacts,
  seoCatalogueAnimalIds,
} from '../scripts/multilingual-seo'
import { mainCollection } from '../src/content/collections/main'
import type { AnimalDefinitionModule } from '../src/content/types'

const canonicalDefinitionModules = import.meta.glob<AnimalDefinitionModule>(
  '../src/content/animals/*/package.ts',
  { eager: true },
)

const builtAppHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="old description" />
    <meta property="og:title" content="old title" />
    <link rel="icon" href="./favicon.svg" />
    <script type="module" crossorigin src="./assets/app-123.js"></script>
    <link rel="stylesheet" crossorigin href="./assets/app-123.css" />
    <title>Old title</title>
  </head>
  <body><div id="root"></div></body>
</html>`

function artifactSource(
  artifacts: ReadonlyMap<string, string>,
  fileName: string,
): string {
  const source = artifacts.get(fileName)
  expect(source, `missing ${fileName}`).toBeTypeOf('string')
  return source ?? ''
}

function parseHtml(source: string): Document {
  return new DOMParser().parseFromString(source, 'text/html')
}

describe('multilingual SEO artifacts', () => {
  const artifacts = createMultilingualSeoArtifacts(builtAppHtml, {
    siteOrigin: 'https://example.test',
    museumPath: '/museum/',
  })

  it('derives every crawlable ID, localized name and gallery from canonical content', () => {
    const definitionsById = new Map(
      Object.values(canonicalDefinitionModules).map(({ animalDefinition }) => [
        animalDefinition.id,
        animalDefinition,
      ]),
    )
    const canonicalAnimals = mainCollection.animalIds.map((id) => {
      const definition = definitionsById.get(id)
      if (!definition || definition.status !== 'published') {
        throw new Error(`Missing canonical published animal ${id}`)
      }
      return definition
    })

    expect(new Set(seoCatalogueAnimalIds).size).toBe(seoCatalogueAnimalIds.length)
    expect(seoCatalogueAnimalIds).toEqual(mainCollection.animalIds)

    for (const [fileName, locale] of [
      ['zh-CN/index.html', 'zh-CN'],
      ['en/index.html', 'en'],
    ] as const) {
      const document = parseHtml(artifactSource(artifacts, fileName))
      const entries = document.querySelectorAll<HTMLElement>(
        '[data-seo-catalogue] [data-animal-id]',
      )
      expect(entries).toHaveLength(canonicalAnimals.length)

      for (const animal of canonicalAnimals) {
        const entry = document.querySelector<HTMLElement>(
          `[data-animal-id="${animal.id}"]`,
        )
        expect(entry?.textContent).toBe(animal.content[locale].name)
        expect(entry?.closest('section')?.getAttribute('data-habitat')).toBe(
          animal.habitat,
        )
      }
    }
  })

  it('renders a Chinese museum template as the fail-open entry', () => {
    const document = parseHtml(artifactSource(artifacts, 'index.html'))

    expect(document.documentElement.lang).toBe('zh-CN')
    expect(document.title).toBe('史前动物博物馆 | 亲子 3D 史前动物展')
    expect(document.querySelector('h1')?.textContent).toBe('史前动物博物馆')
    expect(document.querySelectorAll('[data-seo-catalogue] li')).toHaveLength(
      mainCollection.animalIds.length,
    )
    expect(
      document.querySelector<HTMLAnchorElement>('a[hreflang="zh-CN"]')?.getAttribute(
        'href',
      ),
    ).toBe('./zh-CN/')
    expect(
      document.querySelector<HTMLAnchorElement>('a[hreflang="en"]')?.getAttribute(
        'href',
      ),
    ).toBe('./en/')
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://example.test/museum/zh-CN/')
    expect(
      document.querySelector('link[rel="alternate"][hreflang="x-default"]')
        ?.getAttribute('href'),
    ).toBe('https://example.test/museum/')
    expect(
      document.querySelector('script[type="module"]')?.getAttribute('src'),
    ).toBe('./assets/app-123.js')
    expect(
      document.querySelector('link[rel="stylesheet"]')?.getAttribute('href'),
    ).toBe('./assets/app-123.css')
  })

  it('keeps the no-JS static shell viewport-height and independently scrollable', () => {
    const document = parseHtml(artifactSource(artifacts, 'index.html'))
    const style = document.querySelector('#seo-static-shell-style')?.textContent

    expect(style).toMatch(
      /\.seo-static-shell\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*auto;/s,
    )
    expect(style).toContain('.seo-static-shell :lang(zh-CN)')
    expect(style).toContain('"Noto Sans SC Variable"')
    expect(style).toContain('"Nunito Variable"')
  })

  it.each([
    {
      fileName: 'zh-CN/index.html',
      lang: 'zh-CN',
      canonical: 'https://example.test/museum/zh-CN/',
      title: '史前动物博物馆 | 亲子 3D 史前动物展',
      heading: '史前动物博物馆',
      catalogueEntries: ['剑龙', '沧龙', '无齿翼龙'],
      descriptionFragment: `${mainCollection.animalIds.length} 位来自陆地、天空与水中`,
      brand: 'Leon做了个',
      ownLanguage: 'zh-CN',
      otherLanguage: 'en',
      languageLink: '../en/',
    },
    {
      fileName: 'en/index.html',
      lang: 'en',
      canonical: 'https://example.test/museum/en/',
      title: 'Prehistoric Animal Museum | A 3D Family Adventure',
      heading: 'Prehistoric Animal Museum',
      catalogueEntries: ['Stegosaurus', 'Mosasaurus', 'Pteranodon'],
      descriptionFragment: `${mainCollection.animalIds.length} prehistoric animals from land, sky and sea`,
      brand: 'Leon Made This',
      ownLanguage: 'en',
      otherLanguage: 'zh-CN',
      languageLink: '../zh-CN/',
    },
  ])(
    'renders crawlable localized content and metadata for $lang',
    ({
      fileName,
      lang,
      canonical,
      title,
      heading,
      catalogueEntries,
      descriptionFragment,
      brand,
      ownLanguage,
      otherLanguage,
      languageLink,
    }) => {
      const document = parseHtml(artifactSource(artifacts, fileName))

      expect(document.documentElement.lang).toBe(lang)
      expect(document.title).toBe(title)
      expect(document.querySelector('h1')?.textContent).toBe(heading)
      expect(document.body.textContent).toContain(descriptionFragment)
      expect(document.querySelectorAll('[data-seo-catalogue] li')).toHaveLength(
        mainCollection.animalIds.length,
      )
      for (const entry of catalogueEntries) {
        expect(document.body.textContent).toContain(entry)
      }
      expect(
        document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ).toBe(canonical)
      expect(
        document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
      ).toBe(canonical)
      expect(
        document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      ).toBe(title)
      expect(
        document
          .querySelector('meta[property="og:site_name"]')
          ?.getAttribute('content'),
      ).toBe(brand)
      expect(
        document
          .querySelector(`nav a[hreflang="${otherLanguage}"]`)
          ?.getAttribute('href'),
      ).toBe(languageLink)
      expect(
        document
          .querySelector(`nav a[hreflang="${ownLanguage}"]`)
          ?.getAttribute('href'),
      ).toBe('./')
    },
  )

  it('renders a crawlable Chinese Stegosaurus pilot page from canonical content', () => {
    const document = parseHtml(
      artifactSource(
        artifacts,
        'zh-CN/animals/stegosaurus/index.html',
      ),
    )

    expect(document.documentElement.lang).toBe('zh-CN')
    expect(document.querySelector('h1')?.textContent).toBe('剑龙')
    expect(document.body.textContent).toContain('晚侏罗世')
    expect(document.body.textContent).toContain('北美洲西部')
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(
      'https://example.test/museum/zh-CN/animals/stegosaurus/',
    )
    expect(
      document
        .querySelector<HTMLAnchorElement>('[data-open-exhibit]')
        ?.getAttribute('href'),
    ).toBe('../../../zh-CN/?animal=stegosaurus')
    expect(
      document.querySelector<HTMLAnchorElement>(
        'a[href="https://www.nhm.ac.uk/discover/dino-directory/stegosaurus.html"]',
      ),
    ).not.toBeNull()
  })

  it('renders the reciprocal English Stegosaurus pilot page', () => {
    const document = parseHtml(
      artifactSource(artifacts, 'en/animals/stegosaurus/index.html'),
    )

    expect(document.documentElement.lang).toBe('en')
    expect(document.querySelector('h1')?.textContent).toBe('Stegosaurus')
    expect(document.body.textContent).toContain('Late Jurassic')
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://example.test/museum/en/animals/stegosaurus/')
    expect(
      document
        .querySelector('link[rel="alternate"][hreflang="zh-CN"]')
        ?.getAttribute('href'),
    ).toBe(
      'https://example.test/museum/zh-CN/animals/stegosaurus/',
    )
    expect(
      document
        .querySelector<HTMLAnchorElement>('[data-open-exhibit]')
        ?.getAttribute('href'),
    ).toBe('../../../en/?animal=stegosaurus')
  })

  it('persists a detail-page language choice while preserving the same animal route', () => {
    const document = parseHtml(
      artifactSource(artifacts, 'zh-CN/animals/mosasaurus/index.html'),
    )
    const languageLink = document.querySelector<HTMLAnchorElement>(
      'a[data-locale-choice="en"]',
    )

    expect(languageLink?.getAttribute('href')).toBe(
      '../../../en/animals/mosasaurus/',
    )
    expect(
      document.querySelector('script[data-locale-cookie]')?.textContent,
    ).toContain(
      'museum_locale=en; Max-Age=31536000; Path=/museum; SameSite=Lax; Secure',
    )
  })

  it.each([
    ['zh-CN', 'tyrannosaurus-rex', '霸王龙'],
    ['en', 'tyrannosaurus-rex', 'Tyrannosaurus rex'],
    ['zh-CN', 'mosasaurus', '沧龙'],
    ['en', 'mosasaurus', 'Mosasaurus'],
  ] as const)(
    'renders the %s %s pilot page',
    (locale, animalId, heading) => {
      const document = parseHtml(
        artifactSource(
          artifacts,
          `${locale}/animals/${animalId}/index.html`,
        ),
      )

      expect(document.documentElement.lang).toBe(locale)
      expect(document.querySelector('h1')?.textContent).toBe(heading)
      expect(
        document
          .querySelector<HTMLAnchorElement>('[data-open-exhibit]')
          ?.getAttribute('href'),
      ).toBe(`../../../${locale}/?animal=${animalId}`)
      expect(
        document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ).toBe(
        `https://example.test/museum/${locale}/animals/${animalId}/`,
      )
    },
  )

  it('keeps a pilot detail page lightweight and makes its LCP image discoverable', () => {
    const document = parseHtml(
      artifactSource(artifacts, 'en/animals/mosasaurus/index.html'),
    )

    expect(document.querySelector('script[src]')).toBeNull()
    expect(
      document.querySelectorAll('script:not([type="application/ld+json"])'),
    ).toHaveLength(1)
    expect(document.querySelector('link[rel="stylesheet"]')).toBeNull()
    expect(
      document.querySelector('link[rel="preload"][as="image"]')?.getAttribute(
        'href',
      ),
    ).toBe('../../../animals/mosasaurus/hero.webp')
    expect(
      document.querySelector('meta[property="og:image"]')?.getAttribute(
        'content',
      ),
    ).toBe(
      'https://example.test/museum/animals/mosasaurus/social.webp',
    )
    expect(
      document.querySelector<HTMLImageElement>('.animal-hero__media img')?.width,
    ).toBe(1200)
  })

  it('links the localized catalogue to every published pilot detail page', () => {
    for (const locale of ['zh-CN', 'en'] as const) {
      const document = parseHtml(
        artifactSource(artifacts, `${locale}/index.html`),
      )

      for (const animalId of [
        'stegosaurus',
        'tyrannosaurus-rex',
        'mosasaurus',
      ]) {
        expect(
          document
            .querySelector<HTMLAnchorElement>(
              `[data-animal-id="${animalId}"] a`,
            )
            ?.getAttribute('href'),
        ).toBe(`./animals/${animalId}/`)
      }
    }
  })

  it('links each pilot detail page to the other available animal pages', () => {
    const document = parseHtml(
      artifactSource(artifacts, 'en/animals/mosasaurus/index.html'),
    )
    const related = [
      ...document.querySelectorAll<HTMLAnchorElement>(
        '[data-related-animals] a[data-animal-id]',
      ),
    ]

    expect(
      related.map((link) => [
        link.dataset.animalId,
        link.getAttribute('href'),
      ]),
    ).toEqual([
      ['stegosaurus', '../stegosaurus/'],
      ['tyrannosaurus-rex', '../tyrannosaurus-rex/'],
    ])
    expect(
      related[0]?.querySelector('img')?.getAttribute('src'),
    ).toBe('../../../animals/stegosaurus/thumbnail.webp')
  })

  it('describes a pilot detail page with matching breadcrumb structured data', () => {
    const document = parseHtml(
      artifactSource(artifacts, 'en/animals/stegosaurus/index.html'),
    )
    const source = document.querySelector(
      'script[type="application/ld+json"]',
    )?.textContent
    expect(source).toBeTypeOf('string')
    const data = JSON.parse(source ?? '{}') as {
      '@type'?: string
      breadcrumb?: {
        itemListElement?: Array<{ item?: string; name?: string }>
      }
      name?: string
      url?: string
    }

    expect(data).toMatchObject({
      '@type': 'WebPage',
      name: 'Stegosaurus',
      url: 'https://example.test/museum/en/animals/stegosaurus/',
    })
    expect(data.breadcrumb?.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Prehistoric Animal Museum',
        item: 'https://example.test/museum/en/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Stegosaurus',
        item: 'https://example.test/museum/en/animals/stegosaurus/',
      },
    ])
  })

  it('declares the complete reciprocal hreflang set on every page', () => {
    for (const fileName of ['index.html', 'zh-CN/index.html', 'en/index.html']) {
      const document = parseHtml(artifactSource(artifacts, fileName))
      const alternates = Object.fromEntries(
        [...document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"]')].map(
          (link) => [link.hreflang, link.href],
        ),
      )

      expect(alternates).toEqual({
        'zh-CN': 'https://example.test/museum/zh-CN/',
        en: 'https://example.test/museum/en/',
        'x-default': 'https://example.test/museum/',
      })
    }
  })

  it('rebases only document assets for nested locale pages', () => {
    const localizedHtml = artifactSource(artifacts, 'en/index.html')

    expect(localizedHtml).toContain('src="../assets/app-123.js"')
    expect(localizedHtml).toContain('href="../assets/app-123.css"')
    expect(localizedHtml).toContain('href="../favicon.svg"')
    expect(localizedHtml).not.toContain('src="./assets/app-123.js"')
  })

  it('emits distinct localized museum-level social cards', () => {
    const zhCN = artifactSource(artifacts, 'social/museum.zh-CN.svg')
    const en = artifactSource(artifacts, 'social/museum.en.svg')

    expect(zhCN).toContain('史前动物博物馆')
    expect(zhCN).toContain('Leon做了个')
    expect(en).toContain('Prehistoric Animal Museum')
    expect(en).toContain('Leon Made This')
    expect(en).toContain('font-family="ui-rounded, system-ui, sans-serif"')
    expect(zhCN).not.toBe(en)
  })

  it.each([
    ['entry-fallback', 'index.html', 'museum.zh-CN.png'],
    ['zh-CN', 'zh-CN/index.html', 'museum.zh-CN.png'],
    ['en', 'en/index.html', 'museum.en.png'],
  ] as const)(
    'emits a scraper-compatible 1200×630 PNG social card for %s',
    async (locale, documentName, imageName) => {
      const png = await readFile(`public/social/${imageName}`)
      const metadata = await sharp(png).metadata()
      expect(metadata.format).toBe('png')
      expect(metadata.width).toBe(1200)
      expect(metadata.height).toBe(630)

      const document = parseHtml(artifactSource(artifacts, documentName))
      expect(
        document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute('content'),
      ).toBe(`https://example.test/museum/social/${imageName}`)
      expect(
        document
          .querySelector('meta[property="og:image:type"]')
          ?.getAttribute('content'),
      ).toBe('image/png')
      expect(
        document
          .querySelector('meta[name="twitter:image:alt"]')
          ?.getAttribute('content'),
      ).toBe(
        document
          .querySelector('meta[property="og:image:alt"]')
          ?.getAttribute('content'),
      )
    },
  )

  it('binds checked-in cards to copy, layout and embedded font inputs', async () => {
    const manifest: unknown = JSON.parse(
      await readFile('public/social/manifest.json', 'utf8'),
    )
    const expectedManifest = createSeoSocialCardManifest()
    expect(manifest).toEqual(expectedManifest)
    for (const locale of ['x-default', 'zh-CN', 'en'] as const) {
      expect(expectedManifest.cards[locale].sourceSha256).toMatch(
        /^[a-f0-9]{64}$/,
      )
    }
  })

  it('emits a root robots file, canonical-only sitemap and a real noindex 404', () => {
    expect(artifactSource(artifacts, 'robots.txt')).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://example.test/sitemap.xml\n',
    )

    const sitemap = artifactSource(artifacts, 'sitemap.xml')
    expect(sitemap).not.toContain('<loc>https://example.test/museum/</loc>')
    expect(sitemap).toContain(
      '<loc>https://example.test/museum/zh-CN/</loc>',
    )
    expect(sitemap).toContain('<loc>https://example.test/museum/en/</loc>')
    expect(sitemap).toContain(
      '<loc>https://example.test/museum/zh-CN/animals/mosasaurus/</loc>',
    )
    expect(sitemap).toContain(
      '<loc>https://example.test/museum/en/animals/mosasaurus/</loc>',
    )
    expect(sitemap.match(/<url>/g)).toHaveLength(8)

    const notFound = parseHtml(artifactSource(artifacts, '404.html'))
    expect(
      notFound.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('noindex, follow')
    expect(notFound.querySelector('h1')?.textContent).toContain('404')
    const returnLink = notFound.querySelector('a[data-museum-return]')
    expect(returnLink?.getAttribute('href')).toBe(
      '/prehistoric-animal-museum/',
    )
  })
})
