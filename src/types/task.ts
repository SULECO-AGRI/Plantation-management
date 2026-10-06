export type WorkType =
  | 'tea_plucking'
  | 'fertilizer_spraying'
  | 'pruning'
  | 'weeding'
  | 'drainage_cleansing'

export type TaskPriority = 'urgent' | 'normal' | 'low'

export type TaskStatus = 'scheduled' | 'in_progress' | 'completed' | 'delayed'

export type TaskAssigneeRole = 'division_manager' | 'field_officer'

export type TaskCreatorRole = 'super_admin' | 'division_manager'

export type Task = {
  id: string
  taskNumber: string
  workType: WorkType
  workTypeLabel: string
  division: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  fieldBlockId: string
  assignedGangKangany: string
  kanganyPhone?: string
  assignedWorkerCount: number
  priority: TaskPriority
  status: TaskStatus
  targetDate: string
  targetOutput: string
  progressPercentage: number
  completedOutput?: string
  notes?: string
  createdAt: string
  createdBy: string
  creatorRole: TaskCreatorRole
  assigneeRole: TaskAssigneeRole
  assigneeId?: string
  assigneeName: string
  assigneePhone?: string
}

export type TaskFilter = {
  division?: string
  status?: TaskStatus
  workType?: WorkType
  priority?: TaskPriority
  date?: string
  search?: string
  assigneeRole?: TaskAssigneeRole | 'all'
  assigneeId?: string
}

