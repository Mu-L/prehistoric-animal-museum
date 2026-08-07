import { buildLocaleUrl, localeFromPath, type Locale } from './locale'

export interface LocalizedMetadata {
  readonly locale: Locale
  readonly documentTitle: string
  readonly museumTitle: string
  readonly creatorBrand: string
  readonly description: string
  readonly socialImageAlt: string
}

function ensureMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
): void {
  let element = document.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  )
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

type MetadataVariant = Locale | 'x-default'

function canonicalFor(variant: MetadataVariant): string {
  const explicit = document.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${variant}"]`,
  )?.href
  if (explicit) {
    return explicit
  }

  const root = document.querySelector<HTMLLinkElement>(
    'link[rel="alternate"][hreflang="x-default"]',
  )?.href
  if (root) {
    return variant === 'x-default'
      ? root
      : new URL(`${variant}/`, root).href
  }

  const stateFreeUrl = new URL(window.location.href)
  stateFreeUrl.search = ''
  stateFreeUrl.hash = ''
  return new URL(
    buildLocaleUrl(
      stateFreeUrl.href,
      variant === 'x-default' ? 'system' : variant,
    ),
    stateFreeUrl.origin,
  ).href
}

function ensureCanonical(href: string): void {
  let canonical = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = href
}

export function updateLocalizedMetadata({
  locale,
  documentTitle,
  museumTitle,
  creatorBrand,
  description,
  socialImageAlt,
}: LocalizedMetadata): void {
  const variant = localeFromPath(window.location.pathname) ?? 'x-default'
  const canonical = canonicalFor(variant)
  const ogLocale = locale === 'zh-CN' ? 'zh_CN' : 'en_GB'
  const alternateLocale = locale === 'zh-CN' ? 'en_GB' : 'zh_CN'
  const socialImageFileName =
    variant === 'x-default' ? 'museum.png' : `museum.${variant}.png`
  const socialImage = new URL(
    `social/${socialImageFileName}`,
    canonicalFor('x-default'),
  ).href

  document.title = documentTitle
  ensureCanonical(canonical)
  ensureMeta('name', 'description', description)
  ensureMeta('property', 'og:site_name', creatorBrand)
  ensureMeta('property', 'og:locale', ogLocale)
  ensureMeta('property', 'og:locale:alternate', alternateLocale)
  ensureMeta('property', 'og:title', museumTitle)
  ensureMeta('property', 'og:description', description)
  ensureMeta('property', 'og:url', canonical)
  ensureMeta('property', 'og:image', socialImage)
  ensureMeta('property', 'og:image:type', 'image/png')
  ensureMeta('property', 'og:image:width', '1200')
  ensureMeta('property', 'og:image:height', '630')
  ensureMeta('property', 'og:image:alt', socialImageAlt)
  ensureMeta('name', 'twitter:card', 'summary_large_image')
  ensureMeta('name', 'twitter:title', museumTitle)
  ensureMeta('name', 'twitter:description', description)
  ensureMeta('name', 'twitter:image', socialImage)
  ensureMeta('name', 'twitter:image:alt', socialImageAlt)
}
