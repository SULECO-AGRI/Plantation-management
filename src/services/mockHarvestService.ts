import { INITIAL_TODAY_HARVEST_SUMMARY, MOCK_HARVEST_LOGS } from '../data/mockHarvest'
import type { DivisionYieldComparison, HarvestLog, TodayHarvestSummary, WeighInSession } from '../types/harvest'
import { delay, loadFromStorage, saveToStorage } from './apiClient'

const HARVEST_STORAGE_KEY = 'plantation_harvest_logs'
const SUMMARY_STORAGE_KEY = 'plantation_harvest_summary'

export type RecordWeighInDTO = {
  date?: string
  session: WeighInSession
  workerId: string
  workerName: string
  division: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  fieldBlock: string
  grossWeightKg: number
  tareBagWeightKg: number
  fineLeafPct: number
  recordedBy?: string
}

export interface IHarvestService {
  getHarvestLogs(filters?: { division?: string; session?: WeighInSession; workerId?: string; date?: string }): Promise<HarvestLog[]>
  recordWeighIn(dto: RecordWeighInDTO): Promise<HarvestLog>
  getTodayHarvestSummary(): Promise<TodayHarvestSummary>
  getDivisionYieldComparison(): Promise<DivisionYieldComparison[]>
}

class MockHarvestService implements IHarvestService {
  private getLogsStore(): HarvestLog[] {
    return loadFromStorage<HarvestLog[]>(HARVEST_STORAGE_KEY, MOCK_HARVEST_LOGS)
  }

  private setLogsStore(logs: HarvestLog[]): void {
    saveToStorage(HARVEST_STORAGE_KEY, logs)
  }

  private calculateSummary(logs: HarvestLog[]): TodayHarvestSummary {
    const today = new Date().toISOString().split('T')[0]
    // Filter today's logs or default to all current sample logs if dates are 2026-10-04
    const todayLogs = logs.filter((l) => l.date === today || l.date === '2026-10-04')

    if (todayLogs.length === 0) {
      return INITIAL_TODAY_HARVEST_SUMMARY
    }

    let morningTotal = 0
    let afternoonTotal = 0
    let grandTotal = 0
    let totalFineLeafPctSum = 0
    const uniqueWorkers = new Set<string>()

    const divisionMap: Record<string, { total: number; workers: Set<string>; finePctSum: number; count: number }> = {}

    todayLogs.forEach((log) => {
      grandTotal += log.netWeightKg
      totalFineLeafPctSum += log.fineLeafPct
      uniqueWorkers.add(log.workerId)

      if (log.session === 'morning') morningTotal += log.netWeightKg
      else afternoonTotal += log.netWeightKg

      if (!divisionMap[log.division]) {
        divisionMap[log.division] = { total: 0, workers: new Set(), finePctSum: 0, count: 0 }
      }
      divisionMap[log.division].total += log.netWeightKg
      divisionMap[log.division].workers.add(log.workerId)
      divisionMap[log.division].finePctSum += log.fineLeafPct
      divisionMap[log.division].count += 1
    })

    const harvesterCount = uniqueWorkers.size || 1
    const avgPerHarvester = Math.round((grandTotal / harvesterCount) * 10) / 10
    const avgFineLeaf = Math.round((totalFineLeafPctSum / todayLogs.length) * 10) / 10

    const divisionYields: DivisionYieldComparison[] = Object.entries(divisionMap).map(([division, data]) => {
      const dWorkers = data.workers.size || 1
      return {
        division,
        totalYieldKg: Math.round(data.total * 10) / 10,
        harvesterCount: dWorkers,
        averagePerHarvesterKg: Math.round((data.total / dWorkers) * 10) / 10,
        fineLeafAvgPct: Math.round((data.finePctSum / data.count) * 10) / 10,
        targetProgressPct: Math.min(100, Math.round((data.total / 60) * 100)),
      }
    })

    // Sort by total yield desc
    divisionYields.sort((a, b) => b.totalYieldKg - a.totalYieldKg)

    return {
      totalEstateYieldTodayKg: Math.round(grandTotal * 10) / 10,
      averagePerHarvesterKg: avgPerHarvester,
      totalHarvestersWeighed: harvesterCount,
      morningSessionKg: Math.round(morningTotal * 10) / 10,
      afternoonSessionKg: Math.round(afternoonTotal * 10) / 10,
      fineLeafAvgPct: avgFineLeaf,
      divisionYields,
    }
  }

  async getHarvestLogs(filters?: { division?: string; session?: WeighInSession; workerId?: string; date?: string }): Promise<HarvestLog[]> {
    await delay(200)
    let list = this.getLogsStore()

    if (filters?.division && filters.division !== 'All Divisions') {
      list = list.filter((l) => l.division === filters.division)
    }
    if (filters?.session) {
      list = list.filter((l) => l.session === filters.session)
    }
    if (filters?.workerId) {
      list = list.filter((l) => l.workerId === filters.workerId)
    }
    if (filters?.date) {
      list = list.filter((l) => l.date === filters.date)
    }

    return list
  }

  async recordWeighIn(dto: RecordWeighInDTO): Promise<HarvestLog> {
    await delay(250)
    const list = this.getLogsStore()
    const now = new Date()
    const today = dto.date || now.toISOString().split('T')[0]
    const timestamp = `${today} ${now.toTimeString().slice(0, 5)}`

    const gross = Number(dto.grossWeightKg)
    const tare = Number(dto.tareBagWeightKg)
    const netWeight = Math.max(0, Math.round((gross - tare) * 10) / 10)
    const finePct = Math.min(100, Math.max(0, Number(dto.fineLeafPct)))
    const coarsePct = 100 - finePct

    const newLog: HarvestLog = {
      id: `HARV-${Date.now()}`,
      date: today,
      session: dto.session,
      workerId: dto.workerId,
      workerName: dto.workerName,
      division: dto.division,
      fieldBlock: dto.fieldBlock,
      grossWeightKg: gross,
      tareBagWeightKg: tare,
      netWeightKg: netWeight,
      fineLeafPct: finePct,
      coarseLeafPct: coarsePct,
      recordedBy: dto.recordedBy || 'Field Kangany',
      timestamp,
    }

    const updatedLogs = [newLog, ...list]
    this.setLogsStore(updatedLogs)

    // Save updated summary
    const summary = this.calculateSummary(updatedLogs)
    saveToStorage(SUMMARY_STORAGE_KEY, summary)

    return newLog
  }

  async getTodayHarvestSummary(): Promise<TodayHarvestSummary> {
    await delay(180)
    const logs = this.getLogsStore()
    return this.calculateSummary(logs)
  }

  async getDivisionYieldComparison(): Promise<DivisionYieldComparison[]> {
    await delay(150)
    const summary = await this.getTodayHarvestSummary()
    return summary.divisionYields
  }
}

export const mockHarvestService = new MockHarvestService()
