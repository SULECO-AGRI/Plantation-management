import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockInventoryService } from '../services/mockInventoryService'
import type { DispatchInventoryDTO, InventoryFilter, InventoryItem } from '../types/inventory'

type InventoryContextType = {
  items: InventoryItem[]
  isLoading: boolean
  filters: InventoryFilter
  setFilters: React.Dispatch<React.SetStateAction<InventoryFilter>>
  dispatchItem: (dto: DispatchInventoryDTO) => Promise<InventoryItem>
  receiveItem: (id: string, receivedBy: string) => Promise<InventoryItem>
  refreshInventory: () => Promise<void>
  isDispatchModalOpen: boolean
  setIsDispatchModalOpen: (open: boolean) => void
  selectedItemForDispatch: InventoryItem | null
  setSelectedItemForDispatch: (item: InventoryItem | null) => void
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<InventoryFilter>({
    category: 'all',
    status: 'all',
  })
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [selectedItemForDispatch, setSelectedItemForDispatch] = useState<InventoryItem | null>(null)

  const fetchItems = async () => {
    try {
      setIsLoading(true)
      const data = await mockInventoryService.getInventory(filters)
      setItems(data)
    } catch (err) {
      console.error('Failed to load inventory items:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [filters])

  const dispatchItem = async (dto: DispatchInventoryDTO): Promise<InventoryItem> => {
    const updated = await mockInventoryService.dispatchItem(dto)
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    return updated
  }

  const receiveItem = async (id: string, receivedBy: string): Promise<InventoryItem> => {
    const updated = await mockInventoryService.receiveItem(id, receivedBy)
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    return updated
  }

  return (
    <InventoryContext.Provider
      value={{
        items,
        isLoading,
        filters,
        setFilters,
        dispatchItem,
        receiveItem,
        refreshInventory: fetchItems,
        isDispatchModalOpen,
        setIsDispatchModalOpen,
        selectedItemForDispatch,
        setSelectedItemForDispatch,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider')
  }
  return context
}
