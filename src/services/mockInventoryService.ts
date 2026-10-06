import { MOCK_INVENTORY } from '../data/mockInventory'
import type { DispatchInventoryDTO, InventoryFilter, InventoryItem } from '../types/inventory'
import { delay, loadFromStorage, saveToStorage } from './apiClient'

const INVENTORY_STORAGE_KEY = 'plantation_inventory_data_v1'

class MockInventoryService {
  private getStore(): InventoryItem[] {
    return loadFromStorage<InventoryItem[]>(INVENTORY_STORAGE_KEY, MOCK_INVENTORY)
  }

  private setStore(items: InventoryItem[]): void {
    saveToStorage(INVENTORY_STORAGE_KEY, items)
  }

  async getInventory(filters?: InventoryFilter): Promise<InventoryItem[]> {
    await delay(150)
    let list = this.getStore()

    if (filters?.division && filters.division !== 'All Divisions') {
      list = list.filter(
        (item) => item.division === filters.division || item.targetDivision === filters.division,
      )
    }

    if (filters?.fieldBlock && filters.fieldBlock !== 'all') {
      list = list.filter(
        (item) => item.fieldBlock === filters.fieldBlock || item.targetFieldBlock === filters.fieldBlock,
      )
    }

    if (filters?.category && filters.category !== 'all') {
      list = list.filter((item) => item.category === filters.category)
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((item) => item.status === filters.status)
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.fieldBlock.toLowerCase().includes(q) ||
          item.division.toLowerCase().includes(q) ||
          (item.dispatchedBy && item.dispatchedBy.toLowerCase().includes(q)) ||
          (item.receivedBy && item.receivedBy.toLowerCase().includes(q)),
      )
    }

    return list
  }

  async dispatchItem(dto: DispatchInventoryDTO): Promise<InventoryItem> {
    await delay(200)
    const list = this.getStore()
    const index = list.findIndex((i) => i.id === dto.itemId)
    if (index === -1) throw new Error(`Inventory item ${dto.itemId} not found`)

    const current = list[index]
    const now = new Date()
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`

    const updated: InventoryItem = {
      ...current,
      status: 'in_transit',
      targetDivision: dto.targetDivision,
      targetFieldBlock: dto.targetFieldBlock,
      dispatchedBy: dto.dispatchedBy,
      dispatchedDate: formattedDate,
      notes: dto.notes ? `${current.notes || ''} [Dispatch Note: ${dto.notes}]` : current.notes,
    }

    list[index] = updated
    this.setStore(list)
    return updated
  }

  async receiveItem(id: string, receivedBy: string): Promise<InventoryItem> {
    await delay(200)
    const list = this.getStore()
    const index = list.findIndex((i) => i.id === id)
    if (index === -1) throw new Error(`Inventory item ${id} not found`)

    const current = list[index]
    const now = new Date()
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`

    const updated: InventoryItem = {
      ...current,
      division: current.targetDivision || current.division,
      fieldBlock: current.targetFieldBlock || current.fieldBlock,
      targetDivision: undefined,
      targetFieldBlock: undefined,
      status: 'received',
      receivedBy,
      receivedDate: formattedDate,
    }

    list[index] = updated
    this.setStore(list)
    return updated
  }
}

export const mockInventoryService = new MockInventoryService()
