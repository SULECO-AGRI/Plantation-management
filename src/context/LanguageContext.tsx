import React, { createContext, useContext, useEffect, useState } from 'react'
import enTranslations from '../locales/en.json'
import siTranslations from '../locales/si.json'

export type Locale = 'en' | 'si'

type TranslationDict = typeof enTranslations

const TRANSLATIONS: Record<Locale, TranslationDict> = {
  en: enTranslations,
  si: siTranslations,
}

const STORAGE_KEY = 'app_locale'
const COOKIE_NAME = 'app_locale'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return matches ? decodeURIComponent(matches[1]) : null
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function detectInitialLocale(): Locale {
  // 1. Check localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'si') return saved
  } catch {
    // ignore storage error
  }

  // 2. Check cookie
  const cookieLocale = getCookie(COOKIE_NAME) || getCookie('NEXT_LOCALE')
  if (cookieLocale === 'en' || cookieLocale === 'si') return cookieLocale

  // 3. Check browser language (navigator.language)
  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('si')) {
      return 'si'
    }
  }

  return 'en'
}

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)

  const applyLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch {
      // ignore
    }
    setCookie(COOKIE_NAME, newLocale)

    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale
      document.documentElement.setAttribute('data-lang', newLocale)
    }
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
      document.documentElement.setAttribute('data-lang', locale)
    }
  }, [locale])

  const toggleLocale = () => {
    applyLocale(locale === 'en' ? 'si' : 'en')
  }

  const t = (path: string, vars?: Record<string, string | number>): string => {
    const keys = path.split('.')
    let current: any = TRANSLATIONS[locale]
    let fallback: any = TRANSLATIONS.en

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        current = undefined
        break
      }
    }

    // Fallback to English if missing in Sinhala
    if (current === undefined || current === null) {
      for (const k of keys) {
        if (fallback && typeof fallback === 'object' && k in fallback) {
          fallback = fallback[k]
        } else {
          fallback = undefined
          break
        }
      }
      current = fallback
    }

    if (typeof current !== 'string') {
      return path
    }

    if (!vars) return current

    return Object.entries(vars).reduce((acc, [k, v]) => {
      return acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
    }, current)
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale: applyLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}

export const useLanguage = useTranslation
