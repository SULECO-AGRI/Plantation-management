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
import type { Worker, WorkerRole, WorkerStatus } from '../../types/workforce'

type WorkforceDirectoryModalProps = {
  isOpen: boolean
  onClose: () => void
  onLocateWorker?: (worker: Worker) => void
}

export const WorkforceDirectoryModal: React.FC<WorkforceDirectoryModalProps> = ({
  isOpen,
  onClose,
  onLocateWorker,
}) => {
  const { currentUser } = useAuth()
  const { workers, selectedWorker, setSelectedWorker } = useWorkforce()
  const { setIsLogModalOpen } = useHarvest()

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isFieldOfficer
          ? `Field Workforce Directory (${selectedField === 'all' ? `All Fields - ${officerDivision}` : selectedField})`
          : isDivisionManager
          ? `Division Workforce Directory (${managerDivision})`
          : 'Estate Workforce & Live GPS Directory'
      }
      subtitle={`${filteredWorkers.length} ${
        isFieldOfficer
          ? `employees assigned to ${selectedField === 'all' ? `${officerDivision} Division` : selectedField}`
          : isDivisionManager
          ? `employees in ${managerDivision} Division`
          : 'workers registered across estate sectors'
      }`}
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
              placeholder="Search by worker name, ID (e.g. WKR-102), field block, or task..."
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

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as WorkerStatus | 'all')}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active In Field</option>
              <option value="break">On Break</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        {/* Workers List / Table */}
        <div className="workforce-table-wrapper">
          <table className="workforce-table">
            <thead>
              <tr>
                <th>Worker ID &amp; Name</th>
                <th>Role</th>
                <th>Division / Field</th>
                <th>Current Work Order / Task</th>
                <th>Today's Leaf (kg)</th>
                <th>Last GPS Ping</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    No workforce members match your search criteria.
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
                            <strong>{worker.todayPluckedKg.toFixed(1)}</strong>
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
                      </div>
                    </td>
                    <td>
                      <div className="worker-actions-cell">
                        <button
                          type="button"
                          className="table-action-btn table-action-btn--locate"
                          onClick={() => handleLocate(worker)}
                          title="Locate on Leaflet Map"
                        >
                          <MapPin size={13} />
                          <span>Map</span>
                        </button>
                        {isFieldOfficer && (worker.role === 'worker' || (worker.role as string) === 'harvester') && (
                          <button
                            type="button"
                            className="table-action-btn table-action-btn--weigh"
                            onClick={() => handleQuickWeighIn(worker)}
                            title="Record Weigh-In"
                          >
                            <Scale size={13} />
                            <span>Weigh</span>
                          </button>
                        )}
                        <a
                          href={`tel:${worker.phone}`}
                          className="table-action-btn table-action-btn--call"
                          title={`Call ${worker.name} (${worker.phone})`}
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
