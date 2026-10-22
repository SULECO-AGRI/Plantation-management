import { Link } from 'react-router-dom'
import { useTranslation } from '../../context/LanguageContext'

export function LandingOfferings() {
  const { t } = useTranslation()

  const offerings = [
    {
      num: '01',
      title: t('landing.offerings.item1Title'),
      tag: t('landing.offerings.item1Tag'),
      desc: t('landing.offerings.item1Desc'),
      link: '/map',
    },
    {
      num: '02',
      title: t('landing.offerings.item2Title'),
      tag: t('landing.offerings.item2Tag'),
      desc: t('landing.offerings.item2Desc'),
      link: '/map?tab=map',
    },
    {
      num: '03',
      title: t('landing.offerings.item3Title'),
      tag: t('landing.offerings.item3Tag'),
      desc: t('landing.offerings.item3Desc'),
      link: '/map?tab=tasks',
    },
    {
      num: '04',
      title: t('landing.offerings.item4Title'),
      tag: t('landing.offerings.item4Tag'),
      desc: t('landing.offerings.item4Desc'),
      link: '/map?tab=workforce',
    },
    {
      num: '05',
      title: t('landing.offerings.item5Title'),
      tag: t('landing.offerings.item5Tag'),
      desc: t('landing.offerings.item5Desc'),
      link: '/map?tab=daily_salary',
    },
    {
      num: '06',
      title: t('landing.offerings.item6Title'),
      tag: t('landing.offerings.item6Tag'),
      desc: t('landing.offerings.item6Desc'),
      link: '/map?tab=harvest',
    },
    {
      num: '07',
      title: t('landing.offerings.item7Title'),
      tag: t('landing.offerings.item7Tag'),
      desc: t('landing.offerings.item7Desc'),
      link: '/map?tab=inventory',
    },
  ]

  return (
    <section id="offerings" className="section section--offerings">
      <div className="section-container">
        {/* Eyebrow & Title */}
        <div className="section-header-center">
          <span className="section-eyebrow">{t('landing.offerings.eyebrow')}</span>
          <h2 className="section-title section-title--center">
            {t('landing.offerings.title')}
          </h2>
          <p className="offerings-header-desc">
            {t('landing.offerings.headerDesc')}
          </p>
        </div>

        {/* Top 3-Col Bento Row */}
        <div className="offerings-top-grid">
          {/* Left image */}
          <div className="offerings-img-card">
            <img
              src="/images/feature_gis.jpg"
              alt="Agronomist surveying tea fields using GIS digital tablet"
              loading="lazy"
            />
          </div>

          {/* Center text & badges */}
          <div className="offerings-center-card">
            <p>
              {t('landing.offerings.centerCardText')}
            </p>

            <div className="offerings-badges-grid">
              <div className="offering-badge">
                <div>
                  <strong>{t('landing.offerings.badgeYears')}</strong>
                  <small>{t('landing.offerings.badgeYearsLabel')}</small>
                </div>
              </div>
              <div className="offering-badge">
                <div>
                  <strong>{t('landing.offerings.badgeCeylon')}</strong>
                  <small>{t('landing.offerings.badgeCeylonLabel')}</small>
                </div>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="offerings-img-card">
            <img
              src="/images/feature_harvest.jpg"
              alt="Freshly plucked green tea leaves in wicker basket"
              loading="lazy"
            />
          </div>
        </div>

        {/* 7-Card Clean Offerings Grid */}
        <div className="offerings-grid">
          {offerings.map((item) => (
            <Link
              key={item.num}
              to={item.link}
              className="offering-card"
            >
              <div className="offering-card__top">
                <span className="offering-card__num">{item.num}</span>
                <span className="offering-card__tag">{item.tag}</span>
              </div>

              <div className="offering-card__body">
                <h3 className="offering-card__title">{item.title}</h3>
                <p className="offering-card__desc">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}



