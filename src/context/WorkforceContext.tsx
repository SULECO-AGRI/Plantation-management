import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockWorkerService } from '../services/mockWorkerService'
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
}

const WorkforceContext = createContext<WorkforceContextType | undefined>(undefined)

export const WorkforceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGpsLayerVisible, setIsGpsLayerVisible] = useState(true)
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
