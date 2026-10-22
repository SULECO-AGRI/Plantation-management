import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../context/LanguageContext'

export function LandingEnterprises() {
  const { t } = useTranslation()

  const enterprises = [
    {
      num: '01',
      title: t('landing.operations.item1Title'),
      desc: t('landing.operations.item1Desc'),
      tag: t('landing.operations.item1Tag'),
    },
    {
      num: '02',
      title: t('landing.operations.item2Title'),
      desc: t('landing.operations.item2Desc'),
      tag: t('landing.operations.item2Tag'),
    },
    {
      num: '03',
      title: t('landing.operations.item3Title'),
      desc: t('landing.operations.item3Desc'),
      tag: t('landing.operations.item3Tag'),
    },
    {
      num: '04',
      title: t('landing.operations.item4Title'),
      desc: t('landing.operations.item4Desc'),
      tag: t('landing.operations.item4Tag'),
    },
  ]

  return (
    <section id="operations" className="section section--enterprises">
      <div className="section-container">
        <div className="enterprises-grid">
          {/* Left Column: Title + Big Image Card */}
          <div className="enterprises-left">
            <h2 className="section-title">
              {t('landing.operations.titlePart1')} <br />
              {t('landing.operations.titlePart2')}
            </h2>

            <div className="enterprises-img-card">
              <img
                src="/images/operations_large.jpg"
                alt="Terraced tea plantation slopes at sunrise"
                loading="lazy"
              />
              <Link to="/map" className="enterprises-img-card__btn" aria-label="Explore GIS Operations">
                <ArrowUpRight size={22} />
              </Link>
            </div>
          </div>

          {/* Right Column: Intro + 4 Clean Row Items */}
          <div className="enterprises-right">
            <div className="enterprises-right__header">
              <p>
                {t('landing.operations.intro')}
              </p>
            </div>

            <div className="enterprises-list">
              {enterprises.map((item) => (
                <div key={item.num} className="enterprise-row">
                  <span className="enterprise-row__num">{item.num}</span>
                  <div className="enterprise-row__info">
                    <div className="enterprise-row__head">
                      <h4>{item.title}</h4>
                      <span className="enterprise-row__tag">{item.tag}</span>
                    </div>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

