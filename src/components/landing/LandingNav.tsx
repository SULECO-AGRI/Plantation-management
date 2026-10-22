import { useState } from 'react'
import { ArrowRight, LogIn, LogOut, Menu, Sparkles, User, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import { LanguageSwitcher } from '../common/LanguageSwitcher'
import { LoginModal } from '../navigation/LoginModal'
import { CropLensBrand } from '../navigation/CropLensBrand'
import type { UserRole } from '../../types/auth'

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { currentUser, isAuthenticated, logout, getRoleDefaultTab } = useAuth()
  const { t } = useTranslation()
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
  const userPlantationParam = (currentUser?.plantationScope || '').toLowerCase() === 'watawala' ? 'watawala' : 'agalawatte'
  const userMapUrl = `/map?plantation=${userPlantationParam}`

  return (
    <>
      <header className="site-header">
        <div className="site-header__container">
          <nav className="site-nav" aria-label="Main Navigation">
            <Link to="/" className="nav-brand" onClick={closeMobileMenu} title="Spatio Agri - Plantation Management">
              <CropLensBrand />
            </Link>

            <div className="nav-menu">
              <a href="#about" className="nav-link">{t('landing.aboutUs')}</a>
              <a href="#offerings" className="nav-link">{t('landing.services')}</a>
              <a href="#operations" className="nav-link">{t('landing.operationsNav')}</a>
            </div>

            <div className="nav-actions">
              <LanguageSwitcher />

              {/* Authenticated: Show GIS Map button + subtle logout */}
              {isAuthenticated && currentUser ? (
                <div className="nav-user-cluster">
                  <Link
                    to={userMapUrl}
                    className="btn btn--nav"
                    title={`Open GIS Map (${getRoleDestinationLabel(currentUser.role)})`}
                  >
                    {t('landing.gisMap')}
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
                  title="Sign In to Spatio Agri PM Portal"
                >
                  {t('landing.login')}
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
              <a href="#about" className="nav-mobile-link" onClick={closeMobileMenu}>{t('landing.aboutUs')}</a>
              <a href="#offerings" className="nav-mobile-link" onClick={closeMobileMenu}>{t('landing.services')}</a>
              <a href="#operations" className="nav-mobile-link" onClick={closeMobileMenu}>{t('landing.operationsNav')}</a>
            </div>

            <div className="nav-mobile-action">
              {isAuthenticated && currentUser ? (
                <div className="nav-mobile-user-box">
                  <Link
                    to={userMapUrl}
                    className="btn btn--nav-mobile"
                    onClick={closeMobileMenu}
                  >
                    {t('landing.gisMap')}
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
                    <span>{t('landing.signOut')} ({currentUser.name})</span>
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
                  {t('landing.login')}
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
