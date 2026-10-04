import React, { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { ReportIncidentModal } from './ReportIncidentModal'
import { useIncident } from '../../context/IncidentContext'
import { useAuth } from '../../context/AuthContext'
import type { Incident, IncidentSeverity, IncidentStatus } from '../../types/incident'

type IncidentAlertsTableProps = {
  onLocateOnMap: (incident: Incident) => void
}

export const IncidentAlertsTable: React.FC<IncidentAlertsTableProps> = ({ onLocateOnMap }) => {
  const {
    incidents,
    acknowledgeIncident,
    resolveIncident,
    isReportModalOpen,
    setIsReportModalOpen,
    isIncidentLayerVisible,
    setIsIncidentLayerVisible,
  } = useIncident()
  const { currentUser, selectedDivisionFilter } = useAuth()

  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchSearch =
        inc.title.toLowerCase().includes(search.toLowerCase()) ||
        inc.description.toLowerCase().includes(search.toLowerCase()) ||
        inc.incidentNumber.toLowerCase().includes(search.toLowerCase()) ||
        inc.typeLabel.toLowerCase().includes(search.toLowerCase())

      const matchDiv =
        selectedDivisionFilter === 'All Divisions' || inc.division === selectedDivisionFilter

      const matchSeverity = severityFilter === 'all' || inc.severity === severityFilter
      const matchStatus = statusFilter === 'all' || inc.status === statusFilter

      return matchSearch && matchDiv && matchSeverity && matchStatus
    })
  }, [incidents, search, selectedDivisionFilter, severityFilter, statusFilter])

  const getSeverityBadgeVariant = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'critical':
        return 'red'
      case 'moderate':
        return 'amber'
      case 'advisory':
        return 'blue'
    }
  }

  const getStatusBadgeVariant = (status: IncidentStatus) => {
    switch (status) {
      case 'reported':
        return 'red'
      case 'acknowledged':
        return 'amber'
      case 'resolved':
        return 'emerald'
    }
  }

  const handleAcknowledge = async (id: string) => {
    const actor = `${currentUser?.name || 'Supervisor'} (${currentUser?.roleTitle || 'Field Officer'})`
    await acknowledgeIncident(id, actor)
  }

  const handleResolveSubmit = async (id: string) => {
    const actor = `${currentUser?.name || 'Estate Manager'} (${currentUser?.roleTitle || 'Super Admin'})`
    await resolveIncident(id, actor, resolutionNote)
    setResolvingId(null)
    setResolutionNote('')
  }

  return (
    <div className="erp-page-container">
      {/* Top Banner */}
      <div className="erp-page-header">
        <div>
          <div className="erp-page-badge erp-page-badge--alert">
            <AlertTriangle size={13} />
            <span>MODULE D · HAZARD &amp; SAFETY ALERTS</span>
          </div>
          <h1 className="erp-page-title">Estate Incident &amp; Environmental Alert System</h1>
          <p className="erp-page-subtitle">
            Geo-tagged incident reporting, pest infestations, soil erosion risks, road blockages, and irrigation breaches.
          </p>
        </div>

        <div className="erp-page-actions">
          <label className="toggle-switch-label">
            <input
              type="checkbox"
              checked={isIncidentLayerVisible}
              onChange={(e) => setIsIncidentLayerVisible(e.target.checked)}
            />
            <span className="toggle-slider" />
            <span className="toggle-text">GIS Alert Pins Active</span>
          </label>

          <button
            type="button"
            className="btn btn--danger-accent"
            onClick={() => setIsReportModalOpen(true)}
          >
            <Plus size={15} />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Content Card with Filters & Table */}
      <div className="erp-content-card">
        <div className="erp-content-card__header">
          <div className="workforce-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search incidents by hazard, alert code, division, or notes..."
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

          <div className="workforce-dropdown-filters">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as IncidentSeverity | 'all')}
              className="filter-select"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="moderate">Moderate</option>
              <option value="advisory">Advisory</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | 'all')}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported (Action Pending)</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="workforce-table-wrapper">
          <table className="workforce-table">
            <thead>
              <tr>
                <th>Alert Ref &amp; Severity</th>
                <th>Hazard Category &amp; Title</th>
                <th>Division / Location</th>
                <th>Observation Description</th>
                <th>Reported By &amp; Time</th>
                <th>Status</th>
                <th>Resolution Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    No active incident alerts match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="workforce-row">
                    <td>
                      <div className="incident-ref-box">
                        <strong>{incident.incidentNumber}</strong>
                        <Badge variant={getSeverityBadgeVariant(incident.severity)} dot>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <div className="incident-headline">
                        <span className="incident-cat-tag">{incident.typeLabel}</span>
                        <strong>{incident.title}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="division-field-cell">
                        <span className="division-badge">{incident.division}</span>
                        {incident.fieldBlock && (
                          <span className="field-tag">{incident.fieldBlock}</span>
                        )}
                        <small className="geo-coords">[{incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}]</small>
                      </div>
                    </td>
                    <td>
                      <p className="incident-desc-text">{incident.description}</p>
                      {incident.resolutionNotes && (
                        <div className="resolution-note-pill">
                          <strong>Resolution:</strong> {incident.resolutionNotes}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="incident-reporter-cell">
                        <span>{incident.reportedBy}</span>
                        <small>{incident.reportedAt}</small>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(incident.status)}>
                        {incident.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <div className="incident-action-box">
                        <button
                          type="button"
                          className="table-action-btn table-action-btn--locate"
                          onClick={() => onLocateOnMap(incident)}
                          title="View Hazard on Leaflet Map"
                        >
                          <MapPin size={13} />
                          <span>Map</span>
                        </button>

                        {incident.status === 'reported' && (
                          <button
                            type="button"
                            className="btn btn--sm btn--warning"
                            onClick={() => handleAcknowledge(incident.id)}
                            title="Acknowledge Alert"
                          >
                            Acknowledge
                          </button>
                        )}

                        {incident.status === 'acknowledged' && (
                          <button
                            type="button"
                            className="btn btn--sm btn--success"
                            onClick={() => setResolvingId(incident.id)}
                            title="Mark as Resolved"
                          >
                            Resolve
                          </button>
                        )}

                        {incident.status === 'resolved' && (
                          <span className="text-muted text-sm flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald" />
                            Resolved
                          </span>
                        )}
                      </div>

                      {/* Inline Resolution Box */}
                      {resolvingId === incident.id && (
                        <div className="inline-resolution-popover">
                          <input
                            type="text"
                            placeholder="Resolution notes (e.g. tree cleared, fungicide sprayed)..."
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            className="form-input form-input--sm"
                          />
                          <div className="flex gap-1 mt-1">
                            <button
                              type="button"
                              className="btn btn--xs btn--primary"
                              onClick={() => handleResolveSubmit(incident.id)}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="btn btn--xs btn--secondary"
                              onClick={() => setResolvingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  )
}
