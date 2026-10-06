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
import { RoleSwitcher } from './RoleSwitcher'

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

  const isFieldOfficer = currentUser?.role === 'field_officer' || (currentUser?.role as string) === 'kangany'

  return (
    <header className="erp-header">
      <div className="erp-header__left">
        <Link to="/" className="erp-brand" title="Return to Landing Page">
          <div className="erp-brand__text">
            <strong>Plantation Management</strong>
            <small>Weddamulla Estate</small>
          </div>
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
          <span>GIS Map</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'workforce' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('workforce')}
        >
          <Users size={13} />
          <span>Employees</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'tasks' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('tasks')}
        >
          <CalendarCheck2 size={13} />
          <span>Tasks</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'harvest' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('harvest')}
        >
          <Scale size={13} />
          <span>Harvest</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'inventory' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('inventory')}
        >
          <Package size={13} />
          <span>Inventory</span>
        </button>

        {isFieldOfficer && (
          <>
            <button
              type="button"
              className={`erp-tab-btn ${activeTab === 'attendance' ? 'erp-tab-btn--active' : ''}`}
              onClick={() => onTabChange('attendance')}
              title="Employee Attendance Roll-Call"
            >
              <ClipboardCheck size={13} />
              <span>Attendance</span>
            </button>

            <button
              type="button"
              className={`erp-tab-btn ${activeTab === 'daily_harvest' ? 'erp-tab-btn--active' : ''}`}
              onClick={() => onTabChange('daily_harvest')}
              title="Daily Harvest Weigh-In"
            >
              <Scale size={13} />
              <span>Daily Harvest</span>
            </button>

            <button
              type="button"
              className={`erp-tab-btn ${activeTab === 'daily_salary' ? 'erp-tab-btn--active' : ''}`}
              onClick={() => onTabChange('daily_salary')}
              title="Employee Daily Salary Payment"
            >
              <Banknote size={13} />
              <span>Daily Salary</span>
            </button>
          </>
        )}

        {!isFieldOfficer && (
          <button
            type="button"
            className={`erp-tab-btn ${activeTab === 'daily_salary' ? 'erp-tab-btn--active' : ''}`}
            onClick={() => onTabChange('daily_salary')}
            title="Employee Daily Salary Sheets"
          >
            <Banknote size={13} />
            <span>Daily Salary</span>
          </button>
        )}
      </nav>

      {/* Header Right Actions */}
      <div className="erp-header__right">
        {/* Role Switcher Dropdown */}
        <RoleSwitcher />
      </div>
    </header>
  )
}
