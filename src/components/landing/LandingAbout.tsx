import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingAbout() {
  const stats = [
    {
      value: '95%',
      label: 'Inspection Precision',
      desc: 'Sub-meter GIS vector boundary demarcation and spatial polygon alignment across all terrain.',
    },
    {
      value: '100+',
      label: 'Active Cultivar Blocks',
      desc: 'High-yielding clonal and seedling tea fields under active digital agronomy management.',
    },
    {
      value: '400+',
      label: 'Estate Workforce',
      desc: 'Dedicated tea pluckers, field officers, and agronomists across 5 mountain divisions.',
    },
    {
      value: '100%',
      label: 'Traceable Harvest',
      desc: 'Single-origin pure Ceylon tea certified from block harvest to export processing.',
    },
  ]

  return (
    <section id="about" className="section section--about">
      <div className="section-container">
        {/* Eyebrow */}
        <span className="section-eyebrow">About Us</span>

        {/* Header split */}
        <div className="about-header-grid">
          <div className="about-header-left">
            <h2 className="section-title">
              Cultivating a Future of <br />
              Sustainable Agriculture
            </h2>
          </div>

          <div className="about-header-right">
            <p>
              Weddamulle Plantation spans five micro climatic divisions across the mist shrouded
              highlands of Sri Lanka. By pairing generational estate craftsmanship with high-resolution
              orthophoto GIS mapping, we ensure ecological soil conservation, optimal fertilizer regimes,
              and sustainable high elevation Ceylon tea production.
            </p>
            <Link to="/map" className="link-arrow">
              <span>Explore GIS Field Analytics</span>
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
            <span>Weddamulle Central Highland Estate</span>
            <small>5 Divisions · 218 Field Polygons</small>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
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
