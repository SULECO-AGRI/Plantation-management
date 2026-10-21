import React, { useEffect, useState } from 'react'
import { Modal } from '../common/Modal'
import { useInventory } from '../../context/InventoryContext'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import type { InventoryItem } from '../../types/inventory'

const DIVISION_NAMES: Record<string, { en: string; si: string }> = {
  weddamulla: { en: 'Weddamulla', si: 'වෙද්දමුල්ල' },
  ramboda: { en: 'Ramboda', si: 'රම්බොඩ' },
  camnethan: { en: 'Camnethan', si: 'කැම්නෙතන්' },
  lilliesland: { en: 'Lilliesland', si: 'ලිලීස්ලන්ඩ්' },
  wewandon: { en: 'Wewandon', si: 'වැවන්ඩන්' },
}

const DIVISION_FIELDS: Record<string, string[]> = {
  Weddamulla: ['Block 4B', 'Block 3C', 'Block 2A', 'Central Depot', 'Factory Yard'],
  Ramboda: ['Block 11A', 'Block 9C', 'Central Depot', 'Field Store'],
  Camnethan: ['Block 7B', 'Block 5A', 'Central Depot'],
  Lilliesland: ['Block 3A', 'Block 2C', 'Central Depot'],
  Wewandon: ['Block 14B', 'Block 12D', 'Central Depot'],
}

const ALL_DIVISIONS: Array<'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'> = [
  'Weddamulla',
  'Ramboda',
  'Camnethan',
  'Lilliesland',
  'Wewandon',
]

type DispatchInventoryModalProps = {
  isOpen: boolean
  onClose: () => void
  preselectedItem?: InventoryItem | null
}

