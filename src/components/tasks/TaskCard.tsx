import React from 'react'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'
import { useTranslation } from '../../context/LanguageContext'

type TaskCardProps = {
  task: Task
  onStatusChange: (id: string, newStatus: TaskStatus) => void
  onDragStart?: (e: React.DragEvent, taskId: string) => void
}

const DIVISION_NAMES: Record<string, { en: string; si: string }> = {
  weddamulla: { en: 'Weddamulla', si: 'වෙද්දමුල්ල' },
  ramboda: { en: 'Ramboda', si: 'රම්බොඩ' },
  camnethan: { en: 'Camnethan', si: 'කැම්නෙතන්' },
  lilliesland: { en: 'Lilliesland', si: 'ලිලීස්ලන්ඩ්' },
  wewandon: { en: 'Wewandon', si: 'වැවන්ඩන්' },
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDragStart }) => {
  const { t, locale } = useTranslation()
  const isManager = task.assigneeRole === 'division_manager'

  const getPriorityLabel = (p: TaskPriority) => {
    switch (p) {
      case 'urgent': return t('tasks.priorityUrgent')
      case 'low': return t('tasks.priorityLow')
      case 'normal':
      default:
        return t('tasks.priorityNormal')
    }
  }

  const getWorkTypeTitle = () => {
    switch (task.workType) {
      case 'tea_plucking': return t('tasks.typeTeaPlucking')
      case 'fertilizer_spraying': return t('tasks.typeFertilizer')
      case 'pruning': return t('tasks.typePruning')
      case 'weeding': return t('tasks.typeWeeding')
      case 'drainage_cleansing': return t('tasks.typeDrainage')
      default: return task.workTypeLabel
    }
  }

  const localizedDivision = locale === 'si' && DIVISION_NAMES[task.division.toLowerCase()]
    ? DIVISION_NAMES[task.division.toLowerCase()].si
    : task.division

  return (
    <div
      className="simple-task-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        if (onDragStart) onDragStart(e, task.id)
      }}
    >
      {/* Top Header: ID & Priority */}
      <div className="simple-task-card__top">
        <span className="simple-task-card__id">{task.taskNumber}</span>
        <span className={`simple-priority-pill simple-priority-pill--${task.priority}`}>
          {getPriorityLabel(task.priority)}
        </span>
      </div>

      {/* Title */}
      <h4 className="simple-task-card__title">{getWorkTypeTitle()}</h4>

      {/* Location & Output */}
      <div className="simple-task-card__meta">
        <span>{localizedDivision}, {task.fieldBlockId}</span>
        {task.targetOutput && <span> — {task.targetOutput}</span>}
      </div>

      {/* Assignee (Name strictly in English) */}
      <div className="simple-task-card__assignee">
        <span className="simple-task-card__assignee-name">
          {task.assigneeName.split('(')[0].trim()}
        </span>
        <span className={`simple-role-chip ${isManager ? 'simple-role-chip--manager' : 'simple-role-chip--officer'}`}>
          {isManager ? t('tasks.roleManager') : t('tasks.roleOfficer')}
        </span>
      </div>

      {/* Footer: Date & Status */}
      <div className="simple-task-card__footer">
        <span className="simple-task-card__date">{task.targetDate}</span>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="simple-task-card__select"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="scheduled">{t('tasks.colScheduled')}</option>
          <option value="in_progress">{t('tasks.colInProgress')}</option>
          <option value="completed">{t('tasks.colCompleted')}</option>
          <option value="delayed">{t('tasks.colDelayed')}</option>
        </select>
      </div>
    </div>
  )
}
