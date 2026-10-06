export type SalaryPaymentStatus = 'paid' | 'unpaid'

export type PaymentMethod = 'cash' | 'direct_transfer'

export type DailySalaryRecord = {
  id: string
  workerId: string
  workerName: string
  roleLabel: string
  division: string
  fieldBlock: string
  date: string // YYYY-MM-DD
  attended: boolean
  hoursWorked: number
  pluckedKg: number
  baseRate: number // e.g. LKR 1,350 standard daily wage
  incentive: number // e.g. LKR 400 plucking/overtime incentive
  totalWage: number // baseRate + incentive
  status: SalaryPaymentStatus
  paymentMethod?: PaymentMethod
  paidAt?: string
  paidBy?: string
  notes?: string
}

export type SalaryFilter = {
  date: string
  division?: string
  fieldBlock?: string
  status?: SalaryPaymentStatus | 'all'
  search?: string
}
