export const supportedLocales = ['zh-CN', 'en'] as const

export type Locale = (typeof supportedLocales)[number]
export type LocalePreference = Locale | 'system'
export type LocaleSource = 'path' | 'saved' | 'system'

export const localePreferenceStorageKey = 'museum.locale'

export interface LocaleResolutionInput {
  readonly pathname: string
  readonly savedPreference: string | null | undefined
  readonly navigatorLanguages: readonly string[]
}

export interface LocaleResolution {
  readonly locale: Locale
  readonly source: LocaleSource
}

export function isLocale(value: unknown): value is Locale {
  return value === 'zh-CN' || value === 'en'
}

export function localeFromPath(pathname: string): Locale | null {
  const match = pathname.match(
    /(?:^|\/)(zh-CN|en)(?:\/index\.html|\/)?$/,
  )
  return match && isLocale(match[1]) ? match[1] : null
}

export function systemLocale(languages: readonly string[]): Locale {
  const primaryLanguage = languages[0]?.trim().toLowerCase() ?? ''
  return primaryLanguage === 'zh' || primaryLanguage.startsWith('zh-')
    ? 'zh-CN'
    : 'en'
}

export function resolveLocale({
  pathname,
  savedPreference,
  navigatorLanguages,
}: LocaleResolutionInput): LocaleResolution {
  const pathLocale = localeFromPath(pathname)
  if (pathLocale) {
    return { locale: pathLocale, source: 'path' }
  }

  if (isLocale(savedPreference)) {
    return { locale: savedPreference, source: 'saved' }
  }

  return { locale: systemLocale(navigatorLanguages), source: 'system' }
}

function rootPathFor(pathname: string): string {
  const normalisedPath = pathname.replace(/\/index\.html\/?$/, '/')
  const localeSuffix = normalisedPath.match(/^(.*\/)(?:zh-CN|en)\/?$/)
  if (localeSuffix?.[1]) {
    return localeSuffix[1]
  }

  if (normalisedPath.endsWith('/')) {
    return normalisedPath
  }
  return `${normalisedPath}/`
}

export function buildLocaleUrl(
  currentUrl: string,
  preference: LocalePreference,
): string {
  const url = new URL(currentUrl, 'http://localhost')
  const rootPath = rootPathFor(url.pathname)
  url.pathname =
    preference === 'system' ? rootPath : `${rootPath}${preference}/`
  return `${url.pathname}${url.search}${url.hash}`
}
