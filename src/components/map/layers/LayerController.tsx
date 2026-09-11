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

type Props = {
  rasterVisibility: Record<RasterLayerId, boolean>
  onToggleRaster: (id: RasterLayerId) => void
  vectorVisibility: Record<LayerKey, boolean>
  onToggleVector: (key: LayerKey) => void
  onResetLayersToDefault: () => void
}

export function LayerController({
  rasterVisibility,
  onToggleRaster,
  vectorVisibility,
  onToggleVector,
  onResetLayersToDefault,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    infrastructure: true,
    estate: true,
    terrain: false,
  })

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }))
  }

  const activeAnalysisCount = ANALYSIS_RASTER_LAYERS.filter((l) => rasterVisibility[l.id]).length
  const activeInfraCount = INFRASTRUCTURE_LAYERS.filter((l) => vectorVisibility[l.key]).length
  const activeEstateCount = ESTATE_LAYERS.filter((l) => vectorVisibility[l.key]).length
  const totalThematicActive = activeAnalysisCount + activeInfraCount + activeEstateCount

  const divisionLayer = ESTATE_LAYERS.find((l) => l.key === 'divisions')
  const fieldLayers = ESTATE_LAYERS.filter((l) => l.kind === 'field')

  // When collapsed, show compact floating pill
  if (isCollapsed) {
    return (
      <button
        type="button"
        className="layer-controller-pill"
        onClick={() => setIsCollapsed(false)}
        aria-label="Expand layers and overlays panel"
        title="Expand Layers & Overlays"
      >
        <span className="layer-controller-pill__icon">
          <Layers size={15} />
        </span>
        <span className="layer-controller-pill__text">
          <strong>Layers</strong>
          <span className="layer-count-chip">{totalThematicActive} active</span>
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
            <span>Layers</span>
            <span className="layer-count-chip">{totalThematicActive} active</span>
          </h2>
        </div>
        <div className="layer-controller-header__actions">
          <button
            className="icon-btn"
            type="button"
            title="Reset overlays to default"
            onClick={onResetLayersToDefault}
            aria-label="Reset overlays to default"
          >
            <RotateCcw size={13} />
          </button>
          <button
            className="icon-btn"
            type="button"
            title="Minimize panel"
            onClick={() => setIsCollapsed(true)}
            aria-label="Minimize layer panel"
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
            <span className="category-title">Infrastructure &amp; Hydrology</span>
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
              {INFRASTRUCTURE_LAYERS.map((layer) => {
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
                      <strong>{layer.shortLabel}</strong>
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
            <span className="category-title">Plantation Sectors &amp; Blocks</span>
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
                    <strong>{divisionLayer.shortLabel}</strong>
                    <small>Estate Divisions boundary &amp; areas</small>
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
                  <span>Agricultural Fields</span>
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
                          <strong>{layer.shortLabel}</strong>
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
            CATEGORY 3: Remote Sensing / Terrain Analysis (Rasters)
           ========================================================================= */}
        <div className="layer-category">
          <button
            type="button"
            className="layer-category__header"
            onClick={() => toggleSection('terrain')}
            aria-expanded={openSections.terrain}
          >
            <span className="category-title">Remote Sensing &amp; Terrain</span>
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

                return (
                  <button
                    key={layer.id}
                    type="button"
                    className={`layer-row ${isVisible ? 'layer-row--active' : ''}`}
                    onClick={() => onToggleRaster(layer.id)}
                    aria-label={`Toggle ${layer.label}`}
                  >
                    <span className="layer-copy">
                      <strong>{layer.shortLabel}</strong>
                      <small>{layer.description}</small>
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
      </div>
    </section>
  )
}
