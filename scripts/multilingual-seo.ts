import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import sharp from 'sharp'
import type { Plugin } from 'vite'

import { animalDefinition as apatosaurusDefinition } from '../src/content/animals/apatosaurus/package'
import { animalDefinition as dilophosaurusDefinition } from '../src/content/animals/dilophosaurus/package'
import { animalDefinition as gigantoraptorDefinition } from '../src/content/animals/gigantoraptor/package'
import { animalDefinition as ichthyosaurDefinition } from '../src/content/animals/ichthyosaur/package'
import { animalDefinition as maiasauraDefinition } from '../src/content/animals/maiasaura/package'
import { animalDefinition as mammothDefinition } from '../src/content/animals/mammoth/package'
import { animalDefinition as megalodonDefinition } from '../src/content/animals/megalodon/package'
import { animalDefinition as meganeuraDefinition } from '../src/content/animals/meganeura/package'
import { animalDefinition as mosasaurusDefinition } from '../src/content/animals/mosasaurus/package'
import { animalDefinition as pachycephalosaurusDefinition } from '../src/content/animals/pachycephalosaurus/package'
import { animalDefinition as plesiosaurusDefinition } from '../src/content/animals/plesiosaurus/package'
import { animalDefinition as pteranodonDefinition } from '../src/content/animals/pteranodon/package'
import { animalDefinition as rhamphorhynchusDefinition } from '../src/content/animals/rhamphorhynchus/package'
import { animalDefinition as sauropeltaDefinition } from '../src/content/animals/sauropelta/package'
import { animalDefinition as stegosaurusDefinition } from '../src/content/animals/stegosaurus/package'
import { animalDefinition as triceratopsDefinition } from '../src/content/animals/triceratops/package'
import { animalDefinition as tupandactylusDefinition } from '../src/content/animals/tupandactylus/package'
import { animalDefinition as tyrannosaurusRexDefinition } from '../src/content/animals/tyrannosaurus-rex/package'
import { mainCollection } from '../src/content/collections/main'
import type {
  Habitat,
  PublishedAnimalDefinition,
} from '../src/content/types'

export type SeoPageLocale = 'x-default' | 'zh-CN' | 'en'

export interface SeoSocialCardManifest {
  readonly version: 1
  readonly width: 1200
  readonly height: 630
  readonly cards: Readonly<
    Record<
      SeoPageLocale,
      {
        readonly fileName: string
        readonly sourceSha256: string
      }
    >
  >
}

export interface MultilingualSeoOptions {
  readonly siteOrigin?: string
  readonly museumPath?: string
  readonly notFoundReturnPath?: string
}

interface ResolvedSeoOptions {
  readonly siteOrigin: string
  readonly museumPath: string
  readonly notFoundReturnPath: string
}

interface CatalogueEntry {
  readonly id: string
  readonly habitat: Habitat
  readonly zhCN: string
  readonly en: string
}

interface CatalogueGroup {
  readonly habitat: Habitat
  readonly zhCN: string
  readonly en: string
  readonly animals: readonly CatalogueEntry[]
}

interface SeoPageCopy {
  readonly locale: SeoPageLocale
  readonly htmlLang: 'zh-CN' | 'en'
  readonly brand: string
  readonly title: string
  readonly description: string
  readonly heading: string
  readonly introduction: string
  readonly privacy: string
  readonly catalogueHeading: string
  readonly languageLabel: string
  readonly systemLanguageLabel: string
  readonly socialImageFileName: string
  readonly socialImageAlt: string
}

const defaultOptions = {
  siteOrigin: 'https://leon-made-this.work',
  museumPath: '/museum/',
  notFoundReturnPath: '/prehistoric-animal-museum/',
} satisfies Required<MultilingualSeoOptions>

const canonicalAnimalDefinitions = [
  apatosaurusDefinition,
  dilophosaurusDefinition,
  gigantoraptorDefinition,
  ichthyosaurDefinition,
  maiasauraDefinition,
  mammothDefinition,
  megalodonDefinition,
  meganeuraDefinition,
  mosasaurusDefinition,
  pachycephalosaurusDefinition,
  plesiosaurusDefinition,
  pteranodonDefinition,
  rhamphorhynchusDefinition,
  sauropeltaDefinition,
  stegosaurusDefinition,
  triceratopsDefinition,
  tupandactylusDefinition,
  tyrannosaurusRexDefinition,
] as const satisfies readonly PublishedAnimalDefinition[]

