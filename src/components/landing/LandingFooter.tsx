import { ExternalLink, Globe, Mail, MapPin, Phone, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VISIGEO_ROOT } from '../../data/layers'

export function LandingFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          {/* Brand & Address */}
          <div className="footer-col footer-col--brand">
            <Link to="/" className="footer-brand">
              <span className="footer-brand__icon"><Sprout size={20} /></span>
              <span>
                <strong>Weddamulle</strong>
                <small>Plantation Management</small>
              </span>
            </Link>

            <p className="footer-desc">
              Next-generation plantation spatial intelligence across 5 divisions and 218 verified field
              polygons in the high-elevation tea country of Sri Lanka.
            </p>

            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <MapPin size={15} />
                <span>Weddamulle Estate, Nuwara Eliya, Central Province, Sri Lanka</span>
              </div>
              <div className="footer-contact-item">
                <Globe size={15} />
                <a href={VISIGEO_ROOT} target="_blank" rel="noreferrer">
                  VisiGeo Orthophoto Portal <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Column 1: Company Profile */}
          <div className="footer-col">
            <h4>Company Profile</h4>
            <ul className="footer-links">
              <li><a href="#about">About Estate</a></li>
              <li><a href="#offerings">Our Services</a></li>
              <li><a href="#operations">Plantation Operations</a></li>
              <li><a href="#faq">Frequently Asked Questions</a></li>
              <li><Link to="/map">Division Analytics</Link></li>
            </ul>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/map">Interactive GIS Map</Link></li>
              <li><Link to="/map">Field Inspector Mode</Link></li>
              <li><Link to="/map">Division Boundary Mode</Link></li>
              <li><Link to="/map">VisiGeo Imagery Layer</Link></li>
              <li><Link to="/map">Vector Polygons (218)</Link></li>
            </ul>
          </div>

          {/* Column 3: Follow Us & Divisions */}
          <div className="footer-col">
            <h4>Estate Divisions</h4>
            <div className="footer-division-tags">
              <span className="div-tag">Ramboda</span>
              <span className="div-tag">Wewandon</span>
              <span className="div-tag">Lilliesland</span>
              <span className="div-tag">Camnethan</span>
              <span className="div-tag">Weddamulla</span>
            </div>

            <h4 style={{ marginTop: '20px' }}>Connect</h4>
            <div className="footer-socials">
              <a href="#social" className="social-icon" aria-label="Globe Network"><Globe size={16} /></a>
              <a href="#social" className="social-icon" aria-label="Email Contact"><Mail size={16} /></a>
              <a href="#social" className="social-icon" aria-label="Phone Contact"><Phone size={16} /></a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Policy */}
        <div className="footer-bottom">
          <div className="footer-bottom__links">
            <a href="#terms">Terms and Condition</a>
            <span>•</span>
            <a href="#privacy">Privacy Policy</a>
          </div>
          <p className="footer-bottom__copy">
            &copy; 2026 Weddamulle Plantation Management. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
