import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Check, Globe, Map as MapIcon } from 'lucide-react'

type Props = {
  isSatelliteActive: boolean
  onToggleSatellite: () => void
  onSelectBaseMap?: (baseMap: 'osm' | 'satellite') => void
  isRgbActive: boolean
  onToggleRgb: () => void
}

export function BaseMapSwitcher({
  isSatelliteActive,
  onToggleSatellite,
  onSelectBaseMap,
  isRgbActive,
  onToggleRgb,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Prevent Leaflet map clicks/scrolls from bubbling to the map canvas underneath
  useEffect(() => {
    if (!containerRef.current) return
    L.DomEvent.disableClickPropagation(containerRef.current)
    L.DomEvent.disableScrollPropagation(containerRef.current)
  }, [])

  const handleSelectOsm = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onSelectBaseMap) {
      onSelectBaseMap('osm')
    } else if (isSatelliteActive) {
      onToggleSatellite()
    }
  }

  const handleSelectSatellite = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onSelectBaseMap) {
      onSelectBaseMap('satellite')
    } else if (!isSatelliteActive) {
      onToggleSatellite()
    }
  }

  const handleToggleRgbClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onToggleRgb()
  }

  return (
    <aside
      ref={containerRef}
      className="modern-basemap-card"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      aria-label="Map Base & Imagery Layers"
    >
      {/* Category: Base Map */}
      <div className="modern-basemap-section">
        <span className="modern-basemap-header">Base Map</span>

        {/* OpenStreetMap Option */}
        <button
          type="button"
          className={`modern-basemap-row ${!isSatelliteActive ? 'modern-basemap-row--active' : ''}`}
          onClick={handleSelectOsm}
          title="Switch to OpenStreetMap vector street map"
        >
          <div className="modern-basemap-left">
            <span className={`modern-radio-circle ${!isSatelliteActive ? 'modern-radio-circle--active' : ''}`}>
              {!isSatelliteActive && <span className="modern-radio-dot" />}
            </span>
            <span className="modern-basemap-title">OpenStreetMap</span>
          </div>
          <MapIcon size={14} className="modern-basemap-icon" />
        </button>

        {/* Google Satellite Option */}
        <button
          type="button"
          className={`modern-basemap-row ${isSatelliteActive ? 'modern-basemap-row--active' : ''}`}
          onClick={handleSelectSatellite}
          title="Switch to Google Satellite satellite imagery"
        >
          <div className="modern-basemap-left">
            <span className={`modern-radio-circle ${isSatelliteActive ? 'modern-radio-circle--active' : ''}`}>
              {isSatelliteActive && <span className="modern-radio-dot" />}
            </span>
            <span className="modern-basemap-title">Google Satellite</span>
          </div>
          <Globe size={14} className="modern-basemap-icon" />
        </button>
      </div>

      <div className="modern-basemap-divider" />

      {/* Category: Imagery Overlay */}
      <div className="modern-basemap-section">
        <span className="modern-basemap-header">Imagery</span>

        {/* RGB Orthophoto Option */}
        <button
          type="button"
          className={`modern-basemap-row ${isRgbActive ? 'modern-basemap-row--active' : ''}`}
          onClick={handleToggleRgbClick}
          title="Toggle high-resolution RGB aerial drone orthophoto"
        >
          <div className="modern-basemap-left">
            <span className={`modern-checkbox-square ${isRgbActive ? 'modern-checkbox-square--active' : ''}`}>
              {isRgbActive && <Check size={11} strokeWidth={3.2} />}
            </span>
            <span className="modern-basemap-title">RGB</span>
          </div>
          <span className="modern-basemap-badge">HD</span>
        </button>
      </div>
    </aside>
  )
}
