import { ArrowUpRight, Check, Compass, Layers, Shield, Sparkles, Sprout, Trees } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingEnterprises() {
  const enterprises = [
    {
      icon: <Sprout size={18} />,
      title: 'Orthodox Ceylon Black Tea',
      desc: 'Single-origin high-grown orthodox grades (OP, BOP, Pekoe) hand-plucked from mature cultivar blocks.',
      tag: 'Tea_ac',
    },
    {
      icon: <Trees size={18} />,
      title: 'Canopy & Shade Conservation',
      desc: 'Albizia and native mountain trees providing natural nitrogen fixation and micro-climate buffering.',
      tag: 'HighVeg_ac',
    },
    {
      icon: <Layers size={18} />,
      title: 'Soil & Grass Buffer Belts',
      desc: 'Contour vetiver and Guatemala grass strips preventing steep slope erosion and preserving watershed basins.',
      tag: 'Grass_ac',
    },
    {
      icon: <Compass size={18} />,
      title: 'Division-Level Harvest Logistics',
      desc: 'Synchronized leaf collection and digital yield dispatch across Ramboda, Wewandon, Lilliesland, Camnethan & Weddamulla.',
      tag: '5 Divisions',
    },
  ]

  return (
    <section id="operations" className="section section--enterprises">
      <div className="section-container">
        <span className="section-eyebrow">Our Plantation Operations</span>

        <div className="enterprises-grid">
          {/* Left Column: Title + Big Image Card */}
          <div className="enterprises-left">
            <h2 className="section-title">
              We&apos;re Leading Agriculture &amp; <br />
              Organic Enterprises
            </h2>

            <div className="enterprises-img-card">
              <img
                src="/images/operations_large.jpg"
                alt="High angle view of geometric tea plantation terraces at sunrise"
                loading="lazy"
              />
              <Link to="/map" className="enterprises-img-card__btn" aria-label="Explore GIS Operations">
                <ArrowUpRight size={22} />
              </Link>
            </div>
          </div>

          {/* Right Column: Intro + Button + 4 Row Items */}
          <div className="enterprises-right">
            <div className="enterprises-right__header">
              <p>
                Weddamulle Estate harmonizes century-old agronomic expertise with digital GIS spatial
                mapping to sustainably cultivate world-class Ceylon tea commodities.
              </p>
              <Link to="/map" className="btn btn--primary btn--sm">
                <span>Explore Estate Map</span>
                <Sparkles size={14} />
              </Link>
            </div>

            <div className="enterprises-list">
              {enterprises.map((item) => (
                <div key={item.title} className="enterprise-row">
                  <div className="enterprise-row__icon">
                    {item.icon}
                  </div>
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
