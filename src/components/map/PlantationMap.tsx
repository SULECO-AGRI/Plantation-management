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
  getFeatureCenter,
  isPointInFeature,
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
import { MapCartographicLegend } from './legend/MapCartographicLegend'

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
      weight: 3.0,
      opacity: 0.98,
      fillColor: CARTOGRAPHIC_COLORS.estateBoundary.hex,
      fillOpacity: 0.04,
    }
  }

  if (config.kind === 'infrastructure') {
    if (config.key === 'roads') {
      const cat = feature?.properties?.category
      const isPrimary = cat === 1 || cat === 2 || cat === 3 || !cat
      return {
        color: isPrimary ? CARTOGRAPHIC_COLORS.roadsPrimary.hex : CARTOGRAPHIC_COLORS.roadsLocal.hex,
        weight: isPrimary ? 2.6 : 1.8,
        opacity: 0.95,
        dashArray: cat === 5 ? '4, 4' : undefined,
      }
    }
    if (config.key === 'streams') {
      return {
        color: CARTOGRAPHIC_COLORS.streams.hex,
        weight: 2.2,
        opacity: 0.92,
      }
    }
    if (config.key === 'buildings') {
      return {
        color: CARTOGRAPHIC_COLORS.buildings.hex,
        weight: 1.4,
        opacity: 0.95,
        fillColor: CARTOGRAPHIC_COLORS.buildings.hex,
        fillOpacity: 0.85,
      }
    }
  }

  if (config.kind === 'division') {
    const divColor = getDivisionColorByName(feature?.properties?.Name ?? feature?.properties?.ID)
    return {
      color: CARTOGRAPHIC_COLORS.estateBoundary.hex,
      weight: isDivisionActive ? 2.8 : 1.8,
      opacity: 0.95,
      fillColor: divColor,
      fillOpacity: isDivisionActive ? 0.35 : 0.12,
    }
  }

  // Field plots
  const fieldColor = config.fillColor || config.color
  return {
    color: config.color,
    weight: 1.5,
    opacity: 0.92,
    fillColor: fieldColor,
    fillOpacity: isDivisionActive ? 0.22 : 0.45,
  }
}

