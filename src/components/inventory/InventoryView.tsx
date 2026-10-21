import React, { useMemo, useState } from 'react'
import { useInventory } from '../../context/InventoryContext'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import { DispatchInventoryModal } from './DispatchInventoryModal'
import type { InventoryCategory, InventoryItem, InventoryStatus } from '../../types/inventory'

const DIVISION_NAMES: Record<string, { en: string; si: string }> = {
  weddamulla: { en: 'Weddamulla', si: 'වෙද්දමුල්ල' },
  ramboda: { en: 'Ramboda', si: 'රම්බොඩ' },
  camnethan: { en: 'Camnethan', si: 'කැම්නෙතන්' },
  lilliesland: { en: 'Lilliesland', si: 'ලිලීස්ලන්ඩ්' },
  wewandon: { en: 'Wewandon', si: 'වැවන්ඩන්' },
}

const CATEGORY_LABELS: Record<string, { en: string; si: string }> = {
  vehicles: { en: 'Vehicles', si: 'වාහන' },
  fertilizer: { en: 'Fertilizer', si: 'පොහොර' },
  tools: { en: 'Tools', si: 'මෙවලම්' },
  equipment: { en: 'Equipment', si: 'උපකරණ' },
}

export const InventoryView: React.FC = () => {
  const { items, isLoading, receiveItem } = useInventory()
  const { currentUser } = useAuth()
  const { t, locale } = useTranslation()

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
  const localizedUserDivision = DIVISION_NAMES[userDivision.toLowerCase()]?.[locale] || userDivision

  const viewTitle = isSuperAdmin
    ? (locale === 'si' ? 'ඉන්වෙන්ටරි: සියලු කොට්ඨාස' : 'Inventory: All Divisions')
    : isDivisionManager
    ? (locale === 'si' ? `ඉන්වෙන්ටරි: ${localizedUserDivision} කොට්ඨාසය` : `Inventory: ${userDivision} Division`)
    : isFieldOfficer
    ? (locale === 'si' ? `ඉන්වෙන්ටරි: ${userField}` : `Inventory: ${userField}`)
    : (locale === 'si' ? `ඉන්වෙන්ටරි: ${localizedUserDivision}` : `Inventory: ${userDivision}`)

  const viewSubtitle = isSuperAdmin
    ? (locale === 'si' ? 'සියලු කොට්ඨාස හරහා වතු වාහන, මෙවලම්, පොහොර සහ සැපයුම්' : 'All estate vehicles, tools, fertilizers, and supplies across divisions')
    : isDivisionManager
    ? (locale === 'si' ? `${localizedUserDivision} කොට්ඨාසය සඳහා ඉන්වෙන්ටරි කළමනාකරණය සහ ක්ෂේත්‍ර නිකුත් කිරීම්` : `Inventory management and field dispatch for ${userDivision} Division`)
    : isFieldOfficer
    ? (locale === 'si' ? `${userField} සඳහා අනුයුක්ත ක්ෂේත්‍ර වාහන, මෙවලම් සහ ලැබෙන නිකුත් කිරීම්` : `Assigned field vehicles, tools, and incoming dispatches for ${userField}`)
    : (locale === 'si' ? `${localizedUserDivision} සඳහා ඉන්වෙන්ටරි තොරතුරු` : `Inventory view for ${userDivision}`)

  const categoryTabs = [
    { id: 'all' as const, label: t('inventory.tabAllItems') },
    { id: 'vehicles' as const, label: t('inventory.tabVehicles') },
    { id: 'fertilizer' as const, label: t('inventory.tabFertilizer') },
    { id: 'tools' as const, label: t('inventory.tabTools') },
    { id: 'equipment' as const, label: t('inventory.tabEquipment') },
  ]

  const statusOptions = [
    { id: 'all' as const, label: t('inventory.statusAll') },
    { id: 'available' as const, label: t('inventory.statusAvailable') },
    { id: 'in_transit' as const, label: t('inventory.statusInTransit') },
    { id: 'received' as const, label: t('inventory.statusReceived') },
    { id: 'maintenance' as const, label: t('inventory.statusMaintenance') },
  ]

  const conditionLabels: Record<string, string> = {
    good: t('inventory.conditionGood'),
    fair: t('inventory.conditionFair'),
    poor: t('inventory.conditionPoor'),
    needs_service: t('inventory.conditionNeedsService'),
  }

  return (
    <div className="erp-page-container">
      {/* Top Banner / Header */}
      <div className="erp-page-header">
        <div>
          <div className="erp-page-title-row">
            <h1 className="erp-page-title">{viewTitle}</h1>
            <span className="erp-badge erp-badge--neutral">
              {isSuperAdmin
                ? (locale === 'si' ? 'ප්‍රධාන පරිපාලක ප්‍රවේශය' : 'Super Admin Access')
                : isDivisionManager
                ? (locale === 'si' ? 'කොට්ඨාස විෂය පථය' : 'Division Scope')
                : isFieldOfficer
                ? `${locale === 'si' ? 'ක්ෂේත්‍ර නිලධාරී' : 'Field Officer'}: ${userField}`
                : t('inventory.viewOnly')}
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
              + {locale === 'si' ? 'ඉන්වෙන්ටරි නිකුත් කරන්න' : 'Dispatch Inventory'}
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
          <strong>{locale === 'si' ? 'ක්‍රියාමාර්ග අවශ්‍යයි:' : 'Action Required:'}</strong>{' '}
          {locale === 'si'
            ? `භාණ්ඩ ${pendingReceiptCount}ක් ${userField} වෙත ප්‍රවාහනයේ පවතී. භාණ්ඩ ලැබුණු පසු පහත "භාර ගන්න" බොත්තම ක්ලික් කරන්න.`
            : `${pendingReceiptCount} item${pendingReceiptCount > 1 ? 's are' : ' is'} currently in transit to ${userField}. Review and click "Receive" below once verified on site.`}
        </div>
      )}

      {/* Simple Summary Metric Cards */}
      <div className="erp-metrics-grid">
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">{t('inventory.totalTracked')}</div>
          <div className="erp-metric-card__value">{stats.total}</div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">{t('inventory.vehiclesMachinery')}</div>
          <div className="erp-metric-card__value">{stats.vehicles}</div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">{t('inventory.available')}</div>
          <div className="erp-metric-card__value">{stats.available}</div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">{t('inventory.inTransit')}</div>
          <div className="erp-metric-card__value" style={{ color: stats.inTransit > 0 ? '#b45309' : undefined }}>
            {stats.inTransit}
          </div>
        </div>
        <div className="erp-metric-card">
          <div className="erp-metric-card__label">{t('inventory.receivedInField')}</div>
          <div className="erp-metric-card__value">{stats.received}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="erp-filters-bar">
        {/* Category Pills */}
        <div className="erp-filter-group">
          {categoryTabs.map((tab) => (
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
            {statusOptions.map((opt) => (
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
              <option value="all">{locale === 'si' ? 'සියලු කොට්ඨාස' : 'All Divisions'}</option>
              <option value="Weddamulla">{locale === 'si' ? 'වෙද්දමුල්ල' : 'Weddamulla'}</option>
              <option value="Ramboda">{locale === 'si' ? 'රම්බොඩ' : 'Ramboda'}</option>
              <option value="Camnethan">{locale === 'si' ? 'කැම්නෙතන්' : 'Camnethan'}</option>
              <option value="Lilliesland">{locale === 'si' ? 'ලිලීස්ලන්ඩ්' : 'Lilliesland'}</option>
              <option value="Wewandon">{locale === 'si' ? 'වැවන්ඩන්' : 'Wewandon'}</option>
            </select>
          )}

          {/* Search Box */}
          <input
            type="text"
            className="erp-input erp-input--search"
            placeholder={t('inventory.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="erp-table-container">
        {isLoading ? (
          <div className="erp-table-empty">{t('inventory.loadingInventory')}</div>
        ) : filteredItems.length === 0 ? (
          <div className="erp-table-empty">
            {t('inventory.noInventoryMatch')}
          </div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>{t('inventory.thCode')}</th>
                <th>{t('inventory.thItemName')}</th>
                <th>{t('inventory.thCategory')}</th>
                <th>{t('inventory.thCurrentLocation')}</th>
                <th>{t('inventory.thQuantity')}</th>
                <th>{t('inventory.thStatus')}</th>
                <th>{t('inventory.thCondition')}</th>
                <th style={{ textAlign: 'right' }}>{t('inventory.thAction')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isTargetForThisOfficer =
                  isFieldOfficer &&
                  item.status === 'in_transit' &&
                  (item.targetFieldBlock === userField || item.fieldBlock === userField)

                const divName = DIVISION_NAMES[item.division.toLowerCase()]?.[locale] || item.division
                const targetDivName = item.targetDivision ? (DIVISION_NAMES[item.targetDivision.toLowerCase()]?.[locale] || item.targetDivision) : divName
                const catLabel = CATEGORY_LABELS[item.category]?.[locale] || item.categoryLabel

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
                      <span className="erp-table__category-badge">{catLabel}</span>
                    </td>

                    {/* Location */}
                    <td>
                      <div className="erp-table__location">
                        {divName} — {item.fieldBlock}
                      </div>
                      {item.status === 'in_transit' && item.targetFieldBlock && (
                        <div className="erp-table__transit-target">
                          {locale === 'si' ? 'ගමනාන්තය:' : 'Destination:'} {targetDivName} — {item.targetFieldBlock}
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
                        <span className="erp-badge erp-badge--success">{t('inventory.statusAvailable')}</span>
                      )}
                      {item.status === 'in_transit' && (
                        <span className="erp-badge erp-badge--warning">
                          {locale === 'si'
                            ? `ප්‍රවාහනයේ (${item.targetFieldBlock || 'ක්ෂේත්‍රය'})`
                            : `In Transit (${item.targetFieldBlock || 'Field'})`}
                        </span>
                      )}
                      {item.status === 'received' && (
                        <span className="erp-badge erp-badge--info">{t('inventory.statusReceived')}</span>
                      )}
                      {item.status === 'maintenance' && (
                        <span className="erp-badge erp-badge--muted">{t('inventory.statusMaintenance')}</span>
                      )}
                    </td>

                    {/* Condition */}
                    <td>
                      <span className="erp-table__condition-text">
                        {conditionLabels[item.condition] || item.condition}
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
                            {receivingId === item.id ? t('inventory.btnReceiving') : t('inventory.btnReceive')}
                          </button>
                        ) : item.status === 'received' ? (
                          <span className="erp-table__status-text">{t('inventory.stationedIn', { field: item.fieldBlock })}</span>
                        ) : (
                          <span className="erp-table__status-text">{t('inventory.assigned')}</span>
                        )
                      ) : (isSuperAdmin || isDivisionManager) ? (
                        /* Super Admin & Division Manager: Can dispatch available or received items */
                        item.status === 'in_transit' ? (
                          <span className="erp-table__transit-pill">
                            {t('inventory.enRouteTo', { field: item.targetFieldBlock || '' })}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="erp-btn erp-btn--sm erp-btn--outline"
                            onClick={() => handleOpenDispatch(item)}
                          >
                            {t('inventory.btnDispatch')}
                          </button>
                        )
                      ) : (
                        <span className="erp-table__status-text">{t('inventory.viewOnly')}</span>
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
