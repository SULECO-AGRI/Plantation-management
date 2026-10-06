import React, { useMemo } from 'react'
import {
  Award,
  BarChart3,
  Calendar,
  Layers,
  Scale,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { WeighInModal } from './WeighInModal'
import { useHarvest } from '../../context/HarvestContext'
import { useAuth } from '../../context/AuthContext'
import type { WeighInSession } from '../../types/harvest'

export const HarvestYieldDashboard: React.FC = () => {
  const {
    harvestLogs,
    summary,
    sessionFilter,
    setSessionFilter,
    divisionFilter,
    setDivisionFilter,
    fieldFilter,
    setFieldFilter,
    isLogModalOpen,
    setIsLogModalOpen,
  } = useHarvest()
  const { currentUser } = useAuth()

  const isDivisionManager = currentUser?.role === 'division_manager'
  const managerDivision =
    currentUser?.assignedDivision ||
    (currentUser?.divisionScope !== 'All Divisions' ? currentUser?.divisionScope : 'Weddamulla') ||
    'Weddamulla'

  const activeDivision = isDivisionManager ? managerDivision : divisionFilter
  const isSingleDivision = activeDivision !== 'All Divisions'

  // Extract available fields for the active division
  const availableFields = useMemo(() => {
    const set = new Set<string>()
    if (summary?.fieldYields) {
      summary.fieldYields.forEach((f) => {
        if (!isSingleDivision || f.division.toLowerCase() === activeDivision.toLowerCase()) {
          set.add(f.field)
        }
      })
    }
    harvestLogs.forEach((l) => {
      if (!isSingleDivision || l.division.toLowerCase() === activeDivision.toLowerCase()) {
        if (l.fieldBlock) set.add(l.fieldBlock)
      }
    })
    return Array.from(set).sort()
  }, [summary, harvestLogs, isSingleDivision, activeDivision])

  // Current field data if single field filtered
  const currentFieldData = useMemo(() => {
    if (fieldFilter === 'all' || !summary?.fieldYields) return null
    return summary.fieldYields.find((f) => f.field === fieldFilter) || null
  }, [fieldFilter, summary])

  // Filtered logs for the table
  const displayedLogs = useMemo(() => {
    return harvestLogs.filter((log) => {
      if (isDivisionManager && log.division.toLowerCase() !== managerDivision.toLowerCase()) {
        return false
      }
      if (divisionFilter !== 'All Divisions' && log.division.toLowerCase() !== divisionFilter.toLowerCase()) {
        return false
      }
      if (fieldFilter !== 'all' && log.fieldBlock !== fieldFilter) {
        return false
      }
      if (sessionFilter !== 'all' && log.session !== sessionFilter) {
        return false
      }
      return true
    })
  }, [harvestLogs, isDivisionManager, managerDivision, divisionFilter, fieldFilter, sessionFilter])

  interface ChartItem {
    key: string
    label: string
    subLabel?: string
    totalYieldKg: number
    fineLeafAvgPct?: number
    morningKg?: number
    afternoonKg?: number
    harvesterCount?: number
  }

  // Chart items strictly filtered to active division, ensuring every field of the division is displayed
  const chartData = useMemo<ChartItem[]>(() => {
    if (isSingleDivision) {
      const itemsMap = new Map<string, ChartItem>()

      // 1. Load from summary.fieldYields if matching activeDivision
      if (summary?.fieldYields && summary.fieldYields.length > 0) {
        summary.fieldYields
          .filter((f) => f.division.toLowerCase() === activeDivision.toLowerCase())
          .forEach((f) => {
            itemsMap.set(f.field, {
              key: f.field,
              label: f.field,
              subLabel: `${f.fineLeafAvgPct}% Fine`,
              totalYieldKg: f.totalYieldKg,
              fineLeafAvgPct: f.fineLeafAvgPct,
              morningKg: f.morningKg,
              afternoonKg: f.afternoonKg,
              harvesterCount: f.harvesterCount,
            })
          })
      }

      // 2. Supplement or aggregate from harvestLogs for activeDivision
      harvestLogs.forEach((log) => {
        if (log.division.toLowerCase() === activeDivision.toLowerCase() && log.fieldBlock) {
          const field = log.fieldBlock
          if (!itemsMap.has(field)) {
            itemsMap.set(field, {
              key: field,
              label: field,
              subLabel: `${log.fineLeafPct}% Fine`,
              totalYieldKg: 0,
              fineLeafAvgPct: log.fineLeafPct,
              morningKg: 0,
              afternoonKg: 0,
              harvesterCount: 0,
            })
          }
          const item = itemsMap.get(field)!
          // If item was created from scratch (not from summary)
          if (!summary?.fieldYields || !summary.fieldYields.some((f) => f.field === field && f.division.toLowerCase() === activeDivision.toLowerCase())) {
            item.totalYieldKg = Math.round((item.totalYieldKg + log.netWeightKg) * 10) / 10
            if (log.session === 'morning') {
              item.morningKg = Math.round(((item.morningKg || 0) + log.netWeightKg) * 10) / 10
            } else {
              item.afternoonKg = Math.round(((item.afternoonKg || 0) + log.netWeightKg) * 10) / 10
            }
          }
        }
      })

      // 3. Guarantee that every known field for the division is shown
      availableFields.forEach((field) => {
        if (!itemsMap.has(field)) {
          itemsMap.set(field, {
            key: field,
            label: field,
            subLabel: '0% Fine',
            totalYieldKg: 0,
            fineLeafAvgPct: 0,
            morningKg: 0,
            afternoonKg: 0,
            harvesterCount: 0,
          })
        }
      })

      const list = Array.from(itemsMap.values())
      // Sort by yield descending, then alphabetically by name
      return list.sort((a, b) => b.totalYieldKg - a.totalYieldKg || a.label.localeCompare(b.label))
    }

    // Estate Level (All Divisions)
    if (summary?.divisionYields && summary.divisionYields.length > 0) {
      return summary.divisionYields.map((d) => ({
        key: d.division,
        label: d.division,
        subLabel: `${d.fineLeafAvgPct}% Fine`,
        totalYieldKg: d.totalYieldKg,
        fineLeafAvgPct: d.fineLeafAvgPct,
        harvesterCount: d.harvesterCount,
      }))
    }

    return []
  }, [isSingleDivision, summary, activeDivision, harvestLogs, availableFields])

  // Dynamic round integer Y-axis ticks and ceiling with comfortable pill headroom
  const { maxAxisKg, ticks } = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.totalYieldKg), 0)
    let ceiling = 80
    if (maxVal <= 0) ceiling = 40
    else if (maxVal <= 18) ceiling = 20
    else if (maxVal <= 36) ceiling = 40
    else if (maxVal <= 55) ceiling = 60
    else if (maxVal <= 75) ceiling = 80
    else if (maxVal <= 95) ceiling = 100
    else if (maxVal <= 115) ceiling = 120
    else {
      const rawStep = Math.ceil((maxVal * 1.15) / 4 / 10) * 10
      ceiling = rawStep * 4
    }
    const step = ceiling / 4
    const tickList = [ceiling, ceiling - step, ceiling - 2 * step, ceiling - 3 * step, 0]
    return { maxAxisKg: ceiling, ticks: tickList }
  }, [chartData])

  const handleBarClick = (key: string) => {
    if (isSingleDivision) {
      setFieldFilter(fieldFilter === key ? 'all' : key)
    } else {
      setDivisionFilter(key)
      setFieldFilter('all')
    }
  }

  return (
    <div className="erp-page-container">
      {/* Top Banner */}
      <div className="erp-page-header">
        <div>
          <h1 className="erp-page-title">
            Harvest &amp; Crop Operations
          </h1>
          {isDivisionManager && (
            <div className="division-jurisdiction-label">
              <span>{managerDivision} Division</span>
            </div>
          )}
          <p className="erp-page-subtitle">
            {isDivisionManager
              ? `Daily morning & afternoon digital weigh-ins, harvester productivity, and green leaf yield analytics for ${managerDivision} and its field blocks.`
              : 'Daily morning & afternoon digital weigh-ins, harvester productivity, and division green leaf yield analytics.'}
          </p>
        </div>
      </div>

      {/* Real-Time Aggregation Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-card--highlight">
          <div className="kpi-card__icon kpi-card__icon--emerald">
            <Scale size={24} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">
              {isDivisionManager ? (
                fieldFilter !== 'all' ? `Total ${fieldFilter} Yield Today` : `Total ${managerDivision} Yield Today`
              ) : (
                divisionFilter !== 'All Divisions' ? (
                  fieldFilter !== 'all' ? `Total ${fieldFilter} Yield Today` : `Total ${divisionFilter} Yield Today`
                ) : 'Total Estate Yield Today'
              )}
            </span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">
                {currentFieldData ? currentFieldData.totalYieldKg : (summary?.totalEstateYieldTodayKg ?? 0)}
              </strong>
              <span className="kpi-card__unit">kg Net</span>
            </div>
            <span className="kpi-card__sub">
              {currentFieldData ? (
                `Morning: ${currentFieldData.morningKg} kg · Afternoon: ${currentFieldData.afternoonKg} kg`
              ) : (
                `Morning: ${summary?.morningSessionKg ?? 0} kg · Afternoon: ${summary?.afternoonSessionKg ?? 0} kg`
              )}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__icon kpi-card__icon--blue">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">
              {isDivisionManager
                ? `Harvester Daily Average (${managerDivision})`
                : isSingleDivision
                ? `Harvester Average (${activeDivision})`
                : 'Harvester Daily Average'}
            </span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">
                {currentFieldData ? currentFieldData.averagePerHarvesterKg : (summary?.averagePerHarvesterKg ?? 0)}
              </strong>
              <span className="kpi-card__unit">kg / day</span>
            </div>
            <span className="kpi-card__sub text-emerald">
              {isDivisionManager || isSingleDivision
                ? `▲ Division average across active plucking gangs`
                : '▲ +2.4 kg above regional Nuwara Eliya benchmark (20.6 kg)'}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__icon kpi-card__icon--amber">
            <Users size={24} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">
              {isDivisionManager
                ? `Active Harvesters Weighed`
                : isSingleDivision
                ? `Harvesters Weighed (${activeDivision})`
                : 'Active Harvesters Weighed'}
            </span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">
                {currentFieldData ? currentFieldData.harvesterCount : (summary?.totalHarvestersWeighed ?? 0)}
              </strong>
              <span className="kpi-card__sub">Harvesters</span>
            </div>
            <span className="kpi-card__sub">
              {isDivisionManager || isSingleDivision
                ? `100% attendance in ${fieldFilter !== 'all' ? fieldFilter : activeDivision}`
                : '100% attendance across morning gang'}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__icon kpi-card__icon--purple">
            <Award size={24} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Leaf Quality Standard</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">
                {currentFieldData ? currentFieldData.fineLeafAvgPct : (summary?.fineLeafAvgPct ?? 0)}%
              </strong>
              <span className="kpi-card__sub">Fine Grade</span>
            </div>
            <span className="kpi-card__sub text-purple">
              Two leaves and a bud export standard
            </span>
          </div>
        </div>
      </div>

      {/* Yield Comparison - Vertical Bar Graph */}
      <div className="erp-content-card">
        <div className="erp-content-card__header-simple">
          <div className="card-title-group">
            <BarChart3 size={17} />
            <h3>
              {isSingleDivision
                ? `${activeDivision} Field Block Yield Comparison (Today's Crop)`
                : "Top Division Yield Comparison (Today's Crop)"}
            </h3>
            {fieldFilter !== 'all' && (
              <button
                type="button"
                className="chart-active-filter-pill"
                onClick={() => setFieldFilter('all')}
                title="Click to clear filter and show all blocks"
              >
                Filtered: <strong>{fieldFilter}</strong> ✕
              </button>
            )}
          </div>
          <div className="chart-legend-group">
            <span className="chart-legend-item">
              <span className="legend-swatch legend-swatch--bar" /> Net Clean Leaf (kg)
            </span>
          </div>
        </div>

        <div className="vertical-bar-chart-container">
          <div className="vchart-y-axis">
            {ticks.map((t) => (
              <span key={t} className="vchart-y-tick">
                {t} kg
              </span>
            ))}
          </div>

          <div className="vchart-canvas-area">
            {/* 220px High Plot Stage with Gridlines and Bar Tracks */}
            <div className="vchart-stage">
              {ticks.map((t, idx) => {
                const bottomPct = ((ticks.length - 1 - idx) / (ticks.length - 1)) * 100
                return (
                  <div
                    key={t}
                    className={`chart-grid-line ${t === 0 ? 'chart-grid-line--baseline' : ''}`}
                    style={{ bottom: `${bottomPct}%` }}
                  />
                )
              })}

              {/* Bars Row - strictly single row */}
              <div className="vchart-bars-row">
                {chartData.length > 0 ? (
                  chartData.map((item) => {
                    const heightPct = Math.min(100, Math.max(3, Math.round((item.totalYieldKg / maxAxisKg) * 100)))
                    const isSelected = isSingleDivision ? fieldFilter === item.key : divisionFilter === item.key

                    return (
                      <div
                        key={item.key}
                        className={`vchart-bar-slot ${isSelected ? 'vchart-bar-slot--selected' : ''}`}
                        onClick={() => handleBarClick(item.key)}
                        title={`${item.label}: ${item.totalYieldKg} kg (${item.subLabel || ''}) · Click to filter`}
                      >
                        <div className="vchart-track">
                          <div
                            className={`vchart-fill ${isSelected ? 'vchart-fill--selected' : ''}`}
                            style={{ height: `${heightPct}%` }}
                          >
                            <div className="vchart-value-pill">
                              <span className="bar-kg-val">{item.totalYieldKg}</span>
                              <span className="bar-kg-unit">kg</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="vchart-empty-state">
                    No weigh-in logs recorded for {activeDivision} today.
                  </div>
                )}
              </div>
            </div>

            {/* X-Axis Meta Labels - strictly beneath the plot stage baseline */}
            <div className="vchart-x-row">
              {chartData.map((item) => {
                const isSelected = isSingleDivision ? fieldFilter === item.key : divisionFilter === item.key

                return (
                  <div
                    key={item.key}
                    className={`vchart-x-slot ${isSelected ? 'vchart-x-slot--selected' : ''}`}
                    onClick={() => handleBarClick(item.key)}
                    title={`Click to filter by ${item.label}`}
                  >
                    <strong className="x-division-title">{item.label}</strong>
                    {item.subLabel && <span className="x-division-sub">{item.subLabel}</span>}
                    {isSelected && <span className="vchart-selected-chip">Selected</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Weigh-in Logs Table */}
      <div className="erp-content-card">
        <div className="erp-content-card__header">
          <div className="card-title-group">
            <Calendar size={16} />
            <h3>
              {isSingleDivision
                ? `${activeDivision} Digital Weigh-In Records`
                : "Today's Digital Weigh-In Records"}
            </h3>
            <span className="log-count-pill">{displayedLogs.length} entries</span>
          </div>

          <div className="workforce-dropdown-filters">
            {/* Division dropdown or locked badge */}
            {isDivisionManager ? (
              <div
                className="division-lock-pill"
                title={`Jurisdiction strictly scoped to ${managerDivision} Division`}
              >
                <Layers size={13} />
                <span>{managerDivision}</span>
              </div>
            ) : (
              <select
                value={divisionFilter}
                onChange={(e) => {
                  setDivisionFilter(e.target.value)
                  setFieldFilter('all')
                }}
                className="filter-select"
              >
                <option value="All Divisions">All Divisions</option>
                <option value="Weddamulla">Weddamulla</option>
                <option value="Ramboda">Ramboda</option>
                <option value="Camnethan">Camnethan</option>
                <option value="Lilliesland">Lilliesland</option>
                <option value="Wewandon">Wewandon</option>
              </select>
            )}

            {/* Field dropdown for active division */}
            {isSingleDivision && availableFields.length > 0 && (
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="filter-select"
                title={`Filter by field in ${activeDivision}`}
              >
                <option value="all">All Fields ({activeDivision})</option>
                {availableFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            )}

            {/* Session dropdown */}
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value as WeighInSession | 'all')}
              className="filter-select"
            >
              <option value="all">All Sessions</option>
              <option value="morning">Morning Session (11:30)</option>
              <option value="afternoon">Afternoon Session (16:30)</option>
            </select>
          </div>
        </div>

        <div className="workforce-table-wrapper">
          <table className="workforce-table">
            <thead>
              <tr>
                <th>Record ID &amp; Time</th>
                <th>Session</th>
                <th>Harvester</th>
                <th>Division / Field</th>
                <th>Gross Weight</th>
                <th>Tare Bag</th>
                <th>Net Clean Leaf</th>
                <th>Fine Leaf %</th>
                <th>Supervisor Signature</th>
              </tr>
            </thead>
            <tbody>
              {displayedLogs.length > 0 ? (
                displayedLogs.map((log) => (
                  <tr key={log.id} className="workforce-row">
                    <td>
                      <strong>{log.id}</strong>
                      <span className="table-timestamp">{log.timestamp}</span>
                    </td>
                    <td>
                      <Badge variant={log.session === 'morning' ? 'amber' : 'purple'}>
                        {log.session === 'morning' ? 'MORNING' : 'AFTERNOON'}
                      </Badge>
                    </td>
                    <td>
                      <div className="worker-profile-cell">
                        <div>
                          <strong>{log.workerName}</strong>
                          <span className="worker-id-code">{log.workerId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="division-field-cell">
                        <span className="division-badge">{log.division}</span>
                        <span className="field-tag">{log.fieldBlock}</span>
                      </div>
                    </td>
                    <td>{log.grossWeightKg.toFixed(1)} kg</td>
                    <td>{log.tareBagWeightKg.toFixed(1)} kg</td>
                    <td>
                      <strong className="text-emerald text-lg">{log.netWeightKg.toFixed(1)} kg</strong>
                    </td>
                    <td>
                      <div className="quality-pill">
                        <span className="quality-dot" />
                        <strong>{log.fineLeafPct}%</strong>
                      </div>
                    </td>
                    <td>
                      <span className="recorded-by-chip">{log.recordedBy}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No weigh-in logs found for the selected {activeDivision} {fieldFilter !== 'all' ? `(${fieldFilter})` : ''} criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <WeighInModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </div>
  )
}
