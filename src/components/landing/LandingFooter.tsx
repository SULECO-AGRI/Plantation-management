import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          {/* Brand & Address */}
          <div className="footer-col footer-col--brand">
            <Link to="/" className="footer-brand">
              <span className="footer-brand__text">
                <strong>Plantation Management</strong>
              </span>
            </Link>

            <p className="footer-desc">
              Next-generation plantation spatial intelligence, digital field mapping, and agronomic
              analytics for high-elevation tea estates.
            </p>

            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <MapPin size={15} />
                <span>Weddamulle Estate, Nuwara Eliya, Central Province, Sri Lanka</span>
              </div>
              <div className="footer-contact-item">
                <Mail size={15} />
                <span>info@plantationmanagement.lk</span>
              </div>
            </div>
          </div>

          {/* Column 1: Navigation */}
          <div className="footer-col">
            <h4>Navigation</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#offerings">Our Services</a></li>
              <li><a href="#operations">Operations</a></li>
              <li><a href="#faq">Frequently Asked Questions</a></li>
              <li><Link to="/map">Launch GIS Map</Link></li>
            </ul>
          </div>

          {/* Column 2: GIS Platform */}
          <div className="footer-col">
            <h4>GIS Platform</h4>
            <ul className="footer-links">
              <li><Link to="/map">Interactive Map Viewer</Link></li>
              <li><Link to="/map">Field Inspector</Link></li>
              <li><Link to="/map">Division Boundaries</Link></li>
              <li><Link to="/map">High-Resolution Imagery</Link></li>
              <li><Link to="/map">Spatial Analytics</Link></li>
            </ul>
          </div>

          {/* Column 3: Connect & Contact */}
          <div className="footer-col">
            <h4>Connect</h4>
            <p className="footer-connect-desc">
              Get in touch with our agricultural and GIS technical operations team.
            </p>
            <div className="footer-socials">
              <a href="#social" className="social-icon" aria-label="Website Network"><Globe size={16} /></a>
              <a href="mailto:info@plantationmanagement.lk" className="social-icon" aria-label="Email Contact"><Mail size={16} /></a>
              <a href="tel:+94522223344" className="social-icon" aria-label="Phone Contact"><Phone size={16} /></a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Policy */}
        <div className="footer-bottom">
          <div className="footer-bottom__links">
            <a href="#terms">Terms &amp; Conditions</a>
            <span>•</span>
            <a href="#privacy">Privacy Policy</a>
          </div>
          <p className="footer-bottom__copy">
            &copy; 2026 Plantation Management. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
