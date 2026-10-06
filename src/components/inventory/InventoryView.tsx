import React, { useMemo, useState } from 'react'
import { useInventory } from '../../context/InventoryContext'
import { useAuth } from '../../context/AuthContext'
import { DispatchInventoryModal } from './DispatchInventoryModal'
import type { InventoryCategory, InventoryItem, InventoryStatus } from '../../types/inventory'

const CATEGORY_TABS: Array<{ id: InventoryCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All Items' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'fertilizer', label: 'Fertilizer' },
  { id: 'tools', label: 'Tools' },
  { id: 'equipment', label: 'Equipment' },
]

const STATUS_OPTIONS: Array<{ id: InventoryStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All Status' },
  { id: 'available', label: 'Available' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'received', label: 'Received' },
  { id: 'maintenance', label: 'Maintenance' },
]

export const InventoryView: React.FC = () => {
  const { items, isLoading, receiveItem } = useInventory()
  const { currentUser } = useAuth()

  const isSuperAdmin = currentUser?.role === 'super_admin'
  const isDivisionManager = currentUser?.role === 'division_manager'
  const isFieldOfficer = currentUser?.role === 'field_officer' || (currentUser?.role as string) === 'kangany'

  const userDivision = currentUser?.assignedDivision || currentUser?.divisionScope || 'Weddamulla'
  const userField = currentUser?.assignedField || 'Block 4B'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItemForDispatch, setSelectedItemForDispatch] = useState<InventoryItem | null>(null)

  // Local Filter States
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<InventoryStatus | 'all'>('all')
  const [divisionFilter, setDivisionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [receivingId, setReceivingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // 1. Role-based scoping of inventory items
  const roleScopedItems = useMemo(() => {
    return items.filter((item) => {
      // Super Admin: Views all inventory components, vehicles across all divisions and fields
      if (isSuperAdmin) {
        if (divisionFilter !== 'all') {
          return item.division === divisionFilter || item.targetDivision === divisionFilter
        }
        return true
      }

      // Division Manager: Views inventory ONLY his division
      if (isDivisionManager) {
        return item.division === userDivision || item.targetDivision === userDivision
      }

      // Field Officer: Views inventory components and vehicles that exist in / destined for his field(s)
      if (isFieldOfficer) {
        return (
          item.fieldBlock === userField ||
          item.targetFieldBlock === userField ||
          (item.division === userDivision && item.fieldBlock === 'Central Depot' && item.category === 'vehicles')
        )
      }

      // Worker or default fallback
      return item.division === userDivision
    })
  }, [items, isSuperAdmin, isDivisionManager, isFieldOfficer, divisionFilter, userDivision, userField])

  // 2. Secondary filtering (Category, Status, Search)
  const filteredItems = useMemo(() => {
    return roleScopedItems.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false
      }
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchCode = item.code.toLowerCase().includes(q)
        const matchName = item.name.toLowerCase().includes(q)
        const matchLocation = item.fieldBlock.toLowerCase().includes(q) || item.division.toLowerCase().includes(q)
        const matchNotes = item.notes?.toLowerCase().includes(q)
        return matchCode || matchName || matchLocation || matchNotes
      }
      return true
    })
  }, [roleScopedItems, selectedCategory, selectedStatus, searchQuery])

  // Count items awaiting receipt for Field Officer
  const pendingReceiptCount = useMemo(() => {
    if (!isFieldOfficer) return 0
    return items.filter(
      (item) => item.status === 'in_transit' && (item.targetFieldBlock === userField || item.fieldBlock === userField)
    ).length
  }, [items, isFieldOfficer, userField])

  // Summary counts
  const stats = useMemo(() => {
    const total = roleScopedItems.length
    const vehicles = roleScopedItems.filter((i) => i.category === 'vehicles').length
    const inTransit = roleScopedItems.filter((i) => i.status === 'in_transit').length
    const available = roleScopedItems.filter((i) => i.status === 'available').length
    const received = roleScopedItems.filter((i) => i.status === 'received').length
    return { total, vehicles, inTransit, available, received }
  }, [roleScopedItems])

  const handleOpenDispatch = (item?: InventoryItem) => {
    setSelectedItemForDispatch(item || null)
    setIsModalOpen(true)
  }

  const handleReceive = async (item: InventoryItem) => {
    try {
      setReceivingId(item.id)
      const receiverName = `${currentUser?.name || 'Field Officer'} (${userField})`
      await receiveItem(item.id, receiverName)
      setNotification(`Received ${item.code} (${item.name}) successfully at ${userField}.`)
      setTimeout(() => setNotification(null), 4000)
    } catch (err: any) {
      alert(`Error receiving item: ${err.message || 'Unknown error'}`)
    } finally {
      setReceivingId(null)
    }
  }

  // Header Titles
  const viewTitle = isSuperAdmin
    ? 'Inventory: All Divisions'
    : isDivisionManager
    ? `Inventory: ${userDivision} Division`
    : isFieldOfficer
    ? `Inventory: ${userField}`
    : `Inventory: ${userDivision}`

  const viewSubtitle = isSuperAdmin
    ? 'All estate vehicles, tools, fertilizers, and supplies across divisions'
    : isDivisionManager
    ? `Inventory management and field dispatch for ${userDivision} Division`
    : isFieldOfficer
    ? `Assigned field vehicles, tools, and incoming dispatches for ${userField}`
    : `Inventory view for ${userDivision}`

  return (
    <div className="erp-page-container">
      {/* Top Banner / Header */}
      <div className="erp-page-header">
        <div>
          <div className="erp-page-title-row">
            <h1 className="erp-page-title">{viewTitle}</h1>
            <span className="erp-badge erp-badge--neutral">
              {isSuperAdmin
                ? 'Super Admin Access'
                : isDivisionManager
                ? 'Division Scope'
                : isFieldOfficer
                ? `Field Officer: ${userField}`
                : 'View Only'}
            </span>
          </div>
          <p className="erp-page-subtitle">{viewSubtitle}</p>
        </div>

        {/* Dispatch Action (Super Admin & Division Manager only) */}
        {(isSuperAdmin || isDivisionManager) && (
          <div className="erp-page-header__actions">
            <button
              type="button"
              className="erp-btn erp-btn--primary"
              onClick={() => handleOpenDispatch()}
            >
              + Dispatch Inventory
            </button>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="erp-alert erp-alert--success">
          <span>{notification}</span>
          <button type="button" className="erp-alert__close" onClick={() => setNotification(null)}>
            ×
          </button>
        </div>
      )}

      {/* Field Officer Alert for In-Transit Items */}
      {isFieldOfficer && pendingReceiptCount > 0 && (
        <div className="erp-alert erp-alert--warning">
          <strong>Action Required:</strong> {pendingReceiptCount} item{pendingReceiptCount > 1 ? 's are' : ' is'} currently in transit to {userField}. Review and click "Receive" below once verified on site.
        </div>
      )}

      {/* Simple Summary Metric Cards */}
      <div className="erp-metrics-grid">
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">Total Tracked</div>
          <div className="erp-metric-card__value">{stats.total}</div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">Vehicles & Machinery</div>
          <div className="erp-metric-card__value">{stats.vehicles}</div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">Available</div>
          <div className="erp-metric-card__value">{stats.available}</div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">In Transit</div>
          <div className="erp-metric-card__value" style={{ color: stats.inTransit > 0 ? '#b45309' : undefined }}>
            {stats.inTransit}
          </div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">Received in Field</div>
          <div className="erp-metric-card__value">{stats.received}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="erp-filters-bar">
        {/* Category Pills */}
        <div className="erp-filter-group">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`erp-pill-btn ${selectedCategory === tab.id ? 'erp-pill-btn--active' : ''}`}
              onClick={() => setSelectedCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="erp-filter-controls">
          <select
            className="erp-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Super Admin Division Dropdown */}
          {isSuperAdmin && (
            <select
              className="erp-select"
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
            >
              <option value="all">All Divisions</option>
              <option value="Weddamulla">Weddamulla</option>
              <option value="Ramboda">Ramboda</option>
              <option value="Camnethan">Camnethan</option>
              <option value="Lilliesland">Lilliesland</option>
              <option value="Wewandon">Wewandon</option>
            </select>
          )}

          {/* Search Box */}
          <input
            type="text"
            className="erp-input erp-input--search"
            placeholder="Search code, name, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="erp-table-container">
        {isLoading ? (
          <div className="erp-table-empty">Loading inventory data...</div>
        ) : filteredItems.length === 0 ? (
          <div className="erp-table-empty">
            No inventory items found matching the selected criteria.
          </div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Location</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Condition</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isTargetForThisOfficer =
                  isFieldOfficer &&
                  item.status === 'in_transit' &&
                  (item.targetFieldBlock === userField || item.fieldBlock === userField)

                return (
                  <tr key={item.id}>
                    {/* Code */}
                    <td className="erp-table__code">{item.code}</td>

                    {/* Name + Notes */}
                    <td>
                      <div className="erp-table__primary-text">{item.name}</div>
                      {item.notes && (
                        <div className="erp-table__secondary-text">{item.notes}</div>
                      )}
                    </td>

                    {/* Category */}
                    <td>
                      <span className="erp-table__category-badge">{item.categoryLabel}</span>
                    </td>

                    {/* Location */}
                    <td>
                      <div className="erp-table__location">
                        {item.division} — {item.fieldBlock}
                      </div>
                      {item.status === 'in_transit' && item.targetFieldBlock && (
                        <div className="erp-table__transit-target">
                          Destination: {item.targetDivision || item.division} — {item.targetFieldBlock}
                        </div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td>
                      <strong>{item.quantity}</strong> {item.unit}
                    </td>

                    {/* Status */}
                    <td>
                      {item.status === 'available' && (
                        <span className="erp-badge erp-badge--success">Available</span>
                      )}
                      {item.status === 'in_transit' && (
                        <span className="erp-badge erp-badge--warning">
                          In Transit ({item.targetFieldBlock || 'Field'})
                        </span>
                      )}
                      {item.status === 'received' && (
                        <span className="erp-badge erp-badge--info">Received</span>
                      )}
                      {item.status === 'maintenance' && (
                        <span className="erp-badge erp-badge--muted">Maintenance</span>
                      )}
                    </td>

                    {/* Condition */}
                    <td>
                      <span className="erp-table__condition-text">
                        {item.condition.charAt(0).toUpperCase() + item.condition.slice(1).replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action Column */}
                    <td style={{ textAlign: 'right' }}>
                      {/* Field Officer: Can receive items destined for their field */}
                      {isFieldOfficer ? (
                        isTargetForThisOfficer ? (
                          <button
                            type="button"
                            className="erp-btn erp-btn--sm erp-btn--success"
                            onClick={() => handleReceive(item)}
                            disabled={receivingId === item.id}
                          >
                            {receivingId === item.id ? 'Receiving...' : 'Receive'}
                          </button>
                        ) : item.status === 'received' ? (
                          <span className="erp-table__status-text">Stationed in {item.fieldBlock}</span>
                        ) : (
                          <span className="erp-table__status-text">Assigned</span>
                        )
                      ) : (isSuperAdmin || isDivisionManager) ? (
                        /* Super Admin & Division Manager: Can dispatch available or received items */
                        item.status === 'in_transit' ? (
                          <span className="erp-table__transit-pill">
                            En route to {item.targetFieldBlock}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="erp-btn erp-btn--sm erp-btn--outline"
                            onClick={() => handleOpenDispatch(item)}
                          >
                            Dispatch
                          </button>
                        )
                      ) : (
                        <span className="erp-table__status-text">View Only</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Dispatch Modal */}
      <DispatchInventoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedItemForDispatch(null)
        }}
        preselectedItem={selectedItemForDispatch}
      />
    </div>
  )
}
