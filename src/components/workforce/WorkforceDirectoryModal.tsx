import React, { useMemo, useState } from 'react'
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
  const { workers, selectedWorker, setSelectedWorker } = useWorkforce()
  const { setIsLogModalOpen } = useHarvest()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('all')
  const [selectedRole, setSelectedRole] = useState<WorkerRole | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<WorkerStatus | 'all'>('all')

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.currentTask.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.fieldBlock.toLowerCase().includes(searchTerm.toLowerCase())

      const matchDiv = selectedDivision === 'all' || w.division === selectedDivision
      const matchRole = selectedRole === 'all' || w.role === selectedRole
      const matchStatus = selectedStatus === 'all' || w.status === selectedStatus

      return matchSearch && matchDiv && matchRole && matchStatus
    })
  }, [workers, searchTerm, selectedDivision, selectedRole, selectedStatus])

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
      title="Estate Workforce & Live GPS Directory"
      subtitle={`${filteredWorkers.length} workers registered across estate sectors`}
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
              <option value="kangany">Kangany (Supervisor)</option>
              <option value="harvester">Tea Harvester</option>
              <option value="sprayer">Chemical Sprayer</option>
              <option value="sundry">Sundry / Maintenance</option>
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
                        {worker.role === 'harvester' && (
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
