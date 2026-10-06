import React from 'react'
import type { Task, TaskPriority, TaskStatus } from '../../types/task'

type TaskCardProps = {
  task: Task
  onStatusChange: (id: string, newStatus: TaskStatus) => void
  onDragStart?: (e: React.DragEvent, taskId: string) => void
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDragStart }) => {
  const isManager = task.assigneeRole === 'division_manager'

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
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="simple-task-card__title">{task.workTypeLabel}</h4>

      {/* Location & Output */}
      <div className="simple-task-card__meta">
        <span>{task.division}, {task.fieldBlockId}</span>
        {task.targetOutput && <span> — {task.targetOutput}</span>}
      </div>

      {/* Assignee */}
      <div className="simple-task-card__assignee">
        <span className="simple-task-card__assignee-name">
          {task.assigneeName.split('(')[0].trim()}
        </span>
        <span className={`simple-role-chip ${isManager ? 'simple-role-chip--manager' : 'simple-role-chip--officer'}`}>
          {isManager ? 'Manager' : 'Officer'}
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
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="delayed">Delayed</option>
        </select>
      </div>
    </div>
  )
}
