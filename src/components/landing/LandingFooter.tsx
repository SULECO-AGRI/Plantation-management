import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../context/LanguageContext'
import { CropLensBrand } from '../navigation/CropLensBrand'

export function LandingFooter() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          {/* Brand & Address */}
          <div className="footer-col footer-col--brand">
            <Link to="/" className="footer-brand" title="Spatio Agri - Plantation Management">
              <CropLensBrand theme="light" />
            </Link>

            <p className="footer-desc">
              {t('landing.footer.desc')}
            </p>

            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <MapPin size={15} />
                <span>{t('landing.footer.address')}</span>
              </div>
              <div className="footer-contact-item">
                <Mail size={15} />
                <span>info@plantationmanagement.lk</span>
              </div>
            </div>
          </div>

          {/* Column 1: Navigation */}
          <div className="footer-col">
            <h4>{t('landing.footer.navigation')}</h4>
            <ul className="footer-links">
              <li><a href="#about">{t('landing.footer.aboutUs')}</a></li>
              <li><a href="#offerings">{t('landing.footer.ourServices')}</a></li>
              <li><a href="#operations">{t('landing.footer.operations')}</a></li>
              <li><Link to="/map">{t('landing.footer.launchMap')}</Link></li>
            </ul>
          </div>

          {/* Column 2: GIS Platform */}
          <div className="footer-col">
            <h4>{t('landing.footer.gisPlatform')}</h4>
            <ul className="footer-links">
              <li><Link to="/map">{t('landing.footer.mapViewer')}</Link></li>
              <li><Link to="/map">{t('landing.footer.fieldInspector')}</Link></li>
              <li><Link to="/map">{t('landing.footer.divisionBoundaries')}</Link></li>
              <li><Link to="/map">{t('landing.footer.highResImagery')}</Link></li>
              <li><Link to="/map">{t('landing.footer.spatialAnalytics')}</Link></li>
            </ul>
          </div>

          {/* Column 3: Connect & Contact */}
          <div className="footer-col">
            <h4>{t('landing.footer.connect')}</h4>
            <p className="footer-connect-desc">
              {t('landing.footer.connectDesc')}
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
            <a href="#terms">{t('landing.footer.terms')}</a>
            <span>•</span>
            <a href="#privacy">{t('landing.footer.privacy')}</a>
          </div>
          <p className="footer-bottom__copy">
            {t('landing.footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}
