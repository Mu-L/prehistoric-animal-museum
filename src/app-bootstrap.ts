import { animalIdPattern } from './content/types'
import { isLocale, type Locale, type LocalePreference } from './i18n/locale'

export const appBootstrapElementId = 'museum-bootstrap'

export interface InitialAppState {
  readonly animalId: string
  readonly locale: Locale
  readonly preference: LocalePreference
  readonly rootFallback?: boolean
}

export function readInitialAppState(
  source: Pick<Document, 'getElementById'> = document,
): InitialAppState | null {
  const element = source.getElementById(appBootstrapElementId)
  if (!element?.textContent) {
    return null
  }

  try {
    const value: unknown = JSON.parse(element.textContent)
    if (!value || typeof value !== 'object') {
      return null
    }
    const candidate = value as Record<string, unknown>
    if (
      typeof candidate.animalId !== 'string' ||
      !animalIdPattern.test(candidate.animalId) ||
      !isLocale(candidate.locale) ||
      (candidate.preference !== 'system' &&
        !isLocale(candidate.preference)) ||
      (candidate.rootFallback !== undefined &&
        typeof candidate.rootFallback !== 'boolean')
    ) {
      return null
    }
    return {
      animalId: candidate.animalId,
      locale: candidate.locale,
      preference: candidate.preference,
      ...(candidate.rootFallback === true ? { rootFallback: true } : {}),
    }
  } catch {
    return null
  }
}
