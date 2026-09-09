import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="site-header">
      <div className="site-header__container">
        <nav className="site-nav" aria-label="Main Navigation">
          <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
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
            <Link to="/map" className="btn btn--nav">
              GIS Map
            </Link>

            <button
              type="button"
              className="nav-mobile-toggle"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="nav-mobile-drawer">
          <div className="nav-mobile-menu">
            <a href="#about" className="nav-mobile-link" onClick={closeMobileMenu}>About Us</a>
            <a href="#offerings" className="nav-mobile-link" onClick={closeMobileMenu}>Our Services</a>
            <a href="#operations" className="nav-mobile-link" onClick={closeMobileMenu}>Operations</a>
            <a href="#faq" className="nav-mobile-link" onClick={closeMobileMenu}>FAQ</a>
          </div>
          <div className="nav-mobile-action">
            <Link to="/map" className="btn btn--nav-mobile" onClick={closeMobileMenu}>
              Launch GIS Map
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
