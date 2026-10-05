import React, { useMemo, useState } from 'react'
import {
  Search,
  Users,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { useWorkforce } from '../../context/WorkforceContext'
import type { Worker, WorkerRole } from '../../types/workforce'
import { EmployeeDayDetailModal } from './EmployeeDayDetailModal'

type WorkforceViewProps = {
  onLocateOnMap: (worker: Worker) => void
}

export const WorkforceView: React.FC<WorkforceViewProps> = ({ onLocateOnMap }) => {
  const { workers } = useWorkforce()
  const [search, setSearch] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('all')
  const [selectedRole, setSelectedRole] = useState<WorkerRole | 'all'>('all')
  const [selectedAttendance, setSelectedAttendance] = useState<'all' | 'present' | 'absent'>('all')
  const [detailWorker, setDetailWorker] = useState<Worker | null>(null)

  const stats = useMemo(() => {
    const total = workers.length
    const present = workers.filter((w) => w.attended).length
    const absent = total - present
    const totalLeafToday = workers
      .filter((w) => w.attended)
      .reduce((acc, w) => acc + (w.todayPluckedKg || 0), 0)

    return {
      total,
      present,
      absent,
      totalLeafToday: Math.round(totalLeafToday * 10) / 10,
    }
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
      const matchAttendance =
        selectedAttendance === 'all' ||
        (selectedAttendance === 'present' && w.attended) ||
        (selectedAttendance === 'absent' && !w.attended)

      return matchSearch && matchDiv && matchRole && matchAttendance
    })
  }, [workers, search, selectedDivision, selectedRole, selectedAttendance])

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

  return (
    <div className="erp-page-container">
      {/* Top Banner */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">Employees Working Today</h1>
          <p className="erp-page-subtitle">
            Daily muster roll, attendance records, and leaf harvest yields across all divisions.
          </p>
        </div>
      </div>

      {/* KPI Cards Row (Clean, Simple, 4 Metrics) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Total Staff</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">{stats.total}</strong>
              <span className="kpi-card__sub">Across 5 Divisions</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Present Today</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value text-emerald">{stats.present}</strong>
              <span className="kpi-card__sub">Attended Muster Roll</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Absent Today</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value text-muted">{stats.absent}</strong>
              <span className="kpi-card__sub">On Leave / Off-Duty</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Today's Harvested Leaf</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">{stats.totalLeafToday}</strong>
              <span className="kpi-card__sub">kg total weighed</span>
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
              placeholder="Search by worker name, ID, or field block..."
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
              value={selectedAttendance}
              onChange={(e) => setSelectedAttendance(e.target.value as 'all' | 'present' | 'absent')}
              className="filter-select"
            >
              <option value="all">All Attendance</option>
              <option value="present">Present (Attended)</option>
              <option value="absent">Absent</option>
            </select>

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
              <option value="harvester">Tea Harvester</option>
              <option value="kangany">Kangany (Lead)</option>
              <option value="sprayer">Chemical Sprayer</option>
              <option value="sundry">Sundry / Maintenance</option>
            </select>
          </div>
        </div>

        <div className="workforce-table-wrapper">
          <table className="workforce-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Attendance</th>
                <th>Role</th>
                <th>Division &amp; Block</th>
                <th>Hours Worked</th>
                <th>Today's Harvest</th>
                <th>Current Task</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((worker) => (
                <tr
                  key={worker.id}
                  className="workforce-row workforce-row--clickable"
                  onClick={() => setDetailWorker(worker)}
                  title="Click to view full employee details"
                >
                  <td>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{worker.name}</strong>
                      <div className="worker-id-code">{worker.id}</div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`employee-status-pill ${
                        worker.attended ? 'employee-status-pill--present' : 'employee-status-pill--absent'
                      }`}
                    >
                      {worker.attended ? 'Present' : 'Absent'}
                    </span>
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
                    {worker.attended ? (
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {(worker.hoursWorkedToday ?? 7.5).toFixed(1)} hrs
                      </span>
                    ) : (
                      <span className="text-muted">0 hrs</span>
                    )}
                  </td>
                  <td>
                    <div className="worker-weight-cell">
                      {worker.role === 'harvester' && worker.attended ? (
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
                    <div className="worker-task-desc" title={worker.currentTask}>
                      {worker.currentTask}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn--xs btn--secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetailWorker(worker)
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
              No employees found matching the selected filters.
            </div>
          )}
        </div>
      </div>

      {/* Clean Employee Details Modal */}
      {detailWorker && (
        <EmployeeDayDetailModal
          worker={detailWorker}
          isOpen={Boolean(detailWorker)}
          onClose={() => setDetailWorker(null)}
          onLocateOnMap={onLocateOnMap}
        />
      )}
    </div>
  )
}
