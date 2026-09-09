import { ArrowUpRight, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingNav() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main Navigation">
        <Link to="/" className="nav-brand">
          <span className="nav-brand__text">
            <strong>Plantation Management</strong>
          </span>
        </Link>

        <div className="nav-menu">
          <a href="#about" className="nav-link">About Us</a>
          <a href="#offerings" className="nav-link">Our Services</a>
          <a href="#operations" className="nav-link">Operations</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </div>

        <div className="nav-actions">
          <Link to="/map" className="btn btn--primary btn--nav">
            <Compass size={15} />
            <span>Launch GIS Map</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </nav>
    </header>
  )
}