export const DispatchInventoryModal: React.FC<DispatchInventoryModalProps> = ({
  isOpen,
  onClose,
  preselectedItem,
}) => {
  const { items, dispatchItem } = useInventory()
  const { currentUser } = useAuth()
  const { t, locale } = useTranslation()

  const isSuperAdmin = currentUser?.role === 'super_admin'
  const userDivision = (currentUser?.assignedDivision || currentUser?.divisionScope || 'Weddamulla') as
    | 'Weddamulla'
    | 'Ramboda'
    | 'Camnethan'
    | 'Lilliesland'
    | 'Wewandon'

  // Available items for selection:
  // If Super Admin: any available item
  // If Division Manager: items in their division that are available
  const selectableItems = items.filter((item) => {
    if (item.status === 'in_transit') return false
    if (isSuperAdmin) return true
    return item.division === userDivision
  })

  const [selectedItemId, setSelectedItemId] = useState<string>(
    preselectedItem?.id || (selectableItems[0]?.id ?? '')
  )

  const activeItem = items.find((i) => i.id === selectedItemId) || preselectedItem || selectableItems[0]

  const defaultTargetDivision = isSuperAdmin ? (activeItem?.division || 'Weddamulla') : userDivision
  const [targetDivision, setTargetDivision] = useState<'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'>(
    defaultTargetDivision
  )

  const availableFields = DIVISION_FIELDS[targetDivision] || ['Central Depot']
  const [targetFieldBlock, setTargetFieldBlock] = useState<string>(availableFields[0] || 'Central Depot')
  const [quantity, setQuantity] = useState<number>(activeItem ? activeItem.quantity : 1)
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Sync state when opening or when active item / preselected item changes
  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id)
      setQuantity(preselectedItem.quantity)
    } else if (selectableItems.length > 0 && !selectedItemId) {
      setSelectedItemId(selectableItems[0].id)
      setQuantity(selectableItems[0].quantity)
    }
  }, [preselectedItem, isOpen])

  useEffect(() => {
    if (activeItem) {
      setQuantity(activeItem.quantity)
    }
  }, [selectedItemId])

  useEffect(() => {
    if (!isSuperAdmin) {
      setTargetDivision(userDivision)
    }
  }, [isSuperAdmin, userDivision])

  useEffect(() => {
    const fields = DIVISION_FIELDS[targetDivision] || ['Central Depot']
    if (!fields.includes(targetFieldBlock)) {
      setTargetFieldBlock(fields[0] || 'Central Depot')
    }
  }, [targetDivision])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItem) {
      setErrorMsg('Please select an item to dispatch.')
      return
    }

    if (!targetFieldBlock) {
      setErrorMsg('Please select a target field or block.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const dispatchedBy = `${currentUser?.name || 'Authorized User'} (${currentUser?.roleTitle || 'Official'})`
      await dispatchItem({
        itemId: activeItem.id,
        targetDivision,
        targetFieldBlock,
        quantity,
        dispatchedBy,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch inventory.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const localizedUserDivision = DIVISION_NAMES[userDivision.toLowerCase()]?.[locale] || userDivision

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('inventory.modalDispatchTitle')}
      subtitle={
        isSuperAdmin
          ? (locale === 'si'
              ? 'ප්‍රධාන පරිපාලක නිකුත් කිරීම්: ඕනෑම කොට්ඨාසයක් සහ ක්ෂේත්‍රයක් වෙත උපකරණ, වාහන හෝ සැපයුම් යවන්න.'
              : 'Super Admin Dispatch: Send equipment, vehicles or supplies across any division & field.')
          : (locale === 'si'
              ? `කොට්ඨාස නිකුත් කිරීම් (${localizedUserDivision}): ඔබේ කොට්ඨාසය තුළ පිහිටි ක්ෂේත්‍ර වෙත භාණ්ඩ යවන්න.`
              : `Division Dispatch (${userDivision}): Send inventory to fields inside your division.`)
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="simple-task-form">
        {errorMsg && (
          <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>
            {errorMsg}
          </div>
        )}

        {/* Item Selection */}
        <div className="form-group">
          <label className="form-label">{t('inventory.modalSelectItem')}</label>
          {preselectedItem ? (
            <div
              style={{
                padding: '10px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <strong>{preselectedItem.code}</strong> — {preselectedItem.name} ({preselectedItem.categoryLabel})
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {locale === 'si' ? 'වත්මන් ස්ථානය:' : 'Current Location:'} {DIVISION_NAMES[preselectedItem.division.toLowerCase()]?.[locale] || preselectedItem.division} — {preselectedItem.fieldBlock} | {locale === 'si' ? 'පවතින ප්‍රමාණය:' : 'Available:'} {preselectedItem.quantity} {preselectedItem.unit}
              </div>
            </div>
          ) : (
            <select
              className="form-input"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
            >
              {selectableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.code}] {item.name} ({DIVISION_NAMES[item.division.toLowerCase()]?.[locale] || item.division} - {item.fieldBlock}) - {locale === 'si' ? 'ප්‍රමාණය:' : 'Qty:'} {item.quantity} {item.unit}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Division Selection */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">
              {t('inventory.modalDestinationDivision')} {isSuperAdmin ? (locale === 'si' ? '(සියලු කොට්ඨාස)' : '(All Divisions)') : (locale === 'si' ? '(ඔබේ කොට්ඨාසය)' : '(Your Division)')}
            </label>
            {isSuperAdmin ? (
              <select
                className="form-input"
                value={targetDivision}
                onChange={(e) => setTargetDivision(e.target.value as any)}
                required
              >
                {ALL_DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {DIVISION_NAMES[div.toLowerCase()]?.[locale] || div} {locale === 'si' ? 'කොට්ඨාසය' : 'Division'}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="form-input"
                value={`${localizedUserDivision} ${locale === 'si' ? 'කොට්ඨාසය' : 'Division'}`}
                disabled
              />
            )}
          </div>

          {/* Target Field / Block */}
          <div className="form-group">
            <label className="form-label">{t('inventory.modalDestinationField')}</label>
            <select
              className="form-input"
              value={targetFieldBlock}
              onChange={(e) => setTargetFieldBlock(e.target.value)}
              required
            >
              {availableFields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity & Unit */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">
              {t('inventory.modalQuantityToDispatch')} {activeItem ? `(${locale === 'si' ? 'උපරිම:' : 'Max:'} ${activeItem.quantity} ${activeItem.unit})` : ''}
            </label>
            <input
              type="number"
              className="form-input"
              value={quantity}
              min={1}
              max={activeItem ? activeItem.quantity : undefined}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{locale === 'si' ? 'ඒකකය' : 'Unit'}</label>
            <input
              type="text"
              className="form-input"
              value={activeItem?.unit || 'units'}
              disabled
            />
          </div>
        </div>

        {/* Dispatch Notes / Purpose */}
        <div className="form-group">
          <label className="form-label">{t('inventory.modalDispatchNotes')}</label>
          <input
            type="text"
            className="form-input"
            placeholder={locale === 'si' ? 'උදා. උදෑසන ක්ෂේත්‍ර වැඩ හෝ නියමිත බෙහෙත් ඉසීම සඳහා වෙන් කිරීම' : 'e.g. Allocation for morning field work or scheduled spray'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {locale === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isSubmitting || !activeItem}
          >
            {isSubmitting ? t('inventory.modalDispatching') : t('inventory.modalDispatchBtn')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
