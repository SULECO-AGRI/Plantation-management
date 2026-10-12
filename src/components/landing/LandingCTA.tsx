import { ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingCTA() {
  return (
    <section className="section section--cta">
      <div className="section-container">
        <div className="cta-banner">
          <h2 className="cta-banner__title">
            Ready to Manage Your <br />
            Plantation Digitally?
          </h2>

          <p className="cta-banner__desc">
            Explore live division maps, field boundaries, and daily operations in one easy-to-use platform.
          </p>

          <div className="cta-banner__actions">
            <Link to="/map" className="btn btn--dark btn--lg">
              <Compass size={18} />
              <span>Launch Interactive Map</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
