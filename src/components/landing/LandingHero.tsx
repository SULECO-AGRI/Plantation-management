import { ArrowRight, ArrowUpRight, Award, Leaf, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../context/LanguageContext'
import { LandingNav } from './LandingNav'

export function LandingHero() {
  const { t } = useTranslation()

  return (
    <section className="hero-section">
      <LandingNav />

      <div className="hero-container">
        {/* Main Hero Header */}
        <div className="hero-header">
          <h1 className="hero-title">
            {t('landing.hero.title')}
          </h1>

          <div className="hero-subtitle-wrap">
            <p className="hero-subtitle">
              {t('landing.hero.subtitle')}
            </p>
            <Link to="/map" className="hero-circle-btn" aria-label={t('landing.hero.exploreMap')}>
              <ArrowUpRight size={20} />
            </Link>
          </div>
        </div>

        {/* 3-Column Hero Feature Grid */}
        <div className="hero-grid">
          {/* Left Column: Tall image with bottom card overlay */}
          <div className="hero-card hero-card--tall">
            <div
              className="hero-card__bg"
              style={{ backgroundImage: "url('/images/hero_left.jpg')" }}
            />
            <div className="hero-card__overlay">
              <h3>{t('landing.hero.cardLeftTitle')}</h3>
              <p>{t('landing.hero.cardLeftDesc')}</p>
              <Link to="/map" className="hero-card__link">
                <span>{t('landing.hero.learnMore')}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Center Column: Top card + Bottom image */}
          <div className="hero-col hero-col--center">
            <div className="hero-info-card">
              <div className="hero-info-card__body">
                <div className="hero-info-card__icon">
                  <Sprout size={22} />
                </div>
                <h4>{t('landing.hero.naturalFarmingTitle')}</h4>
                <p>{t('landing.hero.naturalFarmingDesc')}</p>
              </div>
            </div>

            <div className="hero-img-card">
              <img
                src="/images/hero_center.jpg"
                alt={t('landing.hero.macroShootAlt')}
                loading="eager"
              />
            </div>
          </div>

          {/* Right Column: Top image + Bottom card */}
          <div className="hero-col hero-col--right">
            <div className="hero-img-card">
              <img
                src="/images/hero_right.jpg"
                alt={t('landing.hero.mountainSlopesAlt')}
                loading="eager"
              />
            </div>

            <div className="hero-info-card">
              <div className="hero-info-card__body">
                <div className="hero-info-card__icon">
                  <Award size={22} />
                </div>
                <h4>{t('landing.hero.qualityProductsTitle')}</h4>
                <p>{t('landing.hero.qualityProductsDesc')}</p>
              </div>
              <Link to="/map" className="btn btn--secondary btn--sm">
                <Leaf size={14} />
                <span>{t('landing.hero.exploreMap')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