function createCatalogueEntries(
  animalIds: readonly string[],
  definitions: readonly PublishedAnimalDefinition[],
): CatalogueEntry[] {
  const definitionsById = new Map<string, PublishedAnimalDefinition>()

  for (const definition of definitions) {
    if (definitionsById.has(definition.id)) {
      throw new Error(`SEO catalogue contains duplicate animal “${definition.id}”.`)
    }
    definitionsById.set(definition.id, definition)
  }

  const seenIds = new Set<string>()
  return animalIds.map((id) => {
    if (seenIds.has(id)) {
      throw new Error(`Main collection contains duplicate animal “${id}”.`)
    }
    seenIds.add(id)

    const definition = definitionsById.get(id)
    if (!definition) {
      throw new Error(
        `SEO catalogue cannot find the canonical content package for “${id}”.`,
      )
    }

    const zhCN = definition.content['zh-CN'].name.trim()
    const en = definition.content.en.name.trim()
    if (!zhCN || !en) {
      throw new Error(`SEO catalogue animal “${id}” must have both public names.`)
    }

    return {
      id,
      habitat: definition.habitat,
      zhCN,
      en,
    }
  })
}

const catalogueGroupCopy = {
  land: {
    zhCN: '陆地展厅',
    en: 'Land gallery',
  },
  air: {
    zhCN: '天空展厅',
    en: 'Sky gallery',
  },
  water: {
    zhCN: '水中展厅',
    en: 'Sea gallery',
  },
} as const satisfies Record<Habitat, Pick<CatalogueGroup, 'zhCN' | 'en'>>

const catalogueHabitatOrder = ['land', 'air', 'water'] as const satisfies
  readonly Habitat[]

const catalogueAnimals = createCatalogueEntries(
  mainCollection.animalIds,
  canonicalAnimalDefinitions,
)

const catalogueGroups: readonly CatalogueGroup[] = catalogueHabitatOrder.map(
  (habitat) => ({
    habitat,
    ...catalogueGroupCopy[habitat],
    animals: catalogueAnimals.filter((animal) => animal.habitat === habitat),
  }),
)

export const seoCatalogueAnimalIds = catalogueAnimals.map(({ id }) => id)

const catalogueAnimalCount = seoCatalogueAnimalIds.length

const pageCopy = {
  'x-default': {
    locale: 'x-default',
    htmlLang: 'en',
    brand: 'Leon Made This | Leon做了个',
    title: 'Prehistoric Animal Museum | 史前动物博物馆',
    description: `Choose Simplified Chinese or English for a family-friendly 3D museum featuring ${catalogueAnimalCount} prehistoric animals. 选择简体中文或 English，和孩子一起探索 ${catalogueAnimalCount} 位史前动物朋友。`,
    heading: 'Prehistoric Animal Museum | 史前动物博物馆',
    introduction:
      'A gentle 3D museum for children aged 2–6 and the grown-ups exploring with them. 一座为 2–6 岁孩子和陪伴探索的家长准备的 3D 史前动物博物馆。',
    privacy: `Explore ${catalogueAnimalCount} prehistoric animals from land, sky and sea. No account, advertising or page analytics are used, and narration never starts by itself. 展厅收录陆地、天空与水中的 ${catalogueAnimalCount} 位史前动物，无需账号，没有广告和页面分析，也不会自动播放声音。`,
    catalogueHeading: 'Museum collection | 博物馆藏品',
    languageLabel: 'Choose a language | 选择语言',
    systemLanguageLabel: 'Follow system | 跟随系统',
    socialImageFileName: 'social/museum.png',
    socialImageAlt:
      'Prehistoric Animal Museum — 史前动物博物馆',
  },
  'zh-CN': {
    locale: 'zh-CN',
    htmlLang: 'zh-CN',
    brand: 'Leon做了个',
    title: '史前动物博物馆 | 亲子 3D 史前动物展',
    description: `和孩子一起走进 3D 史前动物博物馆，观察 ${catalogueAnimalCount} 位来自陆地、天空与水中的史前朋友。`,
    heading: '史前动物博物馆',
    introduction:
      '这是一座面向 2–6 岁孩子和家长的 3D 史前动物博物馆。一起转动模型，听观察引导，再读给家长的科学资料。',
    privacy: `展厅收录 ${catalogueAnimalCount} 位来自陆地、天空与水中的史前动物。无需账号，没有广告和页面分析，声音只会在你主动点击后播放。`,
    catalogueHeading: '博物馆藏品',
    languageLabel: '选择语言',
    systemLanguageLabel: '跟随系统',
    socialImageFileName: 'social/museum.zh-CN.png',
    socialImageAlt: '史前动物博物馆亲子 3D 展馆',
  },
  en: {
    locale: 'en',
    htmlLang: 'en',
    brand: 'Leon Made This',
    title: 'Prehistoric Animal Museum | A 3D Family Adventure',
    description: `Explore ${catalogueAnimalCount} prehistoric animals from land, sky and sea in a gentle 3D museum made for young children and their grown-ups.`,
    heading: 'Prehistoric Animal Museum',
    introduction:
      'A gentle 3D museum for children aged 2–6 and the grown-ups exploring with them. Turn each model, listen to a short observation guide and open the grown-up notes when you want to go deeper.',
    privacy: `Meet ${catalogueAnimalCount} prehistoric animals from land, sky and sea. There are no accounts, adverts or page analytics, and narration only plays when you choose it.`,
    catalogueHeading: 'Museum collection',
    languageLabel: 'Choose a language',
    systemLanguageLabel: 'Follow system',
    socialImageFileName: 'social/museum.en.png',
    socialImageAlt:
      'Prehistoric Animal Museum, a 3D family adventure by Leon Made This',
  },
} as const satisfies Record<SeoPageLocale, SeoPageCopy>

