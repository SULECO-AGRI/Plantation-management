import React, { useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Plus,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react'
import { TaskCard } from './TaskCard'
import { CreateTaskModal } from './CreateTaskModal'
import { useTask } from '../../context/TaskContext'
import { useAuth } from '../../context/AuthContext'
import type { TaskPriority, TaskStatus, WorkType } from '../../types/task'

export const TaskKanbanBoard: React.FC = () => {
  const { tasks, updateTaskStatus, isCreateModalOpen, setIsCreateModalOpen } = useTask()
  const { currentUser, selectedDivisionFilter, setSelectedDivisionFilter } = useAuth()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<WorkType | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch =
        task.taskNumber.toLowerCase().includes(search.toLowerCase()) ||
        task.workTypeLabel.toLowerCase().includes(search.toLowerCase()) ||
        task.fieldBlockId.toLowerCase().includes(search.toLowerCase()) ||
        task.assignedGangKangany.toLowerCase().includes(search.toLowerCase())

      const matchDiv =
        selectedDivisionFilter === 'All Divisions' || task.division === selectedDivisionFilter

      const matchType = filterType === 'all' || task.workType === filterType
      const matchPriority = filterPriority === 'all' || task.priority === filterPriority

      return matchSearch && matchDiv && matchType && matchPriority
    })
  }, [tasks, search, selectedDivisionFilter, filterType, filterPriority])

  const columns: Array<{ id: TaskStatus; label: string; icon: React.ReactNode; color: string }> = [
    { id: 'scheduled', label: 'Scheduled', icon: <Clock size={16} />, color: '#64748b' },
    { id: 'in_progress', label: 'In-Progress', icon: <Zap size={16} />, color: '#0284c7' },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={16} />, color: '#059669' },
    { id: 'delayed', label: 'Delayed', icon: <AlertCircle size={16} />, color: '#dc2626' },
  ]

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(colId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      await updateTaskStatus(taskId, targetStatus)
    }
  }

  return (
    <div className="erp-page-container">
      {/* Top Banner */}
      <div className="erp-page-header">
        <div>
          <div className="erp-page-badge">
            <CalendarCheck2 size={13} />
            <span>MODULE B · DISPATCH ENGINE</span>
          </div>
          <h1 className="erp-page-title">Task Allocation &amp; Dispatch Engine</h1>
          <p className="erp-page-subtitle">
            Manage daily field work orders, plucking rounds, fertilizer spraying, and maintenance crews.
          </p>
        </div>

        <div className="erp-page-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={15} />
            <span>Dispatch Work Order</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="erp-content-card">
        <div className="erp-content-card__header">
          <div className="workforce-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search tasks by WO number, crop block, gang, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="workforce-search-input"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="workforce-dropdown-filters">
            <select
              value={selectedDivisionFilter}
              onChange={(e) => setSelectedDivisionFilter(e.target.value)}
              className="filter-select"
              disabled={currentUser?.divisionScope !== 'All Divisions'}
            >
              <option value="All Divisions">All Divisions</option>
              <option value="Weddamulla">Weddamulla</option>
              <option value="Ramboda">Ramboda</option>
              <option value="Camnethan">Camnethan</option>
              <option value="Lilliesland">Lilliesland</option>
              <option value="Wewandon">Wewandon</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as WorkType | 'all')}
              className="filter-select"
            >
              <option value="all">All Work Types</option>
              <option value="tea_plucking">Tea Plucking</option>
              <option value="fertilizer_spraying">Fertilizer Spraying</option>
              <option value="pruning">Bush Pruning</option>
              <option value="weeding">Terrace Weeding</option>
              <option value="drainage_cleansing">Drainage Cleansing</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Kanban Columns Grid */}
        <div className="kanban-grid">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id)
            const isTarget = dragOverColumn === col.id

            return (
              <div
                key={col.id}
                className={`kanban-col ${isTarget ? 'kanban-col--drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="kanban-col__header">
                  <div className="kanban-col__title-box">
                    <span
                      className="kanban-col__dot"
                      style={{ backgroundColor: col.color }}
                    />
                    <h3>{col.label}</h3>
                  </div>
                  <span className="kanban-col__count">{colTasks.length}</span>
                </div>

                <div className="kanban-col__cards">
                  {colTasks.length === 0 ? (
                    <div className="kanban-col__empty">
                      <span>No tasks in this stage</span>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={updateTaskStatus}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialDivision={selectedDivisionFilter !== 'All Divisions' ? selectedDivisionFilter : undefined}
      />
    </div>
  )
}
