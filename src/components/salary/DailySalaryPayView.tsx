import React, { useMemo, useState } from 'react'
import { useSalary } from '../../context/SalaryContext'
import { useAuth } from '../../context/AuthContext'
import type { DailySalaryRecord, PaymentMethod, SalaryPaymentStatus } from '../../types/salary'

const ALL_DIVISIONS = ['Weddamulla', 'Ramboda', 'Camnethan', 'Lilliesland', 'Wewandon']

const DIVISION_FIELDS: Record<string, string[]> = {
  Weddamulla: ['Block 4B', 'Block 3C', 'Block 2A', 'Block 4A'],
  Ramboda: ['Block 11A', 'Block 9C'],
  Camnethan: ['Block 7B', 'Block 5A'],
  Lilliesland: ['Block 3A', 'Block 2C'],
  Wewandon: ['Block 14B', 'Block 12D'],
}

export const DailySalaryPayView: React.FC = () => {
  const { records, selectedDate, setSelectedDate, isLoading, markPaid, markUnpaid, batchMarkPaid } = useSalary()
  const { currentUser } = useAuth()

  const isSuperAdmin = currentUser?.role === 'super_admin'
  const isDivisionManager = currentUser?.role === 'division_manager'
  const isFieldOfficer = currentUser?.role === 'field_officer' || (currentUser?.role as string) === 'kangany'

  const userDivision = currentUser?.assignedDivision || currentUser?.divisionScope || 'Weddamulla'
  const userField = currentUser?.assignedField || 'Block 4B'

  // Division and Field Block selections
  const [selectedDivision, setSelectedDivision] = useState<string>(
    isSuperAdmin ? 'Weddamulla' : userDivision
  )
  const [selectedFieldBlock, setSelectedFieldBlock] = useState<string>(
    isFieldOfficer ? userField : 'all'
  )

  // Filter States
  const [statusFilter, setStatusFilter] = useState<SalaryPaymentStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Available field blocks for the selected division
  const availableFields = DIVISION_FIELDS[selectedDivision] || ['Block 4B', 'Block 2A', 'Block 3C']

  // 1. Role Scoping
  const scopedRecords = useMemo(() => {
    return records.filter((record) => {
      // Super Admin: Can view any division & field
      if (isSuperAdmin) {
        if (selectedDivision !== 'all' && record.division.toLowerCase() !== selectedDivision.toLowerCase()) {
          return false
        }
        if (selectedFieldBlock !== 'all' && record.fieldBlock.toLowerCase() !== selectedFieldBlock.toLowerCase()) {
          return false
        }
        return true
      }

      // Division Manager: strictly their division, can filter by field block
      if (isDivisionManager) {
        if (record.division.toLowerCase() !== userDivision.toLowerCase()) {
          return false
        }
        if (selectedFieldBlock !== 'all' && record.fieldBlock.toLowerCase() !== selectedFieldBlock.toLowerCase()) {
          return false
        }
        return true
      }

      // Field Officer: STRICTLY their assigned field in their division
      if (isFieldOfficer) {
        return (
          record.division.toLowerCase() === userDivision.toLowerCase() &&
          record.fieldBlock.toLowerCase() === userField.toLowerCase()
        )
      }

      return record.division.toLowerCase() === userDivision.toLowerCase()
    })
  }, [records, isSuperAdmin, isDivisionManager, isFieldOfficer, selectedDivision, selectedFieldBlock, userDivision, userField])

  // 2. Status & Search Filters
  const filteredRecords = useMemo(() => {
    return scopedRecords.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = record.workerName.toLowerCase().includes(q)
        const matchId = record.workerId.toLowerCase().includes(q)
        const matchRole = record.roleLabel.toLowerCase().includes(q)
        return matchName || matchId || matchRole
      }
      return true
    })
  }, [scopedRecords, statusFilter, searchQuery])

  // Summary Metrics
  const stats = useMemo(() => {
    const totalWorkers = scopedRecords.length
    const presentWorkers = scopedRecords.filter((r) => r.attended).length
    const paidWorkers = scopedRecords.filter((r) => r.status === 'paid').length
    const unpaidPresent = scopedRecords.filter((r) => r.status === 'unpaid' && r.attended).length
    const totalDue = scopedRecords.reduce((acc, r) => acc + (r.attended ? r.totalWage : 0), 0)
    const totalPaid = scopedRecords
      .filter((r) => r.status === 'paid')
      .reduce((acc, r) => acc + r.totalWage, 0)
    return { totalWorkers, presentWorkers, paidWorkers, unpaidPresent, totalDue, totalPaid }
  }, [scopedRecords])

  // Action: Pay single worker
  const handlePay = async (record: DailySalaryRecord, method: PaymentMethod = 'cash') => {
    try {
      setIsProcessingId(record.id)
      const payerName = `${currentUser?.name || 'Field Officer'} (${currentUser?.roleTitle || 'Field Officer'})`
      await markPaid(record.id, payerName, method)
      setToastMessage(`Paid LKR ${record.totalWage.toLocaleString()} to ${record.workerName} (${record.workerId}).`)
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      alert(`Error recording payment: ${err.message}`)
    } finally {
      setIsProcessingId(null)
    }
  }

  // Action: Mark single worker unpaid (undo)
  const handleUnpay = async (record: DailySalaryRecord) => {
    try {
      setIsProcessingId(record.id)
      await markUnpaid(record.id)
      setToastMessage(`Marked ${record.workerName} as Unpaid.`)
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      alert(`Error updating payment: ${err.message}`)
    } finally {
      setIsProcessingId(null)
    }
  }

  // Action: Batch Pay all unpaid present workers
  const handleBatchPayPresent = async () => {
    const unpaidPresentIds = scopedRecords
      .filter((r) => r.status === 'unpaid' && r.attended)
      .map((r) => r.id)

    if (unpaidPresentIds.length === 0) return

    try {
      setIsProcessingId('batch')
      const payerName = `${currentUser?.name || 'Field Officer'} (${currentUser?.roleTitle || 'Field Officer'})`
      await batchMarkPaid(unpaidPresentIds, payerName, 'cash')
      setToastMessage(`Successfully paid ${unpaidPresentIds.length} present field workers.`)
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      alert(`Error in batch payout: ${err.message}`)
    } finally {
      setIsProcessingId(null)
    }
  }

  // Titles
  const viewTitle = isFieldOfficer
    ? `Daily Salary: ${userField}`
    : isDivisionManager
    ? `Daily Salary: ${userDivision} Division`
    : 'Daily Salary: All Divisions'

  const viewSubtitle = isFieldOfficer
    ? `Mark and record daily salary payments for employees in ${userField} (${userDivision} Division)`
    : isDivisionManager
    ? `Daily wage tracking and field payments overview for ${userDivision} Division`
    : 'Global estate daily wage payout tracking across all divisions and fields'

  return (
    <div className="erp-page-container">
      {/* Page Header */}
      <div className="erp-page-header">
        <div>
          <div className="erp-page-title-row">
            <h1 className="erp-page-title">{viewTitle}</h1>
            <span className="erp-badge erp-badge--neutral">
              {isFieldOfficer
                ? `Field Officer (${userField})`
                : isDivisionManager
                ? `Division Manager (${userDivision})`
                : 'Super Admin'}
            </span>
          </div>
          <p className="erp-page-subtitle">{viewSubtitle}</p>
        </div>

        {/* Batch Pay Button for Field Officer / Manager */}
        {stats.unpaidPresent > 0 && (
          <div className="erp-page-header__actions">
            <button
              type="button"
              className="erp-btn erp-btn--success"
              onClick={handleBatchPayPresent}
              disabled={isProcessingId === 'batch'}
            >
              {isProcessingId === 'batch'
                ? 'Processing...'
                : `Pay All Present (${stats.unpaidPresent} Workers)`}
            </button>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="erp-alert erp-alert--success">
          <span>{toastMessage}</span>
          <button type="button" className="erp-alert__close" onClick={() => setToastMessage(null)}>
            ×
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="erp-metrics-grid">
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">Field Workers</div>
          <div className="erp-metric-card__value">{stats.totalWorkers}</div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">Present Today</div>
          <div className="erp-metric-card__value">{stats.presentWorkers}</div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">Total Daily Wage Due</div>
          <div className="erp-metric-card__value">LKR {stats.totalDue.toLocaleString()}</div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">Total Paid Today</div>
          <div className="erp-metric-card__value" style={{ color: '#15803d' }}>
            LKR {stats.totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">Unpaid Workers</div>
          <div
            className="erp-metric-card__value"
            style={{ color: stats.unpaidPresent > 0 ? '#b45309' : undefined }}
          >
            {stats.unpaidPresent}
          </div>
        </div>
      </div>

      {/* Filter and Date Controls */}
      <div className="erp-filters-bar">
        {/* Status Pills */}
        <div className="erp-filter-group">
          <button
            type="button"
            className={`erp-pill-btn ${statusFilter === 'all' ? 'erp-pill-btn--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Workers ({scopedRecords.length})
          </button>
          <button
            type="button"
            className={`erp-pill-btn ${statusFilter === 'unpaid' ? 'erp-pill-btn--active' : ''}`}
            onClick={() => setStatusFilter('unpaid')}
          >
            Unpaid ({scopedRecords.filter((r) => r.status === 'unpaid').length})
          </button>
          <button
            type="button"
            className={`erp-pill-btn ${statusFilter === 'paid' ? 'erp-pill-btn--active' : ''}`}
            onClick={() => setStatusFilter('paid')}
          >
            Paid ({scopedRecords.filter((r) => r.status === 'paid').length})
          </button>
        </div>

        {/* Date, Scope and Search Controls */}
        <div className="erp-filter-controls">
          {/* Date Selector */}
          <input
            type="date"
            className="erp-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '140px' }}
          />

          {/* Super Admin Division Selector */}
          {isSuperAdmin && (
            <select
              className="erp-select"
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value)
                setSelectedFieldBlock('all')
              }}
            >
              {ALL_DIVISIONS.map((div) => (
                <option key={div} value={div}>
                  {div} Division
                </option>
              ))}
            </select>
          )}

          {/* Division Manager / Super Admin Field Selector */}
          {(isSuperAdmin || isDivisionManager) && (
            <select
              className="erp-select"
              value={selectedFieldBlock}
              onChange={(e) => setSelectedFieldBlock(e.target.value)}
            >
              <option value="all">All Fields</option>
              {availableFields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <input
            type="text"
            className="erp-input erp-input--search"
            placeholder="Search worker ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Salary Table */}
      <div className="erp-table-container">
        {isLoading ? (
          <div className="erp-table-empty">Loading salary records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="erp-table-empty">
            No employee salary records found matching the criteria.
          </div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Worker ID & Name</th>
                <th>Role</th>
                <th>Attendance</th>
                <th>Work Output</th>
                <th>Base Wage</th>
                <th>Incentive</th>
                <th>Total Pay</th>
                <th>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const isPaid = record.status === 'paid'

                return (
                  <tr key={record.id}>
                    {/* Worker ID & Name */}
                    <td>
                      <div className="erp-table__primary-text">{record.workerName}</div>
                      <div className="erp-table__secondary-text">
                        <span className="erp-table__code">{record.workerId}</span> • {record.fieldBlock}
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span className="erp-table__category-badge">{record.roleLabel}</span>
                    </td>

                    {/* Attendance */}
                    <td>
                      {record.attended ? (
                        <span className="erp-badge erp-badge--success">
                          Present ({record.hoursWorked}h)
                        </span>
                      ) : (
                        <span className="erp-badge erp-badge--muted">Absent</span>
                      )}
                    </td>

                    {/* Work Output */}
                    <td>
                      {record.pluckedKg > 0 ? (
                        <span style={{ fontWeight: 500 }}>{record.pluckedKg} kg Leaf</span>
                      ) : (
                        <span className="erp-table__status-text">—</span>
                      )}
                    </td>

                    {/* Base Wage */}
                    <td>
                      {record.attended ? `LKR ${record.baseRate.toLocaleString()}` : 'LKR 0'}
                    </td>

                    {/* Incentive */}
                    <td>
                      {record.incentive > 0 ? (
                        <span style={{ color: '#047857', fontWeight: 500 }}>
                          + LKR {record.incentive.toLocaleString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Total Pay */}
                    <td>
                      <strong style={{ fontSize: '13.5px', color: record.attended ? '#0f172a' : '#94a3b8' }}>
                        LKR {record.totalWage.toLocaleString()}
                      </strong>
                    </td>

                    {/* Payment Status */}
                    <td>
                      {isPaid ? (
                        <div>
                          <span className="erp-badge erp-badge--success">Paid (Cash)</span>
                          {record.paidBy && (
                            <div className="erp-table__secondary-text" style={{ fontSize: '11px', marginTop: '2px' }}>
                              {record.paidBy} {record.paidAt ? `• ${record.paidAt.split(' ')[1]}` : ''}
                            </div>
                          )}
                        </div>
                      ) : record.attended ? (
                        <span className="erp-badge erp-badge--warning">Unpaid</span>
                      ) : (
                        <span className="erp-badge erp-badge--muted">No Payout</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      {record.attended ? (
                        isPaid ? (
                          <button
                            type="button"
                            className="erp-btn erp-btn--sm erp-btn--outline"
                            onClick={() => handleUnpay(record)}
                            disabled={isProcessingId === record.id}
                            title="Mark back to unpaid"
                          >
                            Mark Unpaid
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="erp-btn erp-btn--sm erp-btn--success"
                            onClick={() => handlePay(record, 'cash')}
                            disabled={isProcessingId === record.id}
                          >
                            {isProcessingId === record.id ? 'Saving...' : 'Mark Paid'}
                          </button>
                        )
                      ) : (
                        <span className="erp-table__status-text">No Pay</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
