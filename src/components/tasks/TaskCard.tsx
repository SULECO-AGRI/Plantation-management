import React from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MoreVertical,
  Phone,
  Scale,
  Sparkles,
  Users,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'

type TaskCardProps = {
  task: Task
  onStatusChange: (id: string, newStatus: TaskStatus) => void
  onDragStart?: (e: React.DragEvent, taskId: string) => void
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDragStart }) => {
  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'red'
      case 'normal':
        return 'amber'
      case 'low':
        return 'emerald'
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id)
    if (onDragStart) onDragStart(e, task.id)
  }

  return (
    <div
      className="task-card"
      draggable
      onDragStart={handleDrag}
      title="Drag to change status or use status selector below"
    >
      {/* Top Meta Row */}
      <div className="task-card__meta">
        <span className="task-card__number">{task.taskNumber}</span>
        <Badge variant={getPriorityBadgeVariant(task.priority)} dot>
          {task.priority.toUpperCase()}
        </Badge>
      </div>

      {/* Title / Work Type */}
      <h4 className="task-card__title">{task.workTypeLabel}</h4>

      {/* Location / Division & Block */}
      <div className="task-card__loc">
        <MapPin size={12} />
        <span>{task.division}</span>
        <span className="task-card__block-chip">{task.fieldBlockId}</span>
      </div>

      {/* Gang & Crew */}
      <div className="task-card__crew">
        <div className="task-card__crew-info">
          <Users size={12} />
          <span>{task.assignedGangKangany}</span>
        </div>
        <span className="task-card__headcount">{task.assignedWorkerCount} crew</span>
      </div>

      {/* Target Metric */}
      <div className="task-card__target-box">
        <div className="task-card__target-label">
          <span>Target: <strong>{task.targetOutput}</strong></span>
          <span>{task.progressPercentage}%</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${
              task.status === 'completed'
                ? 'progress-fill--completed'
                : task.status === 'delayed'
                ? 'progress-fill--delayed'
                : 'progress-fill--in-progress'
            }`}
            style={{ width: `${task.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Due Date & Quick Status Switcher */}
      <div className="task-card__footer">
        <div className="task-card__due">
          <Calendar size={12} />
          <span>{task.targetDate}</span>
        </div>

        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="task-card__status-select"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In-Progress</option>
          <option value="completed">Completed</option>
          <option value="delayed">Delayed</option>
        </select>
      </div>
    </div>
  )
}