const staticShellStyle = `<style id="seo-static-shell-style">
  .seo-static-shell { box-sizing: border-box; min-height: 100vh; height: 100dvh; overflow: auto; padding: clamp(2rem, 6vw, 5rem); color: #20382f; background: linear-gradient(150deg, #eef4df, #d8e7c2 55%, #c2dddb); font-family: "Nunito Variable", "Avenir Next", system-ui, sans-serif; }
  .seo-static-shell :lang(zh-CN) { font-family: "Noto Sans SC Variable", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; }
  .seo-static-shell__inner { width: min(68rem, 100%); margin: 0 auto; }
  .seo-static-shell h1 { max-width: 18ch; margin: 0 0 1rem; font-size: clamp(2rem, 7vw, 5rem); line-height: .98; text-wrap: balance; }
  .seo-static-shell p { max-width: 70ch; font-size: clamp(1rem, 2.2vw, 1.25rem); line-height: 1.65; }
  .seo-static-shell nav { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1.5rem 0 2.5rem; }
  .seo-static-shell a { display: inline-flex; min-height: 3rem; align-items: center; padding: 0 1.1rem; border: 2px solid currentColor; border-radius: 999px; color: inherit; font-weight: 700; }
  .seo-static-shell__catalogue { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 1rem; }
  .seo-static-shell__catalogue section { padding: 1rem 1.25rem; border-radius: 1rem; background: rgb(255 255 255 / .55); }
  .seo-static-shell__catalogue h2 { margin-top: 0; font-size: 1.15rem; }
  .seo-static-shell__catalogue ul { margin-bottom: 0; padding-inline-start: 1.25rem; line-height: 1.75; }
</style>`

