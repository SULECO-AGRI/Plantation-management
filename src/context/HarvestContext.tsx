import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockHarvestService, RecordWeighInDTO } from '../services/mockHarvestService'
import type { HarvestLog, TodayHarvestSummary, WeighInSession } from '../types/harvest'

type HarvestContextType = {
  harvestLogs: HarvestLog[]
  summary: TodayHarvestSummary | null
  isLoading: boolean
  recordWeighIn: (dto: RecordWeighInDTO) => Promise<HarvestLog>
  refreshHarvestData: () => Promise<void>
  sessionFilter: WeighInSession | 'all'
  setSessionFilter: (session: WeighInSession | 'all') => void
  divisionFilter: string
  setDivisionFilter: (division: string) => void
  isLogModalOpen: boolean
  setIsLogModalOpen: (open: boolean) => void
}

const HarvestContext = createContext<HarvestContextType | undefined>(undefined)

export const HarvestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [harvestLogs, setHarvestLogs] = useState<HarvestLog[]>([])
  const [summary, setSummary] = useState<TodayHarvestSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionFilter, setSessionFilter] = useState<WeighInSession | 'all'>('all')
  const [divisionFilter, setDivisionFilter] = useState('All Divisions')
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  const fetchHarvestData = async () => {
    try {
      setIsLoading(true)
      const [logs, sum] = await Promise.all([
        mockHarvestService.getHarvestLogs({
          division: divisionFilter !== 'All Divisions' ? divisionFilter : undefined,
          session: sessionFilter !== 'all' ? sessionFilter : undefined,
        }),
        mockHarvestService.getTodayHarvestSummary(),
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
  }, [sessionFilter, divisionFilter])

  const recordWeighIn = async (dto: RecordWeighInDTO): Promise<HarvestLog> => {
    const newLog = await mockHarvestService.recordWeighIn(dto)
    setHarvestLogs((prev) => [newLog, ...prev])
    const updatedSummary = await mockHarvestService.getTodayHarvestSummary()
    setSummary(updatedSummary)
    return newLog
  }

  return (
    <HarvestContext.Provider
      value={{
        harvestLogs,
        summary,
        isLoading,
        recordWeighIn,
        refreshHarvestData: fetchHarvestData,
        sessionFilter,
        setSessionFilter,
        divisionFilter,
        setDivisionFilter,
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
