import { useState } from 'react'
import { ChevronDown, Database, Layers, MapPinned, PieChart, Ruler, Sprout, Users, X } from 'lucide-react'
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

type Props = {
  selection: SelectedEstateFeature | null
  onClose: () => void
}

export function FeatureDetailPanel({ selection, onClose }: Props) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    workforce: true,
    agronomy: true,
    gis: true,
  })

  if (!selection || !selection.feature) return null

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const { feature, kind, layerLabel, center } = selection
  const isDivision = kind === 'division'
  const area = getAreaSummary(feature.properties, kind)
  const breakdown = isDivision ? getDivisionBreakdown(feature.properties) : null
  const cleanLayerLabel = layerLabel
    ? layerLabel
      .replace(/\b(fields|field|divisions|division)\b/gi, '')
      .replace(/^estate\s*$/i, '')
      .trim()
    : ''

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
            {cleanLayerLabel ? (
              <span className="eyebrow eyebrow--light">{cleanLayerLabel}</span>
            ) : null}
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
                    <dd className="field-placeholder">—</dd>
                  </div>
                  <div>
                    <dt>{isDivision ? 'Total Workers' : 'Assigned Workers'}</dt>
                    <dd className="field-placeholder">—</dd>
                  </div>
                  <div>
                    <dt>{isDivision ? 'Female Workers' : 'Female Harvesters'}</dt>
                    <dd className="field-placeholder">—</dd>
                  </div>
                  <div>
                    <dt>{isDivision ? 'Male Workers' : 'Male Sundry / Field Ops'}</dt>
                    <dd className="field-placeholder">—</dd>
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
                        <dt>Active Fields</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Elevation Profile</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Monthly Crop Target</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Plucking Round Cycle</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Primary Cultivars</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt>Planting Type</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Cultivar / Clones</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Year of Planting</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Bush Density / Stand</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Pruning Cycle &amp; Stage</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Plucking Round Cycle</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Monthly Crop Target</dt>
                        <dd className="field-placeholder">—</dd>
                      </div>
                      <div>
                        <dt>Soil Condition / pH</dt>
                        <dd className="field-placeholder">—</dd>
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
