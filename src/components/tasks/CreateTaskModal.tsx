import React, { useState } from 'react'
import { Calendar, CheckCircle, Clock, MapPin, Plus, ShieldAlert, Sparkles, Users } from 'lucide-react'
import { Modal } from '../common/Modal'
import { useTask } from '../../context/TaskContext'
import { useAuth } from '../../context/AuthContext'
import type { TaskPriority, WorkType } from '../../types/task'

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

  const [workType, setWorkType] = useState<WorkType>('tea_plucking')
  const [division, setDivision] = useState<'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'>(
    (initialDivision as any) || 'Weddamulla',
  )
  const [fieldBlockId, setFieldBlockId] = useState('Block 4B')
  const [assignedGangKangany, setAssignedGangKangany] = useState('S. Raman (Weddamulla Gang #1)')
  const [kanganyPhone, setKanganyPhone] = useState('+94 77 341 8970')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  const [targetOutput, setTargetOutput] = useState('450 kg Fine Green Leaf')
  const [assignedWorkerCount, setAssignedWorkerCount] = useState(16)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Gang presets per division
  const handleDivisionChange = (div: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon') => {
    setDivision(div)
    switch (div) {
      case 'Weddamulla':
        setAssignedGangKangany('S. Raman (Weddamulla Gang #1)')
        setKanganyPhone('+94 77 341 8970')
        setFieldBlockId('Block 4B')
        break
      case 'Ramboda':
        setAssignedGangKangany('T. Krishnan (Ramboda Gang #3)')
        setKanganyPhone('+94 77 650 1199')
        setFieldBlockId('Block 11A')
        break
      case 'Camnethan':
        setAssignedGangKangany('K. Rajaratnam (Camnethan Gang #2)')
        setKanganyPhone('+94 77 412 8871')
        setFieldBlockId('Block 7B')
        break
      case 'Lilliesland':
        setAssignedGangKangany('V. Murugan (Lilliesland Gang #1)')
        setKanganyPhone('+94 77 789 2314')
        setFieldBlockId('Block 3A')
        break
      case 'Wewandon':
        setAssignedGangKangany('P. Balasubramaniam (Wewandon Gang #1)')
        setKanganyPhone('+94 77 901 3452')
        setFieldBlockId('Block 1A')
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createTask({
        workType,
        division,
        fieldBlockId,
        assignedGangKangany,
        kanganyPhone,
        priority,
        targetDate,
        targetOutput,
        assignedWorkerCount: Number(assignedWorkerCount) || 10,
        notes,
        createdBy: `${currentUser?.name || 'Field Officer'} (${currentUser?.roleTitle || 'Supervisor'})`,
      })
      setSuccessMsg('Work order successfully dispatched to division field supervisor!')
      setTimeout(() => {
        setSuccessMsg('')
        onClose()
      }, 1000)
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
      title="Create &amp; Dispatch Field Work Order"
      subtitle="Allocate agricultural tasks, target yield outputs, and field gangs"
      icon={<Plus size={18} />}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="task-form">
        {successMsg && (
          <div className="form-alert form-alert--success">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="form-grid-2">
          {/* Work Type */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-work-type">Work Order Type *</label>
            <select
              id="task-work-type"
              value={workType}
              onChange={(e) => setWorkType(e.target.value as WorkType)}
              className="form-input"
              required
            >
              <option value="tea_plucking">🍃 Tea Plucking (Fine Grade)</option>
              <option value="fertilizer_spraying">🧪 Fertilizer &amp; Micronutrient Spraying</option>
              <option value="pruning">✂️ Selective Bush Pruning</option>
              <option value="weeding">🌿 Terrace Manual / Bush Weeding</option>
              <option value="drainage_cleansing">💧 Contour Drainage &amp; Silt Cleansing</option>
            </select>
          </div>

          {/* Target Division */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-division">Target Estate Division *</label>
            <select
              id="task-division"
              value={division}
              onChange={(e) => handleDivisionChange(e.target.value as any)}
              className="form-input"
              required
            >
              <option value="Weddamulla">Weddamulla Division</option>
              <option value="Ramboda">Ramboda Division</option>
              <option value="Camnethan">Camnethan Division</option>
              <option value="Lilliesland">Lilliesland Division</option>
              <option value="Wewandon">Wewandon Division</option>
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          {/* Field Block ID */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-block">Specific Field Block ID *</label>
            <input
              id="task-block"
              type="text"
              placeholder="e.g. Block 4B, Block 11A, Plot 7"
              value={fieldBlockId}
              onChange={(e) => setFieldBlockId(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-priority">Dispatch Priority *</label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="form-input"
              required
            >
              <option value="urgent">🔴 Urgent (Immediate Action)</option>
              <option value="normal">🟡 Normal Priority</option>
              <option value="low">🟢 Low / Routine Maintenance</option>
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          {/* Assigned Gang / Kangany */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-kangany">Assigned Gang / Field Lead (Kangany) *</label>
            <input
              id="task-kangany"
              type="text"
              value={assignedGangKangany}
              onChange={(e) => setAssignedGangKangany(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Assigned Workers Count */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-workers-count">Crew Headcount (Workers)</label>
            <input
              id="task-workers-count"
              type="number"
              min="1"
              max="100"
              value={assignedWorkerCount}
              onChange={(e) => setAssignedWorkerCount(Number(e.target.value))}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-grid-2">
          {/* Target Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-date">Scheduled Target Date *</label>
            <input
              id="task-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Target Output */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-output">Target Output Metric *</label>
            <input
              id="task-output"
              type="text"
              placeholder="e.g. 450 kg leaf, 12 ha sprayed, 1,200m drain"
              value={targetOutput}
              onChange={(e) => setTargetOutput(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Operational Instructions / Notes */}
        <div className="form-group">
          <label className="form-label" htmlFor="task-notes">Field Instructions &amp; Safety Directives</label>
          <textarea
            id="task-notes"
            rows={3}
            placeholder="Special agronomic guidelines (e.g. plucking round cycle, PPE for chemical application, weather precautions)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input form-textarea"
          />
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Dispatching...' : 'Dispatch Work Order'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
