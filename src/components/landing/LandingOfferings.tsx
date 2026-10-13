import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingOfferings() {
  const offerings = [
    {
      num: '01',
      title: 'Digital Field & Boundary Mapping',
      desc: 'Clear digital maps of all 218 field plots, showing exact field boundaries, hill slopes, and division zones on your screen.',
    },
    {
      num: '02',
      title: 'Soil & Fertilizer Planning',
      desc: 'Simple fertilizer schedules and soil care routines to keep tea plants well-fed and growing healthy green leaves.',
    },
    {
      num: '03',
      title: 'Harvest & Crop Health Tracking',
      desc: 'Track daily leaf harvest weights by division, watch seasonal crop trends, and protect bushes from plant disease.',
    },
  ]

  return (
    <section id="offerings" className="section section--offerings">
      <div className="section-container">
        {/* Eyebrow & Title */}
        <div className="section-header-center">
          <h2 className="section-title section-title--center">
            What We Offer
          </h2>
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
              Everything you need to manage your land, keep soil healthy, and track your daily tea harvest
              using simple digital tools.
            </p>

            <div className="offerings-badges-grid">
              <div className="offering-badge">
                <div>
                  <strong>25+ Years</strong>
                  <small>Estate Experience</small>
                </div>
              </div>
              <div className="offering-badge">
                <div>
                  <strong>100%</strong>
                  <small>Pure Ceylon Tea</small>
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

        {/* Bottom 2-Col Row */}
        <div className="offerings-bottom-grid">
          {/* Left Forest Card */}
          <div className="offerings-cta-card">
            <div className="offerings-cta-card__top">
              <span className="offerings-cta-tag">Interactive Map</span>
              <Link to="/map" className="circle-arrow-link" aria-label="Explore estate fields">
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <h3>Explore Estate Fields &amp; Crops</h3>
            <p>
              See how we map fields, care for tea bushes, and protect natural forest cover across all 5 divisions.
            </p>
            <Link to="/map" className="btn btn--white btn--sm">
              <span>Explore Interactive Map</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Right Numbered Feature Rows */}
          <div className="offerings-list">
            {offerings.map((item) => (
              <div key={item.num} className="offering-item">
                <div className="offering-item__num">{item.num}</div>
                <div className="offering-item__content">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
