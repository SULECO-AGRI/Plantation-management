import { MOCK_WORKERS } from '../data/mockWorkers'
import type { DivisionWorkforceSummary, Worker, WorkerRole, WorkerStatus } from '../types/workforce'
import { delay, loadFromStorage, saveToStorage } from './apiClient'

const WORKERS_STORAGE_KEY = 'plantation_workforce_data'

export interface IWorkerService {
  getWorkers(filters?: { division?: string; role?: WorkerRole; status?: WorkerStatus }): Promise<Worker[]>
  getWorkerById(id: string): Promise<Worker | null>
  getWorkersByDivision(division: string): Promise<Worker[]>
  getDivisionSupervision(divisionName: string): Promise<DivisionWorkforceSummary>
  updateWorkerLocation(id: string, lat: number, lng: number): Promise<Worker>
}

class MockWorkerService implements IWorkerService {
  private getStore(): Worker[] {
    return loadFromStorage<Worker[]>(WORKERS_STORAGE_KEY, MOCK_WORKERS)
  }

  private setStore(workers: Worker[]): void {
    saveToStorage(WORKERS_STORAGE_KEY, workers)
  }

  async getWorkers(filters?: { division?: string; role?: WorkerRole; status?: WorkerStatus }): Promise<Worker[]> {
    await delay(200)
    let list = this.getStore()

    if (filters?.division && filters.division !== 'All Divisions') {
      const d = filters.division.toLowerCase()
      list = list.filter((w) => w.division.toLowerCase() === d)
    }
    if (filters?.role) {
      list = list.filter((w) => w.role === filters.role)
    }
    if (filters?.status) {
      list = list.filter((w) => w.status === filters.status)
    }

    return list
  }

  async getWorkerById(id: string): Promise<Worker | null> {
    await delay(120)
    const list = this.getStore()
    return list.find((w) => w.id === id) || null
  }

  async getWorkersByDivision(division: string): Promise<Worker[]> {
    await delay(150)
    const list = this.getStore()
    const d = division.toLowerCase()
    return list.filter((w) => w.division.toLowerCase().includes(d) || d.includes(w.division.toLowerCase()))
  }

  async getDivisionSupervision(divisionName: string): Promise<DivisionWorkforceSummary> {
    await delay(180)
    const list = this.getStore()
    const d = divisionName.toLowerCase()

    const divisionWorkers = list.filter((w) => {
      const wd = w.division.toLowerCase()
      return wd.includes(d) || d.includes(wd)
    })

    const kangany = divisionWorkers.find((w) => w.role === 'kangany')
    const totalWorkers = divisionWorkers.length
    const femaleHarvesters = divisionWorkers.filter((w) => w.gender === 'female' && w.role === 'harvester').length
    const maleSundry = divisionWorkers.filter((w) => w.gender === 'male' && (w.role === 'sundry' || w.role === 'sprayer')).length
    const activeCount = divisionWorkers.filter((w) => w.status === 'active').length
    const breakCount = divisionWorkers.filter((w) => w.status === 'break').length

    // Known supervision directory fallback
    const supervisorsMap: Record<string, { name: string; phone: string; role: string }> = {
      weddamulla: { name: 'S. Raman', phone: '+94 77 341 8970', role: 'Head Division Kangany' },
      ramboda: { name: 'T. Krishnan', phone: '+94 77 650 1199', role: 'Senior Field Kangany' },
      camnethan: { name: 'K. Rajaratnam', phone: '+94 77 412 8871', role: 'Field Lead Kangany' },
      lilliesland: { name: 'V. Murugan', phone: '+94 77 789 2314', role: 'Division Kangany' },
      wewandon: { name: 'P. Balasubramaniam', phone: '+94 77 901 3452', role: 'Nursery & Field Kangany' },
    }

    const matchedKey = Object.keys(supervisorsMap).find((k) => d.includes(k)) || 'weddamulla'
    const supervisor = kangany
      ? { name: kangany.name, phone: kangany.phone, role: kangany.roleLabel }
      : supervisorsMap[matchedKey]

    // Estimate active tasks based on division
    const taskCountMap: Record<string, number> = {
      weddamulla: 3,
      ramboda: 2,
      camnethan: 2,
      lilliesland: 2,
      wewandon: 1,
    }

    return {
      division: divisionName,
      supervisor,
      totalWorkers: totalWorkers > 0 ? totalWorkers : 18,
      activeTasks: taskCountMap[matchedKey] || 2,
      femaleHarvesters: femaleHarvesters > 0 ? femaleHarvesters : 12,
      maleSundry: maleSundry > 0 ? maleSundry : 4,
      activeCount: activeCount > 0 ? activeCount : 16,
      breakCount: breakCount > 0 ? breakCount : 2,
    }
  }

  async updateWorkerLocation(id: string, lat: number, lng: number): Promise<Worker> {
    await delay(120)
    const list = this.getStore()
    const index = list.findIndex((w) => w.id === id)
    if (index === -1) throw new Error(`Worker ${id} not found`)

    const updated: Worker = {
      ...list[index],
      lat,
      lng,
      lastPingTime: 'Just now',
    }
    list[index] = updated
    this.setStore(list)
    return updated
  }
}

export const mockWorkerService = new MockWorkerService()
