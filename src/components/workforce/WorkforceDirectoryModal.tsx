import React, { useEffect, useMemo, useState } from 'react'
import {
  Filter,
  MapPin,
  Phone,
  Scale,
  Search,
  User,
  Users,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'
import { useWorkforce } from '../../context/WorkforceContext'
import { useHarvest } from '../../context/HarvestContext'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import type { Worker, WorkerRole, WorkerStatus } from '../../types/workforce'

type WorkforceDirectoryModalProps = {
  isOpen: boolean
  onClose: () => void
  onLocateWorker?: (worker: Worker) => void
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

export const WorkforceDirectoryModal: React.FC<WorkforceDirectoryModalProps> = ({
  isOpen,
  onClose,
  onLocateWorker,
}) => {
  const { currentUser } = useAuth()
  const { workers, selectedWorker, setSelectedWorker } = useWorkforce()
  const { setIsLogModalOpen } = useHarvest()
  const { t, locale } = useTranslation()

  const isFieldOfficer = currentUser?.role === 'field_officer' || (currentUser?.role as string) === 'kangany'
  const officerField = currentUser?.assignedField || 'Block 4B'
  const isDivisionManager = currentUser?.role === 'division_manager'
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

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedField, setSelectedField] = useState<string>(
    isFieldOfficer ? officerField : 'all'
  )
  const [selectedDivision, setSelectedDivision] = useState(
    isDivisionManager ? managerDivision : 'all'
  )
  const [selectedRole, setSelectedRole] = useState<WorkerRole | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<WorkerStatus | 'all'>('all')

  useEffect(() => {
    if (isFieldOfficer) {
      setSelectedField(currentUser?.assignedField || 'Block 4B')
    } else {
      setSelectedField('all')
    }
  }, [isFieldOfficer, currentUser?.assignedField])

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (isFieldOfficer) {
        if (w.role === 'super_admin' || w.role === 'division_manager') return false
        if (w.division.toLowerCase() !== officerDivision.toLowerCase()) return false
        if (selectedField !== 'all' && w.fieldBlock.trim().toLowerCase() !== selectedField.trim().toLowerCase()) {
          return false
        }
      }

      const matchSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.currentTask.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.fieldBlock.toLowerCase().includes(searchTerm.toLowerCase())

      const matchDiv = isFieldOfficer
        ? true
        : isDivisionManager
        ? w.division === managerDivision
        : selectedDivision === 'all' || w.division === selectedDivision
      const matchRole =
        selectedRole === 'all' ||
        w.role === selectedRole ||
        (selectedRole === 'field_officer' && (w.role as string) === 'kangany') ||
        (selectedRole === 'worker' && ['harvester', 'sprayer', 'sundry'].includes(w.role as string))
      const matchStatus = selectedStatus === 'all' || w.status === selectedStatus

      return matchSearch && matchDiv && matchRole && matchStatus
    })
  }, [workers, searchTerm, isFieldOfficer, officerDivision, selectedField, isDivisionManager, managerDivision, selectedDivision, selectedRole, selectedStatus])

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
        return t('employees.badgeSuperAdmin')
      case 'division_manager':
        return t('employees.badgeDivisionManager')
      case 'field_officer':
      case 'kangany':
        return t('employees.badgeFieldOfficer')
      case 'worker':
      case 'harvester':
      case 'sprayer':
      case 'sundry':
      default:
        return t('employees.badgeEmployee')
    }
  }

  const handleLocate = (worker: Worker) => {
    setSelectedWorker(worker)
    onClose()
    if (onLocateWorker) onLocateWorker(worker)
  }

  const handleQuickWeighIn = (worker: Worker) => {
    setSelectedWorker(worker)
    onClose()
    setIsLogModalOpen(true)
  }

  const modalTitle = isFieldOfficer
    ? t('employees.directoryFieldTitle', {
        field: selectedField === 'all'
          ? `${t('employees.allFields')} - ${getLocalizedDivision(officerDivision, locale)}`
          : selectedField,
      })
    : isDivisionManager
    ? t('employees.directoryDivisionTitle', {
        division: getLocalizedDivision(managerDivision, locale),
      })
    : t('employees.directoryEstateTitle')

  const modalSubtitle = isFieldOfficer
    ? t('employees.directorySubtitleField', {
        count: filteredWorkers.length,
        field: selectedField === 'all'
          ? `${getLocalizedDivision(officerDivision, locale)} ${t('employees.divisionSuffix')}`
          : selectedField,
      })
    : isDivisionManager
    ? t('employees.directorySubtitleDivision', {
        count: filteredWorkers.length,
        division: getLocalizedDivision(managerDivision, locale),
      })
    : t('employees.directorySubtitleEstate', {
        count: filteredWorkers.length,
      })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={<Users size={20} />}
      maxWidth="xl"
    >
      <div className="workforce-directory">
        {/* Filter Controls Bar */}
        <div className="workforce-filter-bar">
          <div className="workforce-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder={t('employees.directorySearchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="workforce-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="workforce-dropdown-filters">
            {isFieldOfficer ? (
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="filter-select"
                title="Filter by field block"
                style={{
                  fontWeight: 600,
                  color: 'var(--forest-900)',
                  cursor: 'pointer',
                }}
              >
                <option value="all">{t('employees.allFields')} ({getLocalizedDivision(officerDivision, locale)})</option>
                {availableOfficerFields.map((f) => (
                  <option key={f} value={f}>
                    {f} {f === currentUser?.assignedField ? t('employees.inCharge') : ''}
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
                <option value={managerDivision}>
                  {getLocalizedDivision(managerDivision, locale)} {t('employees.divisionSuffix')} {t('employees.assigned')}
                </option>
              </select>
            ) : (
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('employees.allDivisions')}</option>
                <option value="Weddamulla">{getLocalizedDivision('Weddamulla', locale)}</option>
                <option value="Ramboda">{getLocalizedDivision('Ramboda', locale)}</option>
                <option value="Camnethan">{getLocalizedDivision('Camnethan', locale)}</option>
                <option value="Lilliesland">{getLocalizedDivision('Lilliesland', locale)}</option>
                <option value="Wewandon">{getLocalizedDivision('Wewandon', locale)}</option>
              </select>
            )}

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as WorkerRole | 'all')}
              className="filter-select"
            >
              <option value="all">{t('employees.allRoles')}</option>
              {!isFieldOfficer && <option value="super_admin">{t('employees.roleSuperAdmin')}</option>}
              {!isFieldOfficer && <option value="division_manager">{t('employees.roleDivisionManager')}</option>}
              <option value="field_officer">{t('employees.roleFieldOfficer')}</option>
              <option value="worker">{t('employees.roleEmployee')}</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as WorkerStatus | 'all')}
              className="filter-select"
            >
              <option value="all">{t('employees.allStatuses')}</option>
              <option value="active">{t('employees.statusActive')}</option>
              <option value="break">{t('employees.statusBreak')}</option>
              <option value="offline">{t('employees.statusOffline')}</option>
            </select>
          </div>
        </div>

        {/* Workers List / Table */}
        <div className="workforce-table-wrapper">
          <table className="workforce-table">
            <thead>
              <tr>
                <th>{t('employees.thWorkerIdName')}</th>
                <th>{t('employees.thRole')}</th>
                <th>{t('employees.thDivisionField')}</th>
                <th>{t('employees.thCurrentWorkOrder')}</th>
                <th>{t('employees.thTodaysLeafKg')}</th>
                <th>{t('employees.thLastGpsPing')}</th>
                <th>{t('employees.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    {t('employees.noWorkersMatch')}
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
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
                          {/* Worker personal name kept strictly in English as instructed */}
                          <strong>{worker.name}</strong>
                          <span className="worker-id-code">{worker.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getRoleBadgeVariant(worker.role)}>
                        {getRoleBadgeLabel(worker.role)}
                      </Badge>
                    </td>
                    <td>
                      <div className="division-field-cell">
                        <span className="division-badge">{getLocalizedDivision(worker.division, locale)}</span>
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
                            <strong>{worker.todayPluckedKg.toFixed(1)}</strong>
                            <small> {t('employees.kg')}</small>
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
                      </div>
                    </td>
                    <td>
                      <div className="worker-actions-cell">
                        <button
                          type="button"
                          className="table-action-btn table-action-btn--locate"
                          onClick={() => handleLocate(worker)}
                          title={t('employees.titleLocate')}
                        >
                          <MapPin size={13} />
                          <span>{t('employees.btnMap')}</span>
                        </button>
                        {isFieldOfficer && (worker.role === 'worker' || (worker.role as string) === 'harvester') && (
                          <button
                            type="button"
                            className="table-action-btn table-action-btn--weigh"
                            onClick={() => handleQuickWeighIn(worker)}
                            title={t('employees.titleRecordWeigh')}
                          >
                            <Scale size={13} />
                            <span>{t('employees.btnWeigh')}</span>
                          </button>
                        )}
                        <a
                          href={`tel:${worker.phone}`}
                          className="table-action-btn table-action-btn--call"
                          title={t('employees.titleCall', { name: worker.name, phone: worker.phone })}
                        >
                          <Phone size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
