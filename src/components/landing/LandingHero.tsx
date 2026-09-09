import { ArrowRight, ArrowUpRight, Award, Leaf, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LandingNav } from './LandingNav'

export function LandingHero() {
  return (
    <section className="hero-section">
      <LandingNav />

      <div className="hero-container">
        {/* Main Hero Header */}
        <div className="hero-header">
          <h1 className="hero-title">
            Transforming Plantation Operations
            <br />
            Through{' '}
            <span className="hero-highlight-word">
              Smart
            </span>{' '}
            Digital Mapping
          </h1>

          <div className="hero-subtitle-wrap">
            <p className="hero-subtitle">
              Spatial intelligence, division zoning, and field level harvest logistics
              across 5 divisions and 218 verified agricultural polygons in Nuwara Eliya.
            </p>
            <Link to="/map" className="hero-circle-btn" aria-label="Explore GIS map">
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
              <h3>Cultivating Growth Through Modern Agriculture</h3>
              <p>
                Real-time field boundary mapping, elevation contour tracking, and vegetative NDVI health
                across all estate sectors.
              </p>
              <Link to="/map" className="hero-card__link">
                <span>Learn More</span>
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
                <h4>Natural Farming</h4>
                <p>
                  Organic soil enrichment, shade tree canopy stewardship, and contour erosion conservation
                  across high-altitude mountain slopes.
                </p>
              </div>
            </div>

            <div className="hero-img-card">
              <img
                src="/images/hero_center.jpg"
                alt="Macro view of fresh green tea shoot"
                loading="eager"
              />
            </div>
          </div>

          {/* Right Column: Top image + Bottom card */}
          <div className="hero-col hero-col--right">
            <div className="hero-img-card">
              <img
                src="/images/hero_right.jpg"
                alt="Terraced tea plantation slopes under golden sunbeams"
                loading="eager"
              />
            </div>

            <div className="hero-info-card">
              <div className="hero-info-card__body">
                <div className="hero-info-card__icon">
                  <Award size={22} />
                </div>
                <h4>Quality Products</h4>
                <p>
                  Single-origin orthodox Ceylon tea cultivated at 4,000–6,000ft elevation with complete
                  field-level traceability.
                </p>
              </div>
              <Link to="/map" className="btn btn--secondary btn--sm">
                <Leaf size={14} />
                <span>Explore Map</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
