import { useState } from 'react'
import {
  ChevronDown,
  Layers,
  Minus,
  RotateCcw,
} from 'lucide-react'
import {
  ANALYSIS_RASTER_LAYERS,
  CARTOGRAPHIC_COLORS,
  ESTATE_LAYERS,
  INFRASTRUCTURE_LAYERS,
} from '../../../data/layers'
import type {
  LayerKey,
  RasterLayerId,
} from '../../../types/gis'
import type { Worker } from '../../../types/workforce'
import { useWorkforce } from '../../../context/WorkforceContext'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from '../../../context/LanguageContext'
import { EmployeeDayDetailModal } from '../../workforce/EmployeeDayDetailModal'

type Props = {
  rasterVisibility: Record<RasterLayerId, boolean>
  onToggleRaster: (id: RasterLayerId) => void
  vectorVisibility: Record<LayerKey, boolean>
  onToggleVector: (key: LayerKey) => void
  onResetLayersToDefault: () => void
  onSelectEmployee?: (worker: Worker) => void
  onSelectPlot?: (plotId: string) => void
}

export function LayerController({
  rasterVisibility,
  onToggleRaster,
  vectorVisibility,
  onToggleVector,
  onResetLayersToDefault,
  onSelectEmployee,
  onSelectPlot,
}: Props) {
  const { t } = useTranslation()
  const { isGpsLayerVisible, setIsGpsLayerVisible, workers, setSelectedWorker } = useWorkforce()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isRosterOpen, setIsRosterOpen] = useState(false)
  const [fallbackModalWorker, setFallbackModalWorker] = useState<Worker | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    infrastructure: true,
    estate: true,
    telemetry: true,
    terrain: true,
  })

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }))
  }

  const attendedCount = workers.filter((w) => w.attended).length
  const absentCount = workers.length - attendedCount

  const handleEmployeeClick = (worker: Worker) => {
    setSelectedWorker(worker)
    if (onSelectEmployee) {
      onSelectEmployee(worker)
    } else {
      setFallbackModalWorker(worker)
    }
  }

  const { role } = useAuth()
  const activeRole = role || 'Officer'
  const showTerrain = true
  const showTelemetry = activeRole === 'Admin' || activeRole === 'Officer'

  const getRoleBadgeLabel = (r: string) => {
    switch (r.toLowerCase()) {
      case 'admin':
        return t('roles.admin')
      case 'manager':
        return t('roles.manager')
      case 'officer':
        return t('roles.officer')
      default:
        return r
    }
  }

  const getLayerLabel = (key: string, fallbackLabel: string) => {
    switch (key) {
      case 'roads':
        return t('layers.roads')
      case 'streams':
        return t('layers.streams')
      case 'buildings':
        return t('layers.buildings')
      case 'divisions':
        return t('layers.divisions')
      case 'fields_weddamulla':
        return t('layers.weddamulla')
      case 'fields_ramboda':
        return t('layers.ramboda')
      case 'fields_camnethan':
        return t('layers.camnethan')
      case 'fields_lilliesland':
        return t('layers.lilliesland')
      case 'fields_wewandon':
        return t('layers.wewandon')
      case 'chm':
        return t('layers.chm')
      case 'slope':
        return t('layers.slope')
      case 'landuse':
        return t('layers.landuse')
      case 'contours':
        return t('layers.contours')
      default:
        return fallbackLabel
    }
  }

  const allowedInfraLayers = INFRASTRUCTURE_LAYERS.filter((l) => {
    if (activeRole === 'Admin') return true
    if (activeRole === 'Manager') return l.key !== 'boundary'
    return l.key === 'roads' || l.key === 'streams'
  })

  const activeAnalysisCount = ANALYSIS_RASTER_LAYERS.filter((l) => rasterVisibility[l.id]).length
  const activeInfraCount = allowedInfraLayers.filter((l) => vectorVisibility[l.key]).length
  const activeEstateCount = ESTATE_LAYERS.filter((l) => vectorVisibility[l.key]).length
  const activeTelemetryCount = isGpsLayerVisible ? 1 : 0
  const totalThematicActive = activeAnalysisCount + activeInfraCount + activeEstateCount + activeTelemetryCount

  const divisionLayer = ESTATE_LAYERS.find((l) => l.key === 'divisions')
  const fieldLayers = ESTATE_LAYERS.filter((l) => l.kind === 'field')

  // When collapsed, show compact floating pill
  if (isCollapsed) {
    return (
      <button
        type="button"
        className="layer-controller-pill"
        onClick={() => setIsCollapsed(false)}
        aria-label={t('layers.expandAria')}
        title={t('layers.expandTitle')}
      >
        <span className="layer-controller-pill__icon">
          <Layers size={15} />
        </span>
        <span className="layer-controller-pill__text">
          <strong>{t('layers.title')}</strong>
          <span className="layer-count-chip">{t('layers.activeCount', { count: totalThematicActive })}</span>
        </span>
        <ChevronDown size={14} className="layer-controller-pill__chevron" />
      </button>
    )
  }

  return (
    <section className="map-card layer-controller-floating" aria-label="Map layers and overlays">
      {/* Header */}
      <div className="map-card__header">
        <div className="layer-controller-header__title">
          <h2>
            <Layers size={15} />
            <span>{t('layers.title')}</span>
            <span className="layer-count-chip">{t('layers.activeCount', { count: totalThematicActive })}</span>
            <span
              style={{
                fontSize: '10.5px',
                background: '#e5f4ec',
                color: '#1f6b52',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}
            >
              {getRoleBadgeLabel(activeRole)}
            </span>
          </h2>
        </div>
        <div className="layer-controller-header__actions">
          <button
            className="icon-btn"
            type="button"
            title={t('layers.resetTitle')}
            onClick={onResetLayersToDefault}
            aria-label={t('layers.resetTitle')}
          >
            <RotateCcw size={13} />
          </button>
          <button
            className="icon-btn"
            type="button"
            title={t('layers.minimizeTitle')}
            onClick={() => setIsCollapsed(true)}
            aria-label={t('layers.minimizeTitle')}
          >
            <Minus size={14} />
          </button>
        </div>
      </div>

      <div className="layer-controller__scroll-body">
        {/* =========================================================================
            CATEGORY 1: Infrastructure & Hydrology (Vectors)
           ========================================================================= */}
        <div className="layer-category">
          <button
            type="button"
            className="layer-category__header"
            onClick={() => toggleSection('infrastructure')}
            aria-expanded={openSections.infrastructure}
          >
            <span className="category-title">{t('layers.infraTitle')}</span>
            <span className="category-meta">
              {activeInfraCount > 0 && (
                <span className="category-active-tag">{activeInfraCount}</span>
              )}
              <ChevronDown
                size={13}
                className={`category-chevron ${openSections.infrastructure ? 'category-chevron--open' : ''}`}
              />
            </span>
          </button>

          {openSections.infrastructure && (
            <div className="layer-category__content">
              {allowedInfraLayers.map((layer) => {
                const isVisible = vectorVisibility[layer.key]
                const isOutlined = layer.key === 'roads' || layer.key === 'streams'
                return (
                  <button
                    key={layer.key}
                    type="button"
                    className={`layer-row ${isVisible ? 'layer-row--active' : ''}`}
                    onClick={() => onToggleVector(layer.key)}
                    aria-label={`Toggle ${layer.label}`}
                  >
                    <span
                      className="layer-swatch"
                      style={{
                        borderColor: layer.color,
                        background: isOutlined ? (layer.fillColor || '#FFFFFF') : (layer.fillColor || layer.color),
                        borderWidth: isOutlined ? '2px' : '1.5px',
                      }}
                    />
                    <span className="layer-copy">
                      <strong>{getLayerLabel(layer.key, layer.shortLabel)}</strong>
                    </span>
                    <span
                      className={`layer-toggle-switch ${isVisible ? 'layer-toggle-switch--active' : ''}`}
                      aria-hidden="true"
                    >
                      <span className="layer-toggle-switch__thumb" />
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
            CATEGORY 2: Plantation Sectors & Blocks (Divisions & Fields)
           ========================================================================= */}
        <div className="layer-category">
          <button
            type="button"
            className="layer-category__header"
            onClick={() => toggleSection('estate')}
            aria-expanded={openSections.estate}
          >
            <span className="category-title">{t('layers.sectorsTitle')}</span>
            <span className="category-meta">
              {activeEstateCount > 0 && (
                <span className="category-active-tag">{activeEstateCount}</span>
              )}
              <ChevronDown
                size={13}
                className={`category-chevron ${openSections.estate ? 'category-chevron--open' : ''}`}
              />
            </span>
          </button>

          {openSections.estate && (
            <div className="layer-category__content">
              {/* Divisions Master Layer */}
              {divisionLayer && (
                <button
                  key={divisionLayer.key}
                  type="button"
                  className={`layer-row ${vectorVisibility[divisionLayer.key] ? 'layer-row--active' : ''}`}
                  onClick={() => onToggleVector(divisionLayer.key)}
                  aria-label={`Toggle ${divisionLayer.label}`}
                >
                  <span className="layer-swatch layer-swatch--multi" title="Master 5 Division Themes">
                    <span style={{ background: CARTOGRAPHIC_COLORS.divisions.weddamulla.hex }} />
                    <span style={{ background: CARTOGRAPHIC_COLORS.divisions.ramboda.hex }} />
                    <span style={{ background: CARTOGRAPHIC_COLORS.divisions.camnethan.hex }} />
                    <span style={{ background: CARTOGRAPHIC_COLORS.divisions.lilliesland.hex }} />
                    <span style={{ background: CARTOGRAPHIC_COLORS.divisions.wewandon.hex }} />
                  </span>
                  <span className="layer-copy">
                    <strong>{t('layers.divisions')}</strong>
                    <small>{t('layers.divisionsSubtitle')}</small>
                  </span>
                  <span
                    className={`layer-toggle-switch ${vectorVisibility[divisionLayer.key] ? 'layer-toggle-switch--active' : ''}`}
                    aria-hidden="true"
                  >
                    <span className="layer-toggle-switch__thumb" />
                  </span>
                </button>
              )}

              {/* Agricultural Fields Sub-group */}
              <div className="fields-subgroup">
                <div className="fields-subgroup__header">
                  <span>{t('layers.agriculturalFields')}</span>
                </div>

                <div className="fields-subgroup__list">
                  {fieldLayers.map((layer) => {
                    const isVisible = vectorVisibility[layer.key]
                    return (
                      <button
                        key={layer.key}
                        type="button"
                        className={`layer-row layer-row--compact ${isVisible ? 'layer-row--active' : ''}`}
                        onClick={() => onToggleVector(layer.key)}
                        aria-label={`Toggle ${layer.shortLabel}`}
                      >
                        <span
                          className="layer-swatch layer-swatch--compact"
                          style={{ borderColor: layer.color, background: layer.fillColor || layer.color }}
                        />
                        <span className="layer-copy">
                          <strong>{getLayerLabel(layer.key, layer.shortLabel)}</strong>
                        </span>
                        <span
                          className={`layer-toggle-switch layer-toggle-switch--compact ${isVisible ? 'layer-toggle-switch--active' : ''}`}
                          aria-hidden="true"
                        >
                          <span className="layer-toggle-switch__thumb" />
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            CATEGORY: Operational Telemetry (Workforce GPS & Hazard Overlays)
           ========================================================================= */}
        {showTelemetry && (
          <div className="layer-category">
          <button
            type="button"
            className="layer-category__header"
            onClick={() => toggleSection('telemetry')}
            aria-expanded={openSections.telemetry}
          >
            <span className="category-title">{t('layers.telemetryTitle')}</span>
            <span className="category-meta">
              {activeTelemetryCount > 0 && (
                <span className="category-active-tag">{activeTelemetryCount}</span>
              )}
              <ChevronDown
                size={13}
                className={`category-chevron ${openSections.telemetry ? 'category-chevron--open' : ''}`}
              />
            </span>
          </button>

          {openSections.telemetry && (
            <div className="layer-category__content">
              {/* Employees Working Today (Attendance & Overlays) */}
              <div className={`layer-row ${isGpsLayerVisible ? 'layer-row--active' : ''}`}>
                <span className="layer-swatch layer-swatch--multi" title="Kangany (Purple), Harvester (Amber), Sprayer (Blue)">
                  <span style={{ background: '#7c3aed' }} />
                  <span style={{ background: '#f59e0b' }} />
                  <span style={{ background: '#2563eb' }} />
                </span>
                <span
                  className="layer-copy"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsRosterOpen((prev) => !prev)}
                  title="Click to view employees and attendance"
                >
                  <strong>{t('layers.employeesToday')}</strong>
                  <small>
                    {t('layers.presentCount', { attended: attendedCount, absent: absentCount })}
                  </small>
                </span>
                <button
                  type="button"
                  className={`layer-toggle-switch ${isGpsLayerVisible ? 'layer-toggle-switch--active' : ''}`}
                  onClick={() => setIsGpsLayerVisible(!isGpsLayerVisible)}
                  title="Toggle employee map markers on/off"
                  aria-label="Toggle employee markers on map"
                >
                  <span className="layer-toggle-switch__thumb" />
                </button>
              </div>

              {/* Roster quick-toggle bar */}
              <button
                type="button"
                className="employees-sub-toggle-btn"
                onClick={() => setIsRosterOpen((prev) => !prev)}
              >
                <span>{isRosterOpen ? t('layers.hideRoster') : t('layers.viewRoster')}</span>
                <span>{isRosterOpen ? '▲' : '▼'}</span>
              </button>

              {/* Expandable Employee Roster List */}
              {isRosterOpen && (
                <div className="employees-roster-list">
                  {workers.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      className="employee-roster-item"
                      onClick={() => handleEmployeeClick(w)}
                      title={`Click to view details for ${w.name}`}
                    >
                      <div className="employee-roster-item__left">
                        <span
                          className={`employee-roster-dot ${
                            w.attended ? 'employee-roster-dot--present' : 'employee-roster-dot--absent'
                          }`}
                        />
                        <span className="employee-roster-item__name">{w.name}</span>
                        <span className="employee-roster-item__role">
                          ({w.roleLabel.split(' ')[0]})
                        </span>
                      </div>
                      <div className="employee-roster-item__right">
                        {w.attended && w.role === 'harvester' && w.todayPluckedKg > 0 && (
                          <span className="employee-roster-item__kg">
                            {w.todayPluckedKg.toFixed(1)} kg
                          </span>
                        )}
                        <span
                          className={`employee-roster-item__tag ${
                            w.attended
                              ? 'employee-roster-item__tag--present'
                              : 'employee-roster-item__tag--absent'
                          }`}
                        >
                          {w.attended ? t('layers.present') : t('layers.absent')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

        {/* =========================================================================
            CATEGORY 3: Remote Sensing / Terrain Analysis (Rasters)
           ========================================================================= */}
        {showTerrain && (
          <div className="layer-category">
            <button
              type="button"
              className="layer-category__header"
              onClick={() => toggleSection('terrain')}
              aria-expanded={openSections.terrain}
            >
              <span className="category-title">{t('layers.terrainTitle')}</span>
              <span className="category-meta">
                {activeAnalysisCount > 0 && (
                  <span className="category-active-tag">{activeAnalysisCount}</span>
                )}
                <ChevronDown
                  size={13}
                  className={`category-chevron ${openSections.terrain ? 'category-chevron--open' : ''}`}
                />
              </span>
            </button>

            {openSections.terrain && (
              <div className="layer-category__content">
                {ANALYSIS_RASTER_LAYERS.map((layer) => {
                  const isVisible = rasterVisibility[layer.id]
                  const swatchColor =
                    layer.id === 'contours'
                      ? '#9B59B6'
                      : layer.id === 'chm'
                      ? '#8CD056'
                      : layer.id === 'slope'
                      ? '#FFD300'
                      : '#408018'

                  return (
                    <button
                      key={layer.id}
                      type="button"
                      className={`layer-row ${isVisible ? 'layer-row--active' : ''}`}
                      onClick={() => onToggleRaster(layer.id)}
                      aria-label={`Toggle ${layer.label}`}
                      title={`${layer.label} (${layer.description})`}
                    >
                      <span
                        className="layer-swatch"
                        style={{
                          borderColor: swatchColor,
                          background: layer.id === 'contours' ? '#F4ECF7' : swatchColor,
                          borderWidth: layer.id === 'contours' ? '2.5px' : '1.5px',
                        }}
                      />
                      <span className="layer-copy">
                        <strong>{getLayerLabel(layer.id, layer.shortLabel)}</strong>
                      </span>

                      <span
                        className={`layer-toggle-switch ${isVisible ? 'layer-toggle-switch--active' : ''}`}
                        aria-hidden="true"
                      >
                        <span className="layer-toggle-switch__thumb" />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {fallbackModalWorker && (
        <EmployeeDayDetailModal
          worker={fallbackModalWorker}
          isOpen={Boolean(fallbackModalWorker)}
          onClose={() => setFallbackModalWorker(null)}
        />
      )}
    </section>
  )
}
