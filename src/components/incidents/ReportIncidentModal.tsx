import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, MapPin, ShieldAlert, Sparkles } from 'lucide-react'
import { Modal } from '../common/Modal'
import { useIncident } from '../../context/IncidentContext'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import type { IncidentSeverity, IncidentType } from '../../types/incident'

const DIVISION_NAMES: Record<string, { en: string; si: string }> = {
  weddamulla: { en: 'Weddamulla', si: 'වෙද්දමුල්ල' },
  ramboda: { en: 'Ramboda', si: 'රම්බොඩ' },
  camnethan: { en: 'Camnethan', si: 'කැම්නෙතන්' },
  lilliesland: { en: 'Lilliesland', si: 'ලිලීස්ලන්ඩ්' },
  wewandon: { en: 'Wewandon', si: 'වැවන්ඩන්' },
}

type ReportIncidentModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({ isOpen, onClose }) => {
  const { reportIncident, dropLocation, setDropLocation } = useIncident()
  const { currentUser } = useAuth()
  const { t, locale } = useTranslation()

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
      setSuccessMsg(t('incidents.successMsg'))
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
      title={t('incidents.modalTitle')}
      subtitle={t('incidents.modalSubtitle')}
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
            <label className="form-label" htmlFor="incident-type">{t('incidents.categoryLabel')}</label>
            <select
              id="incident-type"
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
              className="form-input"
              required
            >
              <option value="pest_outbreak">{t('incidents.pestOutbreak')}</option>
              <option value="soil_erosion">{t('incidents.soilErosion')}</option>
              <option value="road_blockage">{t('incidents.roadBlockage')}</option>
              <option value="irrigation_leak">{t('incidents.irrigationLeak')}</option>
            </select>
          </div>

          {/* Severity */}
          <div className="form-group">
            <label className="form-label" htmlFor="incident-severity">{t('incidents.severityLabel')}</label>
            <select
              id="incident-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="form-input"
              required
            >
              <option value="critical">{t('incidents.severityCritical')}</option>
              <option value="moderate">{t('incidents.severityModerate')}</option>
              <option value="advisory">{t('incidents.severityAdvisory')}</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="incident-title">{t('incidents.titleLabel')}</label>
          <input
            id="incident-title"
            type="text"
            placeholder={t('incidents.titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-grid-2">
          {/* Division */}
          <div className="form-group">
            <label className="form-label" htmlFor="incident-division">{t('incidents.divisionLabel')}</label>
            <select
              id="incident-division"
              value={division}
              onChange={(e) => handleDivisionChange(e.target.value as any)}
              className="form-input"
              required
            >
              <option value="Weddamulla">
                {DIVISION_NAMES.weddamulla[locale]} {t('incidents.divisionSuffix')}
              </option>
              <option value="Ramboda">
                {DIVISION_NAMES.ramboda[locale]} {t('incidents.divisionSuffix')}
              </option>
              <option value="Camnethan">
                {DIVISION_NAMES.camnethan[locale]} {t('incidents.divisionSuffix')}
              </option>
              <option value="Lilliesland">
                {DIVISION_NAMES.lilliesland[locale]} {t('incidents.divisionSuffix')}
              </option>
              <option value="Wewandon">
                {DIVISION_NAMES.wewandon[locale]} {t('incidents.divisionSuffix')}
              </option>
            </select>
          </div>

          {/* Field Block */}
          <div className="form-group">
            <label className="form-label" htmlFor="incident-block">{t('incidents.fieldBlockLabel')}</label>
            <input
              id="incident-block"
              type="text"
              placeholder={t('incidents.fieldBlockPlaceholder')}
              value={fieldBlock}
              onChange={(e) => setFieldBlock(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Geographic Coordinates */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">{t('incidents.latLabel')}</label>
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
            <label className="form-label">{t('incidents.lngLabel')}</label>
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
          <label className="form-label" htmlFor="incident-desc">{t('incidents.descLabel')}</label>
          <textarea
            id="incident-desc"
            rows={3}
            placeholder={t('incidents.descPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input form-textarea"
            required
          />
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            {t('incidents.cancelBtn')}
          </button>
          <button type="submit" className="btn btn--primary btn--danger-accent" disabled={isSubmitting}>
            {isSubmitting ? t('incidents.transmittingBtn') : t('incidents.broadcastBtn')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
