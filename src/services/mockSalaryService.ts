import { MOCK_SALARY_RECORDS } from '../data/mockSalary'
import type { DailySalaryRecord, PaymentMethod, SalaryFilter, SalaryPaymentStatus } from '../types/salary'
import { delay, loadFromStorage, saveToStorage } from './apiClient'

const SALARY_STORAGE_KEY = 'plantation_daily_salary_records_v1'

class MockSalaryService {
  private getStore(): DailySalaryRecord[] {
    return loadFromStorage<DailySalaryRecord[]>(SALARY_STORAGE_KEY, MOCK_SALARY_RECORDS)
  }

  private setStore(records: DailySalaryRecord[]): void {
    saveToStorage(SALARY_STORAGE_KEY, records)
  }

  async getSalaries(filter?: SalaryFilter): Promise<DailySalaryRecord[]> {
    await delay(100)
    let list = this.getStore()

    if (filter?.date) {
      list = list.filter((r) => r.date === filter.date)
    }

    if (filter?.division && filter.division !== 'All Divisions') {
      list = list.filter((r) => r.division.toLowerCase() === filter.division!.toLowerCase())
    }

    if (filter?.fieldBlock && filter.fieldBlock !== 'all') {
      list = list.filter((r) => r.fieldBlock.toLowerCase() === filter.fieldBlock!.toLowerCase())
    }

    if (filter?.status && filter.status !== 'all') {
      list = list.filter((r) => r.status === filter.status)
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase()
      list = list.filter(
        (r) =>
          r.workerName.toLowerCase().includes(q) ||
          r.workerId.toLowerCase().includes(q) ||
          r.roleLabel.toLowerCase().includes(q) ||
          r.fieldBlock.toLowerCase().includes(q)
      )
    }

    return list
  }

  async updatePaymentStatus(
    id: string,
    status: SalaryPaymentStatus,
    paidBy?: string,
    method: PaymentMethod = 'cash'
  ): Promise<DailySalaryRecord> {
    await delay(150)
    const list = this.getStore()
    const index = list.findIndex((r) => r.id === id)
    if (index === -1) throw new Error(`Salary record ${id} not found`)

    const current = list[index]
    const now = new Date()
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`

    const updated: DailySalaryRecord = {
      ...current,
      status,
      paymentMethod: status === 'paid' ? method : undefined,
      paidAt: status === 'paid' ? formattedDate : undefined,
      paidBy: status === 'paid' ? paidBy : undefined,
    }

    list[index] = updated
    this.setStore(list)
    return updated
  }

  async batchUpdatePaymentStatus(
    ids: string[],
    status: SalaryPaymentStatus,
    paidBy: string,
    method: PaymentMethod = 'cash'
  ): Promise<DailySalaryRecord[]> {
    await delay(200)
    const list = this.getStore()
    const now = new Date()
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`

    const updatedList = list.map((record) => {
      if (ids.includes(record.id)) {
        return {
          ...record,
          status,
          paymentMethod: status === 'paid' ? method : undefined,
          paidAt: status === 'paid' ? formattedDate : undefined,
          paidBy: status === 'paid' ? paidBy : undefined,
        }
      }
      return record
    })

    this.setStore(updatedList)
    return updatedList.filter((r) => ids.includes(r.id))
  }
}

export const mockSalaryService = new MockSalaryService()
