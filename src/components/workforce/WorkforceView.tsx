import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Users,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { useWorkforce } from '../../context/WorkforceContext'
import { useAuth } from '../../context/AuthContext'
import type { Worker, WorkerRole } from '../../types/workforce'
import { EmployeeDayDetailModal } from './EmployeeDayDetailModal'

type WorkforceViewProps = {
  onLocateOnMap: (worker: Worker) => void
}

export const WorkforceView: React.FC<WorkforceViewProps> = ({ onLocateOnMap }) => {
  const { workers } = useWorkforce()
  const { currentUser } = useAuth()

  const isDivisionManager = currentUser?.role === 'division_manager'
  const isFieldOfficer = currentUser?.role === 'field_officer' || (currentUser?.role as string) === 'kangany'
  const officerField = currentUser?.assignedField || 'Block 4B'
  const officerDivision =
    currentUser?.assignedDivision ||
    (currentUser?.divisionScope !== 'All Divisions' ? currentUser?.divisionScope : 'Weddamulla') ||
    'Weddamulla'
  const managerDivision = officerDivision

  // Monitored field blocks available in the officer's division
  const availableOfficerFields = useMemo(() => {
    const fieldsSet = new Set<string>()
    workers.forEach((w) => {
      if (
        w.division.toLowerCase() === officerDivision.toLowerCase() &&
        w.fieldBlock &&
        w.fieldBlock !== 'Estate HQ' &&
        w.fieldBlock !== 'Division Office' &&
        w.role !== 'super_admin' &&
        w.role !== 'division_manager'
      ) {
        fieldsSet.add(w.fieldBlock)
      }
    })
    const list = Array.from(fieldsSet).sort()
    return list.length > 0 ? list : ['Block 4B', 'Block 4A', 'Block 2A', 'Block 3C', 'Block 3A']
  }, [workers, officerDivision])

  const [search, setSearch] = useState('')
  const [selectedField, setSelectedField] = useState<string>(
    isFieldOfficer ? officerField : 'all'
  )
  const [selectedDivision, setSelectedDivision] = useState(
    isDivisionManager ? managerDivision : 'all'
  )
  const [selectedRole, setSelectedRole] = useState<WorkerRole | 'all'>('all')
  const [selectedAttendance, setSelectedAttendance] = useState<'all' | 'present' | 'absent'>('all')
  const [detailWorker, setDetailWorker] = useState<Worker | null>(null)

  // Sync selected field when role or assignedField changes
  useEffect(() => {
    if (isFieldOfficer) {
      setSelectedField(currentUser?.assignedField || 'Block 4B')
    } else {
      setSelectedField('all')
    }
  }, [isFieldOfficer, currentUser?.assignedField])

  // Scope base workers:
  // - Field Officer: scoped to their division; filters by the selected field dropdown (or all monitored fields)
  // - Division Manager: limited to their assigned division
  // - Others (Super Admin): all workers across the estate
  const scopedWorkers = useMemo(() => {
    if (isFieldOfficer) {
      return workers.filter((w) => {
        if (w.role === 'super_admin' || w.role === 'division_manager') return false
        if (w.division.toLowerCase() !== officerDivision.toLowerCase()) return false
        if (selectedField !== 'all') {
          return w.fieldBlock.trim().toLowerCase() === selectedField.trim().toLowerCase()
        }
        return true
      })
    }
    if (isDivisionManager) {
      return workers.filter((w) => w.division === managerDivision)
    }
    return workers
  }, [workers, isFieldOfficer, officerDivision, selectedField, isDivisionManager, managerDivision])

  const stats = useMemo(() => {
    const total = scopedWorkers.length
    const present = scopedWorkers.filter((w) => w.attended).length
    const absent = total - present
    const totalLeafToday = scopedWorkers
      .filter((w) => w.attended)
      .reduce((acc, w) => acc + (w.todayPluckedKg || 0), 0)

    return {
      total,
      present,
      absent,
      totalLeafToday: Math.round(totalLeafToday * 10) / 10,
    }
  }, [scopedWorkers])

  const filtered = useMemo(() => {
    return scopedWorkers.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.id.toLowerCase().includes(search.toLowerCase()) ||
        w.currentTask.toLowerCase().includes(search.toLowerCase()) ||
        w.fieldBlock.toLowerCase().includes(search.toLowerCase())

      const matchDiv = isFieldOfficer || isDivisionManager
        ? true
        : selectedDivision === 'all' || w.division === selectedDivision

      const matchRole =
        selectedRole === 'all' ||
        w.role === selectedRole ||
        (selectedRole === 'field_officer' && (w.role as string) === 'kangany') ||
        (selectedRole === 'worker' && ['harvester', 'sprayer', 'sundry'].includes(w.role as string))

      const matchAttendance =
        selectedAttendance === 'all' ||
        (selectedAttendance === 'present' && w.attended) ||
        (selectedAttendance === 'absent' && !w.attended)

      return matchSearch && matchDiv && matchRole && matchAttendance
    })
  }, [scopedWorkers, search, isFieldOfficer, isDivisionManager, selectedDivision, selectedRole, selectedAttendance])

  const getRoleBadgeVariant = (role: WorkerRole) => {
    switch (role) {
      case 'super_admin':
        return 'emerald'
      case 'division_manager':
        return 'blue'
      case 'field_officer':
      case 'kangany':
        return 'purple'
      case 'worker':
      case 'harvester':
        return 'amber'
      case 'sprayer':
        return 'blue'
      case 'sundry':
      default:
        return 'slate'
    }
  }

  const getRoleBadgeLabel = (role: WorkerRole) => {
    switch (role) {
      case 'super_admin':
        return 'SUPER ADMIN'
      case 'division_manager':
        return 'DIVISION MANAGER'
      case 'field_officer':
      case 'kangany':
        return 'FIELD OFFICER'
      case 'worker':
      case 'harvester':
      case 'sprayer':
      case 'sundry':
        return 'EMPLOYEE'
      default:
        return 'EMPLOYEE'
    }
  }

  return (
    <div className="erp-page-container">
      {/* Top Banner */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">
            Employees Working Today{' '}
            {isFieldOfficer ? (
              <span style={{ color: 'var(--emerald-600)' }}>
                ({selectedField === 'all' ? `All Fields - ${officerDivision}` : selectedField})
              </span>
            ) : isDivisionManager ? (
              `(${managerDivision} Division)`
            ) : (
              ''
            )}
          </h1>
          <p className="erp-page-subtitle">
            {isFieldOfficer
              ? selectedField === 'all'
                ? `Daily muster roll, attendance records, and leaf harvest yields across all monitored fields in ${officerDivision} Division.`
                : `Daily muster roll, attendance records, and leaf harvest yields for field block ${selectedField} (${officerDivision} Division).`
              : isDivisionManager
              ? `Daily muster roll, attendance records, and leaf harvest yields for ${managerDivision} Division.`
              : 'Daily muster roll, attendance records, and leaf harvest yields across all divisions.'}
          </p>
        </div>
      </div>

      {/* KPI Cards Row (Clean, Simple, 4 Metrics) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Total Employees</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">{stats.total}</strong>
              <span className="kpi-card__sub">
                {isFieldOfficer
                  ? selectedField === 'all'
                    ? `${officerDivision} Division`
                    : `Field ${selectedField}`
                  : isDivisionManager
                  ? `${managerDivision} Division`
                  : 'Across 5 Divisions'}
              </span>
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

            {isFieldOfficer ? (
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="filter-select"
                title="Filter employees by field block"
                style={{
                  fontWeight: 600,
                  color: 'var(--forest-900)',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Fields ({officerDivision})</option>
                {availableOfficerFields.map((f) => (
                  <option key={f} value={f}>
                    {f} {f === currentUser?.assignedField ? '(In Charge)' : ''}
                  </option>
                ))}
              </select>
            ) : isDivisionManager ? (
              <select
                value={managerDivision}
                disabled
                className="filter-select"
                title={`Division Manager view restricted to ${managerDivision} Division`}
                style={{ opacity: 0.9, backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              >
                <option value={managerDivision}>{managerDivision} Division (Assigned)</option>
              </select>
            ) : (
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
            )}

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as WorkerRole | 'all')}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              {!isFieldOfficer && <option value="super_admin">Super Admin</option>}
              {!isFieldOfficer && <option value="division_manager">Division Manager</option>}
              <option value="field_officer">Field Officer</option>
              <option value="worker">Employee</option>
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
                      {getRoleBadgeLabel(worker.role)}
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
                      {worker.todayPluckedKg > 0 && worker.attended ? (
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
              {isFieldOfficer
                ? `No employees found in ${selectedField === 'all' ? officerDivision : selectedField} matching the selected filters.`
                : 'No employees found matching the selected filters.'}
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
