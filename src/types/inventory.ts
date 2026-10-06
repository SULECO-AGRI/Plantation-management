export type InventoryCategory = 'vehicles' | 'fertilizer' | 'tools' | 'equipment'

export type InventoryStatus = 'available' | 'in_transit' | 'received' | 'maintenance'

export type InventoryCondition = 'excellent' | 'good' | 'fair' | 'needs_service'

export type InventoryItem = {
  id: string
  code: string
  name: string
  category: InventoryCategory
  categoryLabel: string
  division: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  fieldBlock: string // e.g. 'Central Depot', 'Block 4B', 'Block 11A', 'Block 3C'
  quantity: number
  unit: string // 'units', 'bags', 'liters', 'sets'
  status: InventoryStatus
  condition: InventoryCondition
  dispatchedBy?: string
  dispatchedDate?: string
  targetDivision?: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  targetFieldBlock?: string
  receivedBy?: string
  receivedDate?: string
  notes?: string
}

export type DispatchInventoryDTO = {
  itemId: string
  targetDivision: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  targetFieldBlock: string
  quantity?: number
  dispatchedBy: string
  notes?: string
}

export type InventoryFilter = {
  category?: InventoryCategory | 'all'
  division?: string
  fieldBlock?: string
  status?: InventoryStatus | 'all'
  search?: string
}
