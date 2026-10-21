import React from 'react'
import {
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Layers,
  MapPin,
  Package,
  Scale,
  Users,
  Banknote,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import { RoleSwitcher } from './RoleSwitcher'
import { CropLensBrand } from './CropLensBrand'
import { LanguageSwitcher } from '../common/LanguageSwitcher'

export type PortalTab =
  | 'map'
  | 'workforce'
  | 'tasks'
  | 'harvest'
  | 'inventory'
  | 'attendance'
  | 'daily_harvest'
  | 'daily_salary'

type AppHeaderProps = {
  activeTab: PortalTab
  onTabChange: (tab: PortalTab) => void
  onOpenWorkforceModal?: () => void
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenWorkforceModal,
}) => {
  const { currentUser } = useAuth()
  const { t } = useTranslation()

  const isFieldOfficer = currentUser?.role === 'field_officer' || (currentUser?.role as string) === 'kangany'

  return (
    <header className="erp-header">
      <div className="erp-header__left">
        <Link to="/" className="erp-brand" title="Spatio Agri - Plantation Management">
          <CropLensBrand />
        </Link>
      </div>

      {/* Main ERP Navigation Tabs */}
      <nav className="erp-nav-tabs" aria-label="Plantation ERP Modules">
        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'map' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('map')}
        >
          <Layers size={13} />
          <span>{t('nav.gisMap')}</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'workforce' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('workforce')}
        >
          <Users size={13} />
          <span>{t('nav.employees')}</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'tasks' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('tasks')}
        >
          <CalendarCheck2 size={13} />
          <span>{t('nav.tasks')}</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'harvest' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('harvest')}
        >
          <Scale size={13} />
          <span>{t('nav.harvest')}</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'inventory' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('inventory')}
        >
          <Package size={13} />
          <span>{t('nav.inventory')}</span>
        </button>

        {isFieldOfficer && (
          <>
            <button
              type="button"
              className={`erp-tab-btn ${activeTab === 'attendance' ? 'erp-tab-btn--active' : ''}`}
              onClick={() => onTabChange('attendance')}
              title={t('nav.attendanceTooltip')}
            >
              <ClipboardCheck size={13} />
              <span>{t('nav.attendance')}</span>
            </button>

            <button
              type="button"
              className={`erp-tab-btn ${activeTab === 'daily_harvest' ? 'erp-tab-btn--active' : ''}`}
              onClick={() => onTabChange('daily_harvest')}
              title={t('nav.dailyHarvestTooltip')}
            >
              <Scale size={13} />
              <span>{t('nav.dailyHarvest')}</span>
            </button>

            <button
              type="button"
              className={`erp-tab-btn ${activeTab === 'daily_salary' ? 'erp-tab-btn--active' : ''}`}
              onClick={() => onTabChange('daily_salary')}
              title={t('nav.dailySalaryTooltip')}
            >
              <Banknote size={13} />
              <span>{t('nav.dailySalary')}</span>
            </button>
          </>
        )}

        {!isFieldOfficer && (
          <button
            type="button"
            className={`erp-tab-btn ${activeTab === 'daily_salary' ? 'erp-tab-btn--active' : ''}`}
            onClick={() => onTabChange('daily_salary')}
            title={t('nav.dailySalarySheetsTooltip')}
          >
            <Banknote size={13} />
            <span>{t('nav.dailySalary')}</span>
          </button>
        )}
      </nav>

      {/* Header Right Actions */}
      <div className="erp-header__right">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Role Switcher Dropdown */}
        <RoleSwitcher />
      </div>
    </header>
  )
}
