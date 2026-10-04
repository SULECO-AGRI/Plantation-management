import React, { useState } from 'react'
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Filter,
  Layers,
  Plus,
  Scale,
  Sparkles,
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
    isLogModalOpen,
    setIsLogModalOpen,
  } = useHarvest()
  const { currentUser } = useAuth()

  return (
    <div className="erp-page-container">
      {/* Top Banner */}
      <div className="erp-page-header">
        <div>
          <div className="erp-page-badge">
            <Scale size={13} />
            <span>MODULE C · YIELD &amp; HARVEST TELEMETRY</span>
          </div>
          <h1 className="erp-page-title">Harvest &amp; Plucking Yield Logger</h1>
          <p className="erp-page-subtitle">
            Daily morning &amp; afternoon digital weigh-ins, harvester productivity, and division green leaf yield analytics.
          </p>
        </div>

        <div className="erp-page-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setIsLogModalOpen(true)}
          >
            <Plus size={15} />
            <span>Record Weigh-In</span>
          </button>
        </div>
      </div>

      {/* Real-Time Aggregation Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-card--highlight">
          <div className="kpi-card__icon kpi-card__icon--emerald">
            <Scale size={24} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Total Estate Yield Today</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">
                {summary?.totalEstateYieldTodayKg ?? 206.9}
              </strong>
              <span className="kpi-card__unit">kg Net</span>
            </div>
            <span className="kpi-card__sub">
              Morning: {summary?.morningSessionKg ?? 117.0} kg · Afternoon: {summary?.afternoonSessionKg ?? 89.9} kg
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__icon kpi-card__icon--blue">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Harvester Daily Average</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">
                {summary?.averagePerHarvesterKg ?? 23.0}
              </strong>
              <span className="kpi-card__unit">kg / day</span>
            </div>
            <span className="kpi-card__sub text-emerald">
              ▲ +2.4 kg above regional Nuwara Eliya benchmark (20.6 kg)
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__icon kpi-card__icon--amber">
            <Users size={24} />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Active Harvesters Weighed</span>
            <div className="kpi-card__val-row">
              <strong className="kpi-card__value">
                {summary?.totalHarvestersWeighed ?? 9}
              </strong>
              <span className="kpi-card__sub">Harvesters</span>
            </div>
            <span className="kpi-card__sub">100% attendance across morning gang</span>
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
                {summary?.fineLeafAvgPct ?? 79.5}%
              </strong>
              <span className="kpi-card__sub">Fine Grade</span>
            </div>
            <span className="kpi-card__sub text-purple">
              Two leaves and a bud high-grown export standard
            </span>
          </div>
        </div>
      </div>

      {/* Top Division Yield Comparison Bar & Progress Grid */}
      <div className="erp-content-card">
        <div className="erp-content-card__header-simple">
          <div className="card-title-group">
            <BarChart3 size={17} />
            <h3>Top Division Yield Comparison (Today's Crop)</h3>
          </div>
          <span className="card-badge">Target: 60 kg / division daily</span>
        </div>

        <div className="division-yield-bars">
          {summary?.divisionYields.map((d) => {
            const pct = Math.min(100, Math.round((d.totalYieldKg / 70) * 100))
            return (
              <div key={d.division} className="yield-bar-row">
                <div className="yield-bar-info">
                  <span className="yield-bar-name">
                    <strong>{d.division} Division</strong>
                    <small>({d.harvesterCount} harvesters · avg {d.averagePerHarvesterKg} kg/worker)</small>
                  </span>
                  <div className="yield-bar-stat">
                    <span className="yield-bar-grade">{d.fineLeafAvgPct}% Fine Leaf</span>
                    <strong className="yield-bar-kg">{d.totalYieldKg} kg</strong>
                  </div>
                </div>
                <div className="yield-progress-track">
                  <div
                    className="yield-progress-bar"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weigh-in Logs Table */}
      <div className="erp-content-card">
        <div className="erp-content-card__header">
          <div className="card-title-group">
            <Calendar size={16} />
            <h3>Today's Digital Weigh-In Records</h3>
            <span className="log-count-pill">{harvestLogs.length} entries</span>
          </div>

          <div className="workforce-dropdown-filters">
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All Divisions">All Divisions</option>
              <option value="Weddamulla">Weddamulla</option>
              <option value="Ramboda">Ramboda</option>
              <option value="Camnethan">Camnethan</option>
              <option value="Lilliesland">Lilliesland</option>
              <option value="Wewandon">Wewandon</option>
            </select>

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
              {harvestLogs.map((log) => (
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
              ))}
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
