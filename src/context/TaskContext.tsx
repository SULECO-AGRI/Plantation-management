import React, { createContext, useContext, useEffect, useState } from 'react'
import { CreateTaskDTO, mockTaskService } from '../services/mockTaskService'
import type { Task, TaskFilter, TaskStatus } from '../types/task'

type TaskContextType = {
  tasks: Task[]
  isLoading: boolean
  filters: TaskFilter
  setFilters: React.Dispatch<React.SetStateAction<TaskFilter>>
  createTask: (dto: CreateTaskDTO) => Promise<Task>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<Task>
  deleteTask: (id: string) => Promise<boolean>
  refreshTasks: () => Promise<void>
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void
  prefilledDivision?: string
  setPrefilledDivision: (division?: string) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<TaskFilter>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [prefilledDivision, setPrefilledDivision] = useState<string | undefined>(undefined)

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const data = await mockTaskService.getTasks(filters)
      setTasks(data)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [filters])

  const createTask = async (dto: CreateTaskDTO): Promise<Task> => {
    const created = await mockTaskService.createTask(dto)
    setTasks((prev) => [created, ...prev])
    return created
  }

  const updateTaskStatus = async (id: string, status: TaskStatus): Promise<Task> => {
    const updated = await mockTaskService.updateTaskStatus(id, status)
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }

  const deleteTask = async (id: string): Promise<boolean> => {
    const success = await mockTaskService.deleteTask(id)
    if (success) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
    }
    return success
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        filters,
        setFilters,
        createTask,
        updateTaskStatus,
        deleteTask,
        refreshTasks: fetchTasks,
        isCreateModalOpen,
        setIsCreateModalOpen,
        prefilledDivision,
        setPrefilledDivision,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}
