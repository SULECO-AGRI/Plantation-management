import { ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../context/LanguageContext'

export function LandingCTA() {
  const { t } = useTranslation()

  return (
    <section className="section section--cta">
      <div className="section-container">
        <div className="cta-banner">
          <h2 className="cta-banner__title">
            {t('landing.cta.titlePart1')} <br />
            {t('landing.cta.titlePart2')}
          </h2>

          <p className="cta-banner__desc">
            {t('landing.cta.desc')}
          </p>

          <div className="cta-banner__actions">
            <Link to="/map" className="btn btn--dark btn--lg">
              <Compass size={18} />
              <span>{t('landing.cta.button')}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

