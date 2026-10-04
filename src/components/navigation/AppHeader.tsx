import React from 'react'
import {
  AlertTriangle,
  ArrowLeft,
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
  const { currentUser, selectedDivisionFilter, setSelectedDivisionFilter } = useAuth()
  const { setIsCreateModalOpen } = useTask()
  const { setIsLogModalOpen } = useHarvest()
  const { setIsReportModalOpen, incidents } = useIncident()

  const unresolvedIncidentsCount = incidents.filter((i) => i.status !== 'resolved').length

  const divisions = ['All Divisions', 'Weddamulla', 'Ramboda', 'Camnethan', 'Lilliesland', 'Wewandon']

  return (
    <header className="erp-header">
      <div className="erp-header__left">
        <Link to="/" className="erp-brand" title="Return to Landing Page">
          <div className="erp-brand__logo-emblem">
            <span className="erp-brand__tea-leaf">🍃</span>
          </div>
          <div className="erp-brand__text">
            <strong>Plantation Management</strong>
            <small>Weddamulla Estate · Nuwara Eliya</small>
          </div>
        </Link>

        {/* Division Scope Filter */}
        <div className="erp-division-selector">
          <label htmlFor="estate-division-select" className="sr-only">Estate Division</label>
          <select
            id="estate-division-select"
            value={selectedDivisionFilter}
            onChange={(e) => setSelectedDivisionFilter(e.target.value)}
            disabled={currentUser?.divisionScope !== 'All Divisions'}
            className="erp-division-select"
            title={currentUser?.divisionScope !== 'All Divisions' ? `Locked to ${currentUser?.divisionScope}` : 'Filter estate division'}
          >
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d === 'All Divisions' ? '🌿 All Estate Divisions' : `📍 ${d} Division`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main ERP Navigation Tabs */}
      <nav className="erp-nav-tabs" aria-label="Plantation ERP Modules">
        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'map' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('map')}
        >
          <Layers size={15} />
          <span>GIS Interactive Map</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'workforce' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('workforce')}
        >
          <Users size={15} />
          <span>Workforce GPS</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'tasks' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('tasks')}
        >
          <CalendarCheck2 size={15} />
          <span>Task Dispatch (Kanban)</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'harvest' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('harvest')}
        >
          <Scale size={15} />
          <span>Harvest &amp; Yield Logger</span>
        </button>

        <button
          type="button"
          className={`erp-tab-btn ${activeTab === 'incidents' ? 'erp-tab-btn--active' : ''}`}
          onClick={() => onTabChange('incidents')}
        >
          <AlertTriangle size={15} />
          <span>Incident Alerts</span>
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
            <Plus size={14} />
            <span>New Task</span>
          </button>

          <button
            type="button"
            className="erp-action-btn erp-action-btn--weigh"
            onClick={() => setIsLogModalOpen(true)}
            title="Record Daily Harvest Weigh-In"
          >
            <Scale size={14} />
            <span>Weigh-In</span>
          </button>

          <button
            type="button"
            className="erp-action-btn erp-action-btn--incident"
            onClick={() => setIsReportModalOpen(true)}
            title="Report Environmental or Field Hazard"
          >
            <AlertTriangle size={14} />
            <span>Alert</span>
          </button>
        </div>

        {/* Role Switcher Dropdown */}
        <RoleSwitcher />

        {/* Back Link to Landing */}
        <Link to="/" className="erp-overview-link" title="Return to Public Landing Page">
          <ArrowLeft size={15} />
          <span>Overview</span>
        </Link>
      </div>
    </header>
  )
}
