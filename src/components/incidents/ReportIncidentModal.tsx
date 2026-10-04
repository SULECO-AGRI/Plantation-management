import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, MapPin, ShieldAlert, Sparkles } from 'lucide-react'
import { Modal } from '../common/Modal'
import { useIncident } from '../../context/IncidentContext'
import { useAuth } from '../../context/AuthContext'
import type { IncidentSeverity, IncidentType } from '../../types/incident'

type ReportIncidentModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({ isOpen, onClose }) => {
  const { reportIncident, dropLocation, setDropLocation } = useIncident()
  const { currentUser } = useAuth()

  const [type, setType] = useState<IncidentType>('pest_outbreak')
  const [severity, setSeverity] = useState<IncidentSeverity>('critical')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [division, setDivision] = useState<'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'>('Weddamulla')
  const [fieldBlock, setFieldBlock] = useState('Block 4B')
  const [lat, setLat] = useState<number>(7.0545)
  const [lng, setLng] = useState<number>(80.7115)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // If opened via map click coordinate drop
  useEffect(() => {
    if (dropLocation) {
      setLat(dropLocation.lat)
      setLng(dropLocation.lng)
    }
  }, [dropLocation])

  const handleDivisionChange = (div: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon') => {
    setDivision(div)
    if (!dropLocation) {
      switch (div) {
        case 'Weddamulla':
          setLat(7.0545)
          setLng(80.7115)
          setFieldBlock('Block 4B')
          break
        case 'Ramboda':
          setLat(7.0615)
          setLng(80.7072)
          setFieldBlock('Block 11A')
          break
        case 'Camnethan':
          setLat(7.0488)
          setLng(80.7215)
          setFieldBlock('Block 7B')
          break
        case 'Lilliesland':
          setLat(7.0592)
          setLng(80.7198)
          setFieldBlock('Block 3A')
          break
        case 'Wewandon':
          setLat(7.0435)
          setLng(80.7102)
          setFieldBlock('Block 1A')
          break
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await reportIncident({
        type,
        severity,
        title,
        description,
        division,
        fieldBlock,
        lat,
        lng,
        reportedBy: `${currentUser?.name || 'Field Officer'} (${currentUser?.roleTitle || 'Supervisor'})`,
      })
      setSuccessMsg('Incident geo-tagged and broadcast to field superintendents!')
      setTimeout(() => {
        setSuccessMsg('')
        setDropLocation(null)
        onClose()
      }, 1000)
    } catch (err) {
      console.error('Failed to report incident:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Geo-Tagged Incident &amp; Hazard Report"
      subtitle="Broadcast emergency, pest outbreaks, soil landslips, or infrastructure damage"
      icon={<AlertTriangle size={18} />}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="incident-form">
        {successMsg && (
          <div className="form-alert form-alert--success">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="form-grid-2">
          {/* Incident Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="incident-type">Hazard Category *</label>
            <select
              id="incident-type"
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
              className="form-input"
              required
            >
              <option value="pest_outbreak">🐛 Pest Outbreak (Tea Tortrix / Blister Blight)</option>
              <option value="soil_erosion">⛰️ Soil Erosion / Landslip Risk</option>
              <option value="road_blockage">🚜 Road Network Blockage</option>
              <option value="irrigation_leak">💧 Irrigation / Water Pipe Leak</option>
            </select>
          </div>

          {/* Severity */}
          <div className="form-group">
            <label className="form-label" htmlFor="incident-severity">Severity Level *</label>
            <select
              id="incident-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="form-input"
              required
            >
              <option value="critical">🔴 Critical (Immediate Action Required)</option>
              <option value="moderate">🟡 Moderate Hazard</option>
              <option value="advisory">🔵 Advisory / Routine Attention</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="incident-title">Incident Title *</label>
          <input
            id="incident-title"
            type="text"
            placeholder="e.g. Caterpillar nesting spotted on high terrace ridge"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-grid-2">
          {/* Division */}
          <div className="form-group">
            <label className="form-label" htmlFor="incident-division">Target Estate Division *</label>
            <select
              id="incident-division"
              value={division}
              onChange={(e) => handleDivisionChange(e.target.value as any)}
              className="form-input"
              required
            >
              <option value="Weddamulla">Weddamulla Division</option>
              <option value="Ramboda">Ramboda Division</option>
              <option value="Camnethan">Camnethan Division</option>
              <option value="Lilliesland">Lilliesland Division</option>
              <option value="Wewandon">Wewandon Division</option>
            </select>
          </div>

          {/* Field Block */}
          <div className="form-group">
            <label className="form-label" htmlFor="incident-block">Field Block Identifier</label>
            <input
              id="incident-block"
              type="text"
              placeholder="e.g. Block 4B or Road 3 Bypass"
              value={fieldBlock}
              onChange={(e) => setFieldBlock(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Geographic Coordinates */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">GPS Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">GPS Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="incident-desc">Hazard Observation &amp; Action Recommendation *</label>
          <textarea
            id="incident-desc"
            rows={3}
            placeholder="Describe extent of damage, affected acreage, immediate containment actions taken..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input form-textarea"
            required
          />
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary btn--danger-accent" disabled={isSubmitting}>
            {isSubmitting ? 'Transmitting Alert...' : 'Broadcast Incident Alert'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
