import React, { useEffect, useState } from 'react'
import { CheckCircle, Info, Scale, Sparkles, User, Zap } from 'lucide-react'
import { Modal } from '../common/Modal'
import { useHarvest } from '../../context/HarvestContext'
import { useWorkforce } from '../../context/WorkforceContext'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import type { WeighInSession } from '../../types/harvest'

const DIVISION_NAMES: Record<string, { en: string; si: string }> = {
  weddamulla: { en: 'Weddamulla', si: 'වෙද්දමුල්ල' },
  ramboda: { en: 'Ramboda', si: 'රම්බොඩ' },
  camnethan: { en: 'Camnethan', si: 'කැම්නෙතන්' },
  lilliesland: { en: 'Lilliesland', si: 'ලිලීස්ලන්ඩ්' },
  wewandon: { en: 'Wewandon', si: 'වැවන්ඩන්' },
}

type WeighInModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const WeighInModal: React.FC<WeighInModalProps> = ({ isOpen, onClose }) => {
  const { recordWeighIn } = useHarvest()
  const { workers, selectedWorker } = useWorkforce()
  const { currentUser } = useAuth()
  const { t, locale } = useTranslation()

  const isDivisionManager = currentUser?.role === 'division_manager'
  const managerDivision =
    currentUser?.assignedDivision ||
    (currentUser?.divisionScope !== 'All Divisions' ? currentUser?.divisionScope : 'Weddamulla') ||
    'Weddamulla'

  const harvesters = workers.filter((w) => {
    if (w.role !== 'harvester') return false
    if (isDivisionManager && w.division.toLowerCase() !== managerDivision.toLowerCase()) return false
    return true
  })

  const [session, setSession] = useState<WeighInSession>('morning')
  const [workerId, setWorkerId] = useState(harvesters[0]?.id || 'WKR-102')
  const [workerName, setWorkerName] = useState(harvesters[0]?.name || 'K. Meenakshi')
  const [division, setDivision] = useState<'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'>(
    (isDivisionManager ? managerDivision : 'Weddamulla') as any,
  )
  const [fieldBlock, setFieldBlock] = useState('Block 4B')
  const [grossWeightKg, setGrossWeightKg] = useState<string>('15.8')
  const [tareBagWeightKg, setTareBagWeightKg] = useState<string>('1.8')
  const [fineLeafPct, setFineLeafPct] = useState<number>(80)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Sync if selectedWorker was set from workforce directory
  useEffect(() => {
    if (selectedWorker) {
      setWorkerId(selectedWorker.id)
      setWorkerName(selectedWorker.name)
      setDivision(selectedWorker.division)
      setFieldBlock(selectedWorker.fieldBlock)
    }
  }, [selectedWorker])

  const handleWorkerChange = (wId: string) => {
    setWorkerId(wId)
    const match = workers.find((w) => w.id === wId)
    if (match) {
      setWorkerName(match.name)
      setDivision(match.division)
      setFieldBlock(match.fieldBlock)
    }
  }

  const grossNum = parseFloat(grossWeightKg) || 0
  const tareNum = parseFloat(tareBagWeightKg) || 0
  const netWeightCalculated = Math.max(0, Math.round((grossNum - tareNum) * 10) / 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await recordWeighIn({
        session,
        workerId,
        workerName,
        division,
        fieldBlock,
        grossWeightKg: grossNum,
        tareBagWeightKg: tareNum,
        fineLeafPct,
        recordedBy: `${currentUser?.name || 'Field Kangany'} (${currentUser?.roleTitle || 'Supervisor'})`,
      })
      setSuccessMsg(
        locale === 'si'
          ? `${workerName} සඳහා ශුද්ධ දළු කි.ග්‍රෑ. ${netWeightCalculated} සටහන් විය!`
          : `Recorded ${netWeightCalculated} kg net leaf for ${workerName}!`
      )
      setTimeout(() => {
        setSuccessMsg('')
        onClose()
      }, 1000)
    } catch (err) {
      console.error('Failed to record weigh in:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const localizedDivision = locale === 'si' && DIVISION_NAMES[division.toLowerCase()]
    ? DIVISION_NAMES[division.toLowerCase()].si
    : division

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('harvest.modalTitle')}
      subtitle={t('harvest.modalSubtitle')}
      icon={<Scale size={18} />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="weigh-in-form">
        {successMsg && (
          <div className="form-alert form-alert--success">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Session Selector Toggle */}
        <div className="form-group">
          <label className="form-label">{t('harvest.thSession')} *</label>
          <div className="session-toggle-pill">
            <button
              type="button"
              className={`session-btn ${session === 'morning' ? 'session-btn--active' : ''}`}
              onClick={() => setSession('morning')}
            >
              ☀️ {t('harvest.sessionMorning')}
            </button>
            <button
              type="button"
              className={`session-btn ${session === 'afternoon' ? 'session-btn--active' : ''}`}
              onClick={() => setSession('afternoon')}
            >
              ⛅ {t('harvest.sessionAfternoon')}
            </button>
          </div>
        </div>

        {/* Worker Picker (Name strictly in English) */}
        <div className="form-group">
          <label className="form-label" htmlFor="weigh-worker">{t('harvest.modalHarvester')} *</label>
          <select
            id="weigh-worker"
            value={workerId}
            onChange={(e) => handleWorkerChange(e.target.value)}
            className="form-input"
            required
          >
            {harvesters.map((w) => {
              const divName = locale === 'si' && DIVISION_NAMES[w.division.toLowerCase()]
                ? DIVISION_NAMES[w.division.toLowerCase()].si
                : w.division
              return (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.id}) — {divName} {w.fieldBlock}
                </option>
              )
            })}
          </select>
        </div>

        {/* Division & Field Block readonly display */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">{t('harvest.thDivisionField')}</label>
            <input
              type="text"
              value={`${localizedDivision} · ${fieldBlock}`}
              readOnly
              className="form-input form-input--readonly"
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('harvest.modalTareKg')}</label>
            <input
              type="number"
              step="0.1"
              value={tareBagWeightKg}
              onChange={(e) => setTareBagWeightKg(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Weight Inputs & Net Weight Auto-Calculation */}
        <div className="weigh-card">
          <div className="weigh-card__inputs">
            <div className="form-group">
              <label className="form-label" htmlFor="weigh-gross">{t('harvest.modalGrossKg')} *</label>
              <input
                id="weigh-gross"
                type="number"
                step="0.1"
                min="0.5"
                max="60"
                value={grossWeightKg}
                onChange={(e) => setGrossWeightKg(e.target.value)}
                className="form-input form-input--lg"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('harvest.modalNetKg')}</label>
              <div className="net-weight-display">
                <span className="net-weight-number">{netWeightCalculated.toFixed(1)}</span>
                <span className="net-weight-unit">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Fine Leaf % Slider */}
        <div className="form-group">
          <div className="slider-header">
            <label className="form-label" htmlFor="weigh-fine-pct">{t('harvest.modalFineLeafQuality')}</label>
            <span className="fine-pct-value">{fineLeafPct}% {locale === 'si' ? 'මනා දළු' : 'Fine Grade'}</span>
          </div>
          <input
            id="weigh-fine-pct"
            type="range"
            min="40"
            max="100"
            value={fineLeafPct}
            onChange={(e) => setFineLeafPct(Number(e.target.value))}
            className="form-slider"
          />
          <div className="slider-labels">
            <span>{locale === 'si' ? `රළු දළු (${100 - fineLeafPct}%)` : `Coarse Leaf (${100 - fineLeafPct}%)`}</span>
            <span>{locale === 'si' ? 'අපනයන ඉලක්කය (≥75%)' : 'Target Export Standard (≥75%)'}</span>
            <span>{locale === 'si' ? 'විශිෂ්ට මනා දළු (90%+)' : 'Super Fine (90%+)'}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            {t('harvest.modalCancelBtn')}
          </button>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting || netWeightCalculated <= 0}>
            {isSubmitting ? t('harvest.modalSubmitting') : `${t('harvest.modalSubmitBtn')} (${netWeightCalculated.toFixed(1)} kg)`}
          </button>
        </div>
      </form>
    </Modal>
  )
}
