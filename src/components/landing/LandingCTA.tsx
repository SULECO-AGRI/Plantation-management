import { ArrowRight, Compass, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingCTA() {
  return (
    <section className="section section--cta">
      <div className="section-container">
        <div className="cta-banner">
          <div className="cta-banner__icon">
            <Sprout size={32} />
          </div>

          <h2 className="cta-banner__title">
            Become a Part of Our Growing <br />
            Plantation Network!
          </h2>

          <p className="cta-banner__desc">
            Experience next-generation Ceylon estate management with high-resolution orthophoto imagery,
            dual-mode division &amp; field inspection, and precision spatial analytics.
          </p>

          <div className="cta-banner__actions">
            <Link to="/map" className="btn btn--dark btn--lg">
              <Compass size={18} />
              <span>Launch Interactive GIS Map</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
