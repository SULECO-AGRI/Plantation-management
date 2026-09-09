import { Layers, MapPinned, PieChart, Ruler, Sprout, Users, X } from 'lucide-react'
import {
  featureSubtitle,
  featureTitle,
  formatNumber,
  formatPropertyValue,
  getAreaSummary,
  getDivisionBreakdown,
  getDivisionOperationalInfo,
  humanizePropertyKey,
  numeric,
} from '../../../utils/gisUtils'
import type { SelectedEstateFeature } from '../../../types/gis'

type Props = {
  selection: SelectedEstateFeature | null
  onClose: () => void
}

export function FeatureDetailPanel({ selection, onClose }: Props) {
  if (!selection || !selection.feature) return null

  const { feature, kind, layerLabel, center } = selection
  const isDivision = kind === 'division'
  const area = getAreaSummary(feature.properties, kind)
  const breakdown = isDivision ? getDivisionBreakdown(feature.properties) : null
  const divisionName = String(feature.properties?.Name || featureTitle(feature, kind))
  const divisionAreaAcres = numeric(feature.properties?.Area)
  const ops = isDivision ? getDivisionOperationalInfo(divisionName, divisionAreaAcres) : null

  const entries = Object.entries(feature.properties || {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  )

  return (
    <aside className="feature-panel" aria-label="Selected feature details">
      <div className={`feature-panel__top ${isDivision ? 'feature-panel__top--division' : 'feature-panel__top--field'}`}>
        <div>
          <div className="feature-panel__badges">
            <span className="entity-kind-badge">
              {isDivision ? <Layers size={11} /> : <Sprout size={11} />}
              {isDivision ? 'DIVISION' : 'FIELD'}
            </span>
            <span className="eyebrow eyebrow--light">{layerLabel}</span>
          </div>
          <h2>{featureTitle(feature, kind)}</h2>
          <p>{featureSubtitle(feature, kind)}</p>
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
              <strong>{center.lat.toFixed(5)}°N</strong>
              <em>{center.lng.toFixed(5)}°E</em>
            </span>
          </article>
        </div>

        {/* Division Workforce Stats */}
        {isDivision && ops && (
          <div className="workforce-section">
            <div className="attribute-heading">
              <span><Users size={13} /> Workforce Distribution</span>
              <span className="share-pill">{ops.totalWorkers} Active Workers</span>
            </div>

            <div className="workforce-grid">
              <div className="workforce-card workforce-card--female">
                <div className="workforce-card__head">
                  <small>Female (Harvesting)</small>
                </div>
                <strong>{ops.femaleWorkers}</strong>
                <em>{ops.femalePct}% of division force</em>
              </div>

              <div className="workforce-card workforce-card--male">
                <div className="workforce-card__head">
                  <small>Male (Field Ops & Transport)</small>
                </div>
                <strong>{ops.maleWorkers}</strong>
                <em>{ops.malePct}% of division force</em>
              </div>
            </div>
          </div>
        )}

        {/* Division-specific Land Use & Estate Share Breakdown */}
        {isDivision && breakdown && (
          <div className="landuse-section">
            <div className="attribute-heading">
              <span><PieChart size={13} /> Land Use & Allocation</span>
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
                  <small>Vegetation</small>
                  <strong>{formatNumber(breakdown.vegAcres)} ac</strong>
                </div>
              )}
              {breakdown.grassAcres !== undefined && (
                <div className="landuse-card landuse-card--grass">
                  <small>Grass</small>
                  <strong>{formatNumber(breakdown.grassAcres)} ac</strong>
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

        {/* Details List */}
        <div className="attribute-heading">
          <span>Details</span>
        </div>

        <dl className="attribute-list">
          <div>
            <dt>Supervisor</dt>
            <dd className="supervisor-field">&nbsp;</dd>
          </div>
          {isDivision && ops && (
            <>
              <div>
                <dt>Active Fields</dt>
                <dd>{ops.fieldsCount} Fields</dd>
              </div>
              <div>
                <dt>Elevation Range</dt>
                <dd>{ops.elevation}</dd>
              </div>
              <div>
                <dt>Monthly Crop Target</dt>
                <dd>{ops.monthlyCropTarget}</dd>
              </div>
              <div>
                <dt>Plucking Round</dt>
                <dd>{ops.pluckingRound}</dd>
              </div>
              <div>
                <dt>Primary Cultivars</dt>
                <dd>{ops.primaryCultivar}</dd>
              </div>
            </>
          )}
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{humanizePropertyKey(key)}</dt>
              <dd>{formatPropertyValue(key, value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  )
}
