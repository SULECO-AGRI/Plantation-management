import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Database,
  Layers,
  MapPin,
  MapPinned,
  Package,
  PieChart,
  Ruler,
  Sprout,
  Users,
  X,
} from 'lucide-react'
import {
  featureSubtitle,
  featureTitle,
  formatNumber,
  formatPropertyValue,
  getAreaSummary,
  getDivisionBreakdown,
  humanizePropertyKey,
} from '../../../utils/gisUtils'
import type { SelectedEstateFeature } from '../../../types/gis'
import { useWorkforce } from '../../../context/WorkforceContext'
import { useTask } from '../../../context/TaskContext'
import type { DivisionWorkforceSummary } from '../../../types/workforce'
import type { Task } from '../../../types/task'

type Props = {
  selection: SelectedEstateFeature | null
  onClose: () => void
}

/**
 * Smooth cubic-eased numerical interpolation hook for dynamic KPI changes
 */
function useAnimatedNumber(target: number, duration = 650): number {
  const [current, setCurrent] = useState(target)
  const previousRef = useRef(target)

  useEffect(() => {
    const start = previousRef.current
    const end = target
    if (start === end) return

    let startTimestamp: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const elapsed = timestamp - startTimestamp
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const currentVal = Math.round(start + (end - start) * ease)
      setCurrent(currentVal)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        previousRef.current = end
        setCurrent(end)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animationFrameId)
      previousRef.current = current
    }
  }, [target, duration])

  return current
}

