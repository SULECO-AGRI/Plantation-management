export type WorkerRole = 'kangany' | 'harvester' | 'sprayer' | 'sundry'

export type WorkerStatus = 'active' | 'break' | 'offline'

export type Worker = {
  id: string
  name: string
  role: WorkerRole
  roleLabel: string
  gender: 'female' | 'male'
  division: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  fieldBlock: string
  currentTask: string
  taskId?: string
  todayPluckedKg: number
  lastPingTime: string
  lat: number
  lng: number
  phone: string
  status: WorkerStatus
  gangName?: string
  avatar?: string
}

export type DivisionWorkforceSummary = {
  division: string
  supervisor: {
    name: string
    phone: string
    role: string
  }
  totalWorkers: number
  activeTasks: number
  femaleHarvesters: number
  maleSundry: number
  activeCount: number
  breakCount: number
}
