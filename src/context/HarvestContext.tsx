import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockHarvestService, RecordWeighInDTO } from '../services/mockHarvestService'
import type { HarvestLog, TodayHarvestSummary, WeighInSession } from '../types/harvest'
import { useAuth } from './AuthContext'
import { useWorkforce } from './WorkforceContext'

type HarvestContextType = {
  harvestLogs: HarvestLog[]
  summary: TodayHarvestSummary | null
  isLoading: boolean
  recordWeighIn: (dto: RecordWeighInDTO) => Promise<HarvestLog>
  batchRecordWeighIns: (dtos: RecordWeighInDTO[]) => Promise<HarvestLog[]>
  refreshHarvestData: () => Promise<void>
  sessionFilter: WeighInSession | 'all'
  setSessionFilter: (session: WeighInSession | 'all') => void
  divisionFilter: string
  setDivisionFilter: (division: string) => void
  fieldFilter: string
  setFieldFilter: (field: string) => void
  isLogModalOpen: boolean
  setIsLogModalOpen: (open: boolean) => void
}

const HarvestContext = createContext<HarvestContextType | undefined>(undefined)

export const HarvestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth()
  const isDivisionManager = currentUser?.role === 'division_manager'
  const managerDivision =
    currentUser?.assignedDivision ||
    (currentUser?.divisionScope !== 'All Divisions' ? currentUser?.divisionScope : 'Weddamulla') ||
    'Weddamulla'

  const [harvestLogs, setHarvestLogs] = useState<HarvestLog[]>([])
  const [summary, setSummary] = useState<TodayHarvestSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionFilter, setSessionFilter] = useState<WeighInSession | 'all'>('all')
  const [divisionFilter, setDivisionFilter] = useState<string>(isDivisionManager ? managerDivision : 'All Divisions')
  const [fieldFilter, setFieldFilter] = useState<string>('all')
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  // Keep divisionFilter locked to manager's division if division_manager
  useEffect(() => {
    if (isDivisionManager) {
      setDivisionFilter(managerDivision)
    } else {
      setDivisionFilter('All Divisions')
    }
    setFieldFilter('all')
  }, [isDivisionManager, managerDivision])

  const effectiveDivision = isDivisionManager ? managerDivision : divisionFilter

  const fetchHarvestData = async () => {
    try {
      setIsLoading(true)
      const targetDiv = effectiveDivision !== 'All Divisions' ? effectiveDivision : undefined
      const [logs, sum] = await Promise.all([
        mockHarvestService.getHarvestLogs({
          division: targetDiv,
          fieldBlock: fieldFilter !== 'all' ? fieldFilter : undefined,
          session: sessionFilter !== 'all' ? sessionFilter : undefined,
        }),
        mockHarvestService.getTodayHarvestSummary(targetDiv),
      ])
      setHarvestLogs(logs)
      setSummary(sum)
    } catch (err) {
      console.error('Failed to load harvest data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHarvestData()
  }, [sessionFilter, divisionFilter, fieldFilter, effectiveDivision])

  const { updateWorkerPluckedKg } = useWorkforce()

  const recordWeighIn = async (dto: RecordWeighInDTO): Promise<HarvestLog> => {
    const newLog = await mockHarvestService.recordWeighIn(dto)
    setHarvestLogs((prev) => [newLog, ...prev])
    const targetDiv = effectiveDivision !== 'All Divisions' ? effectiveDivision : undefined
    const updatedSummary = await mockHarvestService.getTodayHarvestSummary(targetDiv)
    setSummary(updatedSummary)

    // Real-time Dual Sync: update worker plucked kg in workforce
    if (newLog.netWeightKg > 0) {
      await updateWorkerPluckedKg(dto.workerId, newLog.netWeightKg)
    }

    return newLog
  }

  const batchRecordWeighIns = async (dtos: RecordWeighInDTO[]): Promise<HarvestLog[]> => {
    const newLogs = await mockHarvestService.batchRecordWeighIns(dtos)
    setHarvestLogs((prev) => [...newLogs, ...prev])
    const targetDiv = effectiveDivision !== 'All Divisions' ? effectiveDivision : undefined
    const updatedSummary = await mockHarvestService.getTodayHarvestSummary(targetDiv)
    setSummary(updatedSummary)

    // Real-time Dual Sync: update workers plucked kg in workforce
    for (const log of newLogs) {
      if (log.netWeightKg > 0) {
        await updateWorkerPluckedKg(log.workerId, log.netWeightKg)
      }
    }

    return newLogs
  }

  return (
    <HarvestContext.Provider
      value={{
        harvestLogs,
        summary,
        isLoading,
        recordWeighIn,
        batchRecordWeighIns,
        refreshHarvestData: fetchHarvestData,
        sessionFilter,
        setSessionFilter,
        divisionFilter: effectiveDivision,
        setDivisionFilter,
        fieldFilter,
        setFieldFilter,
        isLogModalOpen,
        setIsLogModalOpen,
      }}
    >
      {children}
    </HarvestContext.Provider>
  )
}

export const useHarvest = (): HarvestContextType => {
  const context = useContext(HarvestContext)
  if (!context) {
    throw new Error('useHarvest must be used within a HarvestProvider')
  }
  return context
}
