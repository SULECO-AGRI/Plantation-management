import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Layers, MapPin, Mountain, Palette, Shield } from 'lucide-react'
import { CARTOGRAPHIC_COLORS } from '../../../data/layers'
import type { LayerKey, RasterLayerId } from '../../../types/gis'

type Props = {
  rasterVisibility: Record<RasterLayerId, boolean>
  vectorVisibility: Record<LayerKey, boolean>
}

export function MapCartographicLegend({ rasterVisibility, vectorVisibility }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active')

  // Check which rasters/vectors are currently on
  const isChmActive = rasterVisibility.chm
  const isSlopeActive = rasterVisibility.slope
  const isLanduseActive = rasterVisibility.landuse
  const isDivisionsActive = vectorVisibility.divisions
  const isBuildingsActive = vectorVisibility.buildings
  const isRoadsActive = vectorVisibility.roads
  const isStreamsActive = vectorVisibility.streams
  const isBoundaryActive = vectorVisibility.boundary

  if (!isOpen) {
    return (
      <button
        type="button"
        className="carto-legend-pill"
        onClick={() => setIsOpen(true)}
        aria-label="Open Cartographic Map Legend"
        title="Open Survey Map Legend & Symbology"
      >
        <span className="carto-legend-pill__icon">
          <Palette size={15} />
        </span>
        <span className="carto-legend-pill__label">
          <strong>Cartographic Legend</strong>
          <small>Survey Symbology</small>
        </span>
        <ChevronUp size={14} className="carto-legend-pill__chevron" />
      </button>
    )
  }

  return (
    <div className="carto-legend-panel" role="region" aria-label="Cartographic Map Legend">
      {/* Header */}
      <div className="carto-legend-header">
        <div className="carto-legend-header__title">
          <Palette size={15} />
          <div>
            <h3>Cartographic Legend</h3>
            <span className="carto-legend-subtitle">Official UAV &amp; Survey Symbology</span>
          </div>
        </div>
        <div className="carto-legend-header__actions">
          <div className="carto-legend-tabs">
            <button
              type="button"
              className={`carto-tab-btn ${activeTab === 'active' ? 'carto-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Layers
            </button>
            <button
              type="button"
              className={`carto-tab-btn ${activeTab === 'all' ? 'carto-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Full Key
            </button>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--light"
            onClick={() => setIsOpen(false)}
            aria-label="Collapse Legend"
            title="Collapse Legend"
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      <div className="carto-legend-body">
        {/* =========================================================================
            1. DIVISION THEMATIC FILLS (Master Key Map)
           ========================================================================= */}
        {(activeTab === 'all' || isDivisionsActive || vectorVisibility.weddamullaFields || vectorVisibility.rambodaFields || vectorVisibility.camnethanFields || vectorVisibility.lillieslandFields || vectorVisibility.wewandonFields) && (
          <section className="carto-legend-section">
            <div className="carto-section-title">
              <Layers size={13} />
              <span>Agricultural Fields (Thematic Fills)</span>
            </div>
            <div className="carto-swatch-grid carto-swatch-grid--divisions">
              {Object.entries(CARTOGRAPHIC_COLORS.divisions).map(([key, item]) => (
                <div key={key} className="carto-swatch-item">
                  <span
                    className="carto-swatch-box"
                    style={{ backgroundColor: item.hex, borderColor: '#1C1E1B' }}
                  />
                  <div className="carto-swatch-info">
                    <strong>{item.label}</strong>
                    <small>
                      <code>{item.hex}</code> &middot; {item.tone}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            2. LAND USE CATEGORIES (Land Cover Classification)
           ========================================================================= */}
        {(activeTab === 'all' || isLanduseActive) && (
          <section className="carto-legend-section">
            <div className="carto-section-title">
              <BookOpen size={13} />
              <span>Land Use &amp; Cover Classes</span>
            </div>
            <div className="carto-swatch-grid">
              {Object.entries(CARTOGRAPHIC_COLORS.landUse).map(([key, item]) => (
                <div key={key} className="carto-swatch-item">
                  <span
                    className="carto-swatch-box"
                    style={{ backgroundColor: item.hex }}
                  />
                  <div className="carto-swatch-info">
                    <strong>{item.label}</strong>
                    <small>
                      <code>{item.hex}</code> &middot; {item.rgb}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            3. CANOPY HEIGHT MODEL (CHM / Vegetation Strata)
           ========================================================================= */}
        {(activeTab === 'all' || isChmActive) && (
          <section className="carto-legend-section">
            <div className="carto-section-title">
              <Mountain size={13} />
              <span>Canopy Height Model (CHM Strata)</span>
            </div>
            <div className="carto-ramp-list">
              {CARTOGRAPHIC_COLORS.chm.map((item, idx) => (
                <div key={idx} className="carto-ramp-row">
                  <span
                    className="carto-ramp-swatch"
                    style={{ backgroundColor: item.hex }}
                  />
                  <div className="carto-ramp-desc">
                    <strong>{item.label}</strong>
                    <small>
                      <code>{item.hex}</code> &middot; {item.rgb}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            4. SLOPE GRADIENT ANALYSIS (Topographic Gradient)
           ========================================================================= */}
        {(activeTab === 'all' || isSlopeActive) && (
          <section className="carto-legend-section">
            <div className="carto-section-title">
              <Mountain size={13} />
              <span>Slope Classification (Topographic Gradient)</span>
            </div>
            <div className="carto-ramp-list">
              {CARTOGRAPHIC_COLORS.slope.map((item, idx) => (
                <div key={idx} className="carto-ramp-row">
                  <span
                    className="carto-ramp-swatch"
                    style={{ backgroundColor: item.hex }}
                  />
                  <div className="carto-ramp-desc">
                    <strong>{item.label}</strong>
                    <small>
                      <code>{item.hex}</code> &middot; {item.rgb}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            5. GENERAL FEATURES & INFRASTRUCTURE
           ========================================================================= */}
        {(activeTab === 'all' || isBoundaryActive || isBuildingsActive || isRoadsActive || isStreamsActive) && (
          <section className="carto-legend-section">
            <div className="carto-section-title">
              <Shield size={13} />
              <span>General Features &amp; Infrastructure</span>
            </div>
            <div className="carto-swatch-grid carto-swatch-grid--lines">
              {/* Outer Boundary */}
              <div className="carto-swatch-item">
                <span
                  className="carto-line-swatch"
                  style={{ backgroundColor: CARTOGRAPHIC_COLORS.estateBoundary.hex, height: '4px' }}
                />
                <div className="carto-swatch-info">
                  <strong>Estate Outer Boundary</strong>
                  <small>
                    <code>{CARTOGRAPHIC_COLORS.estateBoundary.hex}</code> &middot; Dark charcoal boundary
                  </small>
                </div>
              </div>

              {/* Buildings */}
              <div className="carto-swatch-item">
                <span
                  className="carto-swatch-box"
                  style={{ backgroundColor: CARTOGRAPHIC_COLORS.buildings.hex }}
                />
                <div className="carto-swatch-info">
                  <strong>Buildings / Built-up</strong>
                  <small>
                    <code>{CARTOGRAPHIC_COLORS.buildings.hex}</code> &middot; Deep maroon/plum
                  </small>
                </div>
              </div>

              {/* Estate Road Network */}
              <div className="carto-swatch-item">
                <span
                  className="carto-line-swatch"
                  style={{ backgroundColor: CARTOGRAPHIC_COLORS.roadsPrimary.hex, height: '3px' }}
                />
                <div className="carto-swatch-info">
                  <strong>Estate Road Network</strong>
                  <small>
                    <code>{CARTOGRAPHIC_COLORS.roadsPrimary.hex}</code> &middot; Warm terracotta
                  </small>
                </div>
              </div>

              {/* Streams */}
              <div className="carto-swatch-item">
                <span
                  className="carto-line-swatch"
                  style={{ backgroundColor: CARTOGRAPHIC_COLORS.streams.hex, height: '2.5px' }}
                />
                <div className="carto-swatch-info">
                  <strong>Streams &amp; Watercourses</strong>
                  <small>
                    <code>{CARTOGRAPHIC_COLORS.streams.hex}</code> &middot; Hydrographic blue
                  </small>
                </div>
              </div>

              {/* Contours */}
              <div className="carto-swatch-item">
                <span
                  className="carto-line-swatch"
                  style={{ backgroundColor: CARTOGRAPHIC_COLORS.contourIndex.hex, height: '2.5px' }}
                />
                <div className="carto-swatch-info">
                  <strong>Contour Lines (Index)</strong>
                  <small>
                    <code>{CARTOGRAPHIC_COLORS.contourIndex.hex}</code> &middot; Prominent brown
                  </small>
                </div>
              </div>

              <div className="carto-swatch-item">
                <span
                  className="carto-line-swatch"
                  style={{ backgroundColor: CARTOGRAPHIC_COLORS.contourMinor.hex, height: '1.5px' }}
                />
                <div className="carto-swatch-info">
                  <strong>Contour Lines (Minor)</strong>
                  <small>
                    <code>{CARTOGRAPHIC_COLORS.contourMinor.hex}</code> &middot; Tan/sand
                  </small>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
