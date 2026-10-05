import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Worker } from '../../types/workforce'

type EmployeeDayDetailModalProps = {
  worker: Worker | null
  isOpen: boolean
  onClose: () => void
  onLocateOnMap?: (worker: Worker) => void
}

export const EmployeeDayDetailModal: React.FC<EmployeeDayDetailModalProps> = ({
  worker,
  isOpen,
  onClose,
  onLocateOnMap,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !worker) return null

  const isAttended = Boolean(worker.attended)
  const hours = worker.hoursWorkedToday ?? (isAttended ? 7.5 : 0)
  const isHarvester = worker.role === 'harvester'

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container modal-container--sm employee-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="employee-detail-modal__header">
          <div className="employee-detail-modal__title-group">
            <div className="employee-detail-modal__name-row">
              <h3 className="employee-detail-modal__name">{worker.name}</h3>
              <span
                className={`employee-status-pill ${
                  isAttended ? 'employee-status-pill--present' : 'employee-status-pill--absent'
                }`}
              >
                {isAttended ? 'Present Today' : 'Absent Today'}
              </span>
            </div>
            <p className="employee-detail-modal__subtitle">
              {worker.id} · {worker.roleLabel}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close employee details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="employee-detail-modal__body">
          {/* Key Metrics Grid */}
          <div className="employee-stat-grid">
            <div className="employee-stat-card">
              <span className="employee-stat-card__label">Today's Harvest</span>
              <div className="employee-stat-card__value">
                {isHarvester && isAttended ? (
                  <>
                    {worker.todayPluckedKg.toFixed(1)} <small>kg</small>
                  </>
                ) : (
                  <span className="employee-stat-card__muted">—</span>
                )}
              </div>
              <span className="employee-stat-card__hint">
                {isHarvester
                  ? isAttended
                    ? 'Total leaf weighed today'
                    : 'No attendance recorded'
                  : 'Non-harvesting assignment'}
              </span>
            </div>

            <div className="employee-stat-card">
              <span className="employee-stat-card__label">Hours Worked</span>
              <div className="employee-stat-card__value">
                {isAttended ? (
                  <>
                    {hours.toFixed(1)} <small>hrs</small>
                  </>
                ) : (
                  <span className="employee-stat-card__muted">0 <small>hrs</small></span>
                )}
              </div>
              <span className="employee-stat-card__hint">
                {isAttended && worker.checkInTime
                  ? `Shift start: ${worker.checkInTime}`
                  : 'Absent from morning roll'}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="employee-info-list">
            <div className="employee-info-row">
              <span className="employee-info-label">Division</span>
              <span className="employee-info-val">{worker.division}</span>
            </div>
            <div className="employee-info-row">
              <span className="employee-info-label">Field Block</span>
              <span className="employee-info-val">{worker.fieldBlock}</span>
            </div>
            <div className="employee-info-row">
              <span className="employee-info-label">Current Task</span>
              <span className="employee-info-val">{worker.currentTask}</span>
            </div>
            {worker.gangName && (
              <div className="employee-info-row">
                <span className="employee-info-label">Assigned Gang</span>
                <span className="employee-info-val">{worker.gangName}</span>
              </div>
            )}
            <div className="employee-info-row">
              <span className="employee-info-label">Phone</span>
              <span className="employee-info-val">
                <a href={`tel:${worker.phone}`} className="employee-phone-link">
                  {worker.phone}
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="employee-detail-modal__footer">
          {onLocateOnMap && isAttended && (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => {
                onLocateOnMap(worker)
                onClose()
              }}
            >
              Locate on Map
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
