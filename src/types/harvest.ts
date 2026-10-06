export type WeighInSession = 'morning' | 'afternoon'

export type HarvestLog = {
  id: string
  date: string
  session: WeighInSession
  workerId: string
  workerName: string
  division: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  fieldBlock: string
  grossWeightKg: number
  tareBagWeightKg: number
  netWeightKg: number
  fineLeafPct: number // Quality grade e.g. 78% fine leaves (two leaves and a bud)
  coarseLeafPct: number // Calculated: 100 - fineLeafPct
  recordedBy: string
  timestamp: string
}

export type DivisionYieldComparison = {
  division: string
  totalYieldKg: number
  harvesterCount: number
  averagePerHarvesterKg: number
  fineLeafAvgPct: number
  targetProgressPct: number
}

export type FieldYieldComparison = {
  field: string
  division: string
  totalYieldKg: number
  harvesterCount: number
  averagePerHarvesterKg: number
  fineLeafAvgPct: number
  morningKg: number
  afternoonKg: number
}

export type TodayHarvestSummary = {
  totalEstateYieldTodayKg: number
  averagePerHarvesterKg: number
  totalHarvestersWeighed: number
  morningSessionKg: number
  afternoonSessionKg: number
  fineLeafAvgPct: number
  divisionYields: DivisionYieldComparison[]
  fieldYields?: FieldYieldComparison[]
}
