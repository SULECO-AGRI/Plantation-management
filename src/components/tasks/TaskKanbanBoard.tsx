import React, { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { TaskCard } from './TaskCard'
import { CreateTaskModal } from './CreateTaskModal'
import { useTask } from '../../context/TaskContext'
import { useAuth } from '../../context/AuthContext'
import type { TaskPriority, TaskStatus, WorkType } from '../../types/task'

export const TaskKanbanBoard: React.FC = () => {
  const { tasks, updateTaskStatus, isCreateModalOpen, setIsCreateModalOpen } = useTask()
  const { currentUser, selectedDivisionFilter, setSelectedDivisionFilter } = useAuth()

  const isSuperAdmin = currentUser?.role === 'super_admin'
  const isDivisionManager = currentUser?.role === 'division_manager'
  const isFieldOfficer = currentUser?.role === 'field_officer' || (currentUser?.role as string) === 'kangany'
  const canCreateTask = isSuperAdmin || isDivisionManager
  const userDivision = currentUser?.assignedDivision || currentUser?.divisionScope || 'Weddamulla'

  // Filter tab
  const [filterTab, setFilterTab] = useState<'all' | 'managers' | 'officers' | 'my_tasks'>(
    isFieldOfficer ? 'my_tasks' : 'all'
  )
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<WorkType | 'all'>('all')
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Division
      if (isSuperAdmin) {
        if (selectedDivisionFilter !== 'All Divisions' && task.division !== selectedDivisionFilter) {
          return false
        }
      } else {
        if (task.division !== userDivision) return false
      }

      // 2. Role filter tab
      if (isSuperAdmin) {
        if (filterTab === 'managers' && task.assigneeRole !== 'division_manager') return false
        if (filterTab === 'officers' && task.assigneeRole !== 'field_officer') return false
      } else if (isDivisionManager) {
        if (filterTab === 'managers') {
          // Tasks assigned to this manager from Super Admin
          if (task.assigneeRole !== 'division_manager') return false
        } else if (filterTab === 'officers') {
          // Tasks assigned to field officers
          if (task.assigneeRole !== 'field_officer') return false
        }
      } else if (isFieldOfficer) {
        if (filterTab === 'my_tasks') {
          const matchName = currentUser?.name && task.assigneeName.toLowerCase().includes(currentUser.name.toLowerCase())
          const matchBlock = currentUser?.assignedField && task.fieldBlockId === currentUser.assignedField
          if (!matchName && !matchBlock && task.assigneeRole !== 'field_officer') return false
        }
      }

      // 3. Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          task.taskNumber.toLowerCase().includes(q) ||
          task.workTypeLabel.toLowerCase().includes(q) ||
          task.fieldBlockId.toLowerCase().includes(q) ||
          task.assigneeName.toLowerCase().includes(q) ||
          task.division.toLowerCase().includes(q)
        if (!match) return false
      }

      // 4. Work type
      if (filterType !== 'all' && task.workType !== filterType) {
        return false
      }

      return true
    })
  }, [
    tasks,
    isSuperAdmin,
    isDivisionManager,
    isFieldOfficer,
    selectedDivisionFilter,
    userDivision,
    filterTab,
    search,
    filterType,
    currentUser,
  ])

  const columns: Array<{ id: TaskStatus; label: string }> = [
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'delayed', label: 'Delayed' },
  ]

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      await updateTaskStatus(taskId, targetStatus)
    }
  }

  return (
    <div className="simple-tasks-page">
      {/* 1. Clean Header */}
      <div className="simple-tasks-header">
        <div>
          <div className="simple-tasks-title-row">
            <h1 className="simple-tasks-title">Tasks</h1>
            <span className="simple-tasks-role-badge">
              {isSuperAdmin
                ? 'Super Admin'
                : isDivisionManager
                ? `${userDivision} Manager`
                : `${userDivision} Field Officer`}
            </span>
          </div>
          <p className="simple-tasks-subtitle">
            {isSuperAdmin
              ? 'Assign tasks to Division Managers and Field Officers.'
              : isDivisionManager
              ? 'Assign tasks to your field officers and view assigned work.'
              : 'View your assigned tasks and update work progress.'}
          </p>
        </div>

        {canCreateTask && (
          <button
            type="button"
            className="simple-btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* 2. Unified Filter Bar */}
      <div className="simple-filter-bar">
        {/* Search */}
        <div className="simple-search-box">
          <Search size={14} className="simple-search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="simple-search-input"
          />
          {search && (
            <button
              type="button"
              className="simple-search-clear"
              onClick={() => setSearch('')}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="simple-pills-group">
          {isSuperAdmin && (
            <>
              <button
                type="button"
                className={`simple-pill ${filterTab === 'all' ? 'simple-pill--active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`simple-pill ${filterTab === 'managers' ? 'simple-pill--active' : ''}`}
                onClick={() => setFilterTab('managers')}
              >
                To Managers
              </button>
              <button
                type="button"
                className={`simple-pill ${filterTab === 'officers' ? 'simple-pill--active' : ''}`}
                onClick={() => setFilterTab('officers')}
              >
                To Field Officers
              </button>
            </>
          )}

          {isDivisionManager && (
            <>
              <button
                type="button"
                className={`simple-pill ${filterTab === 'all' ? 'simple-pill--active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`simple-pill ${filterTab === 'managers' ? 'simple-pill--active' : ''}`}
                onClick={() => setFilterTab('managers')}
              >
                My Tasks
              </button>
              <button
                type="button"
                className={`simple-pill ${filterTab === 'officers' ? 'simple-pill--active' : ''}`}
                onClick={() => setFilterTab('officers')}
              >
                Field Officers
              </button>
            </>
          )}

          {isFieldOfficer && (
            <>
              <button
                type="button"
                className={`simple-pill ${filterTab === 'my_tasks' ? 'simple-pill--active' : ''}`}
                onClick={() => setFilterTab('my_tasks')}
              >
                My Tasks
              </button>
              <button
                type="button"
                className={`simple-pill ${filterTab === 'all' ? 'simple-pill--active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All Division
              </button>
            </>
          )}
        </div>

        {/* Dropdowns */}
        <div className="simple-selects-group">
          {isSuperAdmin && (
            <select
              value={selectedDivisionFilter}
              onChange={(e) => setSelectedDivisionFilter(e.target.value)}
              className="simple-select"
            >
              <option value="All Divisions">All Divisions</option>
              <option value="Weddamulla">Weddamulla</option>
              <option value="Ramboda">Ramboda</option>
              <option value="Camnethan">Camnethan</option>
              <option value="Lilliesland">Lilliesland</option>
              <option value="Wewandon">Wewandon</option>
            </select>
          )}

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as WorkType | 'all')}
            className="simple-select"
          >
            <option value="all">All Types</option>
            <option value="tea_plucking">Tea Plucking</option>
            <option value="fertilizer_spraying">Spraying</option>
            <option value="pruning">Pruning</option>
            <option value="weeding">Weeding</option>
            <option value="drainage_cleansing">Drainage</option>
          </select>
        </div>
      </div>

      {/* 3. Clean Kanban Board */}
      <div className="simple-kanban-grid">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id)
          const isTarget = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              className={`simple-kanban-col ${isTarget ? 'simple-kanban-col--over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverColumn(col.id)
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="simple-kanban-col__header">
                <span className="simple-kanban-col__title">{col.label}</span>
                <span className="simple-kanban-col__count">{colTasks.length}</span>
              </div>

              <div className="simple-kanban-col__cards">
                {colTasks.length === 0 ? (
                  <div className="simple-kanban-col__empty">No tasks</div>
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

      {/* Creation Modal */}
      {canCreateTask && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialDivision={
            isDivisionManager
              ? userDivision
              : selectedDivisionFilter !== 'All Divisions'
              ? selectedDivisionFilter
              : undefined
          }
        />
      )}
    </div>
  )
}
