import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockSalaryService } from '../services/mockSalaryService'
import type { DailySalaryRecord, PaymentMethod } from '../types/salary'

type SalaryContextType = {
  records: DailySalaryRecord[]
  selectedDate: string
  setSelectedDate: (date: string) => void
  isLoading: boolean
  markPaid: (recordId: string, paidBy: string, method?: PaymentMethod) => Promise<DailySalaryRecord>
  markUnpaid: (recordId: string) => Promise<DailySalaryRecord>
  batchMarkPaid: (recordIds: string[], paidBy: string, method?: PaymentMethod) => Promise<DailySalaryRecord[]>
  refreshSalaries: () => Promise<void>
}

const SalaryContext = createContext<SalaryContextType | undefined>(undefined)

export const SalaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [records, setRecords] = useState<DailySalaryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRecords = async () => {
    try {
      setIsLoading(true)
      const data = await mockSalaryService.getSalaries({ date: selectedDate })
      setRecords(data)
    } catch (err) {
      console.error('Failed to load salary records:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [selectedDate])

  const markPaid = async (
    recordId: string,
    paidBy: string,
    method: PaymentMethod = 'cash'
  ): Promise<DailySalaryRecord> => {
    const updated = await mockSalaryService.updatePaymentStatus(recordId, 'paid', paidBy, method)
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    return updated
  }

  const markUnpaid = async (recordId: string): Promise<DailySalaryRecord> => {
    const updated = await mockSalaryService.updatePaymentStatus(recordId, 'unpaid')
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    return updated
  }

  const batchMarkPaid = async (
    recordIds: string[],
    paidBy: string,
    method: PaymentMethod = 'cash'
  ): Promise<DailySalaryRecord[]> => {
    const updatedList = await mockSalaryService.batchUpdatePaymentStatus(recordIds, 'paid', paidBy, method)
    const updatedMap = new Map(updatedList.map((r) => [r.id, r]))
    setRecords((prev) => prev.map((r) => (updatedMap.has(r.id) ? updatedMap.get(r.id)! : r)))
    return updatedList
  }

  return (
    <SalaryContext.Provider
      value={{
        records,
        selectedDate,
        setSelectedDate,
        isLoading,
        markPaid,
        markUnpaid,
        batchMarkPaid,
        refreshSalaries: fetchRecords,
      }}
    >
      {children}
    </SalaryContext.Provider>
  )
}

export const useSalary = (): SalaryContextType => {
  const context = useContext(SalaryContext)
  if (!context) {
    throw new Error('useSalary must be used within a SalaryProvider')
  }
  return context
}
