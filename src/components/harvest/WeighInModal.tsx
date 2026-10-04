import React, { useEffect, useState } from 'react'
import { CheckCircle, Info, Scale, Sparkles, User, Zap } from 'lucide-react'
import { Modal } from '../common/Modal'
import { useHarvest } from '../../context/HarvestContext'
import { useWorkforce } from '../../context/WorkforceContext'
import { useAuth } from '../../context/AuthContext'
import type { WeighInSession } from '../../types/harvest'

type WeighInModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const WeighInModal: React.FC<WeighInModalProps> = ({ isOpen, onClose }) => {
  const { recordWeighIn } = useHarvest()
  const { workers, selectedWorker } = useWorkforce()
  const { currentUser } = useAuth()

  const harvesters = workers.filter((w) => w.role === 'harvester')

  const [session, setSession] = useState<WeighInSession>('morning')
  const [workerId, setWorkerId] = useState(harvesters[0]?.id || 'WKR-102')
  const [workerName, setWorkerName] = useState(harvesters[0]?.name || 'K. Meenakshi')
  const [division, setDivision] = useState<'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'>('Weddamulla')
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
      setSuccessMsg(`Recorded ${netWeightCalculated} kg net leaf for ${workerName}!`)
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Harvest &amp; Plucking Weigh-In"
      subtitle="Digital scale logger with automatic tare deduction &amp; fine leaf grading"
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
          <label className="form-label">Weighing Session *</label>
          <div className="session-toggle-pill">
            <button
              type="button"
              className={`session-btn ${session === 'morning' ? 'session-btn--active' : ''}`}
              onClick={() => setSession('morning')}
            >
              ☀️ Morning Pluck Weigh-In (11:30 AM)
            </button>
            <button
              type="button"
              className={`session-btn ${session === 'afternoon' ? 'session-btn--active' : ''}`}
              onClick={() => setSession('afternoon')}
            >
              ⛅ Afternoon Pluck Weigh-In (4:30 PM)
            </button>
          </div>
        </div>

        {/* Worker Picker */}
        <div className="form-group">
          <label className="form-label" htmlFor="weigh-worker">Harvester *</label>
          <select
            id="weigh-worker"
            value={workerId}
            onChange={(e) => handleWorkerChange(e.target.value)}
            className="form-input"
            required
          >
            {harvesters.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.id}) — {w.division} {w.fieldBlock}
              </option>
            ))}
          </select>
        </div>

        {/* Division & Field Block readonly display */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Assigned Sector</label>
            <input
              type="text"
              value={`${division} · ${fieldBlock}`}
              readOnly
              className="form-input form-input--readonly"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tare Bag Standard</label>
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
              <label className="form-label" htmlFor="weigh-gross">Gross Weight (Scale reading in kg) *</label>
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
              <label className="form-label">Net Clean Leaf (Gross - Tare)</label>
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
            <label className="form-label" htmlFor="weigh-fine-pct">Leaf Quality Grade (% Fine Two Leaves &amp; A Bud)</label>
            <span className="fine-pct-value">{fineLeafPct}% Fine Grade</span>
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
            <span>Coarse Leaf ({100 - fineLeafPct}%)</span>
            <span>Target Export Standard (&ge;75%)</span>
            <span>Super Fine (90%+)</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting || netWeightCalculated <= 0}>
            {isSubmitting ? 'Recording...' : `Record ${netWeightCalculated.toFixed(1)} kg Net`}
          </button>
        </div>
      </form>
    </Modal>
  )
}