function resolveOptions(options: MultilingualSeoOptions): ResolvedSeoOptions {
  const rawOrigin = options.siteOrigin ?? defaultOptions.siteOrigin
  const rawMuseumPath = options.museumPath ?? defaultOptions.museumPath
  const rawNotFoundReturnPath =
    options.notFoundReturnPath ?? defaultOptions.notFoundReturnPath
  const siteOrigin = rawOrigin.replace(/\/+$/, '')
  const museumPath = `/${rawMuseumPath.split('/').filter(Boolean).join('/')}/`
  const notFoundReturnPath = `/${rawNotFoundReturnPath
    .split('/')
    .filter(Boolean)
    .join('/')}/`

  if (!/^https:\/\//.test(siteOrigin)) {
    throw new Error('SEO siteOrigin must be an absolute HTTPS origin.')
  }
  if (!rawNotFoundReturnPath.startsWith('/') || rawNotFoundReturnPath.startsWith('//')) {
    throw new Error('SEO notFoundReturnPath must be an absolute path.')
  }

  return { siteOrigin, museumPath, notFoundReturnPath }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function canonicalUrl(
  locale: SeoPageLocale,
  options: ResolvedSeoOptions,
): string {
  const suffix = locale === 'x-default' ? '' : `${locale}/`
  return `${options.siteOrigin}${options.museumPath}${suffix}`
}

function renderHead(copy: SeoPageCopy, options: ResolvedSeoOptions): string {
  const canonical = canonicalUrl(copy.locale, options)
  const socialImage = `${options.siteOrigin}${options.museumPath}${copy.socialImageFileName}`
  const ogLocale = copy.locale === 'zh-CN' ? 'zh_CN' : 'en_GB'
  const ogAlternate = copy.locale === 'zh-CN' ? 'en_GB' : 'zh_CN'

  return `<title>${escapeHtml(copy.title)}</title>
    <meta name="description" content="${escapeHtml(copy.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="zh-CN" href="${escapeHtml(canonicalUrl('zh-CN', options))}" />
    <link rel="alternate" hreflang="en" href="${escapeHtml(canonicalUrl('en', options))}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonicalUrl('x-default', options))}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(copy.brand)}" />
    <meta property="og:locale" content="${ogLocale}" />
    <meta property="og:locale:alternate" content="${ogAlternate}" />
    <meta property="og:title" content="${escapeHtml(copy.title)}" />
    <meta property="og:description" content="${escapeHtml(copy.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(socialImage)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(copy.socialImageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(copy.title)}" />
    <meta name="twitter:description" content="${escapeHtml(copy.description)}" />
    <meta name="twitter:image" content="${escapeHtml(socialImage)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(copy.socialImageAlt)}" />
    ${staticShellStyle}`
}

function languageLinks(
  locale: SeoPageLocale,
  copy: SeoPageCopy,
): string {
  const rootHref = locale === 'x-default' ? './' : '../'
  const zhCNHref =
    locale === 'x-default' ? './zh-CN/' : locale === 'zh-CN' ? './' : '../zh-CN/'
  const enHref =
    locale === 'x-default' ? './en/' : locale === 'en' ? './' : '../en/'

  const navigationLabel =
    locale === 'x-default' ? 'Choose a language' : copy.languageLabel
  const systemLabel =
    locale === 'x-default'
      ? '<span lang="en">Follow system</span> | <span lang="zh-CN">跟随系统</span>'
      : escapeHtml(copy.systemLanguageLabel)

  return `<nav aria-label="${escapeHtml(navigationLabel)}">
        <a href="${rootHref}" hreflang="x-default">${systemLabel}</a>
        <a href="${zhCNHref}" hreflang="zh-CN" lang="zh-CN">简体中文</a>
        <a href="${enHref}" hreflang="en" lang="en">English</a>
      </nav>`
}

function catalogueNameMarkup(
  animal: CatalogueEntry,
  locale: SeoPageLocale,
): string {
  if (locale === 'zh-CN') {
    return escapeHtml(animal.zhCN)
  }
  if (locale === 'en') {
    return escapeHtml(animal.en)
  }
  return `<span lang="en">${escapeHtml(animal.en)}</span> / <span lang="zh-CN">${escapeHtml(animal.zhCN)}</span>`
}

function catalogueGroupHeadingMarkup(
  group: CatalogueGroup,
  locale: SeoPageLocale,
): string {
  if (locale === 'zh-CN') {
    return escapeHtml(group.zhCN)
  }
  if (locale === 'en') {
    return escapeHtml(group.en)
  }
  return `<span lang="en">${escapeHtml(group.en)}</span> / <span lang="zh-CN">${escapeHtml(group.zhCN)}</span>`
}

function renderCatalogue(locale: SeoPageLocale): string {
  return catalogueGroups
    .map(
      (group) => `<section data-habitat="${group.habitat}">
          <h2>${catalogueGroupHeadingMarkup(group, locale)}</h2>
          <ul>${group.animals
            .map(
              (animal) =>
                `<li data-animal-id="${animal.id}">${catalogueNameMarkup(animal, locale)}</li>`,
            )
            .join('')}</ul>
        </section>`,
    )
    .join('')
}

function renderShell(copy: SeoPageCopy): string {
  const heading =
    copy.locale === 'x-default'
      ? '<span lang="en">Prehistoric Animal Museum</span> | <span lang="zh-CN">史前动物博物馆</span>'
      : escapeHtml(copy.heading)
  const introduction =
    copy.locale === 'x-default'
      ? '<span lang="en">A gentle 3D museum for children aged 2–6 and the grown-ups exploring with them.</span> <span lang="zh-CN">一座为 2–6 岁孩子和陪伴探索的家长准备的 3D 史前动物博物馆。</span>'
      : escapeHtml(copy.introduction)
  const privacy =
    copy.locale === 'x-default'
      ? `<span lang="en">Explore ${catalogueAnimalCount} prehistoric animals from land, sky and sea. No account, advertising or page analytics are used, and narration never starts by itself.</span> <span lang="zh-CN">展厅收录陆地、天空与水中的 ${catalogueAnimalCount} 位史前动物，无需账号，没有广告和页面分析，也不会自动播放声音。</span>`
      : escapeHtml(copy.privacy)
  const catalogueHeading =
    copy.locale === 'x-default'
      ? '<span lang="en">Museum collection</span> | <span lang="zh-CN">博物馆藏品</span>'
      : escapeHtml(copy.catalogueHeading)

  return `<main class="seo-static-shell" data-seo-shell="${copy.locale}">
    <div class="seo-static-shell__inner">
      <h1>${heading}</h1>
      <p>${introduction}</p>
      <p>${privacy}</p>
      ${languageLinks(copy.locale, copy)}
      <h2>${catalogueHeading}</h2>
      <div class="seo-static-shell__catalogue" data-seo-catalogue>
        ${renderCatalogue(copy.locale)}
      </div>
    </div>
  </main>`
}

function removeExistingSeoHead(html: string): string {
  return html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/gi, '')
    .replace(
      /<meta\b(?=[^>]*(?:name=["'](?:description|robots|twitter:[^"']+)["']|property=["']og:[^"']+["']))[^>]*>\s*/gi,
      '',
    )
    .replace(
      /<link\b(?=[^>]*rel=["'](?:canonical|alternate)["'])[^>]*>\s*/gi,
      '',
    )
    .replace(
      /<style\b[^>]*id=["']seo-static-shell-style["'][^>]*>[\s\S]*?<\/style>\s*/gi,
      '',
    )
}

function rebaseDocumentAssets(html: string): string {
  return html.replace(
    /<(?:script|link|img|source|video)\b[^>]*>/gi,
    (assetTag) =>
      assetTag.replace(/\b(src|href|poster)=(['"])\.\//g, '$1=$2../'),
  )
}

export function renderSeoDocument(
  builtAppHtml: string,
  locale: SeoPageLocale,
  rawOptions: MultilingualSeoOptions = {},
): string {
  const options = resolveOptions(rawOptions)
  const copy = pageCopy[locale]
  let html = removeExistingSeoHead(builtAppHtml)

  if (!/<html\b[^>]*\blang=["'][^"']*["']/i.test(html)) {
    throw new Error('Built application HTML must declare an html lang attribute.')
  }
  if (!/<\/head>/i.test(html)) {
    throw new Error('Built application HTML is missing </head>.')
  }
  if (!/<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i.test(html)) {
    throw new Error('Built application HTML is missing the #root element.')
  }

  html = html.replace(
    /(<html\b[^>]*\blang=)["'][^"']*["']/i,
    `$1"${copy.htmlLang}"`,
  )
  html = html.replace(/<\/head>/i, `    ${renderHead(copy, options)}\n  </head>`)
  html = html.replace(
    /<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i,
    `<div id="root">${renderShell(copy)}</div>`,
  )

  return locale === 'x-default' ? html : rebaseDocumentAssets(html)
}

function renderSitemap(options: ResolvedSeoOptions): string {
  const urls: readonly SeoPageLocale[] = ['x-default', 'zh-CN', 'en']
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (locale) => `  <url>
    <loc>${escapeHtml(canonicalUrl(locale, options))}</loc>
  </url>`,
  )
  .join('\n')}
</urlset>
`
}

function renderNotFound(options: ResolvedSeoOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, follow" />
    <title>Page not found | 页面没有找到</title>
    <style>body{margin:0;padding:3rem;background:#d8e7c2;color:#20382f;font:1.1rem/1.6 system-ui,sans-serif}main{max-width:42rem;margin:auto}a{color:inherit;font-weight:700}</style>
  </head>
  <body>
    <main>
      <h1>404 · Page not found · <span lang="zh-CN">页面没有找到</span></h1>
      <p><span lang="en">The trail ends here.</span> <span lang="zh-CN">这条参观路线暂时走不通。</span></p>
      <p><a data-museum-return href="${escapeHtml(options.notFoundReturnPath)}"><span lang="en">Return to the museum</span> · <span lang="zh-CN">返回博物馆</span></a></p>
    </main>
  </body>
</html>
`
}

const socialLatinFontData = readFileSync(
  resolve(
    process.cwd(),
    'node_modules/@fontsource-variable/fredoka/files/fredoka-latin-wght-normal.woff2',
  ),
).toString('base64')
const socialChineseFontData = readFileSync(
  resolve(
    process.cwd(),
    'node_modules/@fontsource/zcool-kuaile/files/zcool-kuaile-chinese-simplified-400-normal.woff2',
  ),
).toString('base64')

function socialCardFontStyles(): string {
  return `<style>
    @font-face { font-family: "Museum Latin"; src: url("data:font/woff2;base64,${socialLatinFontData}") format("woff2"); font-style: normal; font-weight: 300 700; }
    @font-face { font-family: "Museum Chinese"; src: url("data:font/woff2;base64,${socialChineseFontData}") format("woff2"); font-style: normal; font-weight: 400; }
  </style>`
}

function renderSocialCard(
  locale: SeoPageLocale,
  embedFonts = false,
): string {
  const copy = pageCopy[locale]
  const titleLines =
    locale === 'zh-CN'
      ? ['史前动物博物馆']
      : locale === 'en'
        ? ['Prehistoric Animal', 'Museum']
        : ['Prehistoric Animal Museum', '史前动物博物馆']
  const titleFontSize = locale === 'x-default' ? 58 : 68
  const titleStartY = titleLines.length === 1 ? 270 : 225
  const titleMarkup = titleLines
    .map(
      (line, index) =>
        `<tspan x="125" y="${titleStartY + index * 76}">${escapeHtml(line)}</tspan>`,
    )
    .join('')
  const subtitle =
    locale === 'zh-CN'
      ? `和孩子一起探索 ${catalogueAnimalCount} 位史前动物朋友`
      : locale === 'en'
        ? `Meet ${catalogueAnimalCount} prehistoric animals in 3D`
        : 'A bilingual 3D family museum · 双语亲子 3D 博物馆'
  const galleryLabel =
    locale === 'zh-CN'
      ? '陆地 · 天空 · 水中'
      : locale === 'en'
        ? 'Land · Sky · Sea'
        : 'Land · Sky · Sea | 陆地 · 天空 · 水中'
  const fontFamily = embedFonts
    ? 'Museum Latin, Museum Chinese'
    : 'ui-rounded, system-ui, sans-serif'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">${escapeHtml(copy.socialImageAlt)}</title>
  <desc id="description">${escapeHtml(subtitle)}</desc>
  <defs>
    ${embedFonts ? socialCardFontStyles() : ''}
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef4df"/><stop offset=".58" stop-color="#d8e7c2"/><stop offset="1" stop-color="#9dc8c5"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#173a35" flood-opacity=".2"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#background)"/>
  <circle cx="1030" cy="120" r="180" fill="#fff" opacity=".25"/>
  <circle cx="1040" cy="570" r="270" fill="#487e70" opacity=".13"/>
  <g fill="#315f53" opacity=".7"><path d="M920 430c65-90 153-100 222-34-52 1-77 24-84 70-42-46-85-57-138-36Z"/><path d="M827 494c53-64 119-63 166-7-40-5-62 11-73 46-28-38-58-51-93-39Z"/></g>
  <g filter="url(#shadow)">
    <rect x="72" y="70" width="860" height="490" rx="44" fill="#fff" opacity=".84"/>
    <text x="125" y="145" fill="#51766b" font-family="${fontFamily}" font-size="28" font-weight="700">${escapeHtml(copy.brand)}</text>
    <text fill="#20382f" font-family="${fontFamily}" font-size="${titleFontSize}" font-weight="700">${titleMarkup}</text>
    <text x="125" y="382" fill="#355b50" font-family="${fontFamily}" font-size="31" font-weight="600">${escapeHtml(subtitle)}</text>
    <g transform="translate(125 420)" fill="#d6724d"><circle cx="33" cy="33" r="33"/><circle cx="111" cy="33" r="33"/><circle cx="189" cy="33" r="33"/></g>
    <text x="125" y="525" fill="#527a6e" font-family="${fontFamily}" font-size="25">${escapeHtml(galleryLabel)}</text>
  </g>
</svg>
`
}

export async function renderSocialCardPng(
  locale: SeoPageLocale,
): Promise<Buffer> {
  return sharp(Buffer.from(renderSocialCard(locale, true)))
    .png({ compressionLevel: 9 })
    .toBuffer()
}

export function createSeoSocialCardManifest(): SeoSocialCardManifest {
  const cards = Object.fromEntries(
    (['x-default', 'zh-CN', 'en'] as const).map((locale) => [
      locale,
      {
        fileName: pageCopy[locale].socialImageFileName.replace('social/', ''),
        sourceSha256: createHash('sha256')
          .update(renderSocialCard(locale, true))
          .digest('hex'),
      },
    ]),
  ) as SeoSocialCardManifest['cards']
  return { version: 1, width: 1200, height: 630, cards }
}

export function createMultilingualSeoArtifacts(
  builtAppHtml: string,
  rawOptions: MultilingualSeoOptions = {},
): ReadonlyMap<string, string> {
  const options = resolveOptions(rawOptions)
  return new Map([
    ['index.html', renderSeoDocument(builtAppHtml, 'x-default', options)],
    ['zh-CN/index.html', renderSeoDocument(builtAppHtml, 'zh-CN', options)],
    ['en/index.html', renderSeoDocument(builtAppHtml, 'en', options)],
    [
      'robots.txt',
      `User-agent: *\nAllow: /\nSitemap: ${options.siteOrigin}/sitemap.xml\n`,
    ],
    ['sitemap.xml', renderSitemap(options)],
    ['404.html', renderNotFound(options)],
    ['social/museum.svg', renderSocialCard('x-default')],
    ['social/museum.zh-CN.svg', renderSocialCard('zh-CN')],
    ['social/museum.en.svg', renderSocialCard('en')],
  ])
}

export function multilingualSeoPlugin(
  options: MultilingualSeoOptions = {},
): Plugin {
  return {
    name: 'multilingual-static-seo',
    apply: 'build',
    async writeBundle(outputOptions) {
      const outputDirectory = resolve(outputOptions.dir ?? 'dist')
      const indexPath = resolve(outputDirectory, 'index.html')
      const builtAppHtml = await readFile(indexPath, 'utf8')
      const artifacts = createMultilingualSeoArtifacts(builtAppHtml, options)

      for (const [fileName, source] of artifacts) {
        const outputPath = resolve(outputDirectory, fileName)
        await mkdir(dirname(outputPath), { recursive: true })
        await writeFile(outputPath, source, 'utf8')
      }

      const expectedManifest = createSeoSocialCardManifest()
      const manifestPath = resolve(outputDirectory, 'social/manifest.json')
      const actualManifest = JSON.parse(
        await readFile(manifestPath, 'utf8'),
      ) as unknown
      if (
        JSON.stringify(actualManifest) !== JSON.stringify(expectedManifest)
      ) {
        throw new Error(
          `SEO social card manifest is stale; run npm run generate:seo-social-cards: ${manifestPath}`,
        )
      }

      // Raster output can vary between librsvg/Pango versions. The manifest
      // binds each checked-in image to all copy, layout and embedded-font
      // inputs; the build separately verifies the scraper-required dimensions.
      for (const locale of ['x-default', 'zh-CN', 'en'] as const) {
        const cardPath = resolve(
          outputDirectory,
          pageCopy[locale].socialImageFileName,
        )
        const actualCard = await readFile(cardPath)
        const metadata = await sharp(actualCard).metadata()
        if (
          metadata.format !== 'png' ||
          metadata.width !== 1200 ||
          metadata.height !== 630
        ) {
          throw new Error(
              `SEO social card must be a 1200×630 PNG: ${cardPath}`,
            )
        }
      }
    },
  }
}
