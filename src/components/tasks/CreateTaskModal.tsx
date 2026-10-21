import React, { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '../common/Modal'
import { useTask } from '../../context/TaskContext'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
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

const DIVISION_NAMES: Record<string, { en: string; si: string }> = {
  weddamulla: { en: 'Weddamulla', si: 'වෙද්දමුල්ල' },
  ramboda: { en: 'Ramboda', si: 'රම්බොඩ' },
  camnethan: { en: 'Camnethan', si: 'කැම්නෙතන්' },
  lilliesland: { en: 'Lilliesland', si: 'ලිලීස්ලන්ඩ්' },
  wewandon: { en: 'Wewandon', si: 'වැවන්ඩන්' },
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  initialDivision,
}) => {
  const { createTask } = useTask()
  const { currentUser } = useAuth()
  const { t, locale } = useTranslation()

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

  const localizedDivision = locale === 'si' && DIVISION_NAMES[division.toLowerCase()]
    ? DIVISION_NAMES[division.toLowerCase()].si
    : division

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
      title={t('tasks.modalNewTask')}
      subtitle={
        isSuperAdmin
          ? t('tasks.modalSubtitleAdmin')
          : t('tasks.modalSubtitleManager', { division: localizedDivision })
      }
      icon={<Plus size={18} />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="simple-task-form">
        {/* Assignee Selection */}
        {isSuperAdmin && (
          <div className="form-group">
            <label className="form-label">{t('tasks.modalAssignTo')}</label>
            <div className="simple-radio-pills">
              <button
                type="button"
                className={`simple-radio-pill ${assigneeRole === 'division_manager' ? 'simple-radio-pill--active' : ''}`}
                onClick={() => setAssigneeRole('division_manager')}
              >
                {t('tasks.roleManager')}
              </button>
              <button
                type="button"
                className={`simple-radio-pill ${assigneeRole === 'field_officer' ? 'simple-radio-pill--active' : ''}`}
                onClick={() => setAssigneeRole('field_officer')}
              >
                {t('tasks.roleOfficer')}
              </button>
            </div>
          </div>
        )}

        <div className="form-grid-2">
          {/* Division */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-division">{t('tasks.modalDivision')}</label>
            {isSuperAdmin ? (
              <select
                id="simple-division"
                value={division}
                onChange={(e) => setDivision(e.target.value as EstateDivision)}
                className="form-input"
              >
                <option value="Weddamulla">{locale === 'si' ? 'වෙද්දමුල්ල' : 'Weddamulla'}</option>
                <option value="Ramboda">{locale === 'si' ? 'රම්බොඩ' : 'Ramboda'}</option>
                <option value="Camnethan">{locale === 'si' ? 'කැම්නෙතන්' : 'Camnethan'}</option>
                <option value="Lilliesland">{locale === 'si' ? 'ලිලීස්ලන්ඩ්' : 'Lilliesland'}</option>
                <option value="Wewandon">{locale === 'si' ? 'වැවන්ඩන්' : 'Wewandon'}</option>
              </select>
            ) : (
              <input
                id="simple-division"
                type="text"
                value={localizedDivision}
                disabled
                className="form-input"
              />
            )}
          </div>

          {/* Person (names kept strictly in English) */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-officer">
              {assigneeRole === 'division_manager' ? t('tasks.roleManager') : t('tasks.roleOfficer')}
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
            <label className="form-label" htmlFor="simple-worktype">{t('tasks.modalWorkType')}</label>
            <select
              id="simple-worktype"
              value={workType}
              onChange={(e) => setWorkType(e.target.value as WorkType)}
              className="form-input"
            >
              <option value="tea_plucking">{t('tasks.typeTeaPlucking')}</option>
              <option value="fertilizer_spraying">{t('tasks.typeFertilizer')}</option>
              <option value="pruning">{t('tasks.typePruning')}</option>
              <option value="weeding">{t('tasks.typeWeeding')}</option>
              <option value="drainage_cleansing">{t('tasks.typeDrainage')}</option>
            </select>
          </div>

          {/* Block */}
          <div className="form-group">
            <label className="form-label" htmlFor="simple-block">{t('tasks.modalBlock')}</label>
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
            <label className="form-label" htmlFor="simple-output">{t('tasks.modalTarget')}</label>
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
            <label className="form-label" htmlFor="simple-date">{t('tasks.modalDueDate')}</label>
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
            <label className="form-label" htmlFor="simple-priority">{t('tasks.modalPriority')}</label>
            <select
              id="simple-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="form-input"
            >
              <option value="normal">{t('tasks.priorityNormal')}</option>
              <option value="urgent">{t('tasks.priorityUrgent')}</option>
              <option value="low">{t('tasks.priorityLow')}</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label" htmlFor="simple-notes">{t('tasks.modalInstructions')}</label>
          <textarea
            id="simple-notes"
            rows={2}
            placeholder={t('tasks.modalInstructionsPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input form-textarea"
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            {t('tasks.modalCancelBtn')}
          </button>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? t('tasks.modalCreating') : t('tasks.modalCreateBtn')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
