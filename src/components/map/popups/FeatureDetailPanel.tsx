import { useEffect, useState } from 'react'
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
import { useWorkforce } from '../../../context/WorkforceContext'
import type { DivisionWorkforceSummary } from '../../../types/workforce'

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
  const { getDivisionSupervision } = useWorkforce()
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

  if (!selection || !selection.feature) return null

  const validFeature = selection.feature
  const validKind = selection.kind
  const validCenter = selection.center

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const isDivision = validKind === 'division'
  const area = getAreaSummary(validFeature.properties, validKind)
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
