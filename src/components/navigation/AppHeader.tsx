import React from 'react'
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  Layers,
  MapPin,
  Plus,
  Scale,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useHarvest } from '../../context/HarvestContext'
import { useIncident } from '../../context/IncidentContext'
import { useTask } from '../../context/TaskContext'
import { RoleSwitcher } from './RoleSwitcher'

export type PortalTab = 'map' | 'workforce' | 'tasks' | 'harvest' | 'incidents'

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
  const { setIsCreateModalOpen } = useTask()
  const { setIsLogModalOpen } = useHarvest()
  const { setIsReportModalOpen, incidents } = useIncident()

  const unresolvedIncidentsCount = incidents.filter((i) => i.status !== 'resolved').length

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
          className={`erp-tab-btn ${activeTab === 'incidents' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('incidents')}
        >
          <AlertTriangle size={13} />
          <span>Alerts</span>
          {unresolvedIncidentsCount > 0 && (
            <span className="erp-tab-counter">{unresolvedIncidentsCount}</span>
          )}
        </button>
      </nav>

      {/* Header Right Actions */}
      <div className="erp-header__right">
        {/* Quick Action Button for Modals */}
        <div className="erp-quick-actions">
          <button
            type="button"
            className="erp-action-btn erp-action-btn--task"
            onClick={() => setIsCreateModalOpen(true)}
            title="Create and Dispatch Work Order"
          >
            <Plus size={12} />
            <span>Task</span>
          </button>

          <button
            type="button"
            className="erp-action-btn erp-action-btn--weigh"
            onClick={() => setIsLogModalOpen(true)}
            title="Record Daily Harvest Weigh-In"
          >
            <Scale size={12} />
            <span>Weigh-In</span>
          </button>

          <button
            type="button"
            className="erp-action-btn erp-action-btn--incident"
            onClick={() => setIsReportModalOpen(true)}
            title="Report Environmental or Field Hazard"
          >
            <AlertTriangle size={12} />
            <span>Alert</span>
          </button>
        </div>

        {/* Role Switcher Dropdown */}
        <RoleSwitcher />
      </div>
    </header>
  )
}
