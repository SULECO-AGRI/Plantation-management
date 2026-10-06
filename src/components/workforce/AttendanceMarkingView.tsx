import React, { useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCheck,
  Clock,
  Layers,
  MapPin,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { useWorkforce } from '../../context/WorkforceContext'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../common/Badge'
import type { Worker, WorkerRole, WorkerStatus } from '../../types/workforce'

export const AttendanceMarkingView: React.FC = () => {
  const { workers, batchUpdateAttendance, markAttendance } = useWorkforce()
  const { currentUser } = useAuth()

  const officerDivision =
    currentUser?.assignedDivision ||
    (currentUser?.divisionScope !== 'All Divisions' ? currentUser?.divisionScope : 'Weddamulla') ||
    'Weddamulla'

  const [search, setSearch] = useState('')
  const [selectedDivision, setSelectedDivision] = useState(officerDivision)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'present' | 'absent'>('all')

  // Extract available fields in the division (excluding administrative offices)
  const availableFields = useMemo(() => {
    const fieldsSet = new Set<string>()
    workers.forEach((w) => {
      if (
        w.division.toLowerCase() === selectedDivision.toLowerCase() &&
        w.fieldBlock &&
        w.fieldBlock !== 'Estate HQ' &&
        w.fieldBlock !== 'Division Office'
      ) {
        fieldsSet.add(w.fieldBlock)
      }
    })
    const list = Array.from(fieldsSet).sort()
    return list.length > 0 ? list : ['Block 4B', 'Block 4A', 'Block 2A', 'Block 3C', 'Block 7B', 'Block 9C', 'Block 3A', 'Block 1A']
  }, [workers, selectedDivision])

  // Field in charge (defaults to officer's assigned field e.g. 'Block 4B')
  const defaultField = currentUser?.assignedField || availableFields[0] || 'Block 4B'
  const [selectedField, setSelectedField] = useState<string>(defaultField)

  useEffect(() => {
    if (currentUser?.assignedField && availableFields.includes(currentUser.assignedField)) {
      setSelectedField(currentUser.assignedField)
    } else if (availableFields.length > 0 && !availableFields.includes(selectedField)) {
      setSelectedField(availableFields[0])
    }
  }, [selectedDivision, availableFields, currentUser])

  // Track pending local edits before batch save or instant inline updates
  const [localAttendance, setLocalAttendance] = useState<
    Record<string, { attended: boolean; checkInTime: string; status: WorkerStatus; hoursWorked: number }>
  >({})

  // Scoped workers STRICTLY for the specific field in charge (excluding super admin & division managers)
  const fieldWorkers = useMemo(() => {
    return workers.filter((w) => {
      const isFieldCrew = w.role !== 'super_admin' && w.role !== 'division_manager'
      const matchDivision = w.division.toLowerCase() === selectedDivision.toLowerCase()
      const matchField = w.fieldBlock.toLowerCase() === selectedField.toLowerCase()
      return isFieldCrew && matchDivision && matchField
    })
  }, [workers, selectedDivision, selectedField])

  // Get effective attendance state for worker
  const getWorkerState = (w: Worker) => {
    if (localAttendance[w.id]) {
      return localAttendance[w.id]
    }
    return {
      attended: w.attended ?? false,
      checkInTime: w.checkInTime || (w.attended ? '07:00 AM' : '07:00 AM'),
      status: w.status || (w.attended ? 'active' : 'offline'),
      hoursWorked: w.hoursWorkedToday || (w.attended ? 8 : 0),
    }
  }

  // Summary Metrics for the specific field in charge
  const stats = useMemo(() => {
    const total = fieldWorkers.length
    let present = 0
    let absent = 0
    let late = 0

    fieldWorkers.forEach((w) => {
      const state = getWorkerState(w)
      if (state.attended) {
        present++
        if (state.status === 'break' || state.checkInTime > '07:30 AM') {
          late++
        }
      } else {
        absent++
      }
    })

    const presentPct = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, late, presentPct }
  }, [fieldWorkers, localAttendance])

  // Filtered workers list by search and status
  const filteredWorkers = useMemo(() => {
    return fieldWorkers.filter((w) => {
      const state = getWorkerState(w)
      const matchesSearch =
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.id.toLowerCase().includes(search.toLowerCase()) ||
        (w.gangName && w.gangName.toLowerCase().includes(search.toLowerCase())) ||
        w.roleLabel.toLowerCase().includes(search.toLowerCase())

      const matchesAttendance =
        selectedFilter === 'all' ||
        (selectedFilter === 'present' && state.attended) ||
        (selectedFilter === 'absent' && !state.attended)

      return matchesSearch && matchesAttendance
    })
  }, [fieldWorkers, search, selectedFilter, localAttendance])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Set single worker status
  const handleSetStatus = (workerId: string, attended: boolean, status: WorkerStatus = 'active') => {
    const current = getWorkerState(fieldWorkers.find((w) => w.id === workerId)!)
    const updated = {
      ...current,
      attended,
      status: attended ? status : 'offline',
      checkInTime: attended ? current.checkInTime || '07:00 AM' : '',
      hoursWorked: attended ? (current.hoursWorked || 8) : 0,
    }

    setLocalAttendance((prev) => ({
      ...prev,
      [workerId]: updated,
    }))

    markAttendance(workerId, attended, updated.checkInTime, updated.status)
    const workerName = fieldWorkers.find((w) => w.id === workerId)?.name || workerId
    showToast(`${workerName} marked as ${attended ? 'Present' : 'Absent'}`)
  }

  // Update check-in time for worker
  const handleCheckInTimeChange = (workerId: string, time: string) => {
    const current = getWorkerState(fieldWorkers.find((w) => w.id === workerId)!)
    const updated = { ...current, checkInTime: time }
    setLocalAttendance((prev) => ({ ...prev, [workerId]: updated }))
    markAttendance(workerId, current.attended, time, current.status)
  }

  // Batch: Mark All Present for this field
  const handleMarkAllPresent = async () => {
    setIsSaving(true)
    const updates = filteredWorkers.map((w) => ({
      workerId: w.id,
      attended: true,
      status: 'active' as WorkerStatus,
      checkInTime: '07:00 AM',
      hoursWorkedToday: 8,
    }))

    const newLocal: Record<string, { attended: boolean; checkInTime: string; status: WorkerStatus; hoursWorked: number }> = {}
    updates.forEach((u) => {
      newLocal[u.workerId] = {
        attended: true,
        checkInTime: u.checkInTime,
        status: u.status,
        hoursWorked: u.hoursWorkedToday,
      }
    })

    setLocalAttendance((prev) => ({ ...prev, ...newLocal }))
    await batchUpdateAttendance(updates)
    setIsSaving(false)
    showToast(`Marked ${updates.length} employees in ${selectedField} as Present`)
  }

  // Batch: Mark All Absent for this field
  const handleMarkAllAbsent = async () => {
    setIsSaving(true)
    const updates = filteredWorkers.map((w) => ({
      workerId: w.id,
      attended: false,
      status: 'offline' as WorkerStatus,
      checkInTime: '',
      hoursWorkedToday: 0,
    }))

    const newLocal: Record<string, { attended: boolean; checkInTime: string; status: WorkerStatus; hoursWorked: number }> = {}
    updates.forEach((u) => {
      newLocal[u.workerId] = {
        attended: false,
        checkInTime: '',
        status: 'offline',
        hoursWorked: 0,
      }
    })

    setLocalAttendance((prev) => ({ ...prev, ...newLocal }))
    await batchUpdateAttendance(updates)
    setIsSaving(false)
    showToast(`Marked ${updates.length} employees in ${selectedField} as Absent`)
  }

  const getRoleBadgeVariant = (role: WorkerRole) => {
    switch (role) {
      case 'field_officer':
      case 'kangany':
        return 'purple'
      case 'harvester':
        return 'emerald'
      case 'sprayer':
        return 'blue'
      case 'worker':
      case 'sundry':
      default:
        return 'slate'
    }
  }

  return (
    <div className="erp-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#ffffff',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '12px 18px',
            color: '#065f46',
            boxShadow: '0 10px 25px rgba(15, 36, 28, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <Check size={16} color="#059669" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner (Field-Specific Header) */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">
            Attendance: <span style={{ color: 'var(--emerald-600)' }}>{selectedField}</span>
          </h1>
          <p className="erp-page-subtitle">
            Daily attendance for field crew in{' '}
            <strong style={{ color: 'var(--forest-900)' }}>{selectedField}</strong> ({selectedDivision} Division).
          </p>
        </div>

        {/* Field in Charge & Division Selectors */}
        <div className="erp-page-actions" style={{ flexWrap: 'wrap', gap: '10px' }}>
          {/* Field in Charge Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} color="var(--emerald-600)" />
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--forest-900)' }}>Field in Charge:</label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="filter-select"
              style={{
                borderColor: 'var(--emerald-500)',
                backgroundColor: '#ffffff',
                fontWeight: 700,
                color: 'var(--emerald-600)',
              }}
            >
              {availableFields.map((f) => (
                <option key={f} value={f}>
                  {f} {f === currentUser?.assignedField ? '(In Charge)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Division Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedDivision} Division</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Specific to this Field) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">{selectedField} Workforce</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">{stats.total}</strong>
              <span className="kpi-card__sub">Field Laborers</span>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-card--highlight">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Present in {selectedField}</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value text-emerald">{stats.present}</strong>
              <span className="kpi-card__unit" style={{ color: 'var(--emerald-600)', fontSize: '13px' }}>
                ({stats.presentPct}%)
              </span>
            </div>
            <span className="kpi-card__sub" style={{ color: 'var(--emerald-600)' }}>
              Attended Morning Muster
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Absent from {selectedField}</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value" style={{ color: '#dc2626' }}>
                {stats.absent}
              </strong>
              <span className="kpi-card__unit" style={{ color: '#dc2626', fontSize: '13px' }}>
                ({100 - stats.presentPct}%)
              </span>
            </div>
            <span className="kpi-card__sub">Off-Duty / Sick Leave</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Field Gate Time</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">07:00 AM</strong>
            </div>
            <span className="kpi-card__sub">Muster Closes 07:30 AM</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Roster Card */}
      <div className="erp-content-card">
        <div className="erp-content-card__header">
          {/* Search box */}
          <div className="workforce-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder={`Search workers in ${selectedField}...`}
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

          {/* Filter Pills & Batch Actions */}
          <div className="workforce-dropdown-filters">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All in {selectedField} ({fieldWorkers.length})</option>
              <option value="present">Present ({stats.present})</option>
              <option value="absent">Absent ({stats.absent})</option>
            </select>

            {/* Batch Action Buttons */}
            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={isSaving}
              style={{
                backgroundColor: 'var(--emerald-600)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(31, 107, 82, 0.15)',
              }}
            >
              <CheckCheck size={14} />
              <span>Mark All Present</span>
            </button>

            <button
              type="button"
              onClick={handleMarkAllAbsent}
              disabled={isSaving}
              style={{
                backgroundColor: '#ffffff',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <UserX size={14} />
              <span>Mark All Absent</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="workforce-table-wrapper">
          <table className="workforce-table">
            <thead>
              <tr>
                <th>Laborer / ID</th>
                <th>Field Role</th>
                <th>Gang &amp; Task</th>
                <th>Attendance Status</th>
                <th>Check-In Time</th>
                <th>Daily Hours</th>
                <th style={{ textAlign: 'right' }}>Muster Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Users size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No field laborers found in {selectedField}.</p>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w) => {
                  const state = getWorkerState(w)
                  const isPresent = state.attended

                  return (
                    <tr key={w.id} className="workforce-row">
                      {/* Name & ID */}
                      <td>
                        <div>
                          <strong style={{ fontSize: '13px', color: 'var(--forest-900)', display: 'block' }}>
                            {w.name}
                          </strong>
                          <span className="worker-id-code">{w.id}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <Badge variant={getRoleBadgeVariant(w.role)}>
                          {w.roleLabel}
                        </Badge>
                      </td>

                      {/* Gang & Task */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--forest-900)' }}>
                          {w.gangName || `${selectedField} Gang`}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '200px' }} title={w.currentTask}>
                          {w.currentTask}
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td>
                        <span
                          className={`employee-status-pill ${
                            isPresent ? 'employee-status-pill--present' : 'employee-status-pill--absent'
                          }`}
                        >
                          {isPresent ? `Present (${state.status})` : 'Absent'}
                        </span>
                      </td>

                      {/* Check-In Time */}
                      <td>
                        {isPresent ? (
                          <select
                            value={state.checkInTime || '07:00 AM'}
                            onChange={(e) => handleCheckInTimeChange(w.id, e.target.value)}
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-body)',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-card)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="06:30 AM">06:30 AM (Gang Lead)</option>
                            <option value="06:45 AM">06:45 AM (Early)</option>
                            <option value="07:00 AM">07:00 AM (Standard)</option>
                            <option value="07:15 AM">07:15 AM (Muster)</option>
                            <option value="07:30 AM">07:30 AM (Late 15m)</option>
                          </select>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* Daily Hours */}
                      <td>
                        {isPresent ? (
                          <strong style={{ color: 'var(--text-body)', fontSize: '12px' }}>
                            {state.hoursWorked.toFixed(1)} hrs
                          </strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0 hrs</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleSetStatus(w.id, true, 'active')}
                            title="Mark Present"
                            style={{
                              backgroundColor: isPresent ? 'var(--emerald-600)' : '#ffffff',
                              color: isPresent ? '#ffffff' : 'var(--emerald-600)',
                              border: '1px solid var(--emerald-500)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Check size={12} />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(w.id, false, 'offline')}
                            title="Mark Absent"
                            style={{
                              backgroundColor: !isPresent ? '#dc2626' : '#ffffff',
                              color: !isPresent ? '#ffffff' : '#dc2626',
                              border: '1px solid #f87171',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <X size={12} />
                            <span>Absent</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
