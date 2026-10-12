import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingEnterprises() {
  const enterprises = [
    {
      num: '01',
      title: 'Fresh Ceylon Tea',
      desc: 'Healthy tea bushes grown across all fields and picked by hand for the best leaf quality.',
      tag: 'Tea Fields',
    },
    {
      num: '02',
      title: 'Shade Trees & Forest Cover',
      desc: 'Trees planted across hill slopes to protect tea crops from harsh sun, wind, and dry weather.',
      tag: 'Forest Area',
    },
    {
      num: '03',
      title: 'Grass Belts & Soil Care',
      desc: 'Thick grass planted along slopes to hold the soil firmly and prevent rainwater runoff.',
      tag: 'Soil Care',
    },
    {
      num: '04',
      title: 'Daily Leaf Collection',
      desc: 'Leaf weighing and quick transport from all 5 divisions straight to the tea factory.',
      tag: '5 Divisions',
    },
  ]

  return (
    <section id="operations" className="section section--enterprises">
      <div className="section-container">
        <div className="enterprises-grid">
          {/* Left Column: Title + Big Image Card */}
          <div className="enterprises-left">
            <h2 className="section-title">
              What We Grow &amp; <br />
              Manage Every Day
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
                We use digital maps to help estate teams care for every acre, keep soil healthy,
                and collect fresh tea leaves on time.
              </p>
            </div>

            <div className="enterprises-list">
              {enterprises.map((item) => (
                <div key={item.title} className="enterprise-row">
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