export function PlantationMap() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)

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
  const [activeBaseLayer, setActiveBaseLayer] = useState<ImageryBaseLayerId>('rgb')
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

  // Find feature by geographic coordinate
  const findFeatureAtPoint = (
    latlng: { lat: number; lng: number },
    targetKind: 'field' | 'division' | 'any',
  ): { layerKey: LayerKey; config: EstateLayerConfig; feature: EstateFeature; pathLayer?: L.Path } | null => {
    // 1. If division layer is ON and target is division (or any), check division first
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

    // 2. Check field layers
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
      chosenPath.setStyle({
        color: '#ffffff',
        weight: 3.6,
        fillColor: '#ffffff',
        fillOpacity: 0.48,
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

    // Create custom ordered panes
    map.createPane('basemap')
    map.getPane('basemap')!.style.zIndex = '100'

    map.createPane('imagery_raster')
    map.getPane('imagery_raster')!.style.zIndex = '200'

    map.createPane('analysis_raster')
    map.getPane('analysis_raster')!.style.zIndex = '250'

    map.createPane('boundary_lines')
    map.getPane('boundary_lines')!.style.zIndex = '300'

    map.createPane('hydrology_streams')
    map.getPane('hydrology_streams')!.style.zIndex = '350'

    map.createPane('road_network')
    map.getPane('road_network')!.style.zIndex = '380'

    map.createPane('buildings')
    map.getPane('buildings')!.style.zIndex = '390'

    map.createPane('fields')
    map.getPane('fields')!.style.zIndex = '410'

    map.createPane('divisions')
    map.getPane('divisions')!.style.zIndex = '420'

    map.createPane('drawn_features')
    map.getPane('drawn_features')!.style.zIndex = '500'

    map.setView([7.05894, 80.70995], 15)
    mapRef.current = map

    // 0. User Drawing Feature Group
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnItemsRef.current = drawnItems
    setDrawnItemsGroup(drawnItems)
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
        opacity: rasterConfig.opacity ?? 0.75,
        attribution: `Weddamulle ${rasterConfig.label}`,
      })

      rasterTileLayersRef.current[rasterConfig.id] = tileLayer

      if (rasterVisibilityRef.current[rasterConfig.id]) {
        tileLayer.addTo(map)
      }
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Central Map Click Dispatcher
    const handleMapClick = (event: L.LeafletMouseEvent) => {
      // If divisions layer is ON, query division first
      if (vectorVisibilityRef.current.divisions) {
        const divisionHit = findFeatureAtPoint(event.latlng, 'division')
        if (divisionHit) {
          selectFeature(divisionHit.layerKey, divisionHit.feature, divisionHit.pathLayer)
          return
        }
      }

      // Otherwise query field plots
      const fieldHit = findFeatureAtPoint(event.latlng, 'field')
      if (fieldHit) {
        selectFeature(fieldHit.layerKey, fieldHit.feature, fieldHit.pathLayer)
      } else {
        handleCloseSelection()
      }
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

              if (config.interactive) {
                leafletLayer.bindTooltip(featureTitle(feature, config.kind), {
                  sticky: true,
                  direction: 'top',
                  className: 'estate-tooltip',
                })

                leafletLayer.on({
                  click: (event: L.LeafletMouseEvent) => {
                    if (isDrawingActiveRef.current) return
                    L.DomEvent.stopPropagation(event)

                    if (config.kind === 'division' && !vectorVisibilityRef.current.divisions) {
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
          map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 })
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

  // Dynamic Base Layer Selection (Bottom-Left Switcher)
  const handleSelectBaseLayer = (nextId: ImageryBaseLayerId) => {
    const map = mapRef.current
    if (!map) return

    setActiveBaseLayer(nextId)

    const osmLayer = baseMapTileLayersRef.current.osm
    const satLayer = baseMapTileLayersRef.current.googleSatellite
    const visigeoGroup = visigeoGroupRef.current

    if (nextId === 'rgb') {
      if (satLayer && map.hasLayer(satLayer)) map.removeLayer(satLayer)
      if (osmLayer && !map.hasLayer(osmLayer)) map.addLayer(osmLayer)
      if (visigeoGroup && !map.hasLayer(visigeoGroup)) map.addLayer(visigeoGroup)
      setBaseMap('osm')
      setRasterVisibility((prev) => ({ ...prev, visigeo: true }))
    } else if (nextId === 'googleSatellite') {
      if (osmLayer && map.hasLayer(osmLayer)) map.removeLayer(osmLayer)
      if (satLayer && !map.hasLayer(satLayer)) map.addLayer(satLayer)
      if (visigeoGroup && !map.hasLayer(visigeoGroup)) map.addLayer(visigeoGroup)
      setBaseMap('googleSatellite')
      setRasterVisibility((prev) => ({ ...prev, visigeo: true }))
    }
  }

  // Toggle Thematic Raster Analysis Layers
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
    } else {
      const tileLayer = rasterTileLayersRef.current[id]
      if (tileLayer) {
        if (nextState) tileLayer.addTo(map)
        else tileLayer.removeFrom(map)
      }
    }

    setRasterVisibility((prev) => ({ ...prev, [id]: nextState }))
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

    // 1. Reset Base Layer to RGB
    handleSelectBaseLayer('rgb')

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

    // 3. Reset Vector Layers (all false)
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
    if (estateBoundsRef.current?.isValid()) {
      map.fitBounds(estateBoundsRef.current, { padding: [45, 45], maxZoom: 16 })
    }
    handleCloseSelection()
  }

  const resetView = () => {
    const map = mapRef.current
    const bounds = estateBoundsRef.current
    if (map && bounds?.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 })
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
        candidate.setStyle({
          weight: config.kind === 'division' ? 4.0 : 3.0,
          fillOpacity: config.kind === 'division' ? 0.45 : 0.55,
        })
        activeSelectedPathRef.current = candidate
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

      <div className="map-legend-rail">
        <MapCartographicLegend
          rasterVisibility={rasterVisibility}
          vectorVisibility={vectorVisibility}
        />
      </div>

      <BaseMapSwitcher
        activeBaseLayer={activeBaseLayer}
        onSelectBaseLayer={handleSelectBaseLayer}
      />

      <FeatureDetailPanel selection={selection} onClose={handleCloseSelection} />

      {loadError && <div className="map-error">{loadError}</div>}

      <div className="map-source-badge">
        <span>GIS</span>
        Weddamulle Plantation · {activeBaseLayer === 'googleSatellite' ? 'Satellite Imagery + Weddamulle Ortho' : 'Street Map + RGB Ortho'}
      </div>
    </div>
  )
}
