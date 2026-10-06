import React, { createContext, useContext, useEffect, useState } from 'react'
import { AttendanceUpdateItem, mockWorkerService } from '../services/mockWorkerService'
import type { DivisionWorkforceSummary, Worker, WorkerRole, WorkerStatus } from '../types/workforce'

type WorkforceContextType = {
  workers: Worker[]
  isLoading: boolean
  isGpsLayerVisible: boolean
  setIsGpsLayerVisible: (visible: boolean) => void
  selectedWorker: Worker | null
  setSelectedWorker: (worker: Worker | null) => void
  refreshWorkers: () => Promise<void>
  getDivisionSupervision: (divisionName: string) => Promise<DivisionWorkforceSummary>
  filterRole: WorkerRole | 'all'
  setFilterRole: (role: WorkerRole | 'all') => void
  filterStatus: WorkerStatus | 'all'
  setFilterStatus: (status: WorkerStatus | 'all') => void
  markAttendance: (workerId: string, attended: boolean, checkInTime?: string, status?: WorkerStatus) => Promise<Worker>
  batchUpdateAttendance: (updates: AttendanceUpdateItem[]) => Promise<Worker[]>
  updateWorkerPluckedKg: (workerId: string, additionalKg: number) => Promise<Worker>
}

const WorkforceContext = createContext<WorkforceContextType | undefined>(undefined)

export const WorkforceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGpsLayerVisible, setIsGpsLayerVisible] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [filterRole, setFilterRole] = useState<WorkerRole | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<WorkerStatus | 'all'>('all')

  const fetchWorkers = async () => {
    try {
      setIsLoading(true)
      const data = await mockWorkerService.getWorkers()
      setWorkers(data)
    } catch (err) {
      console.error('Failed to load workers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [])

  const getDivisionSupervision = async (divisionName: string): Promise<DivisionWorkforceSummary> => {
    return mockWorkerService.getDivisionSupervision(divisionName)
  }

  const markAttendance = async (
    workerId: string,
    attended: boolean,
    checkInTime?: string,
    status?: WorkerStatus
  ): Promise<Worker> => {
    const updated = await mockWorkerService.markAttendance(workerId, attended, checkInTime, status)
    setWorkers((prev) => prev.map((w) => (w.id === workerId ? updated : w)))
    return updated
  }

  const batchUpdateAttendance = async (updates: AttendanceUpdateItem[]): Promise<Worker[]> => {
    const updatedList = await mockWorkerService.batchUpdateAttendance(updates)
    setWorkers(updatedList)
    return updatedList
  }

  const updateWorkerPluckedKg = async (workerId: string, additionalKg: number): Promise<Worker> => {
    const updated = await mockWorkerService.updateWorkerPluckedKg(workerId, additionalKg)
    setWorkers((prev) => prev.map((w) => (w.id === workerId ? updated : w)))
    return updated
  }

  return (
    <WorkforceContext.Provider
      value={{
        workers,
        isLoading,
        isGpsLayerVisible,
        setIsGpsLayerVisible,
        selectedWorker,
        setSelectedWorker,
        refreshWorkers: fetchWorkers,
        getDivisionSupervision,
        filterRole,
        setFilterRole,
        filterStatus,
        setFilterStatus,
        markAttendance,
        batchUpdateAttendance,
        updateWorkerPluckedKg,
      }}
    >
      {children}
    </WorkforceContext.Provider>
  )
}

export const useWorkforce = (): WorkforceContextType => {
  const context = useContext(WorkforceContext)
  if (!context) {
    throw new Error('useWorkforce must be used within a WorkforceProvider')
  }
  return context
}
