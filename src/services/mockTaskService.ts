import { MOCK_TASKS } from '../data/mockTasks'
import type { Task, TaskFilter, TaskPriority, TaskStatus, WorkType } from '../types/task'
import { delay, loadFromStorage, saveToStorage } from './apiClient'

const TASKS_STORAGE_KEY = 'plantation_tasks_data'

export type CreateTaskDTO = {
  workType: WorkType
  division: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  fieldBlockId: string
  assignedGangKangany: string
  kanganyPhone?: string
  priority: TaskPriority
  targetDate: string
  targetOutput: string
  notes?: string
  assignedWorkerCount?: number
  createdBy?: string
}

export interface ITaskService {
  getTasks(filters?: TaskFilter): Promise<Task[]>
  getTaskById(id: string): Promise<Task | null>
  createTask(dto: CreateTaskDTO): Promise<Task>
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task>
  updateTask(id: string, updates: Partial<Task>): Promise<Task>
  deleteTask(id: string): Promise<boolean>
}

class MockTaskService implements ITaskService {
  private getStore(): Task[] {
    return loadFromStorage<Task[]>(TASKS_STORAGE_KEY, MOCK_TASKS)
  }

  private setStore(tasks: Task[]): void {
    saveToStorage(TASKS_STORAGE_KEY, tasks)
  }

  private workTypeLabels: Record<WorkType, string> = {
    tea_plucking: 'Tea Plucking (Fine Grade)',
    fertilizer_spraying: 'Fertilizer & Chemical Spraying',
    pruning: 'Selective Bush Pruning',
    weeding: 'Manual / Mechanical Weeding',
    drainage_cleansing: 'Drainage & Silt Cleansing',
  }

  async getTasks(filters?: TaskFilter): Promise<Task[]> {
    await delay(200)
    let list = this.getStore()

    if (filters?.division && filters.division !== 'All Divisions') {
      list = list.filter((t) => t.division === filters.division)
    }
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status)
    }
    if (filters?.workType) {
      list = list.filter((t) => t.workType === filters.workType)
    }
    if (filters?.priority) {
      list = list.filter((t) => t.priority === filters.priority)
    }
    if (filters?.date) {
      list = list.filter((t) => t.targetDate === filters.date)
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (t) =>
          t.taskNumber.toLowerCase().includes(q) ||
          t.fieldBlockId.toLowerCase().includes(q) ||
          t.assignedGangKangany.toLowerCase().includes(q) ||
          t.workTypeLabel.toLowerCase().includes(q),
      )
    }

    return list
  }

  async getTaskById(id: string): Promise<Task | null> {
    await delay(120)
    const list = this.getStore()
    return list.find((t) => t.id === id) || null
  }

  async createTask(dto: CreateTaskDTO): Promise<Task> {
    await delay(250)
    const list = this.getStore()
    const nextSeq = list.length + 90
    const now = new Date()
    const formattedNow = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`

    const newTask: Task = {
      id: `TSK-${Date.now()}`,
      taskNumber: `WO-2026-${String(nextSeq).padStart(3, '0')}`,
      workType: dto.workType,
      workTypeLabel: this.workTypeLabels[dto.workType] || dto.workType,
      division: dto.division,
      fieldBlockId: dto.fieldBlockId,
      assignedGangKangany: dto.assignedGangKangany,
      kanganyPhone: dto.kanganyPhone || '+94 77 000 0000',
      assignedWorkerCount: dto.assignedWorkerCount || 10,
      priority: dto.priority,
      status: 'scheduled',
      targetDate: dto.targetDate,
      targetOutput: dto.targetOutput,
      progressPercentage: 0,
      notes: dto.notes,
      createdAt: formattedNow,
      createdBy: dto.createdBy || 'Field Officer',
    }

    const updated = [newTask, ...list]
    this.setStore(updated)
    return newTask
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    await delay(150)
    const list = this.getStore()
    const index = list.findIndex((t) => t.id === id)
    if (index === -1) throw new Error(`Task with id ${id} not found`)

    const current = list[index]
    let progress = current.progressPercentage
    if (status === 'completed') progress = 100
    else if (status === 'scheduled' && progress > 0) progress = 0
    else if (status === 'in_progress' && progress === 0) progress = 25

    const updatedTask: Task = {
      ...current,
      status,
      progressPercentage: progress,
    }

    list[index] = updatedTask
    this.setStore(list)
    return updatedTask
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await delay(180)
    const list = this.getStore()
    const index = list.findIndex((t) => t.id === id)
    if (index === -1) throw new Error(`Task with id ${id} not found`)

    const updatedTask: Task = {
      ...list[index],
      ...updates,
    }

    list[index] = updatedTask
    this.setStore(list)
    return updatedTask
  }

  async deleteTask(id: string): Promise<boolean> {
    await delay(150)
    const list = this.getStore()
    const filtered = list.filter((t) => t.id !== id)
    this.setStore(filtered)
    return true
  }
}

export const mockTaskService = new MockTaskService()
