import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../context/LanguageContext'

export function LandingAbout() {
  const { t } = useTranslation()

  const stats = [
    {
      value: t('landing.about.statPrecisionVal'),
      label: t('landing.about.statPrecisionLabel'),
      desc: t('landing.about.statPrecisionDesc'),
    },
    {
      value: t('landing.about.statBlocksVal'),
      label: t('landing.about.statBlocksLabel'),
      desc: t('landing.about.statBlocksDesc'),
    },
    {
      value: t('landing.about.statWorkforceVal'),
      label: t('landing.about.statWorkforceLabel'),
      desc: t('landing.about.statWorkforceDesc'),
    },
    {
      value: t('landing.about.statTraceableVal'),
      label: t('landing.about.statTraceableLabel'),
      desc: t('landing.about.statTraceableDesc'),
    },
  ]

  return (
    <section id="about" className="section section--about">
      <div className="section-container">
        {/* Eyebrow */}
        <span className="section-eyebrow">{t('landing.about.eyebrow')}</span>

        {/* Header split */}
        <div className="about-header-grid">
          <div className="about-header-left">
            <h2 className="section-title">
              {t('landing.about.titlePart1')} <br />
              {t('landing.about.titlePart2')}
            </h2>
          </div>

          <div className="about-header-right">
            <p>
              {t('landing.about.description')}
            </p>
            <Link to="/map" className="link-arrow">
              <span>{t('landing.about.exploreAnalytics')}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Panoramic Landscape Card */}
        <div className="about-panoramic-card">
          <img
            src="/images/about_panoramic.jpg"
            alt="Panoramic view of Weddamulle tea estate and factory in Sri Lanka"
            loading="lazy"
          />
          <div className="about-panoramic-badge">
            <span>{t('landing.about.badgeTitle')}</span>
            <small>{t('landing.about.badgeSubtitle')}</small>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <span className="stat-card__value">{stat.value}</span>
              <strong className="stat-card__label">{stat.label}</strong>
              <p className="stat-card__desc">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

