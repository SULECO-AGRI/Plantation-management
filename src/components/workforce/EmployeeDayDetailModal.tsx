import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Worker } from '../../types/workforce'
import { useTranslation } from '../../context/LanguageContext'

type EmployeeDayDetailModalProps = {
  worker: Worker | null
  isOpen: boolean
  onClose: () => void
  onLocateOnMap?: (worker: Worker) => void
}

const DIVISION_NAMES: Record<string, { en: string; si: string }> = {
  weddamulla: { en: 'Weddamulla', si: 'වෙද්දමුල්ල' },
  ramboda: { en: 'Ramboda', si: 'රම්බොඩ' },
  camnethan: { en: 'Camnethan', si: 'කැම්නෙතන්' },
  lilliesland: { en: 'Lilliesland', si: 'ලිලීස්ලන්ඩ්' },
  wewandon: { en: 'Wewandon', si: 'වැවන්ඩන්' },
}

function getLocalizedDivision(div: string, locale: string): string {
  const key = div.toLowerCase().trim()
  if (locale === 'si' && DIVISION_NAMES[key]) {
    return DIVISION_NAMES[key].si
  }
  return div
}

function getLocalizedRoleLabel(roleLabel: string, role: string, locale: string): string {
  if (locale !== 'si') return roleLabel
  switch (role) {
    case 'super_admin':
      return 'ප්‍රධාන පරිපාලක'
    case 'division_manager':
      return 'කොට්ඨාස කළමනාකරු'
    case 'field_officer':
    case 'kangany':
      return 'ක්ෂේත්‍ර නිලධාරී'
    case 'harvester':
      return 'දළු නෙළන්නා'
    case 'sprayer':
      return 'ඉසින ක්‍රියාකරු'
    case 'sundry':
      return 'ක්ෂේත්‍ර සේවක'
    default:
      return roleLabel
  }
}

export const EmployeeDayDetailModal: React.FC<EmployeeDayDetailModalProps> = ({
  worker,
  isOpen,
  onClose,
  onLocateOnMap,
}) => {
  const { t, locale } = useTranslation()

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
              {/* Employee name preserved in English as instructed */}
              <h3 className="employee-detail-modal__name">{worker.name}</h3>
              <span
                className={`employee-status-pill ${
                  isAttended ? 'employee-status-pill--present' : 'employee-status-pill--absent'
                }`}
              >
                {isAttended ? t('employees.presentToday') : t('employees.absentToday')}
              </span>
            </div>
            <p className="employee-detail-modal__subtitle">
              {worker.id} · {getLocalizedRoleLabel(worker.roleLabel, worker.role, locale)}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('employees.modalClose')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="employee-detail-modal__body">
          {/* Key Metrics Grid */}
          <div className="employee-stat-grid">
            <div className="employee-stat-card">
              <span className="employee-stat-card__label">{t('employees.modalTodaysHarvest')}</span>
              <div className="employee-stat-card__value">
                {isHarvester && isAttended ? (
                  <>
                    {worker.todayPluckedKg.toFixed(1)} <small>{t('employees.kg')}</small>
                  </>
                ) : (
                  <span className="employee-stat-card__muted">—</span>
                )}
              </div>
              <span className="employee-stat-card__hint">
                {isHarvester
                  ? isAttended
                    ? t('employees.modalTotalLeafWeighed')
                    : t('employees.modalNoAttendance')
                  : t('employees.modalNonHarvesting')}
              </span>
            </div>

            <div className="employee-stat-card">
              <span className="employee-stat-card__label">{t('employees.modalHoursWorked')}</span>
              <div className="employee-stat-card__value">
                {isAttended ? (
                  <>
                    {hours.toFixed(1)} <small>{t('employees.hrs')}</small>
                  </>
                ) : (
                  <span className="employee-stat-card__muted">0 <small>{t('employees.hrs')}</small></span>
                )}
              </div>
              <span className="employee-stat-card__hint">
                {isAttended && worker.checkInTime
                  ? t('employees.modalShiftStart', { time: worker.checkInTime })
                  : t('employees.modalAbsentRoll')}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="employee-info-list">
            <div className="employee-info-row">
              <span className="employee-info-label">{t('employees.modalDivision')}</span>
              <span className="employee-info-val">{getLocalizedDivision(worker.division, locale)}</span>
            </div>
            <div className="employee-info-row">
              <span className="employee-info-label">{t('employees.modalFieldBlock')}</span>
              <span className="employee-info-val">{worker.fieldBlock}</span>
            </div>
            <div className="employee-info-row">
              <span className="employee-info-label">{t('employees.modalCurrentTask')}</span>
              <span className="employee-info-val">{worker.currentTask}</span>
            </div>
            {worker.gangName && (
              <div className="employee-info-row">
                <span className="employee-info-label">{t('employees.modalAssignedGang')}</span>
                <span className="employee-info-val">{worker.gangName}</span>
              </div>
            )}
            <div className="employee-info-row">
              <span className="employee-info-label">{t('employees.modalPhone')}</span>
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
              {t('employees.modalLocateOnMap')}
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={onClose}
          >
            {t('employees.modalCloseBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
