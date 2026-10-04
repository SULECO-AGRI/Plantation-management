import L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ALL_VECTOR_LAYERS,
  BASE_MAP_OPTIONS,
  ESTATE_LAYERS,
  GOOGLE_SATELLITE_TILE_URL,
  INITIAL_BASEMAP,
  INITIAL_RASTER_VISIBILITY,
  INITIAL_VECTOR_VISIBILITY,
  OSM_TILE_URL,
  TERRAIN_RASTER_LAYERS,
  VISIGEO_IMAGERY_LAYERS,
  CARTOGRAPHIC_COLORS,
} from '../../data/layers'
import {
  featureSubtitle,
  featureTitle,
  fetchGeoJson,
  getDivisionNameParts,
  getFeatureCenter,
  isPointInFeature,
  numeric,
  searchableText,
} from '../../utils/gisUtils'
import type {
  BaseMapId,
  EstateFeature,
  EstateFeatureCollection,
  EstateLayerConfig,
  GisScalar,
  ImageryBaseLayerId,
  LayerKey,
  RasterLayerId,
  SearchHit,
  SelectedEstateFeature,
} from '../../types/gis'
import { BaseMapSwitcher } from './BaseMapSwitcher'
import { LayerController } from './layers/LayerController'
import { FeatureDetailPanel } from './popups/FeatureDetailPanel'
import { MapTopBar } from './MapTopBar'
import { MapDrawToolbar } from './draw/MapDrawToolbar'
import { useWorkforce } from '../../context/WorkforceContext'
import { useIncident } from '../../context/IncidentContext'
import { useHarvest } from '../../context/HarvestContext'

export type LocateTarget = {
  type: 'worker' | 'incident'
  id: string
  lat: number
  lng: number
  title?: string
}

type PlantationMapProps = {
  locateTarget?: LocateTarget | null
  onClearLocateTarget?: () => void
}

type LoadedVectorLayer = {
  config: EstateLayerConfig
  data: EstateFeatureCollection
  layer: L.GeoJSON
}

export function getDivisionColorByName(nameOrId?: GisScalar | undefined): string {
  const str = String(nameOrId ?? '').toLowerCase()
  if (str.includes('weddamulla') || str === '2') return CARTOGRAPHIC_COLORS.divisions.weddamulla.hex
  if (str.includes('ramboda') || str === '3') return CARTOGRAPHIC_COLORS.divisions.ramboda.hex
  if (str.includes('camnethan') || str === '5') return CARTOGRAPHIC_COLORS.divisions.camnethan.hex
  if (str.includes('lilliesland') || str === '4') return CARTOGRAPHIC_COLORS.divisions.lilliesland.hex
  if (str.includes('wewandon') || str === '1') return CARTOGRAPHIC_COLORS.divisions.wewandon.hex
  return CARTOGRAPHIC_COLORS.divisions.weddamulla.hex
}

function getVectorFeatureStyle(
  feature: EstateFeature | null | undefined,
  config: EstateLayerConfig,
  isDivisionActive: boolean,
): L.PathOptions {
  if (config.kind === 'boundary') {
    return {
      color: CARTOGRAPHIC_COLORS.estateBoundary.hex,
      weight: 2.2,
      opacity: 0.92,
      fillColor: CARTOGRAPHIC_COLORS.estateBoundary.hex,
      fillOpacity: 0.02,
    }
  }

  if (config.kind === 'infrastructure') {
    if (config.key === 'roads') {
      const cat = feature?.properties?.category
      const isPrimary = cat === 1 || cat === 2 || cat === 3 || !cat
      return {
        color: CARTOGRAPHIC_COLORS.roadsPrimary.hex,
        weight: isPrimary ? 1.25 : 0.85,
        opacity: 0.88,
      }
    }
    if (config.key === 'streams') {
      return {
        color: CARTOGRAPHIC_COLORS.streams.hex,
        weight: 1.1,
        opacity: 0.88,
      }
    }
    if (config.key === 'buildings') {
      return {
        color: CARTOGRAPHIC_COLORS.buildings.hex,
        weight: 1.05,
        opacity: 0.95,
        fillColor: CARTOGRAPHIC_COLORS.buildings.hex,
        fillOpacity: 0.90,
      }
    }
  }

  if (config.kind === 'division') {
    return {
      color: CARTOGRAPHIC_COLORS.divisionBoundary.hex,
      weight: isDivisionActive ? 1.35 : 0.95,
      opacity: 0.72,
      fillColor: CARTOGRAPHIC_COLORS.divisionFill.hex,
      fillOpacity: isDivisionActive ? 0.34 : 0.10,
    }
  }

  // Field plots - very thin light black boundary outline
  const fieldColor = config.fillColor || config.color
  return {
    color: CARTOGRAPHIC_COLORS.fieldBoundary.hex,
    weight: 0.65,
    opacity: 0.78,
    fillColor: fieldColor,
    fillOpacity: 0.56,
  }
}

