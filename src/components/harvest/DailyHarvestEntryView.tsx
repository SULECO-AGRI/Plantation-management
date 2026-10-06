import React, { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Check,
  CheckCircle2,
  Layers,
  MapPin,
  Save,
  Scale,
  Search,
  Sun,
  Sunset,
  Users,
} from 'lucide-react'
import { useHarvest } from '../../context/HarvestContext'
import { useWorkforce } from '../../context/WorkforceContext'
import { useAuth } from '../../context/AuthContext'
import type { WeighInSession } from '../../types/harvest'
import type { Worker } from '../../types/workforce'

type RowEntry = {
  grossWeightKg: string
  tareBagWeightKg: string
  fineLeafPct: number
  fieldBlock?: string
}

export const DailyHarvestEntryView: React.FC = () => {
  const { harvestLogs, recordWeighIn, batchRecordWeighIns } = useHarvest()
  const { workers } = useWorkforce()
  const { currentUser } = useAuth()

  const officerDivision =
    currentUser?.assignedDivision ||
    (currentUser?.divisionScope !== 'All Divisions' ? currentUser?.divisionScope : 'Weddamulla') ||
    'Weddamulla'

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [selectedSession, setSelectedSession] = useState<WeighInSession>('morning')
  const [selectedDivision, setSelectedDivision] = useState<string>(officerDivision)
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Extract available fields in the division
  const availableFields = useMemo(() => {
    const fieldsSet = new Set<string>()
    workers.forEach((w) => {
      if (
        w.division.toLowerCase() === selectedDivision.toLowerCase() &&
        w.fieldBlock &&
        w.fieldBlock !== 'Estate HQ' &&
        w.fieldBlock !== 'Division Office'
      ) {
        fieldsSet.add(w.fieldBlock)
      }
    })
    const list = Array.from(fieldsSet).sort()
    return list.length > 0 ? list : ['Block 4B', 'Block 4A', 'Block 2A', 'Block 3C', 'Block 7B', 'Block 9C', 'Block 3A', 'Block 1A']
  }, [workers, selectedDivision])

  // Field in charge (defaults to officer's assigned field e.g. 'Block 4B')
  const defaultField = currentUser?.assignedField || availableFields[0] || 'Block 4B'
  const [selectedField, setSelectedField] = useState<string>(defaultField)

  useEffect(() => {
    if (currentUser?.assignedField && availableFields.includes(currentUser.assignedField)) {
      setSelectedField(currentUser.assignedField)
    } else if (availableFields.length > 0 && !availableFields.includes(selectedField)) {
      setSelectedField(availableFields[0])
    }
  }, [selectedDivision, availableFields, currentUser])

  // Local state for draft inputs per workerId
  const [rowEntries, setRowEntries] = useState<Record<string, RowEntry>>({})

  // Scoped harvesters STRICTLY for the specific field in charge (excluding administrative management)
  const fieldWorkers = useMemo(() => {
    return workers.filter((w) => {
      const isFieldCrew = w.role !== 'super_admin' && w.role !== 'division_manager'
      const matchDivision = w.division.toLowerCase() === selectedDivision.toLowerCase()
      const matchField = w.fieldBlock.toLowerCase() === selectedField.toLowerCase()
      return isFieldCrew && matchDivision && matchField
    })
  }, [workers, selectedDivision, selectedField])

  // Map existing logs for the selected date, session, and field block
  const existingLogsMap = useMemo(() => {
    const map = new Map<string, typeof harvestLogs[0]>()
    harvestLogs.forEach((log) => {
      if (
        log.date === selectedDate &&
        log.session === selectedSession &&
        log.fieldBlock.toLowerCase() === selectedField.toLowerCase()
      ) {
        map.set(log.workerId, log)
      }
    })
    return map
  }, [harvestLogs, selectedDate, selectedSession, selectedField])

  // Get current row inputs or default values
  const getRow = (worker: Worker): RowEntry => {
    if (rowEntries[worker.id]) {
      return rowEntries[worker.id]
    }
    const existing = existingLogsMap.get(worker.id)
    if (existing) {
      return {
        grossWeightKg: String(existing.grossWeightKg),
        tareBagWeightKg: String(existing.tareBagWeightKg),
        fineLeafPct: existing.fineLeafPct,
        fieldBlock: existing.fieldBlock,
      }
    }
    return {
      grossWeightKg: '',
      tareBagWeightKg: '1.8',
      fineLeafPct: 80,
      fieldBlock: selectedField,
    }
  }

  const updateRow = (workerId: string, updates: Partial<RowEntry>) => {
    setRowEntries((prev) => {
      const current = prev[workerId] || {
        grossWeightKg: '',
        tareBagWeightKg: '1.8',
        fineLeafPct: 80,
        fieldBlock: selectedField,
      }
      return {
        ...prev,
        [workerId]: { ...current, ...updates },
      }
    })
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Session KPIs specific to this field in charge
  const sessionStats = useMemo(() => {
    const sessionLogs = harvestLogs.filter(
      (l) =>
        l.date === selectedDate &&
        l.session === selectedSession &&
        l.division.toLowerCase() === selectedDivision.toLowerCase() &&
        l.fieldBlock.toLowerCase() === selectedField.toLowerCase()
    )

    const totalKg = sessionLogs.reduce((acc, l) => acc + l.netWeightKg, 0)
    const weighedCount = sessionLogs.length
    const avgKg = weighedCount > 0 ? Math.round((totalKg / weighedCount) * 10) / 10 : 0
    const avgFineLeaf =
      weighedCount > 0 ? Math.round(sessionLogs.reduce((acc, l) => acc + l.fineLeafPct, 0) / weighedCount) : 0

    return {
      totalKg: Math.round(totalKg * 10) / 10,
      weighedCount,
      avgKg,
      avgFineLeaf,
    }
  }, [harvestLogs, selectedDate, selectedSession, selectedDivision, selectedField])

  // Save single worker weigh-in
  const handleSaveRow = async (worker: Worker) => {
    const row = getRow(worker)
    const gross = parseFloat(row.grossWeightKg)
    const tare = parseFloat(row.tareBagWeightKg) || 1.8

    if (isNaN(gross) || gross <= 0) {
      showToast(`Please enter a valid gross weight for ${worker.name}`)
      return
    }

    try {
      await recordWeighIn({
        date: selectedDate,
        session: selectedSession,
        workerId: worker.id,
        workerName: worker.name,
        division: worker.division as any,
        fieldBlock: selectedField,
        grossWeightKg: gross,
        tareBagWeightKg: tare,
        fineLeafPct: row.fineLeafPct || 80,
        recordedBy: currentUser?.name ? `${currentUser.name} (Field Officer)` : 'Field Officer',
      })

      const net = Math.max(0, Math.round((gross - tare) * 10) / 10)
      showToast(`Saved ${net} kg in ${selectedField} for ${worker.name}`)
    } catch (err) {
      console.error(err)
      showToast(`Failed to save weight for ${worker.name}`)
    }
  }

  // Save all entered rows in batch for this field
  const handleSaveAll = async () => {
    const dtosToSave: any[] = []

    fieldWorkers.forEach((worker) => {
      const row = getRow(worker)
      const gross = parseFloat(row.grossWeightKg)
      const tare = parseFloat(row.tareBagWeightKg) || 1.8

      if (!isNaN(gross) && gross > 0) {
        dtosToSave.push({
          date: selectedDate,
          session: selectedSession,
          workerId: worker.id,
          workerName: worker.name,
          division: worker.division,
          fieldBlock: selectedField,
          grossWeightKg: gross,
          tareBagWeightKg: tare,
          fineLeafPct: row.fineLeafPct || 80,
          recordedBy: currentUser?.name ? `${currentUser.name} (Field Officer)` : 'Field Officer',
        })
      }
    })

    if (dtosToSave.length === 0) {
      showToast(`No new weights entered for ${selectedField} to save.`)
      return
    }

    try {
      setIsSaving(true)
      await batchRecordWeighIns(dtosToSave)
      setIsSaving(false)
      showToast(`Successfully saved ${dtosToSave.length} harvest weigh-in records for ${selectedField}!`)
    } catch (err) {
      setIsSaving(false)
      console.error(err)
      showToast('Error saving batch weigh-ins')
    }
  }

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return fieldWorkers.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.id.toLowerCase().includes(search.toLowerCase()) ||
        w.roleLabel.toLowerCase().includes(search.toLowerCase())

      return matchSearch
    })
  }, [fieldWorkers, search])

  return (
    <div className="erp-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#ffffff',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '12px 18px',
            color: '#065f46',
            boxShadow: '0 10px 25px rgba(15, 36, 28, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <Check size={16} color="#059669" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner (Field-Specific Header) */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">
            Daily Harvest: <span style={{ color: 'var(--emerald-600)' }}>{selectedField}</span>
          </h1>
          <p className="erp-page-subtitle">
            Daily harvest weigh-in records for harvesters in{' '}
            <strong style={{ color: 'var(--forest-900)' }}>{selectedField}</strong> ({selectedDivision} Division).
          </p>
        </div>

        {/* Field in Charge, Date, & Session Selectors */}
        <div className="erp-page-actions" style={{ flexWrap: 'wrap', gap: '10px' }}>
          {/* Field in Charge Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} color="var(--emerald-600)" />
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--forest-900)' }}>Field in Charge:</label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="filter-select"
              style={{
                borderColor: 'var(--emerald-500)',
                backgroundColor: '#ffffff',
                fontWeight: 700,
                color: 'var(--emerald-600)',
              }}
            >
              {availableFields.map((f) => (
                <option key={f} value={f}>
                  {f} {f === currentUser?.assignedField ? '(In Charge)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="filter-select"
              style={{ padding: '5px 8px' }}
            />
          </div>

          {/* Session Switcher Pills */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-card)' }}>
            <button
              type="button"
              onClick={() => setSelectedSession('morning')}
              style={{
                backgroundColor: selectedSession === 'morning' ? '#ffffff' : 'transparent',
                color: selectedSession === 'morning' ? '#0369a1' : 'var(--text-muted)',
                fontWeight: selectedSession === 'morning' ? 700 : 500,
                boxShadow: selectedSession === 'morning' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Sun size={13} />
              <span>Morning (11:30)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSession('afternoon')}
              style={{
                backgroundColor: selectedSession === 'afternoon' ? '#ffffff' : 'transparent',
                color: selectedSession === 'afternoon' ? '#b45309' : 'var(--text-muted)',
                fontWeight: selectedSession === 'afternoon' ? 700 : 500,
                boxShadow: selectedSession === 'afternoon' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Sunset size={13} />
              <span>Afternoon (16:30)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Specific to this Field in Charge) */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-card--highlight">
          <div className="kpi-card__content">
            <span className="kpi-card__label">{selectedField} Leaf Today</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value text-emerald">{sessionStats.totalKg}</strong>
              <span className="kpi-card__unit">kg Net</span>
            </div>
            <span className="kpi-card__sub">
              {selectedSession === 'morning' ? 'Morning Weigh-In' : 'Afternoon Weigh-In'}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Harvesters Weighed in {selectedField}</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">
                {sessionStats.weighedCount} / {fieldWorkers.length}
              </strong>
            </div>
            <span className="kpi-card__sub" style={{ color: 'var(--emerald-600)' }}>
              {fieldWorkers.length > 0
                ? `${Math.round((sessionStats.weighedCount / fieldWorkers.length) * 100)}% Weighed`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Avg / Harvester ({selectedField})</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">{sessionStats.avgKg}</strong>
              <span className="kpi-card__unit">kg</span>
            </div>
            <span className="kpi-card__sub">Target: 12.0 kg/session</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__content">
            <span className="kpi-card__label">Fine Leaf Quality ({selectedField})</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">
                {sessionStats.avgFineLeaf > 0 ? `${sessionStats.avgFineLeaf}%` : '80%'}
              </strong>
              <span className="kpi-card__unit">Fine</span>
            </div>
            <span className="kpi-card__sub">Export grade two leaves &amp; bud</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Sheet Card */}
      <div className="erp-content-card">
        <div className="erp-content-card__header">
          {/* Search Box */}
          <div className="workforce-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder={`Search harvesters in ${selectedField}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="workforce-search-input"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch('')}
              >
                ×
              </button>
            )}
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            style={{
              backgroundColor: 'var(--emerald-600)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(31, 107, 82, 0.15)',
            }}
          >
            <Save size={14} />
            <span>Save All {selectedField} Weights</span>
          </button>
        </div>

        {/* Table View */}
        <div className="workforce-table-wrapper">
          <table className="workforce-table">
            <thead>
              <tr>
                <th>Harvester / ID</th>
                <th>Field Block</th>
                <th>Gross Weight (kg)</th>
                <th>Tare Bag (kg)</th>
                <th>Net Harvest (kg)</th>
                <th>Fine Leaf %</th>
                <th>Session Status</th>
                <th style={{ textAlign: 'right' }}>Weigh-In Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Users size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No harvesters found in {selectedField}.</p>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w) => {
                  const row = getRow(w)
                  const gross = parseFloat(row.grossWeightKg) || 0
                  const tare = parseFloat(row.tareBagWeightKg) || 1.8
                  const netWeight = Math.max(0, Math.round((gross - tare) * 10) / 10)
                  const existing = existingLogsMap.get(w.id)

                  return (
                    <tr key={w.id} className="workforce-row">
                      {/* Name & ID */}
                      <td>
                        <div>
                          <strong style={{ fontSize: '13px', color: 'var(--forest-900)', display: 'block' }}>
                            {w.name}
                          </strong>
                          <span className="worker-id-code">
                            {w.id} • {w.roleLabel}
                          </span>
                        </div>
                      </td>

                      {/* Field Block Tag */}
                      <td>
                        <span className="field-tag" style={{ fontWeight: 600 }}>
                          {selectedField}
                        </span>
                      </td>

                      {/* Gross Input */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0.0"
                            value={row.grossWeightKg}
                            onChange={(e) => updateRow(w.id, { grossWeightKg: e.target.value })}
                            style={{
                              width: '85px',
                              backgroundColor: '#ffffff',
                              color: 'var(--forest-900)',
                              border: '1.5px solid var(--emerald-500)',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '13px',
                              fontWeight: 700,
                              outline: 'none',
                            }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kg</span>
                        </div>
                      </td>

                      {/* Tare Input */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={row.tareBagWeightKg}
                            onChange={(e) => updateRow(w.id, { tareBagWeightKg: e.target.value })}
                            style={{
                              width: '60px',
                              backgroundColor: '#ffffff',
                              color: 'var(--text-body)',
                              border: '1px solid var(--border-card)',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kg</span>
                        </div>
                      </td>

                      {/* Net Harvest Weight */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: netWeight > 0 ? 'var(--emerald-100)' : 'var(--bg-subtle)',
                            color: netWeight > 0 ? 'var(--emerald-600)' : 'var(--text-muted)',
                            border: netWeight > 0 ? '1px solid var(--emerald-400)' : '1px solid var(--border-card)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          <Scale size={12} />
                          {netWeight > 0 ? `${netWeight.toFixed(1)} kg` : '0.0 kg'}
                        </span>
                      </td>

                      {/* Fine Leaf % */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="50"
                            max="100"
                            value={row.fineLeafPct}
                            onChange={(e) => updateRow(w.id, { fineLeafPct: parseInt(e.target.value) || 80 })}
                            style={{
                              width: '55px',
                              backgroundColor: '#ffffff',
                              color: 'var(--text-body)',
                              border: '1px solid var(--border-card)',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>%</span>
                        </div>
                      </td>

                      {/* Session Status */}
                      <td>
                        {existing ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--emerald-600)',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle2 size={13} color="var(--emerald-600)" />
                            Weighed ({existing.netWeightKg} kg)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Pending</span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveRow(w)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: 'var(--emerald-600)',
                            border: '1px solid var(--emerald-500)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Save size={12} />
                          <span>Save</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
