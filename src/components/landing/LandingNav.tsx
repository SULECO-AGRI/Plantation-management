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
      case 'super_admin':
        return 'Estate Overview'
      case 'division_manager':
        return 'Harvest Analytics'
      case 'field_officer':
        return 'Task Dispatch'
      case 'worker':
        return 'Workforce Portal'
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
              {/* Authenticated: Show GIS Map button + subtle logout */}
              {isAuthenticated && currentUser ? (
                <div className="nav-user-cluster">
                  <Link
                    to="/map"
                    className="btn btn--nav"
                    title={`Open GIS Map (${getRoleDestinationLabel(currentUser.role)})`}
                  >
                    GIS Map
                  </Link>

                  <button
                    type="button"
                    className="btn-icon-logout"
                    onClick={handleLogout}
                    title={`Logged in as ${currentUser.name} (${currentUser.roleTitle}). Click to sign out.`}
                    aria-label="Sign Out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                /* Unauthenticated: Show only simple Login button */
                <button
                  type="button"
                  className="btn btn--nav"
                  onClick={() => setIsLoginModalOpen(true)}
                  title="Sign In to Plantation Management Portal"
                >
                  Login
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
                  <Link
                    to="/map"
                    className="btn btn--nav-mobile"
                    onClick={closeMobileMenu}
                  >
                    GIS Map
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
                    <span>Sign Out ({currentUser.name})</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn--nav-mobile"
                  onClick={() => {
                    closeMobileMenu()
                    setIsLoginModalOpen(true)
                  }}
                >
                  Login
                </button>
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