export function PlantationMap({ locateTarget, onClearLocateTarget }: PlantationMapProps = {}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  // Workforce & Incident Contexts
  const { workers, isGpsLayerVisible, setSelectedWorker } = useWorkforce()
  const { incidents, isIncidentLayerVisible, setSelectedIncident, setDropLocation, setIsReportModalOpen } = useIncident()
  const { setIsLogModalOpen } = useHarvest()

  const workforceMarkersGroupRef = useRef<L.LayerGroup | null>(null)
  const incidentMarkersGroupRef = useRef<L.LayerGroup | null>(null)

  // Base map layers
  const baseMapTileLayersRef = useRef<Partial<Record<BaseMapId, L.TileLayer>>>({})

  // Raster overlay tile layers
  const rasterTileLayersRef = useRef<Partial<Record<RasterLayerId, L.TileLayer>>>({})
  const visigeoGroupRef = useRef<L.LayerGroup | null>(null)

  // Vector GeoJSON layers
  const loadedVectorLayersRef = useRef<Partial<Record<LayerKey, LoadedVectorLayer>>>({})
  const estateBoundsRef = useRef<L.LatLngBounds | null>(null)
  const activeSelectedPathRef = useRef<L.Path | null>(null)

  // State
  const [activeBaseLayer, setActiveBaseLayer] = useState<ImageryBaseLayerId>('osm')
  const [baseMap, setBaseMap] = useState<BaseMapId>('osm')
  const baseMapRef = useRef(baseMap)
  baseMapRef.current = baseMap

  const [rasterVisibility, setRasterVisibility] = useState<Record<RasterLayerId, boolean>>(INITIAL_RASTER_VISIBILITY)
  const rasterVisibilityRef = useRef(rasterVisibility)
  rasterVisibilityRef.current = rasterVisibility

  const [vectorVisibility, setVectorVisibility] = useState<Record<LayerKey, boolean>>(INITIAL_VECTOR_VISIBILITY)
  const vectorVisibilityRef = useRef(vectorVisibility)
  vectorVisibilityRef.current = vectorVisibility

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null)
  const [drawnItemsGroup, setDrawnItemsGroup] = useState<L.FeatureGroup | null>(null)
  const [isDrawingActive, setIsDrawingActive] = useState(false)
  const isDrawingActiveRef = useRef(false)
  isDrawingActiveRef.current = isDrawingActive

  const [imageryStatus, setImageryStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selection, setSelection] = useState<SelectedEstateFeature | null>(null)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [allSearchableFeatures, setAllSearchableFeatures] = useState<Array<{ layerKey: LayerKey; feature: EstateFeature }>>([])

  // Search filter
  const searchHits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    return allSearchableFeatures
      .filter(({ feature }) => searchableText(feature).includes(q))
      .slice(0, 12)
      .map(({ layerKey, feature }, index) => {
        const config = ALL_VECTOR_LAYERS.find((item) => item.key === layerKey)
        const kind = config?.kind ?? 'field'
        const shortLabel = config?.shortLabel ?? 'Feature'
        return {
          id: `${layerKey}-${feature.id ?? feature.properties?.OBJECTID ?? index}`,
          layerKey,
          label: featureTitle(feature, kind),
          subtitle: `${shortLabel} · ${featureSubtitle(feature, kind)}`,
          feature,
        }
      })
  }, [allSearchableFeatures, query])

  // Clear active selection highlight
  const clearSelectionHighlight = () => {
    if (activeSelectedPathRef.current) {
      const prevPath = activeSelectedPathRef.current
      const config = ALL_VECTOR_LAYERS.find((c) => {
        const loaded = loadedVectorLayersRef.current[c.key]
        return loaded?.layer.hasLayer(prevPath)
      })
      if (config) {
        const feat =
          (prevPath as L.Path & { _estateFeature?: EstateFeature })._estateFeature ||
          (prevPath as L.Layer & { feature?: EstateFeature }).feature
        prevPath.setStyle(getVectorFeatureStyle(feat, config, vectorVisibilityRef.current.divisions))
      }
      activeSelectedPathRef.current = null
    }
  }

  const handleCloseSelection = () => {
    clearSelectionHighlight()
    setSelection(null)
  }

  // Find feature by geographic coordinate (Fields first, then Divisions)
  const findFeatureAtPoint = (
    latlng: { lat: number; lng: number },
    targetKind: 'field' | 'division' | 'any',
  ): { layerKey: LayerKey; config: EstateLayerConfig; feature: EstateFeature; pathLayer?: L.Path } | null => {
    // 1. Check agricultural field layers first (highest specificity)
    if (targetKind === 'field' || targetKind === 'any') {
      for (const config of ESTATE_LAYERS) {
        if (config.kind === 'field' && vectorVisibilityRef.current[config.key]) {
          const loaded = loadedVectorLayersRef.current[config.key]
          if (loaded && loaded.data?.features) {
            for (const feature of loaded.data.features) {
              if (isPointInFeature(latlng, feature)) {
                let matchedPath: L.Path | undefined
                loaded.layer.eachLayer((candidate) => {
                  const raw = (candidate as L.Layer & { feature?: EstateFeature }).feature
                  if (raw === feature && candidate instanceof L.Path) {
                    matchedPath = candidate
                  }
                })
                return { layerKey: config.key, config, feature, pathLayer: matchedPath }
              }
            }
          }
        }
      }
    }

    // 2. Check estate division layer (broader boundary)
    if (vectorVisibilityRef.current.divisions && (targetKind === 'division' || targetKind === 'any')) {
      const loaded = loadedVectorLayersRef.current.divisions
      if (loaded && loaded.data?.features) {
        for (const feature of loaded.data.features) {
          if (isPointInFeature(latlng, feature)) {
            let matchedPath: L.Path | undefined
            loaded.layer.eachLayer((candidate) => {
              const raw = (candidate as L.Layer & { feature?: EstateFeature }).feature
              if (raw === feature && candidate instanceof L.Path) {
                matchedPath = candidate
              }
            })
            return { layerKey: 'divisions', config: loaded.config, feature, pathLayer: matchedPath }
          }
        }
      }
    }

    return null
  }

  // Select and highlight a feature
  const selectFeature = (
    layerKey: LayerKey,
    feature: EstateFeature,
    leafletLayer?: L.Layer | null,
  ) => {
    const config = ALL_VECTOR_LAYERS.find((c) => c.key === layerKey)
    if (!config || !config.interactive) return

    clearSelectionHighlight()

    let chosenPath: L.Path | null = null
    if (leafletLayer instanceof L.Path) {
      chosenPath = leafletLayer
    } else {
      const loaded = loadedVectorLayersRef.current[layerKey]
      if (loaded) {
        loaded.layer.eachLayer((child) => {
          const raw = (child as L.Layer & { feature?: EstateFeature }).feature
          if (raw === feature && child instanceof L.Path) {
            chosenPath = child
          }
        })
      }
    }

    if (chosenPath) {
      activeSelectedPathRef.current = chosenPath
      const isField = config.kind === 'field'
      chosenPath.setStyle({
        color: CARTOGRAPHIC_COLORS.selectedField?.hex || '#6C004B',
        weight: 1.8,
        opacity: 1.0,
        fillColor: isField ? (config.fillColor || config.color || '#6C004B') : '#F7F5EE',
        fillOpacity: isField ? 0.62 : 0.40,
        dashArray: undefined,
      })
      chosenPath.bringToFront()
    }

    const center = chosenPath ? getFeatureCenter(chosenPath) : { lat: 7.05894, lng: 80.70995 }
    setSelection({
      layerKey,
      layerLabel: config.label,
      kind: config.kind,
      feature,
      center,
    })
  }

  // Initialize Leaflet Map
  useEffect(() => {
    const container = hostRef.current
    if (!container) return

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 10,
      maxZoom: 22,
      maxBounds: [
        [6.8, 80.4],
        [7.3, 81.0],
      ],
      maxBoundsViscosity: 0.8,
    })

    // Create custom ordered panes: Basemap -> Imagery -> Divisions (lowest) -> Fields -> Infrastructure -> Analysis Rasters (top)
    map.createPane('basemap')
    map.getPane('basemap')!.style.zIndex = '100'

    map.createPane('imagery_raster')
    map.getPane('imagery_raster')!.style.zIndex = '200'

    // Below layer: Divisions
    map.createPane('divisions')
    map.getPane('divisions')!.style.zIndex = '300'

    // Division watermark labels
    map.createPane('division_labels')
    map.getPane('division_labels')!.style.zIndex = '420'
    map.getPane('division_labels')!.style.pointerEvents = 'none'

    // Middle layer: Agricultural Fields
    map.createPane('fields')
    map.getPane('fields')!.style.zIndex = '320'

    // Direct On-Map Field Parcel Labels
    map.createPane('field_labels')
    map.getPane('field_labels')!.style.zIndex = '330'
    map.getPane('field_labels')!.style.pointerEvents = 'none'

    // Upper layers: Infrastructure & Hydrology
    map.createPane('hydrology_streams')
    map.getPane('hydrology_streams')!.style.zIndex = '350'

    map.createPane('road_network')
    map.getPane('road_network')!.style.zIndex = '370'

    map.createPane('buildings')
    map.getPane('buildings')!.style.zIndex = '390'

    map.createPane('boundary_lines')
    map.getPane('boundary_lines')!.style.zIndex = '410'

    // On top of all layers (all above vectors): Thematic Analysis Rasters (Canopy Height, Slope, Land Use)
    map.createPane('analysis_raster')
    map.getPane('analysis_raster')!.style.zIndex = '450'

    // Top layer: User Drawing Tools
    map.createPane('drawn_features')
    map.getPane('drawn_features')!.style.zIndex = '500'

    // Workforce GPS Markers Pane
    map.createPane('workforce_markers')
    map.getPane('workforce_markers')!.style.zIndex = '520'

    // Incident Hazard Markers Pane
    map.createPane('incident_markers')
    map.getPane('incident_markers')!.style.zIndex = '530'

    map.setView([7.0545, 80.7115], 14.8)
    mapRef.current = map

    // 0. User Drawing Feature Group
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnItemsRef.current = drawnItems
    setDrawnItemsGroup(drawnItems)

    // Markers Groups
    const workforceGroup = L.layerGroup().addTo(map)
    const incidentGroup = L.layerGroup().addTo(map)
    workforceMarkersGroupRef.current = workforceGroup
    incidentMarkersGroupRef.current = incidentGroup

    // Map right click to report incident at exact coordinate
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      setDropLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
      setIsReportModalOpen(true)
    })

    setMapInstance(map)

    // 1. Base Map Tile Layers
    const osmOption = BASE_MAP_OPTIONS.find((o) => o.id === 'osm')!
    const satOption = BASE_MAP_OPTIONS.find((o) => o.id === 'googleSatellite')!

    const osmTileLayer = L.tileLayer(OSM_TILE_URL, {
      pane: 'basemap',
      minZoom: 1,
      maxZoom: 22,
      maxNativeZoom: 19,
      keepBuffer: 5,
      attribution: osmOption.attribution,
    })

    const googleSatTileLayer = L.tileLayer(GOOGLE_SATELLITE_TILE_URL, {
      pane: 'basemap',
      minZoom: 1,
      maxZoom: 22,
      maxNativeZoom: 20,
      keepBuffer: 5,
      attribution: satOption.attribution,
    })

    baseMapTileLayersRef.current = {
      osm: osmTileLayer,
      googleSatellite: googleSatTileLayer,
    }

    if (baseMapRef.current === 'osm') osmTileLayer.addTo(map)
    else googleSatTileLayer.addTo(map)

    // 2. VisiGeo Multi-area Imagery Group
    let successfulVisiGeoTiles = 0
    const imageryLayers = VISIGEO_IMAGERY_LAYERS.map((source) => {
      const layer = L.tileLayer(source.url, {
        pane: 'imagery_raster',
        minZoom: 13,
        maxZoom: 22,
        maxNativeZoom: 22,
        keepBuffer: 4,
        opacity: 1.0,
        attribution: 'Weddamulle imagery · VisiGeo',
      })

      layer.on('tileload', () => {
        successfulVisiGeoTiles += 1
        setImageryStatus('ready')
      })

      return layer
    })

    const visigeoGroup = L.layerGroup(imageryLayers)
    visigeoGroupRef.current = visigeoGroup
    if (rasterVisibilityRef.current.visigeo) {
      visigeoGroup.addTo(map)
    }

    const imageryHealthTimer = window.setTimeout(() => {
      if (successfulVisiGeoTiles === 0) setImageryStatus('error')
    }, 5000)

    // 3. Terrain & Analysis Raster Layers (CHM, Slope, Landuse)
    TERRAIN_RASTER_LAYERS.forEach((rasterConfig) => {
      if (rasterConfig.type === 'visigeo-multi') return

      const tileLayer = L.tileLayer(rasterConfig.urlTemplate, {
        pane: 'analysis_raster',
        minZoom: rasterConfig.minZoom ?? 13,
        maxZoom: rasterConfig.maxZoom ?? 22,
        opacity: 1.0,
        attribution: `Weddamulle ${rasterConfig.label}`,
      })

      rasterTileLayersRef.current[rasterConfig.id] = tileLayer

      if (rasterVisibilityRef.current[rasterConfig.id]) {
        tileLayer.addTo(map)
      }
    })

    const updateZoomLabels = () => {
      const zoom = map.getZoom()

      // Field Labels: Visible at zoom >= 14.8, hidden when zoomed out (< 14.8)
      const fieldLabelsPane = map.getPane('field_labels')
      if (fieldLabelsPane) {
        if (zoom < 14.8) {
          fieldLabelsPane.style.display = 'none'
          fieldLabelsPane.style.opacity = '0'
        } else if (zoom < 15.5) {
          fieldLabelsPane.style.display = 'block'
          fieldLabelsPane.style.opacity = '0.75'
        } else {
          fieldLabelsPane.style.display = 'block'
          fieldLabelsPane.style.opacity = '1'
        }
      }

      // Division Watermark Names: Visible in estate view, hidden when zoomed far out (< 13.5)
      const divisionLabelsPane = map.getPane('division_labels')
      if (divisionLabelsPane) {
        if (zoom < 13.5) {
          divisionLabelsPane.style.display = 'none'
          divisionLabelsPane.style.opacity = '0'
        } else if (zoom < 14.2) {
          divisionLabelsPane.style.display = 'block'
          divisionLabelsPane.style.opacity = '0.7'
        } else {
          divisionLabelsPane.style.display = 'block'
          divisionLabelsPane.style.opacity = '1'
        }
      }
    }

    map.on('zoom', updateZoomLabels)
    map.on('zoomend', updateZoomLabels)
    updateZoomLabels()

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Central Map Click Dispatcher
    const handleMapClick = (event: L.LeafletMouseEvent) => {
      if (isDrawingActiveRef.current) return

      // 1. Query field parcels first (specific agricultural block)
      const fieldHit = findFeatureAtPoint(event.latlng, 'field')
      if (fieldHit) {
        selectFeature(fieldHit.layerKey, fieldHit.feature, fieldHit.pathLayer)
        return
      }

      // 2. Query division if field was not hit
      if (vectorVisibilityRef.current.divisions) {
        const divisionHit = findFeatureAtPoint(event.latlng, 'division')
        if (divisionHit) {
          selectFeature(divisionHit.layerKey, divisionHit.feature, divisionHit.pathLayer)
          return
        }
      }

      handleCloseSelection()
    }
    map.on('click', handleMapClick)

    // 4. Load all Vector GeoJSON Layers
    const controller = new AbortController()

    Promise.all(
      ALL_VECTOR_LAYERS.map(async (config) => {
        try {
          const data = await fetchGeoJson(config.url, controller.signal)

          const targetPane = config.pane || (config.kind === 'division' ? 'divisions' : 'fields')

          const layer = L.geoJSON(data as never, {
            pane: targetPane,
            style: (feature) =>
              getVectorFeatureStyle(
                feature as unknown as EstateFeature,
                config,
                vectorVisibilityRef.current.divisions,
              ),
            onEachFeature: (rawFeature, leafletLayer) => {
              const feature = rawFeature as unknown as EstateFeature
              if (leafletLayer instanceof L.Path) {
                ;(leafletLayer as L.Path & { _estateFeature?: EstateFeature })._estateFeature = feature
              }

              if (config.kind === 'field') {
                const fieldNo = String(
                  feature.properties?.Field_No ||
                  feature.properties?.Field ||
                  feature.properties?.OBJECTID ||
                  ''
                ).trim()

                if (fieldNo) {
                  const areaProp = numeric(feature.properties?.Shape_Area)
                  let sizeClass = ''
                  if (areaProp !== undefined) {
                    if (areaProp < 500) sizeClass = 'field-map-label-xs'
                    else if (areaProp < 3500) sizeClass = 'field-map-label-sm'
                  } else if (leafletLayer instanceof L.Polygon) {
                    const b = leafletLayer.getBounds()
                    const latSpan = b.getNorth() - b.getSouth()
                    const lngSpan = b.getEast() - b.getWest()
                    const approxArea = latSpan * lngSpan * 111000 * 111000 * 0.99
                    if (approxArea < 500) sizeClass = 'field-map-label-xs'
                    else if (approxArea < 3500) sizeClass = 'field-map-label-sm'
                  }

                  leafletLayer.bindTooltip(fieldNo, {
                    permanent: true,
                    direction: 'center',
                    className: `field-map-label ${sizeClass}`.trim(),
                    interactive: false,
                    pane: 'field_labels',
                  })
                }
              } else if (config.kind === 'division') {
                const parts = getDivisionNameParts(feature)
                const html = `<div class="division-map-watermark"><span class="division-map-name">${parts.name}</span><span class="division-map-suffix">${parts.suffix}</span></div>`
                leafletLayer.bindTooltip(html, {
                  permanent: true,
                  direction: 'center',
                  className: 'division-watermark-tooltip',
                  interactive: false,
                  pane: 'division_labels',
                })
              } else if (config.interactive) {
                leafletLayer.bindTooltip(featureTitle(feature, config.kind), {
                  sticky: true,
                  direction: 'top',
                  className: 'estate-tooltip',
                })
              }

              if (config.interactive) {
                leafletLayer.on({
                  click: (event: L.LeafletMouseEvent) => {
                    if (isDrawingActiveRef.current) return
                    L.DomEvent.stopPropagation(event)

                    if (config.kind === 'division') {
                      const fieldHit = findFeatureAtPoint(event.latlng, 'field')
                      if (fieldHit) {
                        selectFeature(fieldHit.layerKey, fieldHit.feature, fieldHit.pathLayer)
                        return
                      }
                    }

                    selectFeature(config.key, feature, leafletLayer)
                  },
                  mouseover: () => {
                    if (isDrawingActiveRef.current) return
                    if (leafletLayer instanceof L.Path && leafletLayer !== activeSelectedPathRef.current) {
                      leafletLayer.setStyle({
                        weight: config.kind === 'division' ? 3.4 : 2.4,
                        fillOpacity: config.kind === 'division' ? 0.48 : 0.60,
                      })
                    }
                  },
                  mouseout: () => {
                    if (isDrawingActiveRef.current) return
                    if (leafletLayer instanceof L.Path && leafletLayer !== activeSelectedPathRef.current) {
                      leafletLayer.setStyle(
                        getVectorFeatureStyle(feature, config, vectorVisibilityRef.current.divisions),
                      )
                    }
                  },
                })
              }
            },
          })

          if (vectorVisibilityRef.current[config.key]) {
            layer.addTo(map)
          }

          loadedVectorLayersRef.current[config.key] = { config, data, layer }
          return { config, data, layer }
        } catch (err) {
          console.warn(`Vector layer ${config.key} failed to load:`, err)
          return null
        }
      }),
    )
      .then((loadedResults) => {
        const bounds = L.latLngBounds([])
        const searchableFeatures: Array<{ layerKey: LayerKey; feature: EstateFeature }> = []

        loadedResults.forEach((result) => {
          if (!result) return
          const { config, data, layer } = result

          if (layer && typeof layer.getBounds === 'function') {
            const layerBounds = layer.getBounds()
            if (layerBounds && layerBounds.isValid()) bounds.extend(layerBounds)
          }

          if (data && Array.isArray(data.features) && config.interactive) {
            data.features.forEach((feature) => {
              if (feature && feature.properties) {
                searchableFeatures.push({ layerKey: config.key, feature })
              }
            })
          }
        })

        if (bounds.isValid()) {
          estateBoundsRef.current = bounds
          map.setView([7.0545, 80.7115], 14.8)
        }
        setAllSearchableFeatures(searchableFeatures)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Failed to load estate GIS layers.')
      })

    return () => {
      controller.abort()
      window.clearTimeout(imageryHealthTimer)
      map.off('click', handleMapClick)
      map.off('zoom', updateZoomLabels)
      map.off('zoomend', updateZoomLabels)
      map.remove()
      mapRef.current = null
      drawnItemsRef.current = null
      setDrawnItemsGroup(null)
      setMapInstance(null)
      baseMapTileLayersRef.current = {}
      visigeoGroupRef.current = null
      rasterTileLayersRef.current = {}
      loadedVectorLayersRef.current = {}
      activeSelectedPathRef.current = null
    }
  }, [])

  // Toggle Google Satellite Base Map
  const handleToggleSatellite = () => {
    const map = mapRef.current
    if (!map) return

    const nextBaseMap: BaseMapId = baseMap === 'googleSatellite' ? 'osm' : 'googleSatellite'
    setBaseMap(nextBaseMap)

    const osmLayer = baseMapTileLayersRef.current.osm
    const satLayer = baseMapTileLayersRef.current.googleSatellite

    if (nextBaseMap === 'googleSatellite') {
      if (osmLayer && map.hasLayer(osmLayer)) map.removeLayer(osmLayer)
      if (satLayer && !map.hasLayer(satLayer)) map.addLayer(satLayer)
    } else {
      if (satLayer && map.hasLayer(satLayer)) map.removeLayer(satLayer)
      if (osmLayer && !map.hasLayer(osmLayer)) map.addLayer(osmLayer)
    }
  }

  // Dynamic Base Layer Selection (Bottom-Left Switcher)
  const handleSelectBaseLayer = (nextId: ImageryBaseLayerId) => {
    const map = mapRef.current
    if (!map) return

    setActiveBaseLayer(nextId)

    const osmLayer = baseMapTileLayersRef.current.osm
    const satLayer = baseMapTileLayersRef.current.googleSatellite
    const visigeoGroup = visigeoGroupRef.current

    if (nextId === 'osm') {
      if (satLayer && map.hasLayer(satLayer)) map.removeLayer(satLayer)
      if (osmLayer && !map.hasLayer(osmLayer)) map.addLayer(osmLayer)
      if (visigeoGroup && map.hasLayer(visigeoGroup)) map.removeLayer(visigeoGroup)
      setBaseMap('osm')
      setRasterVisibility((prev) => ({ ...prev, visigeo: false }))
    } else if (nextId === 'osmOrtho') {
      if (satLayer && map.hasLayer(satLayer)) map.removeLayer(satLayer)
      if (osmLayer && !map.hasLayer(osmLayer)) map.addLayer(osmLayer)
      if (visigeoGroup && !map.hasLayer(visigeoGroup)) map.addLayer(visigeoGroup)
      setBaseMap('osm')
      setRasterVisibility((prev) => ({ ...prev, visigeo: true }))
    } else if (nextId === 'googleSatellite') {
      if (osmLayer && map.hasLayer(osmLayer)) map.removeLayer(osmLayer)
      if (satLayer && !map.hasLayer(satLayer)) map.addLayer(satLayer)
      if (visigeoGroup && map.hasLayer(visigeoGroup)) map.removeLayer(visigeoGroup)
      setBaseMap('googleSatellite')
      setRasterVisibility((prev) => ({ ...prev, visigeo: false }))
    } else if (nextId === 'satelliteOrtho') {
      if (osmLayer && map.hasLayer(osmLayer)) map.removeLayer(osmLayer)
      if (satLayer && !map.hasLayer(satLayer)) map.addLayer(satLayer)
      if (visigeoGroup && !map.hasLayer(visigeoGroup)) map.addLayer(visigeoGroup)
      setBaseMap('googleSatellite')
      setRasterVisibility((prev) => ({ ...prev, visigeo: true }))
    }
  }

  // Toggle Thematic Raster Analysis Layers (Exclusive per analysis layer)
  const handleToggleRaster = (id: RasterLayerId) => {
    const map = mapRef.current
    if (!map) return

    const nextState = !rasterVisibility[id]

    if (id === 'visigeo') {
      const visigeoGroup = visigeoGroupRef.current
      if (visigeoGroup) {
        if (nextState) visigeoGroup.addTo(map)
        else visigeoGroup.removeFrom(map)
      }
      setRasterVisibility((prev) => ({ ...prev, visigeo: nextState }))
      return
    }

    // Analysis rasters: chm, slope, landuse
    if (nextState) {
      // Turn off any other active analysis layers so they display separately without overlapping
      const analysisIds: RasterLayerId[] = ['chm', 'slope', 'landuse']
      analysisIds.forEach((otherId) => {
        if (otherId !== id) {
          const otherLayer = rasterTileLayersRef.current[otherId]
          if (otherLayer && map.hasLayer(otherLayer)) {
            map.removeLayer(otherLayer)
          }
        }
      })

      const tileLayer = rasterTileLayersRef.current[id]
      if (tileLayer) {
        tileLayer.setOpacity(1.0)
        if (!map.hasLayer(tileLayer)) {
          tileLayer.addTo(map)
        }
      }

      setRasterVisibility((prev) => ({
        ...prev,
        chm: id === 'chm',
        slope: id === 'slope',
        landuse: id === 'landuse',
      }))
    } else {
      const tileLayer = rasterTileLayersRef.current[id]
      if (tileLayer && map.hasLayer(tileLayer)) {
        map.removeLayer(tileLayer)
      }
      setRasterVisibility((prev) => ({ ...prev, [id]: false }))
    }
  }

  // Toggle Vector Layers
  const handleToggleVector = (key: LayerKey) => {
    const map = mapRef.current
    const loaded = loadedVectorLayersRef.current[key]

    setVectorVisibility((current) => {
      const next = !current[key]
      if (map && loaded?.layer) {
        if (next) {
          if (!map.hasLayer(loaded.layer)) {
            loaded.layer.addTo(map)
          }
        } else {
          if (map.hasLayer(loaded.layer)) {
            loaded.layer.removeFrom(map)
          }
          if (selection?.layerKey === key) {
            handleCloseSelection()
          }
        }
      }
      return { ...current, [key]: next }
    })
  }

  // Update styles dynamically when Division visibility changes
  useEffect(() => {
    ALL_VECTOR_LAYERS.forEach((config) => {
      const loaded = loadedVectorLayersRef.current[config.key]
      if (!loaded) return

      loaded.layer.eachLayer((child) => {
        if (child instanceof L.Path && child !== activeSelectedPathRef.current) {
          const feat =
            (child as L.Path & { _estateFeature?: EstateFeature })._estateFeature ||
            (child as L.Layer & { feature?: EstateFeature }).feature
          child.setStyle(getVectorFeatureStyle(feat, config, vectorVisibility.divisions))
        }
      })
    })
  }, [vectorVisibility.divisions])

  // Reset layers to baseline configuration
  const handleResetLayersToDefault = () => {
    const map = mapRef.current
    if (!map) return

    // 1. Reset Base Layer to Street Map (OSM)
    handleSelectBaseLayer('osm')

    // 2. Reset Thematic Rasters (CHM, Slope, Landuse to false)
    Object.entries(INITIAL_RASTER_VISIBILITY).forEach(([rawId, defaultVal]) => {
      const id = rawId as RasterLayerId
      if (id !== 'visigeo') {
        const layer = rasterTileLayersRef.current[id]
        if (defaultVal) layer?.addTo(map)
        else layer?.removeFrom(map)
      }
    })
    setRasterVisibility(INITIAL_RASTER_VISIBILITY)

    // 3. Reset Vector Layers (all default)
    Object.entries(INITIAL_VECTOR_VISIBILITY).forEach(([rawKey, defaultVal]) => {
      const key = rawKey as LayerKey
      const loaded = loadedVectorLayersRef.current[key]
      if (loaded) {
        if (defaultVal && !map.hasLayer(loaded.layer)) loaded.layer.addTo(map)
        else if (!defaultVal && map.hasLayer(loaded.layer)) loaded.layer.removeFrom(map)
      }
    })
    setVectorVisibility(INITIAL_VECTOR_VISIBILITY)

    // 4. Reset View & Selection
    map.setView([7.0545, 80.7115], 14.8)
    handleCloseSelection()
  }

  const resetView = () => {
    const map = mapRef.current
    if (map) {
      map.setView([7.0545, 80.7115], 14.8)
    }
    handleCloseSelection()
  }

  // Search hit focus
  const focusSearchHit = (hit: SearchHit) => {
    const map = mapRef.current
    const loaded = loadedVectorLayersRef.current[hit.layerKey]
    const config = ALL_VECTOR_LAYERS.find((layer) => layer.key === hit.layerKey)
    if (!map || !loaded || !config) return

    if (!vectorVisibility[hit.layerKey]) {
      loaded.layer.addTo(map)
      setVectorVisibility((current) => ({ ...current, [hit.layerKey]: true }))
    }

    clearSelectionHighlight()

    loaded.layer.eachLayer((candidate) => {
      const raw = (candidate as L.Layer & { feature?: EstateFeature }).feature
      if (raw !== hit.feature) return

      if (candidate instanceof L.Path) {
        const isField = config.kind === 'field'
        candidate.setStyle({
          color: CARTOGRAPHIC_COLORS.selectedField?.hex || '#6C004B',
          weight: 1.8,
          opacity: 1.0,
          fillColor: isField ? (config.fillColor || config.color || '#6C004B') : '#F7F5EE',
          fillOpacity: isField ? 0.62 : 0.40,
          dashArray: undefined,
        })
        activeSelectedPathRef.current = candidate
        candidate.bringToFront()
      }

      const center = getFeatureCenter(candidate)
      setSelection({
        layerKey: hit.layerKey,
        layerLabel: config.label,
        kind: config.kind,
        feature: hit.feature,
        center,
      })

      if (candidate instanceof L.Polygon || candidate instanceof L.Polyline) {
        map.fitBounds(candidate.getBounds(), {
          paddingTopLeft: [40, 110],
          paddingBottomRight: [420, 50],
          maxZoom: 19,
        })
      }
    })
    setQuery('')
  }

  // Effect: Render Workforce Markers on Leaflet Map
  useEffect(() => {
    const group = workforceMarkersGroupRef.current
    if (!group) return

    group.clearLayers()
    if (!isGpsLayerVisible) return

    workers.forEach((w) => {
      let roleColor = '#f59e0b'
      let roleLetter = 'H'
      if (w.role === 'kangany') {
        roleColor = '#7c3aed'
        roleLetter = 'K'
      } else if (w.role === 'sprayer') {
        roleColor = '#2563eb'
        roleLetter = 'S'
      } else if (w.role === 'sundry') {
        roleColor = '#64748b'
        roleLetter = 'M'
      }

      const icon = L.divIcon({
        className: 'custom-worker-pin-wrapper',
        html: `
          <div class="custom-worker-pin" style="--role-color: ${roleColor};">
            <span class="custom-worker-pin__pulse"></span>
            <span class="custom-worker-pin__core">${roleLetter}</span>
            <span class="custom-worker-pin__name">${w.name.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      })

      const marker = L.marker([w.lat, w.lng], {
        icon,
        pane: 'workforce_markers',
      })

      const popupHtml = `
        <div class="worker-popup-card">
          <div class="worker-popup-header" style="border-left: 4px solid ${roleColor}">
            <div>
              <h4 class="worker-popup-name">${w.name}</h4>
              <span class="worker-popup-id">${w.id} · ${w.roleLabel}</span>
            </div>
          </div>
          <div class="worker-popup-body">
            <div class="worker-popup-row">
              <span class="label">Division / Field:</span>
              <strong>${w.division} (${w.fieldBlock})</strong>
            </div>
            <div class="worker-popup-row">
              <span class="label">Assigned Task:</span>
              <span>${w.currentTask}</span>
            </div>
            ${w.role === 'harvester' ? `
            <div class="worker-popup-row">
              <span class="label">Today's Leaf:</span>
              <strong style="color: #059669">${w.todayPluckedKg.toFixed(1)} kg</strong>
            </div>` : ''}
            <div class="worker-popup-row">
              <span class="label">Last GPS Ping:</span>
              <small>${w.lastPingTime}</small>
            </div>
            <div class="worker-popup-row">
              <span class="label">Direct Contact:</span>
              <a href="tel:${w.phone}" class="worker-popup-phone">${w.phone}</a>
            </div>
          </div>
        </div>
      `

      marker.bindPopup(popupHtml, {
        className: 'estate-leaflet-popup',
        maxWidth: 280,
      })

      marker.on('click', () => {
        setSelectedWorker(w)
      })

      group.addLayer(marker)
    })
  }, [workers, isGpsLayerVisible, setSelectedWorker])

  // Effect: Render Incident Hazard Markers on Leaflet Map
  useEffect(() => {
    const group = incidentMarkersGroupRef.current
    if (!group) return

    group.clearLayers()
    if (!isIncidentLayerVisible) return

    incidents.forEach((inc) => {
      let sevColor = '#dc2626'
      if (inc.severity === 'moderate') sevColor = '#d97706'
      else if (inc.severity === 'advisory') sevColor = '#2563eb'

      const isResolved = inc.status === 'resolved'
      if (isResolved) sevColor = '#059669'

      const icon = L.divIcon({
        className: 'custom-incident-pin-wrapper',
        html: `
          <div class="custom-incident-pin ${isResolved ? 'custom-incident-pin--resolved' : ''}" style="--sev-color: ${sevColor};">
            ${!isResolved ? '<span class="custom-incident-pin__pulse"></span>' : ''}
            <span class="custom-incident-pin__icon">⚠️</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      })

      const marker = L.marker([inc.lat, inc.lng], {
        icon,
        pane: 'incident_markers',
      })

      const popupHtml = `
        <div class="incident-popup-card">
          <div class="incident-popup-header" style="border-left: 4px solid ${sevColor}">
            <div>
              <div class="incident-popup-badges">
                <span class="incident-popup-sev" style="background: ${sevColor}22; color: ${sevColor}">${inc.severity.toUpperCase()}</span>
                <span class="incident-popup-code">${inc.incidentNumber}</span>
              </div>
              <h4 class="incident-popup-title">${inc.title}</h4>
            </div>
          </div>
          <div class="incident-popup-body">
            <div class="incident-popup-cat">${inc.typeLabel} · ${inc.division} ${inc.fieldBlock ? `(${inc.fieldBlock})` : ''}</div>
            <p class="incident-popup-desc">${inc.description}</p>
            <div class="incident-popup-status">
              <span>Status:</span> <strong>${inc.status.toUpperCase()}</strong>
            </div>
            <div class="incident-popup-meta">
              <small>Reported by ${inc.reportedBy} at ${inc.reportedAt}</small>
            </div>
          </div>
        </div>
      `

      marker.bindPopup(popupHtml, {
        className: 'estate-leaflet-popup',
        maxWidth: 300,
      })

      marker.on('click', () => {
        setSelectedIncident(inc)
      })

      group.addLayer(marker)
    })
  }, [incidents, isIncidentLayerVisible, setSelectedIncident])

  // Effect: Smooth flyTo when locating a target from external tabs
  useEffect(() => {
    if (locateTarget && mapRef.current) {
      mapRef.current.flyTo([locateTarget.lat, locateTarget.lng], 18, { duration: 1.2 })
      if (onClearLocateTarget) onClearLocateTarget()
    }
  }, [locateTarget, onClearLocateTarget])

  return (
    <div className="plantation-map-shell">
      <div ref={hostRef} className="plantation-map" />

      <MapTopBar
        query={query}
        onQueryChange={setQuery}
        onClearQuery={() => setQuery('')}
        searchHits={searchHits}
        onSelectHit={focusSearchHit}
        onResetView={resetView}
      />

      <div className="map-top-left-rail">
        <LayerController
          rasterVisibility={rasterVisibility}
          onToggleRaster={handleToggleRaster}
          vectorVisibility={vectorVisibility}
          onToggleVector={handleToggleVector}
          onResetLayersToDefault={handleResetLayersToDefault}
        />
      </div>

      <MapDrawToolbar
        map={mapInstance}
        drawnItems={drawnItemsGroup}
        isDetailOpen={Boolean(selection)}
        onActiveToolChange={(tool) => setIsDrawingActive(Boolean(tool))}
      />

      <BaseMapSwitcher
        isSatelliteActive={baseMap === 'googleSatellite'}
        onToggleSatellite={handleToggleSatellite}
        isRgbActive={Boolean(rasterVisibility.visigeo)}
        onToggleRgb={() => handleToggleRaster('visigeo')}
      />

      <FeatureDetailPanel selection={selection} onClose={handleCloseSelection} />

      {loadError && <div className="map-error">{loadError}</div>}
    </div>
  )
}
