import React from 'react'
import { Globe } from 'lucide-react'
import { useTranslation } from '../../context/LanguageContext'

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { locale, setLocale } = useTranslation()

  return (
    <div
      className={`lang-switcher ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <div className="lang-switcher__icon" aria-hidden="true">
        <Globe size={13} />
      </div>
      <div className="lang-switcher__pills">
        <button
          type="button"
          className={`lang-btn ${locale === 'en' ? 'lang-btn--active' : ''}`}
          onClick={() => setLocale('en')}
          aria-pressed={locale === 'en'}
          title="Switch to English"
        >
          EN
        </button>
        <span className="lang-divider" aria-hidden="true">/</span>
        <button
          type="button"
          className={`lang-btn ${locale === 'si' ? 'lang-btn--active' : ''}`}
          onClick={() => setLocale('si')}
          aria-pressed={locale === 'si'}
          title="සිංහල භාෂාවට මාරු වන්න"
        >
          සිංහල
        </button>
      </div>
    </div>
  )
}
