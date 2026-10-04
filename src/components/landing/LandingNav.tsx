import { useState } from 'react'
import { ArrowRight, LogIn, LogOut, Menu, Sparkles, User, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoginModal } from '../navigation/LoginModal'
import type { UserRole } from '../../types/auth'

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { currentUser, isAuthenticated, logout, getRoleDefaultTab } = useAuth()
  const navigate = useNavigate()

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  const handleLogout = async () => {
    await logout()
  }

  const getRoleDestinationLabel = (role: UserRole) => {
    switch (role) {
      case 'estate_manager':
        return 'Estate Overview'
      case 'field_officer':
        return 'Task Dispatch'
      case 'kangany':
        return 'Harvest Logger'
      case 'agronomist':
        return 'Incident Alerts'
      default:
        return 'Workspace'
    }
  }

  const userTargetTab = currentUser ? (currentUser.defaultTab || getRoleDefaultTab(currentUser.role)) : 'map'

  return (
    <>
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
              {/* Public GIS Map Quick Access */}
              <Link to="/map" className="btn btn--nav" title="Open Interactive GIS Map">
                GIS Map
              </Link>

              {/* Login / Authenticated User Pill */}
              {isAuthenticated && currentUser ? (
                <div className="nav-user-cluster">
                  <Link
                    to={`/map?tab=${userTargetTab}`}
                    className="nav-user-pill"
                    title={`Logged in as ${currentUser.name} (${currentUser.roleTitle}). Click to open ${getRoleDestinationLabel(currentUser.role)}.`}
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="nav-user-avatar"
                    />
                    <div className="nav-user-details">
                      <span className="nav-user-name">{currentUser.name}</span>
                      <span
                        className="nav-user-badge"
                        style={{
                          backgroundColor: `${currentUser.badgeColor}22`,
                          color: currentUser.badgeColor,
                        }}
                      >
                        {currentUser.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <ArrowRight size={14} className="nav-user-arrow" />
                  </Link>

                  <button
                    type="button"
                    className="btn-icon-logout"
                    onClick={handleLogout}
                    title="Sign Out of Portal"
                    aria-label="Sign Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn--nav-login"
                  onClick={() => setIsLoginModalOpen(true)}
                  title="Sign In to Role-Based ERP Portal"
                >
                  <LogIn size={15} />
                  <span>Portal Login</span>
                </button>
              )}

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
              {isAuthenticated && currentUser ? (
                <div className="nav-mobile-user-box">
                  <div className="nav-mobile-user-row">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="nav-user-avatar"
                    />
                    <div>
                      <strong>{currentUser.name}</strong>
                      <small>{currentUser.roleTitle}</small>
                    </div>
                  </div>
                  <Link
                    to={`/map?tab=${userTargetTab}`}
                    className="btn btn--nav-mobile"
                    onClick={closeMobileMenu}
                  >
                    Open {getRoleDestinationLabel(currentUser.role)}
                  </Link>
                  <button
                    type="button"
                    className="nav-mobile-logout-link"
                    onClick={() => {
                      handleLogout()
                      closeMobileMenu()
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="nav-mobile-auth-stack">
                  <button
                    type="button"
                    className="btn btn--nav-mobile btn--nav-mobile-login"
                    onClick={() => {
                      closeMobileMenu()
                      setIsLoginModalOpen(true)
                    }}
                  >
                    <LogIn size={16} />
                    <span>Sign In to ERP Portal</span>
                  </button>
                  <Link to="/map" className="btn btn--nav-mobile" onClick={closeMobileMenu}>
                    Launch GIS Map (Guest)
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}