export function FeatureDetailPanel({ selection, onClose }: Props) {
  // All hooks MUST be called unconditionally at top of component
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    workforce: true,
    agronomy: true,
    gis: true,
  })
  const { getDivisionSupervision } = useWorkforce()
  const { tasks } = useTask()
  const [supervision, setSupervision] = useState<DivisionWorkforceSummary | null>(null)

  const feature = selection?.feature
  const kind = selection?.kind || 'field'
  const layerLabel = selection?.layerLabel
  const center = selection?.center

  const divisionName = String(
    feature?.properties?.Name ||
    feature?.properties?.Division ||
    (layerLabel ? layerLabel.replace(/\b(fields|field|divisions|division)\b/gi, '').trim() : '') ||
    'Weddamulla'
  )

  useEffect(() => {
    if (divisionName) {
      getDivisionSupervision(divisionName).then((res) => {
        setSupervision(res)
      })
    }
  }, [divisionName, getDivisionSupervision])

  const isDivision = kind === 'division'
  const featureTitleText = feature ? featureTitle(feature, kind) : ''
  const fieldNum = String(
    feature?.properties?.Field ||
    feature?.properties?.field_no ||
    feature?.properties?.Name ||
    ''
  ).replace(/\D+/g, '')

  const area = feature ? getAreaSummary(feature.properties, kind) : null
  const numAcres = parseFloat(area?.secondary?.replace(/[^\d.]/g, '') || '4') || 4

  // Deterministically compute dynamic operations & task analytics per field vs division
  const stats = useMemo(() => {
    if (!feature) {
      return {
        isDivision: false,
        scopeBadge: '',
        totalTasks: 3,
        doneCount: 1,
        pendingCount: 2,
        overdueCount: 0,
        completionRate: 33,
        cultivar: 'VP Clonal',
        activeTasksCount: 3,
        laborCount: 12,
        harvestKg: 1400,
        contextualTasks: [] as Task[],
      }
    }

    if (isDivision) {
      const p = feature.properties || {}
      const teaAcres = Number(p.Tea_ac) || Math.round(numAcres * 0.45) || 120
      const divId = Number(p.ID || p.OBJECTID || 1)

      const totalTasks = 18 + (divId % 9)
      const completionPercent = 58 + ((divId * 7) % 25)
      const doneCount = Math.round((totalTasks * completionPercent) / 100)
      const overdueCount = 1 + (divId % 3)
      const pendingCount = Math.max(0, totalTasks - doneCount - overdueCount)
      const completionRate = Math.round((doneCount / totalTasks) * 100)

      const laborCount = supervision?.totalWorkers || Math.max(38, Math.round(teaAcres * 0.42 + 18))
      const harvestKg = Math.round(teaAcres * 380)

      return {
        isDivision: true,
        scopeBadge: 'Division Scope',
        totalTasks,
        doneCount,
        pendingCount,
        overdueCount,
        completionRate,
        cultivar: '5 Clones (Estate Mix)',
        activeTasksCount: totalTasks,
        laborCount,
        harvestKg,
        contextualTasks: tasks
          .filter((t) => t.division.toLowerCase() === divisionName.toLowerCase())
          .slice(0, totalTasks),
      }
    }

    // Individual Field: Compute rich distinct metrics based on unique seed
    const p = feature.properties || {}
    const rawId = String(p.OBJECTID || p.Field_No || p.field_no || p.Name || featureTitleText || '1')
    let seed = 0
    for (let i = 0; i < rawId.length; i++) {
      seed = (seed << 5) - seed + rawId.charCodeAt(i)
      seed |= 0
    }
    seed = Math.abs(seed) + (Number(p.OBJECTID) || 0) * 17

    const totalTasks = 3 + (seed % 4) // 3, 4, 5, or 6 tasks
    const cycleType = seed % 4
    let doneCount = 1
    let overdueCount = 0

    if (cycleType === 0) {
      doneCount = totalTasks - 1
      overdueCount = 0
    } else if (cycleType === 1) {
      doneCount = Math.max(1, Math.floor(totalTasks * 0.5))
      overdueCount = seed % 3 === 0 ? 1 : 0
    } else if (cycleType === 2) {
      doneCount = 1
      overdueCount = 1 + (seed % 2)
    } else {
      doneCount = 2
      overdueCount = 0
    }

    if (doneCount + overdueCount > totalTasks) {
      overdueCount = Math.max(0, totalTasks - doneCount)
    }
    const pendingCount = Math.max(0, totalTasks - doneCount - overdueCount)
    const completionRate = Math.round((doneCount / totalTasks) * 100)

    const explicitCrop = String(p.CROP || p.Cultivar || p.crop || '').trim()
    const teaClones = ['TRI 2025', 'VP Clonal', 'DT 95', 'TRI 2026', 'CR 6017', 'TRI 2043', 'S106 Clonal']
    const cultivar = explicitCrop || teaClones[seed % teaClones.length]

    const laborCount = Math.max(6, Math.round(numAcres * 2.8 + (seed % 5)))
    const yieldPerAcre = 360 + (seed % 140)
    const harvestKg = Math.round(numAcres * yieldPerAcre)

    const synthTasks: Task[] = []
    const workTypes: Array<{ type: any; label: string }> = [
      { type: 'tea_plucking', label: 'Tea Plucking (Fine Grade)' },
      { type: 'fertilizer_spraying', label: 'Foliar Nutrient Application' },
      { type: 'weeding', label: 'Terrace Boundary Weeding' },
      { type: 'drainage_clearing', label: 'Sub-soil Drain Maintenance' },
      { type: 'shade_pruning', label: 'Grevillea Canopy Pruning' },
      { type: 'moss_cleaning', label: 'Stem Moss & Fern Removal' },
    ]

    for (let i = 0; i < totalTasks; i++) {
      const wt = workTypes[i % workTypes.length]
      let taskStatus: 'completed' | 'in_progress' | 'delayed' = 'in_progress'
      let progress = 45
      let priority: 'normal' | 'urgent' | 'low' = 'normal'

      if (i < doneCount) {
        taskStatus = 'completed'
        progress = 100
      } else if (i < doneCount + overdueCount) {
        taskStatus = 'delayed'
        priority = 'urgent'
        progress = 25
      } else {
        taskStatus = 'in_progress'
        progress = 55 + ((i * 14) % 35)
      }

      synthTasks.push({
        id: `TSK-${rawId}-${i + 1}`,
        taskNumber: `WO-2026-${String(100 + (seed % 800) + i).padStart(4, '0')}`,
        workType: wt.type,
        workTypeLabel: wt.label,
        division: divisionName as any,
        fieldBlockId: featureTitleText,
        assignedGangKangany: ['S. Raman', 'K. Rajaratnam', 'V. Mohan', 'M. Ganeshan'][i % 4],
        assignedWorkerCount: Math.max(3, Math.round(laborCount / totalTasks)),
        priority,
        status: taskStatus,
        targetDate: '2026-10-12',
        targetOutput: `${Math.round(harvestKg / totalTasks)} kg target`,
        progressPercentage: progress,
        createdAt: '2026-10-10',
        createdBy: 'Admin',
        creatorRole: 'super_admin' as const,
        assigneeRole: 'field_officer' as const,
        assigneeName: supervision?.supervisor?.name || 'Field Officer',
      })
    }

    return {
      isDivision: false,
      scopeBadge: featureTitleText,
      totalTasks,
      doneCount,
      pendingCount,
      overdueCount,
      completionRate,
      cultivar,
      activeTasksCount: totalTasks,
      laborCount,
      harvestKg,
      contextualTasks: synthTasks,
    }
  }, [feature, isDivision, divisionName, numAcres, featureTitleText, tasks, supervision])

  // Animated counters for smooth visual transitions
  const animatedTasks = useAnimatedNumber(stats.totalTasks, 600)
  const animatedCompletionRate = useAnimatedNumber(stats.completionRate, 650)
  const animatedOverdue = useAnimatedNumber(stats.overdueCount, 550)
  const animatedLabor = useAnimatedNumber(stats.laborCount, 600)
  const animatedHarvest = useAnimatedNumber(stats.harvestKg, 700)

  // ALL hooks called above. Guard clause safely placed here:
  if (!selection || !selection.feature) return null

  const validFeature = selection.feature
  const validKind = selection.kind
  const validCenter = selection.center

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const breakdown = isDivision ? getDivisionBreakdown(validFeature.properties) : null
  const cleanLayerLabel = layerLabel
    ? layerLabel
      .replace(/\b(fields|field|divisions|division)\b/gi, '')
      .replace(/^estate\s*$/i, '')
      .trim()
    : ''

  const entries = Object.entries(validFeature.properties || {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  )

  // Donut chart calculations
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const totalForSlices = Math.max(1, stats.totalTasks)
  const doneDash = (stats.doneCount / totalForSlices) * circumference
  const pendingDash = (stats.pendingCount / totalForSlices) * circumference
  const overdueDash = (stats.overdueCount / totalForSlices) * circumference
  const doneOffset = 0
  const pendingOffset = -doneDash
  const overdueOffset = -(doneDash + pendingDash)

  return (
    <aside className="feature-panel" aria-label="Selected feature details">
      <div className={`feature-panel__top ${isDivision ? 'feature-panel__top--division' : 'feature-panel__top--field'}`}>
        <div>
          <div className="feature-panel__badges">
            <span className="entity-kind-badge">
              {isDivision ? <Layers size={11} /> : <Sprout size={11} />}
              {isDivision ? 'DIVISION' : 'FIELD'}
            </span>
            {cleanLayerLabel ? (
              <span className="eyebrow eyebrow--light">{cleanLayerLabel}</span>
            ) : null}
          </div>
          <h2>{featureTitle(validFeature, validKind)}</h2>
          <p>{featureSubtitle(validFeature, validKind)}</p>
        </div>
        <button
          className="icon-btn icon-btn--light"
          type="button"
          onClick={onClose}
          aria-label="Close details"
        >
          <X size={18} />
        </button>
      </div>

      <div className="feature-panel__body">
        {/* Core summary metrics */}
        <div className="detail-metrics">
          {area && (
            <article>
              <Ruler size={17} />
              <span>
                <small>{isDivision ? 'Division Area' : 'Field Area'}</small>
                <strong>{area.primary}</strong>
                <em>{area.secondary}</em>
              </span>
            </article>
          )}
          <article>
            <MapPinned size={17} />
            <span>
              <small>Geo Center</small>
              <strong>{validCenter.lat.toFixed(5)}°N</strong>
              <em>{validCenter.lng.toFixed(5)}°E</em>
            </span>
          </article>
        </div>

        {/* =========================================================================
            OPERATIONS & TASK DISTRIBUTION ANALYTICS (Matches Image 3)
           ========================================================================= */}
        <div className="plot-distribution-section" style={{ marginTop: '2px', marginBottom: '14px' }}>
          <div className="plot-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Task Distribution &amp; Operations</span>
            <span style={{ textTransform: 'none', color: '#10b981', fontWeight: 700 }}>
              {isDivision ? 'Division Scope' : featureTitleText}
            </span>
          </div>

          <div className="plot-distribution-grid">
            {/* Left: Donut Chart */}
            <div className="plot-donut-container">
              <div className="plot-donut-svg-wrap">
                <svg width="90" height="90" viewBox="0 0 90 90" className="plot-donut-svg">
                  <circle
                    cx="45"
                    cy="45"
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                  />
                  {doneCount > 0 && (
                    <circle
                      cx="45"
                      cy="45"
                      r={radius}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray={`${doneDash} ${circumference}`}
                      strokeDashoffset={doneOffset}
                      strokeLinecap="butt"
                    />
                  )}
                  {pendingCount > 0 && (
                    <circle
                      cx="45"
                      cy="45"
                      r={radius}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="10"
                      strokeDasharray={`${pendingDash} ${circumference}`}
                      strokeDashoffset={pendingOffset}
                      strokeLinecap="butt"
                    />
                  )}
                  {overdueCount > 0 && (
                    <circle
                      cx="45"
                      cy="45"
                      r={radius}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="10"
                      strokeDasharray={`${overdueDash} ${circumference}`}
                      strokeDashoffset={overdueOffset}
                      strokeLinecap="butt"
                    />
                  )}
                </svg>

                <div className="plot-donut-center">
                  <span className="plot-donut-center-num">{totalTasks}</span>
                  <span className="plot-donut-center-label">Tasks</span>
                </div>
              </div>

              <div className="plot-donut-legend">
                <span className="plot-legend-item">
                  <span className="legend-dot legend-dot--done" /> Done
                </span>
                <span className="plot-legend-item">
                  <span className="legend-dot legend-dot--pending" /> Pending
                </span>
                <span className="plot-legend-item">
                  <span className="legend-dot legend-dot--overdue" /> Overdue
                </span>
              </div>
            </div>

            {/* Right: Stacked KPI Boxes */}
            <div className="plot-stats-column">
              <div className="plot-stat-card plot-stat-card--green">
                <span className="plot-stat-num plot-stat-num--green">{completionRate}%</span>
                <span className="plot-stat-label">Completion Rate</span>
              </div>

              <div className="plot-stat-card plot-stat-card--red">
                <div className="plot-stat-alert-row">
                  <AlertTriangle size={14} className="plot-alert-icon" />
                  <span className="plot-stat-num plot-stat-num--red">{overdueCount}</span>
                </div>
                <span className="plot-stat-label">Overdue Tasks</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2x2 Dark Forest Green KPI Tiles Grid */}
        <div className="plot-kpi-grid" style={{ marginBottom: '14px' }}>
          <div className="plot-kpi-tile">
            <div className="plot-kpi-icon-wrap">
              <Sprout size={14} />
            </div>
            <div className="plot-kpi-content">
              <span className="plot-kpi-title">{isDivision ? 'Crops' : 'Crop Cultivar'}</span>
              <span className="plot-kpi-value">{isDivision ? '5 Blocks' : (String(validFeature.properties?.CROP || 'VP Clonal'))}</span>
            </div>
          </div>

          <div className="plot-kpi-tile">
            <div className="plot-kpi-icon-wrap">
              <ClipboardList size={14} />
            </div>
            <div className="plot-kpi-content">
              <span className="plot-kpi-title">Active Tasks</span>
              <span className="plot-kpi-value">{totalTasks} Orders</span>
            </div>
          </div>

          <div className="plot-kpi-tile">
            <div className="plot-kpi-icon-wrap">
              <Users size={14} />
            </div>
            <div className="plot-kpi-content">
              <span className="plot-kpi-title">Field Labor</span>
              <span className="plot-kpi-value">{supervision?.totalWorkers ?? 18} Active</span>
            </div>
          </div>

          <div className="plot-kpi-tile">
            <div className="plot-kpi-icon-wrap">
              <Package size={14} />
            </div>
            <div className="plot-kpi-content">
              <span className="plot-kpi-title">Est. Harvest</span>
              <span className="plot-kpi-value">{Math.round(numAcres * 420)} Kg</span>
            </div>
          </div>
        </div>

        {/* Division-specific Land Use & Estate Share Breakdown */}
        {isDivision && breakdown && (
          <div className="landuse-section">
            <div className="attribute-heading">
              <span><PieChart size={13} /> Land Use &amp; Allocation</span>
              {breakdown.estateSharePct !== undefined && (
                <span className="share-pill">{formatNumber(breakdown.estateSharePct, 2)}% of Estate</span>
              )}
            </div>

            <div className="landuse-grid">
              {breakdown.teaAcres !== undefined && (
                <div className="landuse-card landuse-card--tea">
                  <small>Tea Area</small>
                  <strong>{formatNumber(breakdown.teaAcres)} ac</strong>
                </div>
              )}
              {breakdown.vegAcres !== undefined && (
                <div className="landuse-card landuse-card--veg">
                  <small>Vegetable Crop</small>
                  <strong>{formatNumber(breakdown.vegAcres)} ac</strong>
                </div>
              )}
              {breakdown.grassAcres !== undefined && (
                <div className="landuse-card landuse-card--grass">
                  <small>Shrubs / Grass</small>
                  <strong>{formatNumber(breakdown.grassAcres)} ac</strong>
                </div>
              )}
              {breakdown.highVegAcres !== undefined && (
                <div className="landuse-card landuse-card--forest">
                  <small>High Forest</small>
                  <strong>{formatNumber(breakdown.highVegAcres)} ac</strong>
                </div>
              )}
              {breakdown.devAcres !== undefined && (
                <div className="landuse-card landuse-card--dev">
                  <small>Developed</small>
                  <strong>{formatNumber(breakdown.devAcres)} ac</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categorized Dropdown Sections */}
        <div className="panel-categories">
          {/* 1. Workforce & Supervision Dropdown */}
          <div className="category-dropdown">
            <button
              type="button"
              className="category-dropdown__header"
              onClick={() => toggleCategory('workforce')}
              aria-expanded={openCategories.workforce}
            >
              <span>
                <Users size={13} />
                Workforce &amp; Supervision
              </span>
              <ChevronDown
                size={15}
                className={`category-chevron ${openCategories.workforce ? 'category-chevron--open' : ''}`}
              />
            </button>

            {openCategories.workforce && (
              <div className="category-dropdown__content">
                <dl className="attribute-list">
                  <div>
                    <dt>Supervisor</dt>
                    <dd>
                      {supervision ? (
                        <a
                          href={`tel:${supervision.supervisor.phone}`}
                          className="supervisor-phone-link"
                          title="Call Assigned Field Kangany"
                        >
                          <strong>{supervision.supervisor.name}</strong>
                          <small>({supervision.supervisor.phone})</small>
                        </a>
                      ) : (
                        <span className="field-placeholder">—</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{isDivision ? 'Total Workers in Division' : 'Assigned Field Workers'}</dt>
                    <dd>
                      <strong className="text-emerald">{supervision?.totalWorkers ?? 18}</strong>
                      <span className="unit-label"> active in field</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Active Tasks Underway</dt>
                    <dd>
                      <strong>{supervision?.activeTasks ?? 2}</strong>
                      <span className="unit-label"> work orders</span>
                    </dd>
                  </div>
                  <div>
                    <dt>{isDivision ? 'Female Harvesters' : 'Harvesters'}</dt>
                    <dd>
                      <strong>{supervision?.femaleHarvesters ?? 12}</strong>
                      <span className="unit-label"> on plucking</span>
                    </dd>
                  </div>
                  <div>
                    <dt>{isDivision ? 'Male Sundry / Field Ops' : 'Sundry / Field Ops'}</dt>
                    <dd>
                      <strong>{supervision?.maleSundry ?? 4}</strong>
                      <span className="unit-label"> sprayers &amp; drainage</span>
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          {/* 2. Agronomy & Operations Dropdown */}
          <div className="category-dropdown">
            <button
              type="button"
              className="category-dropdown__header"
              onClick={() => toggleCategory('agronomy')}
              aria-expanded={openCategories.agronomy}
            >
              <span>
                <Sprout size={13} />
                Agronomy &amp; Operations
              </span>
              <ChevronDown
                size={15}
                className={`category-chevron ${openCategories.agronomy ? 'category-chevron--open' : ''}`}
              />
            </button>

            {openCategories.agronomy && (
              <div className="category-dropdown__content">
                <dl className="attribute-list">
                  {isDivision ? (
                    <>
                      <div>
                        <dt>Active Field Parcels</dt>
                        <dd><strong>18 Blocks</strong> (High yield vigor)</dd>
                      </div>
                      <div>
                        <dt>Elevation Profile</dt>
                        <dd><strong>1,350m – 1,820m MSL</strong> (High Grown)</dd>
                      </div>
                      <div>
                        <dt>Monthly Crop Target</dt>
                        <dd><strong>18,500 kg</strong> green leaf</dd>
                      </div>
                      <div>
                        <dt>Plucking Round Cycle</dt>
                        <dd><strong>7 – 9 day round</strong> (Active)</dd>
                      </div>
                      <div>
                        <dt>Primary Cultivars</dt>
                        <dd><strong>TRI 2023, TRI 2025, DT 1</strong></dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt>Planting Type</dt>
                        <dd><strong>VP Clonal Tea</strong> (Vegetatively Propagated)</dd>
                      </div>
                      <div>
                        <dt>Cultivar / Clones</dt>
                        <dd><strong>TRI 2023 / DT 1 Hybrid</strong></dd>
                      </div>
                      <div>
                        <dt>Year of Planting</dt>
                        <dd><strong>2012</strong> (Prime mature bushes)</dd>
                      </div>
                      <div>
                        <dt>Bush Density / Stand</dt>
                        <dd><strong>11,800 bushes / ha</strong></dd>
                      </div>
                      <div>
                        <dt>Pruning Cycle &amp; Stage</dt>
                        <dd><strong>Year 3 of 4</strong> (High yield flush)</dd>
                      </div>
                      <div>
                        <dt>Plucking Round Cycle</dt>
                        <dd><strong>8-Day Round</strong></dd>
                      </div>
                      <div>
                        <dt>Soil Condition / pH</dt>
                        <dd><strong>pH 4.8 – 5.2</strong> (Optimum Red-Yellow Podzolic)</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* 3. GIS & Dataset Attributes Dropdown */}
          {entries.length > 0 && (
            <div className="category-dropdown">
              <button
                type="button"
                className="category-dropdown__header"
                onClick={() => toggleCategory('gis')}
                aria-expanded={openCategories.gis}
              >
                <span>
                  <Database size={13} />
                  GIS &amp; Dataset Attributes
                </span>
                <ChevronDown
                  size={15}
                  className={`category-chevron ${openCategories.gis ? 'category-chevron--open' : ''}`}
                />
              </button>

              {openCategories.gis && (
                <div className="category-dropdown__content">
                  <dl className="attribute-list">
                    {entries.map(([key, value]) => (
                      <div key={key}>
                        <dt>{humanizePropertyKey(key)}</dt>
                        <dd>{formatPropertyValue(key, value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
