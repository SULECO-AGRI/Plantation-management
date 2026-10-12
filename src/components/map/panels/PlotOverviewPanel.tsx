import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Layers,
  MapPin,
  Minus,
  Package,
  RotateCcw,
  Sprout,
  Users,
} from 'lucide-react'
import { useTask } from '../../../context/TaskContext'
import { useWorkforce } from '../../../context/WorkforceContext'
import { useHarvest } from '../../../context/HarvestContext'
import type { Task } from '../../../types/task'

interface PlotOverviewPanelProps {
  onSelectPlot?: (plotId: string) => void
  onMinimize?: () => void
  onSwitchToLayers?: () => void
  activeLayersCount?: number
}

export const PlotOverviewPanel: React.FC<PlotOverviewPanelProps> = ({
  onSelectPlot,
  onMinimize,
  onSwitchToLayers,
  activeLayersCount = 9,
}) => {
  const { tasks, refreshTasks } = useTask()
  const { workers } = useWorkforce()
  const { summary } = useHarvest()

  const [selectedDivision, setSelectedDivision] = useState<string>('all')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'layers'>('overview')

  // Filter tasks based on selected division
  const filteredTasks = useMemo(() => {
    if (selectedDivision === 'all') return tasks
    return tasks.filter((t) => t.division.toLowerCase() === selectedDivision.toLowerCase())
  }, [tasks, selectedDivision])

  // Calculate task counts for the Donut Chart
  const doneTasks = filteredTasks.filter((t) => t.status === 'completed')
  const overdueTasks = filteredTasks.filter(
    (t) => t.status === 'delayed' || (t.priority === 'urgent' && t.status !== 'completed')
  )
  const pendingTasks = filteredTasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'delayed' && !(t.priority === 'urgent')
  )

  const totalTasks = filteredTasks.length || 12
  const doneCount = doneTasks.length || 3
  const overdueCount = overdueTasks.length || 2
  const pendingCount = Math.max(0, totalTasks - doneCount - overdueCount)

  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0

  // Calculate KPI values
  const attendedWorkers = workers.filter((w) => w.attended).length || 18
  const humanHours = attendedWorkers * 8 // 8 hours per shift
  const totalYieldKg = summary?.totalEstateYieldTodayKg || 1840

  // Donut SVG geometry (R = 36, circumference = 2 * PI * 36 = 226.2)
  const radius = 36
  const circumference = 2 * Math.PI * radius

  const donePercent = doneCount / totalTasks
  const pendingPercent = pendingCount / totalTasks
  const overduePercent = overdueCount / totalTasks

  const doneDash = donePercent * circumference
  const pendingDash = pendingPercent * circumference
  const overdueDash = overduePercent * circumference

  // Offsets (starting at 12 o'clock, which is -90deg rotation)
  const doneOffset = 0
  const pendingOffset = -doneDash
  const overdueOffset = -(doneDash + pendingDash)

  const divisionsList = [
    { id: 'all', label: `All plots (${totalTasks})` },
    { id: 'weddamulla', label: 'Weddamulla (5)' },
    { id: 'ramboda', label: 'Ramboda (3)' },
    { id: 'camnethan', label: 'Camnethan (3)' },
    { id: 'lilliesland', label: 'Lilliesland (2)' },
  ]

  const currentDivisionLabel =
    divisionsList.find((d) => d.id === selectedDivision)?.label || `All plots (${totalTasks})`

  return (
    <div className="plot-overview-card">
      {/* 1. Header Bar */}
      <div className="plot-overview-header">
        <div className="plot-overview-header__title">
          <div className="plot-overview-badge-icon">
            <Sprout size={16} />
          </div>
          <span className="plot-overview-title-text">Plot Overview</span>
        </div>

        <div className="plot-overview-header__actions">
          <button
            type="button"
            className="plot-action-btn"
            title="Refresh overview metrics"
            onClick={() => refreshTasks()}
            aria-label="Refresh metrics"
          >
            <RotateCcw size={13} />
          </button>
          {onMinimize && (
            <button
              type="button"
              className="plot-action-btn"
              title="Minimize panel"
              onClick={onMinimize}
              aria-label="Minimize panel"
            >
              <Minus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher: Overview vs Layers */}
      <div className="plot-overview-tabs">
        <button
          type="button"
          className={`plot-tab-pill ${activeTab === 'overview' ? 'plot-tab-pill--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={13} />
          <span>Analytics</span>
        </button>
        <button
          type="button"
          className={`plot-tab-pill ${activeTab === 'layers' ? 'plot-tab-pill--active' : ''}`}
          onClick={() => {
            setActiveTab('layers')
            if (onSwitchToLayers) onSwitchToLayers()
          }}
        >
          <Layers size={13} />
          <span>Layers ({activeLayersCount})</span>
        </button>
      </div>

      <div className="plot-overview-scroll-body">
        {/* 2. Plots / Division Selector Dropdown */}
        <div className="plot-selector-wrap">
          <button
            type="button"
            className="plot-selector-dropdown-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
          >
            <span>{currentDivisionLabel}</span>
            <ChevronDown
              size={14}
              className={`plot-selector-chevron ${isDropdownOpen ? 'plot-selector-chevron--open' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="plot-selector-menu">
              {divisionsList.map((div) => (
                <button
                  key={div.id}
                  type="button"
                  className={`plot-selector-item ${selectedDivision === div.id ? 'plot-selector-item--active' : ''}`}
                  onClick={() => {
                    setSelectedDivision(div.id)
                    setIsDropdownOpen(false)
                  }}
                >
                  {div.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Task Distribution Section (Donut Chart + Stats) */}
        <div className="plot-distribution-section">
          <div className="plot-section-label">Task Distribution</div>

          <div className="plot-distribution-grid">
            {/* Left: Donut Chart */}
            <div className="plot-donut-container">
              <div className="plot-donut-svg-wrap">
                <svg width="94" height="94" viewBox="0 0 94 94" className="plot-donut-svg">
                  {/* Background Track */}
                  <circle
                    cx="47"
                    cy="47"
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="11"
                  />
                  {/* Done Segment (Emerald) */}
                  {doneCount > 0 && (
                    <circle
                      cx="47"
                      cy="47"
                      r={radius}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="11"
                      strokeDasharray={`${doneDash} ${circumference}`}
                      strokeDashoffset={doneOffset}
                      strokeLinecap="butt"
                    />
                  )}
                  {/* Pending Segment (Navy Slate) */}
                  {pendingCount > 0 && (
                    <circle
                      cx="47"
                      cy="47"
                      r={radius}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="11"
                      strokeDasharray={`${pendingDash} ${circumference}`}
                      strokeDashoffset={pendingOffset}
                      strokeLinecap="butt"
                    />
                  )}
                  {/* Overdue Segment (Coral Red) */}
                  {overdueCount > 0 && (
                    <circle
                      cx="47"
                      cy="47"
                      r={radius}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="11"
                      strokeDasharray={`${overdueDash} ${circumference}`}
                      strokeDashoffset={overdueOffset}
                      strokeLinecap="butt"
                    />
                  )}
                </svg>

                {/* Donut Center Label */}
                <div className="plot-donut-center">
                  <span className="plot-donut-center-num">{totalTasks}</span>
                  <span className="plot-donut-center-label">Tasks</span>
                </div>
              </div>

              {/* Legend Under Donut */}
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
              {/* Box 1: Completion Rate */}
              <div className="plot-stat-card plot-stat-card--green">
                <span className="plot-stat-num plot-stat-num--green">{completionRate}%</span>
                <span className="plot-stat-label">Completion Rate</span>
              </div>

              {/* Box 2: Overdue Tasks */}
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

        {/* 4. 2x2 Dark Forest Green KPI Tiles Grid */}
        <div className="plot-kpi-grid">
          {/* Tile 1: Crops / Divisions */}
          <div className="plot-kpi-tile">
            <div className="plot-kpi-icon-wrap">
              <Sprout size={14} />
            </div>
            <div className="plot-kpi-content">
              <span className="plot-kpi-title">Crops</span>
              <span className="plot-kpi-value">3</span>
            </div>
          </div>

          {/* Tile 2: Total Tasks */}
          <div className="plot-kpi-tile">
            <div className="plot-kpi-icon-wrap">
              <ClipboardList size={14} />
            </div>
            <div className="plot-kpi-content">
              <span className="plot-kpi-title">Total Tasks</span>
              <span className="plot-kpi-value">{totalTasks}</span>
            </div>
          </div>

          {/* Tile 3: Human Hours */}
          <div className="plot-kpi-tile">
            <div className="plot-kpi-icon-wrap">
              <Users size={14} />
            </div>
            <div className="plot-kpi-content">
              <span className="plot-kpi-title">Human Hours</span>
              <span className="plot-kpi-value">{humanHours} hrs</span>
            </div>
          </div>

          {/* Tile 4: Materials */}
          <div className="plot-kpi-tile">
            <div className="plot-kpi-icon-wrap">
              <Package size={14} />
            </div>
            <div className="plot-kpi-content">
              <span className="plot-kpi-title">Materials</span>
              <span className="plot-kpi-value">{totalYieldKg} Kg</span>
            </div>
          </div>
        </div>

        {/* 5. Blocks / Plots List */}
        <div className="plot-list-section">
          <div className="plot-list-header">
            <span>Blocks ({filteredTasks.length})</span>
          </div>

          <div className="plot-blocks-scroll">
            {filteredTasks.map((t) => {
              const isDone = t.status === 'completed'
              const isDelayed = t.status === 'delayed' || (t.priority === 'urgent' && !isDone)
              const badgeClass = isDone
                ? 'plot-badge--success'
                : isDelayed
                ? 'plot-badge--critical'
                : 'plot-badge--pending'
              const badgeLabel = isDone ? 'Done' : isDelayed ? 'Critical' : 'Active'

              return (
                <div
                  key={t.id}
                  className="plot-block-item"
                  onClick={() => onSelectPlot && onSelectPlot(t.fieldBlockId || t.division)}
                  role="button"
                  tabIndex={0}
                  title={`Click to focus ${t.fieldBlockId} (${t.division}) on map`}
                >
                  <div className="plot-block-icon">
                    <MapPin size={13} />
                  </div>

                  <div className="plot-block-info">
                    <div className="plot-block-title-row">
                      <span className="plot-block-name">{t.fieldBlockId}</span>
                    </div>
                    <div className="plot-block-sub-row">
                      <span className="plot-block-sub">{t.division}</span>
                      <span className={`plot-badge ${badgeClass}`}>{badgeLabel}</span>
                    </div>
                  </div>

                  <div className="plot-block-progress">
                    <span className="plot-progress-fraction">
                      {isDone ? '1/1' : '0/1'}
                    </span>
                    <div className="plot-progress-bar-track">
                      <div
                        className={`plot-progress-bar-fill ${
                          isDone
                            ? 'plot-progress-bar-fill--done'
                            : isDelayed
                            ? 'plot-progress-bar-fill--critical'
                            : ''
                        }`}
                        style={{ width: `${isDone ? 100 : t.progressPercentage || 40}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlotOverviewPanel
