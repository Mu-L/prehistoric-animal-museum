import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  buildLocaleUrl,
  localePreferenceStorageKey,
  systemLocale,
  type Locale,
  type LocalePreference,
} from './locale'
import { readInitialLocaleState } from './browser-locale'
import { messagesFor, type MuseumMessages } from './messages'

interface I18nContextValue {
  readonly locale: Locale
  readonly preference: LocalePreference
  readonly messages: MuseumMessages
  readonly setPreference: (preference: LocalePreference) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState(readInitialLocaleState)

  const setPreference = useCallback((preference: LocalePreference) => {
    const locale =
      preference === 'system'
        ? systemLocale(
            navigator.languages.length > 0
              ? navigator.languages
              : [navigator.language],
          )
        : preference

    try {
      if (preference === 'system') {
        window.localStorage.removeItem(localePreferenceStorageKey)
      } else {
        window.localStorage.setItem(localePreferenceStorageKey, preference)
      }
    } catch {
      // Storage can be unavailable in privacy modes. The current visit still
      // changes language and receives the corresponding shareable path.
    }

    const nextUrl = buildLocaleUrl(window.location.href, preference)
    window.history.replaceState(window.history.state, '', nextUrl)
    setState({ locale, preference })
  }, [])

  useEffect(() => {
    document.documentElement.lang = state.locale
    document.documentElement.dataset.locale = state.locale
  }, [state.locale])

  useEffect(() => {
    if (state.preference !== 'system') {
      return
    }
    const handleLanguageChange = () => {
      const locale = systemLocale(
        navigator.languages.length > 0
          ? navigator.languages
          : [navigator.language],
      )
      setState((current) =>
        current.preference === 'system' && current.locale !== locale
          ? { locale, preference: 'system' }
          : current,
      )
    }
    window.addEventListener('languagechange', handleLanguageChange)
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange)
    }
  }, [state.preference])

  const value = useMemo<I18nContextValue>(
    () => ({
      ...state,
      messages: messagesFor(state.locale),
      setPreference,
    }),
    [setPreference, state],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// This hook intentionally shares its context module with the provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider.')
  }
  return context
}
