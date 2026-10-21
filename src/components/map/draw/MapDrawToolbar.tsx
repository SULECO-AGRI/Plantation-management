import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import {
  Check,
  Circle,
  Download,
  Edit3,
  MapPin,
  Minus,
  Pentagon,
  Plus,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { useTranslation } from '../../../context/LanguageContext'

export type DrawToolType =
  | 'polyline'
  | 'polygon'
  | 'rectangle'
  | 'circle'
  | 'marker'
  | 'edit'
  | 'delete'
  | null

type Props = {
  map: L.Map | null
  drawnItems: L.FeatureGroup | null
  isDetailOpen?: boolean
  onActiveToolChange?: (tool: DrawToolType) => void
}

export function MapDrawToolbar({
  map,
  drawnItems,
  isDetailOpen,
  onActiveToolChange,
}: Props) {
  const { t } = useTranslation()
  const [activeTool, setActiveTool] = useState<DrawToolType>(null)
  const [featureCount, setFeatureCount] = useState<number>(0)
  const activeHandlerRef = useRef<any>(null)

  // Update feature count whenever drawn items change
  const updateFeatureCount = () => {
    if (drawnItems) {
      setFeatureCount(drawnItems.getLayers().length)
    }
  }

  // Calculate measurement information for a layer
  const formatLayerPopup = (layer: L.Layer, type: string) => {
    let content = `<div class="draw-popup-content">`
    content += `<div class="draw-popup-header"><strong>${type.toUpperCase()}</strong></div>`

    if (layer instanceof L.Polygon) {
      const latlngs = layer.getLatLngs()
      try {
        const coords = (latlngs[0] as L.LatLng[]) || []
        let areaM2 = 0
        if (coords.length > 2) {
          const earthRadius = 6378137
          for (let i = 0; i < coords.length; i++) {
            const p1 = coords[i]
            const p2 = coords[(i + 1) % coords.length]
            areaM2 +=
              ((p2.lng - p1.lng) *
                (Math.PI / 180) *
                (2 + Math.sin((p1.lat * Math.PI) / 180) + Math.sin((p2.lat * Math.PI) / 180))) /
              2
          }
          areaM2 = Math.abs((areaM2 * earthRadius * earthRadius) / 2)
        }
        const hectares = (areaM2 / 10000).toFixed(2)
        const acres = (areaM2 / 4046.86).toFixed(2)
        content += `<div class="draw-popup-row"><span>${t('draw.area')}</span> <strong>${hectares} ha (${acres} ac)</strong></div>`
        content += `<div class="draw-popup-row"><span>${t('draw.metric')}</span> <span>${Math.round(areaM2).toLocaleString()} m²</span></div>`
      } catch {
        // Fallback
      }
    } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
      const latlngs = layer.getLatLngs() as L.LatLng[]
      let lengthM = 0
      for (let i = 0; i < latlngs.length - 1; i++) {
        lengthM += latlngs[i].distanceTo(latlngs[i + 1])
      }
      const km = (lengthM / 1000).toFixed(2)
      content += `<div class="draw-popup-row"><span>${t('draw.length')}</span> <strong>${km} km</strong> (${Math.round(lengthM).toLocaleString()} m)</div>`
    } else if (layer instanceof L.Circle) {
      const radius = layer.getRadius()
      const areaM2 = Math.PI * radius * radius
      const hectares = (areaM2 / 10000).toFixed(2)
      content += `<div class="draw-popup-row"><span>${t('draw.radius')}</span> <strong>${Math.round(radius).toLocaleString()} m</strong></div>`
      content += `<div class="draw-popup-row"><span>${t('draw.area')}</span> <strong>${hectares} ha</strong> (${Math.round(areaM2).toLocaleString()} m²)</div>`
    } else if (layer instanceof L.Marker) {
      const pos = layer.getLatLng()
      content += `<div class="draw-popup-row"><span>${t('draw.lat')}</span> <strong>${pos.lat.toFixed(6)}</strong></div>`
      content += `<div class="draw-popup-row"><span>${t('draw.lng')}</span> <strong>${pos.lng.toFixed(6)}</strong></div>`
    }

    content += `</div>`
    return content
  }

  // Listen for Leaflet Draw events
  useEffect(() => {
    if (!map || !drawnItems) return

    const handleCreated = (event: any) => {
      const layer = event.layer
      const layerType = event.layerType || 'Feature'

      if (layer instanceof L.Path) {
        layer.setStyle({
          color: '#6C004B',
          weight: 2.2,
          opacity: 0.9,
          fillColor: '#6C004B',
          fillOpacity: 0.18,
        })
      }

      layer.bindPopup(formatLayerPopup(layer, layerType))
      drawnItems.addLayer(layer)
      updateFeatureCount()
      setActiveTool(null)
      onActiveToolChange?.(null)
      activeHandlerRef.current = null
    }

    const handleEdited = () => {
      drawnItems.eachLayer((layer) => {
        let type = 'Feature'
        if (layer instanceof L.Polygon) type = 'Polygon'
        else if (layer instanceof L.Polyline) type = 'Polyline'
        else if (layer instanceof L.Circle) type = 'Circle'
        else if (layer instanceof L.Marker) type = 'Marker'
        layer.bindPopup(formatLayerPopup(layer, type))
      })
      updateFeatureCount()
    }

    const handleDeleted = () => {
      updateFeatureCount()
    }

    map.on(L.Draw.Event.CREATED, handleCreated)
    map.on(L.Draw.Event.EDITED, handleEdited)
    map.on(L.Draw.Event.DELETED, handleDeleted)

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated)
      map.off(L.Draw.Event.EDITED, handleEdited)
      map.off(L.Draw.Event.DELETED, handleDeleted)
    }
  }, [map, drawnItems, t])

  // Disable current active tool
  const disableCurrentHandler = () => {
    if (activeHandlerRef.current) {
      try {
        activeHandlerRef.current.disable()
      } catch {
        // Ignore
      }
      activeHandlerRef.current = null
    }
    setActiveTool(null)
    onActiveToolChange?.(null)
  }

  // Trigger drawing tool
  const handleSelectTool = (tool: DrawToolType) => {
    if (!map || !drawnItems) return

    if (activeTool === tool) {
      disableCurrentHandler()
      return
    }

    disableCurrentHandler()

    const shapeOptions = {
      pane: 'drawn_features',
      color: '#6C004B',
      weight: 2.2,
      opacity: 0.92,
      fillColor: '#6C004B',
      fillOpacity: 0.18,
    }

    let handler: any = null

    switch (tool) {
      case 'polyline':
        handler = new (L.Draw as any).Polyline(map, {
          shapeOptions,
          metric: true,
        })
        break
      case 'polygon':
        handler = new (L.Draw as any).Polygon(map, {
          allowIntersection: true,
          showArea: true,
          metric: true,
          shapeOptions,
          guidelineDistance: 15,
        })
        break
      case 'rectangle':
        handler = new (L.Draw as any).Rectangle(map, {
          shapeOptions,
          metric: true,
        })
        break
      case 'circle':
        handler = new (L.Draw as any).Circle(map, {
          shapeOptions,
          metric: true,
        })
        break
      case 'marker':
        handler = new (L.Draw as any).Marker(map, {
          icon: L.divIcon({
            className: 'draw-pin-marker',
            html: `<div class="pin-dot"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        })
        break
      case 'edit':
        if (drawnItems.getLayers().length === 0) {
          alert('No drawn features to edit.')
          return
        }
        handler = new (L as any).EditToolbar.Edit(map, {
          featureGroup: drawnItems,
          selectedPathOptions: {
            color: '#B86B3E',
            fillColor: '#B86B3E',
            fillOpacity: 0.26,
            dashArray: '5, 5',
          },
        })
        break
      case 'delete':
        if (drawnItems.getLayers().length === 0) {
          alert('No drawn features to delete.')
          return
        }
        handler = new (L as any).EditToolbar.Delete(map, {
          featureGroup: drawnItems,
        })
        break
    }

    if (handler) {
      handler.enable()
      activeHandlerRef.current = handler
      setActiveTool(tool)
      onActiveToolChange?.(tool)
    }
  }

  // Export drawn items as GeoJSON file
  const handleExportGeoJson = () => {
    if (!drawnItems || drawnItems.getLayers().length === 0) {
      alert('No features drawn yet. Draw lines, polygons, or markers first.')
      return
    }

    const geojsonData = drawnItems.toGeoJSON()
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geojsonData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `weddamulle-drawn-features-${Date.now()}.geojson`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div
      className={`map-draw-toolbar ${isDetailOpen ? 'map-draw-toolbar--with-detail' : ''}`}
      aria-label="Map Drawing Tools"
    >
      {/* 1. Zoom Controls */}
      <div className="draw-tool-group">
        <button
          type="button"
          className="draw-tool-btn"
          title={t('draw.zoomIn')}
          aria-label={t('draw.zoomIn')}
          onClick={() => map?.zoomIn()}
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          className="draw-tool-btn"
          title={t('draw.zoomOut')}
          aria-label={t('draw.zoomOut')}
          onClick={() => map?.zoomOut()}
        >
          <Minus size={16} />
        </button>
      </div>

      {/* 2. Shape Drawing Tools */}
      <div className="draw-tool-group">
        <button
          type="button"
          className={`draw-tool-btn ${activeTool === 'polyline' ? 'draw-tool-btn--active' : ''}`}
          title={t('draw.polylineTooltip')}
          aria-label={t('draw.polylineTooltip')}
          onClick={() => handleSelectTool('polyline')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18 L18 6" />
            <rect x="3" y="15" width="6" height="6" rx="1" fill="currentColor" />
            <rect x="15" y="3" width="6" height="6" rx="1" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className={`draw-tool-btn ${activeTool === 'polygon' ? 'draw-tool-btn--active' : ''}`}
          title={t('draw.polygonTooltip')}
          aria-label={t('draw.polygonTooltip')}
          onClick={() => handleSelectTool('polygon')}
        >
          <Pentagon size={15} />
        </button>
        <button
          type="button"
          className={`draw-tool-btn ${activeTool === 'rectangle' ? 'draw-tool-btn--active' : ''}`}
          title={t('draw.rectTooltip')}
          aria-label={t('draw.rectTooltip')}
          onClick={() => handleSelectTool('rectangle')}
        >
          <Square size={14} />
        </button>
        <button
          type="button"
          className={`draw-tool-btn ${activeTool === 'circle' ? 'draw-tool-btn--active' : ''}`}
          title={t('draw.circleTooltip')}
          aria-label={t('draw.circleTooltip')}
          onClick={() => handleSelectTool('circle')}
        >
          <Circle size={14} />
        </button>
        <button
          type="button"
          className={`draw-tool-btn ${activeTool === 'marker' ? 'draw-tool-btn--active' : ''}`}
          title={t('draw.markerTooltip')}
          aria-label={t('draw.markerTooltip')}
          onClick={() => handleSelectTool('marker')}
        >
          <MapPin size={15} />
        </button>
      </div>

      {/* 3. Edit & Delete Tools */}
      <div className="draw-tool-group">
        <button
          type="button"
          className={`draw-tool-btn ${activeTool === 'edit' ? 'draw-tool-btn--active' : ''}`}
          title={t('draw.editTooltip')}
          aria-label={t('draw.editTooltip')}
          onClick={() => handleSelectTool('edit')}
        >
          <Edit3 size={15} />
        </button>
        <button
          type="button"
          className={`draw-tool-btn ${activeTool === 'delete' ? 'draw-tool-btn--active' : ''}`}
          title={t('draw.deleteTooltip')}
          aria-label={t('draw.deleteTooltip')}
          onClick={() => handleSelectTool('delete')}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* 4. Export GeoJSON */}
      <div className="draw-tool-group">
        <button
          type="button"
          className="draw-tool-btn"
          title={t('draw.exportFeatures', { count: featureCount })}
          aria-label={t('draw.exportFeatures', { count: featureCount })}
          onClick={handleExportGeoJson}
        >
          <Download size={15} />
          {featureCount > 0 && <span className="draw-tool-badge">{featureCount}</span>}
        </button>
      </div>

      {/* Active Drawing Tool Helper Bar */}
      {activeTool && (
        <div className="draw-active-indicator">
          <div className="draw-active-info">
            <span className="draw-active-title">
              {activeTool === 'polygon' && t('draw.drawPolygonPrompt')}
              {activeTool === 'rectangle' && t('draw.drawRectanglePrompt')}
              {activeTool === 'polyline' && t('draw.drawPolylinePrompt')}
              {activeTool === 'circle' && t('draw.drawCirclePrompt')}
              {activeTool === 'marker' && t('draw.drawMarkerPrompt')}
              {activeTool === 'edit' && t('draw.drawEditPrompt')}
              {activeTool === 'delete' && t('draw.drawDeletePrompt')}
            </span>
          </div>
          <div className="draw-active-actions">
            {(activeTool === 'polygon' || activeTool === 'polyline' || activeTool === 'edit' || activeTool === 'delete') && (
              <button
                type="button"
                className="draw-btn-finish"
                onClick={() => {
                  if (activeHandlerRef.current) {
                    if (typeof activeHandlerRef.current.completeShape === 'function') {
                      activeHandlerRef.current.completeShape()
                    } else if (typeof activeHandlerRef.current.save === 'function') {
                      activeHandlerRef.current.save()
                    }
                  }
                  disableCurrentHandler()
                }}
                title={t('draw.finish')}
              >
                <Check size={13} /> {t('draw.finish')}
              </button>
            )}
            <button
              type="button"
              className="draw-btn-cancel"
              onClick={disableCurrentHandler}
              title={t('draw.cancel')}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
