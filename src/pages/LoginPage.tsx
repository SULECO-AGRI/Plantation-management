import React from 'react'
import { Link } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { CropLensBrand } from '../components/navigation/CropLensBrand'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'
import { useTranslation } from '../context/LanguageContext'

export function LoginPage() {
  const { t, locale } = useTranslation()

  return (
    <div className="login-page-container">
      <div className="login-page-topbar">
        <Link to="/" className="login-page-brand">
          <CropLensBrand />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <LanguageSwitcher />
          <Link to="/" className="login-page-back-link">
            &larr; {t('auth.returnOverview')}
          </Link>
        </div>
      </div>

      <main className="login-page-main">
        <LoginForm />
      </main>

      <footer className="login-page-footer">
        <p>
          {locale === 'si'
            ? 'වටවල ප්ලාන්ටේෂන්ස් පීඑල්සී • භූගෝලීය තොරතුරු පද්ධති (GIS) • භූමිකාව පදනම් කරගත් ප්‍රවේශ පාලනය'
            : 'Watawala Plantations PLC • Geographic Information Systems • Role-Based Access Control'}
        </p>
      </footer>
    </div>
  )
}
