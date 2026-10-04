import React, { useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Phone,
  Scale,
  Search,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { useWorkforce } from '../../context/WorkforceContext'
import { useHarvest } from '../../context/HarvestContext'
import type { Worker, WorkerRole, WorkerStatus } from '../../types/workforce'

type WorkforceViewProps = {
  onLocateOnMap: (worker: Worker) => void
}

export const WorkforceView: React.FC<WorkforceViewProps> = ({ onLocateOnMap }) => {
  const { workers, isGpsLayerVisible, setIsGpsLayerVisible, setSelectedWorker } = useWorkforce()
  const { setIsLogModalOpen } = useHarvest()
  const [search, setSearch] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('all')
  const [selectedRole, setSelectedRole] = useState<WorkerRole | 'all'>('all')

  const stats = useMemo(() => {
    const total = workers.length
    const active = workers.filter((w) => w.status === 'active').length
    const onBreak = workers.filter((w) => w.status === 'break').length
    const harvesters = workers.filter((w) => w.role === 'harvester').length
    const totalLeafToday = workers.reduce((acc, w) => acc + (w.todayPluckedKg || 0), 0)
    return { total, active, onBreak, harvesters, totalLeafToday: Math.round(totalLeafToday * 10) / 10 }
  }, [workers])

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.id.toLowerCase().includes(search.toLowerCase()) ||
        w.currentTask.toLowerCase().includes(search.toLowerCase()) ||
        w.fieldBlock.toLowerCase().includes(search.toLowerCase())
      const matchDiv = selectedDivision === 'all' || w.division === selectedDivision
      const matchRole = selectedRole === 'all' || w.role === selectedRole
      return matchSearch && matchDiv && matchRole
    })
  }, [workers, search, selectedDivision, selectedRole])

  const getRoleBadgeVariant = (role: WorkerRole) => {
    switch (role) {
      case 'kangany':
        return 'purple'
      case 'harvester':
        return 'amber'
      case 'sprayer':
        return 'blue'
      case 'sundry':
        return 'slate'
    }
  }

  const handleWeighIn = (worker: Worker) => {
    setSelectedWorker(worker)
    setIsLogModalOpen(true)
  }

  return (
    <div className="erp-page-container">
      {/* Top Banner & KPI Cards */}
      <div className="erp-page-header">
        <div>
          <div className="erp-page-badge">
            <Users size={13} />
            <span>MODULE A · FIELD TELEMETRY</span>
          </div>
          <h1 className="erp-page-title">Live Workforce &amp; Field GPS Tracker</h1>
          <p className="erp-page-subtitle">
            Real-time GPS positioning, gang supervision, and field muster roll call for Weddamulla Estate.
          </p>
        </div>

        <div className="erp-page-actions">
          <label className="toggle-switch-label">
            <input
              type="checkbox"
              checked={isGpsLayerVisible}
              onChange={(e) => setIsGpsLayerVisible(e.target.checked)}
            />
            <span className="toggle-slider" />
            <span className="toggle-text">GIS Map Marker Sync</span>
          </label>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card__icon kpi-card__icon--emerald">
            <Users size={22} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Total Registered Staff</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">{stats.total}</strong>
              <span className="kpi-card__sub">Across 5 Divisions</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__icon kpi-card__icon--blue">
            <Activity size={22} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Active In Field Now</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">{stats.active}</strong>
              <span className="kpi-card__badge-tag kpi-card__badge-tag--active">
                {Math.round((stats.active / (stats.total || 1)) * 100)}% muster
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__icon kpi-card__icon--amber">
            <Scale size={22} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Harvesters Plucking</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">{stats.harvesters}</strong>
              <span className="kpi-card__sub">{stats.totalLeafToday} kg plucked</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__icon kpi-card__icon--purple">
            <Clock size={22} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">On Meal / Rest Break</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">{stats.onBreak}</strong>
              <span className="kpi-card__sub">Muster shed休憩</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="erp-content-card">
        <div className="erp-content-card__header">
          <div className="workforce-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by worker name, ID, field block, or work task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="workforce-search-input"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="workforce-dropdown-filters">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Divisions</option>
              <option value="Weddamulla">Weddamulla</option>
              <option value="Ramboda">Ramboda</option>
              <option value="Camnethan">Camnethan</option>
              <option value="Lilliesland">Lilliesland</option>
              <option value="Wewandon">Wewandon</option>
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as WorkerRole | 'all')}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="kangany">Kangany (Field Lead)</option>
              <option value="harvester">Tea Harvester</option>
              <option value="sprayer">Chemical Sprayer</option>
              <option value="sundry">Sundry / Maintenance</option>
            </select>
          </div>
        </div>

        <div className="workforce-table-wrapper">
          <table className="workforce-table">
            <thead>
              <tr>
                <th>Worker ID &amp; Name</th>
                <th>Role</th>
                <th>Division &amp; Block</th>
                <th>Assigned Task</th>
                <th>Today's Plucked Leaf</th>
                <th>GPS Telemetry</th>
                <th>Field Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((worker) => (
                <tr key={worker.id} className="workforce-row">
                  <td>
                    <div className="worker-profile-cell">
                      <div className="worker-avatar">
                        {worker.avatar ? (
                          <img src={worker.avatar} alt={worker.name} />
                        ) : (
                          <span className="worker-avatar-initials">
                            {worker.name.split(' ').map((n) => n[0]).join('')}
                          </span>
                        )}
                        <span className={`worker-status-dot worker-status-dot--${worker.status}`} />
                      </div>
                      <div>
                        <strong>{worker.name}</strong>
                        <span className="worker-id-code">{worker.id} · {worker.gender === 'female' ? 'F' : 'M'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={getRoleBadgeVariant(worker.role)}>
                      {worker.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <div className="division-field-cell">
                      <span className="division-badge">{worker.division}</span>
                      <span className="field-tag">{worker.fieldBlock}</span>
                    </div>
                  </td>
                  <td>
                    <div className="worker-task-desc" title={worker.currentTask}>
                      {worker.currentTask}
                    </div>
                  </td>
                  <td>
                    <div className="worker-weight-cell">
                      {worker.role === 'harvester' ? (
                        <>
                          <strong className="text-emerald">{worker.todayPluckedKg.toFixed(1)}</strong>
                          <small> kg</small>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="worker-ping-cell">
                      <span className="ping-beacon" />
                      <span>{worker.lastPingTime}</span>
                      <small className="geo-coords">[{worker.lat.toFixed(4)}, {worker.lng.toFixed(4)}]</small>
                    </div>
                  </td>
                  <td>
                    <div className="worker-actions-cell">
                      <button
                        type="button"
                        className="table-action-btn table-action-btn--locate"
                        onClick={() => onLocateOnMap(worker)}
                        title="Locate Worker Pin on Leaflet GIS Map"
                      >
                        <MapPin size={13} />
                        <span>Locate</span>
                      </button>
                      {worker.role === 'harvester' && (
                        <button
                          type="button"
                          className="table-action-btn table-action-btn--weigh"
                          onClick={() => handleWeighIn(worker)}
                          title="Record Plucking Weight"
                        >
                          <Scale size={13} />
                          <span>Weigh</span>
                        </button>
                      )}
                      <a
                        href={`tel:${worker.phone}`}
                        className="table-action-btn table-action-btn--call"
                        title={`Direct Field Call (${worker.phone})`}
                      >
                        <Phone size={13} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
