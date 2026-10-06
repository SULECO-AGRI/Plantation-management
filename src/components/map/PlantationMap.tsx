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
import { EmployeeDayDetailModal } from '../workforce/EmployeeDayDetailModal'
import type { Worker } from '../../types/workforce'
import { MapTopBar } from './MapTopBar'
import { MapDrawToolbar } from './draw/MapDrawToolbar'
import { useWorkforce } from '../../context/WorkforceContext'
import { useHarvest } from '../../context/HarvestContext'

export type LocateTarget = {
  type: 'worker'
  id: string
  lat: number
  lng: number
  title?: string
  worker?: Worker
}

type PlantationMapProps = {
  locateTarget?: LocateTarget | null
  onClearLocateTarget?: () => void
  isActive?: boolean
}

type LoadedVectorLayer = {
  config: EstateLayerConfig
  data: EstateFeatureCollection
  layer: L.GeoJSON
}

function getDivisionColorByName(nameOrId?: GisScalar | undefined): string {
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

export function PlantationMap({ locateTarget, onClearLocateTarget, isActive = true }: PlantationMapProps = {}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  // Workforce & Harvest Contexts
  const { workers, isGpsLayerVisible, setIsGpsLayerVisible, setSelectedWorker } = useWorkforce()
  const { setIsLogModalOpen } = useHarvest()

  const [selectedDayWorker, setSelectedDayWorker] = useState<Worker | null>(null)
  const [activeLocatedWorker, setActiveLocatedWorker] = useState<Worker | null>(null)

  const workforceMarkersGroupRef = useRef<L.LayerGroup | null>(null)
  const pinpointMarkerGroupRef = useRef<L.LayerGroup | null>(null)

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

    let isMounted = true

    // Safeguard: Clean up any lingering Leaflet instance or ID on this DOM node
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id
    }
    if (mapRef.current) {
      try {
        mapRef.current.remove()
      } catch (err) {
        console.warn('Error removing previous map instance:', err)
      }
      mapRef.current = null
    }

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

    // Dedicated Pinpoint Marker Pane (high priority, above normal telemetry)
    map.createPane('pinpoint_marker')
    map.getPane('pinpoint_marker')!.style.zIndex = '560'

    map.setView([7.0545, 80.7115], 14.8)
    mapRef.current = map

    // 0. User Drawing Feature Group
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnItemsRef.current = drawnItems
    setDrawnItemsGroup(drawnItems)

    // Markers Groups
    const workforceGroup = L.layerGroup().addTo(map)
    const pinpointGroup = L.layerGroup().addTo(map)
    workforceMarkersGroupRef.current = workforceGroup
    pinpointMarkerGroupRef.current = pinpointGroup

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

          if (!isMounted || mapRef.current !== map) return null

          if (vectorVisibilityRef.current[config.key]) {
            layer.addTo(map)
          }

          loadedVectorLayersRef.current[config.key] = { config, data, layer }
          return { config, data, layer }
        } catch (err) {
          if (controller.signal.aborted) return null
          console.warn(`Vector layer ${config.key} failed to load:`, err)
          return null
        }
      }),
    )
      .then((loadedResults) => {
        if (!isMounted || mapRef.current !== map) return

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

        // Ensure Leaflet calculates viewport dimensions after vector layers load
        requestAnimationFrame(() => {
          if (isMounted && mapRef.current) {
            mapRef.current.invalidateSize()
          }
        })
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Failed to load estate GIS layers.')
      })

    // Immediate layout size recalculation
    requestAnimationFrame(() => {
      if (isMounted && mapRef.current) {
        mapRef.current.invalidateSize()
      }
    })

    return () => {
      isMounted = false
      controller.abort()
      window.clearTimeout(imageryHealthTimer)
      map.off('click', handleMapClick)
      map.off('zoom', updateZoomLabels)
      map.off('zoomend', updateZoomLabels)
      try {
        map.remove()
      } catch (err) {
        console.warn('Error removing map instance:', err)
      }
      mapRef.current = null
      drawnItemsRef.current = null
      setDrawnItemsGroup(null)
      setMapInstance(null)
      baseMapTileLayersRef.current = {}
      visigeoGroupRef.current = null
      rasterTileLayersRef.current = {}
      loadedVectorLayersRef.current = {}
      activeSelectedPathRef.current = null
      if (container && (container as any)._leaflet_id) {
        delete (container as any)._leaflet_id
      }
    }
  }, [])

  // Handle Container Resize and Visibility (fixes 0x0 Leaflet container size bug)
  useEffect(() => {
    const container = hostRef.current
    if (!container) return

    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }

    window.addEventListener('resize', handleResize)

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(container)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])

  // Invalidate map size when tab becomes active or visible
  useEffect(() => {
    if (!isActive) return
    const map = mapRef.current
    if (!map) return

    map.invalidateSize()

    const rafId = requestAnimationFrame(() => {
      mapRef.current?.invalidateSize()
    })

    const t1 = setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 100)

    const t2 = setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 300)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isActive])

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

    // 4. Reset Telemetry Layers to default (off)
    setIsGpsLayerVisible(false)

    // 5. Reset View & Selection
    map.setView([7.0545, 80.7115], 14.8)
    handleCloseSelection()
    clearEmployeePinpoint()
  }

  const clearEmployeePinpoint = () => {
    pinpointMarkerGroupRef.current?.clearLayers()
    setActiveLocatedWorker(null)
    if (onClearLocateTarget) onClearLocateTarget()
  }

  const renderEmployeePinpoint = (w: Worker) => {
    const map = mapRef.current
    const group = pinpointMarkerGroupRef.current
    if (!map || !group) return

    group.clearLayers()
    setActiveLocatedWorker(w)

    let roleColor = '#059669' // Harvester emerald
    let roleLetter = 'H'
    if (w.role === 'kangany') {
      roleColor = '#7c3aed'
      roleLetter = 'K'
    } else if (w.role === 'sprayer') {
      roleColor = '#2563eb'
      roleLetter = 'S'
    } else if (w.role === 'sundry') {
      roleColor = '#475569'
      roleLetter = 'M'
    }

    const pinIcon = L.divIcon({
      className: 'simple-pinpoint-wrapper',
      html: `
        <div class="simple-pinpoint-marker">
          <svg viewBox="0 0 28 38" width="28" height="38" class="simple-pinpoint-svg">
            <path
              d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.268 21.732 0 14 0z"
              fill="${roleColor}"
              stroke="#ffffff"
              stroke-width="1.8"
            />
            <circle cx="14" cy="13" r="7.5" fill="#ffffff" />
            <text
              x="14"
              y="16.5"
              text-anchor="middle"
              fill="${roleColor}"
              font-size="10.5"
              font-weight="900"
              font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >${roleLetter}</text>
          </svg>
        </div>
      `,
      iconSize: [28, 38],
      iconAnchor: [14, 38],
      popupAnchor: [0, -38],
    })

    const marker = L.marker([w.lat, w.lng], {
      icon: pinIcon,
      pane: 'pinpoint_marker',
      zIndexOffset: 1000,
    })

    const popupHtml = `
      <div class="worker-popup-card worker-popup-card--pinpoint">
        <div class="worker-popup-header" style="border-left: 4px solid ${roleColor}">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="status-indicator-dot" style="background: ${w.attended ? '#10b981' : '#94a3b8'}"></span>
              <h4 class="worker-popup-name">${w.name}</h4>
            </div>
            <span class="worker-popup-id">${w.id} · ${w.roleLabel}</span>
          </div>
        </div>
        <div class="worker-popup-body">
          <div class="worker-popup-row">
            <span class="label">Division / Field:</span>
            <strong>${w.division} (${w.fieldBlock})</strong>
          </div>
          <div class="worker-popup-row">
            <span class="label">Current Task:</span>
            <span>${w.currentTask}</span>
          </div>
          <div class="worker-popup-row">
            <span class="label">Attendance:</span>
            <strong style="color: ${w.attended ? '#059669' : '#64748b'}">
              ${w.attended ? `Present Today (${w.checkInTime || '06:30 AM'})` : 'Absent'}
            </strong>
          </div>
          ${w.role === 'harvester' ? `
          <div class="worker-popup-row">
            <span class="label">Today's Harvest:</span>
            <strong style="color: #059669">${w.todayPluckedKg.toFixed(1)} kg</strong>
          </div>` : ''}
          ${w.attended && w.hoursWorkedToday !== undefined ? `
          <div class="worker-popup-row">
            <span class="label">Hours Worked:</span>
            <strong>${w.hoursWorkedToday.toFixed(1)} hrs</strong>
          </div>` : ''}
          <div class="worker-popup-row">
            <span class="label">Assigned Gang:</span>
            <span>${w.gangName || 'Field Gang'}</span>
          </div>
          <div class="worker-popup-row">
            <span class="label">Contact:</span>
            <a href="tel:${w.phone}" class="worker-popup-phone">${w.phone}</a>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 6px;">
            <button type="button" class="btn btn--xs btn--secondary" style="flex: 1; justify-content: center; cursor: pointer;" id="view-day-modal-${w.id}">
              Full Day Details
            </button>
            <button type="button" class="btn btn--xs btn--outline" style="justify-content: center; cursor: pointer;" id="dismiss-pinpoint-${w.id}">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    `

    marker.bindPopup(popupHtml, {
      className: 'estate-leaflet-popup',
      maxWidth: 290,
      autoPan: true,
      autoPanPaddingTopLeft: L.point(380, 85),
      autoPanPaddingBottomRight: L.point(30, 30),
    })

    marker.on('popupopen', () => {
      const detailBtn = document.getElementById(`view-day-modal-${w.id}`)
      if (detailBtn) {
        detailBtn.onclick = () => {
          setSelectedDayWorker(w)
          marker.closePopup()
        }
      }
      const dismissBtn = document.getElementById(`dismiss-pinpoint-${w.id}`)
      if (dismissBtn) {
        dismissBtn.onclick = () => {
          clearEmployeePinpoint()
        }
      }
    })

    group.addLayer(marker)

    // Center camera slightly north of marker so popup has full room below top bar
    map.flyTo([w.lat + 0.00065, w.lng], 17.5, { duration: 1.0 })

    window.setTimeout(() => {
      if (mapRef.current && marker) {
        marker.openPopup()
      }
    }, 550)
  }

  const focusEmployeePinpoint = () => {
    if (activeLocatedWorker) {
      renderEmployeePinpoint(activeLocatedWorker)
    }
  }

  const resetView = () => {
    const map = mapRef.current
    if (map) {
      map.setView([7.0545, 80.7115], 14.8)
    }
    handleCloseSelection()
    clearEmployeePinpoint()
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
              <span class="label">Attendance:</span>
              <strong style="color: ${w.attended ? '#059669' : '#64748b'}">${w.attended ? 'Present Today' : 'Absent'}</strong>
            </div>
            ${w.attended && w.hoursWorkedToday !== undefined ? `
            <div class="worker-popup-row">
              <span class="label">Hours Worked:</span>
              <strong>${w.hoursWorkedToday.toFixed(1)} hrs</strong>
            </div>` : ''}
            <div class="worker-popup-row">
              <span class="label">Last GPS Ping:</span>
              <small>${w.lastPingTime}</small>
            </div>
            <div class="worker-popup-row">
              <span class="label">Direct Contact:</span>
              <a href="tel:${w.phone}" class="worker-popup-phone">${w.phone}</a>
            </div>
            <div style="margin-top: 8px;">
              <button type="button" class="btn btn--xs btn--secondary" style="width: 100%; justify-content: center; cursor: pointer;" id="view-day-detail-${w.id}">
                View Day Details
              </button>
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

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-day-detail-${w.id}`)
        if (btn) {
          btn.onclick = () => {
            setSelectedDayWorker(w)
            marker.closePopup()
          }
        }
      })

      group.addLayer(marker)
    })
  }, [workers, isGpsLayerVisible, setSelectedWorker])

  // Effect: Smooth flyTo and render pinpoint when locating a target from external tabs
  useEffect(() => {
    if (locateTarget && mapRef.current) {
      mapRef.current.flyTo([locateTarget.lat, locateTarget.lng], 18, { duration: 1.2 })
      if (locateTarget.type === 'worker') {
        const targetWorker = locateTarget.worker || workers.find((w) => w.id === locateTarget.id)
        if (targetWorker) {
          renderEmployeePinpoint(targetWorker)
        }
      }
      if (onClearLocateTarget) onClearLocateTarget()
    }
  }, [locateTarget, workers, onClearLocateTarget])

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
        locatedWorker={activeLocatedWorker}
        onClearLocatedWorker={clearEmployeePinpoint}
        onFocusLocatedWorker={focusEmployeePinpoint}
      />

      <div className="map-top-left-rail">
        <LayerController
          rasterVisibility={rasterVisibility}
          onToggleRaster={handleToggleRaster}
          vectorVisibility={vectorVisibility}
          onToggleVector={handleToggleVector}
          onResetLayersToDefault={handleResetLayersToDefault}
          onSelectEmployee={setSelectedDayWorker}
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

      <EmployeeDayDetailModal
        worker={selectedDayWorker}
        isOpen={Boolean(selectedDayWorker)}
        onClose={() => setSelectedDayWorker(null)}
        onLocateOnMap={(w) => {
          setSelectedDayWorker(null)
          if (mapRef.current && w.lat && w.lng) {
            mapRef.current.flyTo([w.lat, w.lng], 18, { duration: 1.2 })
            renderEmployeePinpoint(w)
          }
        }}
      />

      {loadError && <div className="map-error">{loadError}</div>}
    </div>
  )
}
