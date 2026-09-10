import { useState } from 'react'
import {
  ChevronDown,
  Layers3,
  RotateCcw,
} from 'lucide-react'
import {
  BASE_MAP_OPTIONS,
  ESTATE_LAYERS,
  INFRASTRUCTURE_LAYERS,
  TERRAIN_RASTER_LAYERS,
} from '../../../data/layers'
import type {
  BaseMapId,
  LayerKey,
  RasterLayerId,
} from '../../../types/gis'

type Props = {
  baseMap: BaseMapId
  onSelectBaseMap: (id: BaseMapId) => void
  rasterVisibility: Record<RasterLayerId, boolean>
  onToggleRaster: (id: RasterLayerId) => void
  vectorVisibility: Record<LayerKey, boolean>
  onToggleVector: (key: LayerKey) => void
  imageryStatus: 'loading' | 'ready' | 'error'
  onResetLayersToDefault: () => void
}

export function LayerController({
  baseMap,
  onSelectBaseMap,
  rasterVisibility,
  onToggleRaster,
  vectorVisibility,
  onToggleVector,
  imageryStatus,
  onResetLayersToDefault,
}: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basemaps: true,
    terrain: true,
    infrastructure: true,
    estate: true,
  })

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }))
  }

  const activeTerrainCount = Object.values(rasterVisibility).filter(Boolean).length
  const activeInfraCount = INFRASTRUCTURE_LAYERS.filter((l) => vectorVisibility[l.key]).length
  const activeEstateCount = ESTATE_LAYERS.filter((l) => vectorVisibility[l.key]).length
  const totalActive = 1 + activeTerrainCount + activeInfraCount + activeEstateCount

  const divisionLayer = ESTATE_LAYERS.find((l) => l.key === 'divisions')
  const fieldLayers = ESTATE_LAYERS.filter((l) => l.kind === 'field')

  return (
    <section className="map-card layer-controller" aria-label="Map layers and controls">
      {/* Header */}
      <div className="map-card__header">
        <div>
          <span className="eyebrow">Map controls</span>
          <h2>
            <Layers3 size={16} />
            <span>Layers</span>
            <span className="layer-count-chip">{totalActive} active</span>
          </h2>
        </div>
        <button
          className="icon-btn"
          type="button"
          title="Reset layers to default configuration"
          onClick={onResetLayersToDefault}
          aria-label="Reset layers to default"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="layer-controller__scroll-body">
        {/* =========================================================================
            CATEGORY 1: Base Maps (Single Selection)
           ========================================================================= */}
        <div className="layer-category">
          <button
            type="button"
            className="layer-category__header"
            onClick={() => toggleSection('basemaps')}
            aria-expanded={openSections.basemaps}
          >
            <span className="category-title">Base Maps</span>
            <span className="category-meta">
              <span className="category-active-tag">{baseMap === 'osm' ? 'OSM' : 'Satellite'}</span>
              <ChevronDown
                size={14}
                className={`category-chevron ${openSections.basemaps ? 'category-chevron--open' : ''}`}
              />
            </span>
          </button>

          {openSections.basemaps && (
            <div className="layer-category__content">
              <div className="basemap-segmented-grid">
                {BASE_MAP_OPTIONS.map((option) => {
                  const isSelected = baseMap === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`basemap-option-card ${isSelected ? 'basemap-option-card--selected' : ''}`}
                      onClick={() => onSelectBaseMap(option.id)}
                    >
                      <div className="basemap-option-card__text">
                        <strong>{option.label}</strong>
                        <small>{option.id === 'osm' ? 'Standard Mapnik' : 'Satellite Imagery'}</small>
                      </div>
                      <div className={`basemap-radio-dot ${isSelected ? 'basemap-radio-dot--selected' : ''}`} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            CATEGORY 2: Drone & Analysis Imagery (Raster Overlays)
           ========================================================================= */}
        <div className="layer-category">
          <button
            type="button"
            className="layer-category__header"
            onClick={() => toggleSection('terrain')}
            aria-expanded={openSections.terrain}
          >
            <span className="category-title">Drone & Analysis Imagery</span>
            <span className="category-meta">
              {activeTerrainCount > 0 && (
                <span className="category-active-tag">{activeTerrainCount}</span>
              )}
              <ChevronDown
                size={14}
                className={`category-chevron ${openSections.terrain ? 'category-chevron--open' : ''}`}
              />
            </span>
          </button>

          {openSections.terrain && (
            <div className="layer-category__content">
              {TERRAIN_RASTER_LAYERS.map((layer) => {
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
            CATEGORY 3: Infrastructure & Hydrology (Vector Overlays)
           ========================================================================= */}
        <div className="layer-category">
          <button
            type="button"
            className="layer-category__header"
            onClick={() => toggleSection('infrastructure')}
            aria-expanded={openSections.infrastructure}
          >
            <span className="category-title">Infrastructure & Hydrology</span>
            <span className="category-meta">
              {activeInfraCount > 0 && (
                <span className="category-active-tag">{activeInfraCount}</span>
              )}
              <ChevronDown
                size={14}
                className={`category-chevron ${openSections.infrastructure ? 'category-chevron--open' : ''}`}
              />
            </span>
          </button>

          {openSections.infrastructure && (
            <div className="layer-category__content">
              {INFRASTRUCTURE_LAYERS.map((layer) => {
                const isVisible = vectorVisibility[layer.key]
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
                        background: layer.fillColor || `${layer.color}22`,
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
            CATEGORY 4: Estate & Agricultural Blocks (Inspectable Polygon Layers)
           ========================================================================= */}
        <div className="layer-category">
          <button
            type="button"
            className="layer-category__header"
            onClick={() => toggleSection('estate')}
            aria-expanded={openSections.estate}
          >
            <span className="category-title">Estate & Agricultural Blocks</span>
            <span className="category-meta">
              {activeEstateCount > 0 && (
                <span className="category-active-tag">{activeEstateCount}</span>
              )}
              <ChevronDown
                size={14}
                className={`category-chevron ${openSections.estate ? 'category-chevron--open' : ''}`}
              />
            </span>
          </button>

          {openSections.estate && (
            <div className="layer-category__content">
              {/* Divisions Layer */}
              {divisionLayer && (
                <button
                  key={divisionLayer.key}
                  type="button"
                  className={`layer-row ${vectorVisibility[divisionLayer.key] ? 'layer-row--active' : ''}`}
                  onClick={() => onToggleVector(divisionLayer.key)}
                  aria-label={`Toggle ${divisionLayer.label}`}
                >
                  <span
                    className="layer-swatch"
                    style={{ borderColor: divisionLayer.color, background: divisionLayer.fillColor }}
                  />
                  <span className="layer-copy">
                    <strong>{divisionLayer.shortLabel}</strong>
                  </span>
                  <span
                    className={`layer-toggle-switch ${vectorVisibility[divisionLayer.key] ? 'layer-toggle-switch--active' : ''}`}
                    aria-hidden="true"
                  >
                    <span className="layer-toggle-switch__thumb" />
                  </span>
                </button>
              )}

              {/* Fields Sub-group */}
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
                          style={{ borderColor: layer.color, background: layer.fillColor }}
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
      </div>
    </section>
  )
}
