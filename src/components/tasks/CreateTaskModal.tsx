import React, { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '../common/Modal'
import { useTask } from '../../context/TaskContext'
import { useAuth } from '../../context/AuthContext'
import type { TaskAssigneeRole, TaskPriority, WorkType } from '../../types/task'
import {
  EstateDivision,
  findOfficialById,
  getDivisionManagerForDivision,
  getDivisionManagers,
  getFieldOfficers,
} from '../../data/mockOfficials'

type CreateTaskModalProps = {
  isOpen: boolean
  onClose: () => void
  initialDivision?: string
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  initialDivision,
}) => {
  const { createTask } = useTask()
  const { currentUser } = useAuth()

  const isSuperAdmin = currentUser?.role === 'super_admin'
  const isDivisionManager = currentUser?.role === 'division_manager'
  const userDivision = (currentUser?.assignedDivision || currentUser?.divisionScope || 'Weddamulla') as EstateDivision

  const defaultDivision: EstateDivision = isDivisionManager
    ? userDivision
    : (initialDivision as EstateDivision) || 'Weddamulla'

  const [division, setDivision] = useState<EstateDivision>(defaultDivision)
  const [assigneeRole, setAssigneeRole] = useState<TaskAssigneeRole>(
    isSuperAdmin ? 'division_manager' : 'field_officer'
  )
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [workType, setWorkType] = useState<WorkType>('tea_plucking')
  const [fieldBlockId, setFieldBlockId] = useState('Block 4B')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  const [targetOutput, setTargetOutput] = useState('450 kg Leaf')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isDivisionManager) {
      setDivision(userDivision)
      setAssigneeRole('field_officer')
    } else if (initialDivision && initialDivision !== 'All Divisions') {
      setDivision(initialDivision as EstateDivision)
    }
  }, [isOpen, isDivisionManager, userDivision, initialDivision])

  const availableOfficials = useMemo(() => {
    if (assigneeRole === 'division_manager') {
      const dm = getDivisionManagerForDivision(division)
      return dm ? [dm] : getDivisionManagers()
    } else {
      return getFieldOfficers(division)
    }
  }, [division, assigneeRole])

  useEffect(() => {
    if (availableOfficials.length > 0) {
      setAssigneeId(availableOfficials[0].id)
      if (availableOfficials[0].assignedField) {
        setFieldBlockId(availableOfficials[0].assignedField)
      }
    }
  }, [availableOfficials])

  const selectedOfficial = useMemo(() => {
    return findOfficialById(assigneeId) || availableOfficials[0]
  }, [assigneeId, availableOfficials])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOfficial) return

    setIsSubmitting(true)
    try {
      const creatorRole = isSuperAdmin ? 'super_admin' : 'division_manager'
      const createdBy = `${currentUser?.name || 'Administrator'} (${currentUser?.roleTitle || (isSuperAdmin ? 'Super Admin' : 'Division Manager')})`
      const assigneeName = `${selectedOfficial.name} (${selectedOfficial.role === 'division_manager' ? 'Division Manager' : 'Field Officer'})`

      await createTask({
        workType,
        division,
        fieldBlockId,
        assignedGangKangany: selectedOfficial.defaultGang || `${selectedOfficial.name} Crew`,
        kanganyPhone: selectedOfficial.phone,
        priority,
        targetDate,
        targetOutput,
        assignedWorkerCount: 10,
        notes,
        createdBy,
        creatorRole,
        assigneeRole,
        assigneeId: selectedOfficial.id,
        assigneeName,
        assigneePhone: selectedOfficial.phone,
      })

      onClose()
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Task"
      subtitle={
        isSuperAdmin
          ? 'Assign task to a Division Manager or Field Officer'
          : `Assign task to a ${division} Field Officer`
      }
      icon={<Plus size={18} />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="simple-task-form">
        {/* Assignee Selection */}
        {isSuperAdmin && (
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <div className="simple-radio-pills">
              <button
                type="button"
                className={`simple-radio-pill ${assigneeRole === 'division_manager' ? 'simple-radio-pill--active' : ''}`}
                onClick={() => setAssigneeRole('division_manager')}
              >
                Division Manager
              </button>
              <button
                type="button"
                className={`simple-radio-pill ${assigneeRole === 'field_officer' ? 'simple-radio-pill--active' : ''}`}
                onClick={() => setAssigneeRole('field_officer')}
              >
                Field Officer
              </button>
            </div>
          </div>
        )}

        <div className="form-grid-2">
          {/* Division */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-division">Division</label>
            {isSuperAdmin ? (
              <select
                id="simple-division"
                value={division}
                onChange={(e) => setDivision(e.target.value as EstateDivision)}
                className="form-input"
              >
                <option value="Weddamulla">Weddamulla</option>
                <option value="Ramboda">Ramboda</option>
                <option value="Camnethan">Camnethan</option>
                <option value="Lilliesland">Lilliesland</option>
                <option value="Wewandon">Wewandon</option>
              </select>
            ) : (
              <input
                id="simple-division"
                type="text"
                value={division}
                disabled
                className="form-input"
              />
            )}
          </div>

          {/* Person */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-officer">
              {assigneeRole === 'division_manager' ? 'Manager' : 'Field Officer'}
            </label>
            <select
              id="simple-officer"
              value={assigneeId}
              onChange={(e) => {
                setAssigneeId(e.target.value)
                const off = findOfficialById(e.target.value)
                if (off?.assignedField) setFieldBlockId(off.assignedField)
              }}
              className="form-input"
              required
            >
              {availableOfficials.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.assignedField ? `(${o.assignedField})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          {/* Work Type */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-worktype">Work Type</label>
            <select
              id="simple-worktype"
              value={workType}
              onChange={(e) => setWorkType(e.target.value as WorkType)}
              className="form-input"
            >
              <option value="tea_plucking">Tea Plucking</option>
              <option value="fertilizer_spraying">Fertilizer Spraying</option>
              <option value="pruning">Bush Pruning</option>
              <option value="weeding">Weeding</option>
              <option value="drainage_cleansing">Drainage Cleaning</option>
            </select>
          </div>

          {/* Block */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-block">Block</label>
            <input
              id="simple-block"
              type="text"
              placeholder="e.g. Block 4B"
              value={fieldBlockId}
              onChange={(e) => setFieldBlockId(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-grid-3">
          {/* Target Output */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-output">Target</label>
            <input
              id="simple-output"
              type="text"
              placeholder="e.g. 450 kg"
              value={targetOutput}
              onChange={(e) => setTargetOutput(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-date">Due Date</label>
            <input
              id="simple-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-priority">Priority</label>
            <select
              id="simple-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="form-input"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label" htmlFor="simple-notes">Instructions (Optional)</label>
          <textarea
            id="simple-notes"
            rows={2}
            placeholder="Field notes or specific directives..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input form-textarea"
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
