import L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ESTATE_LAYERS,
  INITIAL_LAYER_VISIBILITY,
  OSM_TILE_URL,
  VISIGEO_IMAGERY_LAYERS,
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
  EstateFeature,
  EstateFeatureCollection,
  EstateLayerConfig,
  LayerKey,
  SearchHit,
  SelectedEstateFeature,
} from '../../types/gis'
import { LayerController } from './layers/LayerController'
import { FeatureDetailPanel } from './popups/FeatureDetailPanel'
import { MapTopBar } from './MapTopBar'

type LoadedLayer = {
  config: EstateLayerConfig
  data: EstateFeatureCollection
  layer: L.GeoJSON
}

function getLayerDefaultStyle(config: EstateLayerConfig, currentMode: 'division' | 'field'): L.PathOptions {
  if (config.kind === 'division') {
    return {
      color: config.color,
      weight: currentMode === 'division' ? 3.0 : 1.8,
      opacity: currentMode === 'division' ? 0.95 : 0.65,
      fillColor: config.fillColor,
      fillOpacity: currentMode === 'division' ? 0.12 : 0.03,
    }
  }
  return {
    color: config.color,
    weight: currentMode === 'field' ? 1.4 : 1.0,
    opacity: currentMode === 'field' ? 0.95 : 0.70,
    fillColor: config.fillColor,
    fillOpacity: currentMode === 'field' ? 0.28 : 0.12,
  }
}

export function PlantationMap() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const osmRef = useRef<L.TileLayer | null>(null)
  const imageryGroupRef = useRef<L.LayerGroup | null>(null)
  const loadedRef = useRef<Partial<Record<LayerKey, LoadedLayer>>>({})
  const estateBoundsRef = useRef<L.LatLngBounds | null>(null)
  const activeSelectedLayerRef = useRef<L.Path | null>(null)

  const [mode, setMode] = useState<'division' | 'field'>('field')
  const modeRef = useRef<'division' | 'field'>('field')
  modeRef.current = mode

  const [visibility, setVisibility] = useState(INITIAL_LAYER_VISIBILITY)
  const visibilityRef = useRef(visibility)
  visibilityRef.current = visibility

  const [imageryVisible, setImageryVisible] = useState(true)
  const [imageryStatus, setImageryStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selection, setSelection] = useState<SelectedEstateFeature | null>(null)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [allFeatures, setAllFeatures] = useState<Array<{ layerKey: LayerKey; feature: EstateFeature }>>([])

  const searchHits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    return allFeatures
      .filter(({ feature }) => searchableText(feature).includes(q))
      .slice(0, 12)
      .map(({ layerKey, feature }, index) => {
        const config = ESTATE_LAYERS.find((item) => item.key === layerKey)
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
  }, [allFeatures, query])

  // Clear any active polygon selection highlight
  const clearSelectionHighlight = () => {
    if (activeSelectedLayerRef.current) {
      const prevLayer = activeSelectedLayerRef.current
      const config = ESTATE_LAYERS.find((c) => {
        const loaded = loadedRef.current[c.key]
        return loaded?.layer.hasLayer(prevLayer)
      })
      if (config) {
        prevLayer.setStyle(getLayerDefaultStyle(config, modeRef.current))
      }
      activeSelectedLayerRef.current = null
    }
  }

  const handleCloseSelection = () => {
    clearSelectionHighlight()
    setSelection(null)
  }

  // Find feature by point coordinates across loaded GeoJSON layers
  const findFeatureAtPoint = (
    latlng: { lat: number; lng: number },
    targetKind: 'field' | 'division' | 'any',
  ): { layerKey: LayerKey; config: EstateLayerConfig; feature: EstateFeature; pathLayer?: L.Path } | null => {
    // 1. Check field layers if requested
    if (targetKind === 'field' || targetKind === 'any') {
      for (const config of ESTATE_LAYERS) {
        if (config.kind === 'field' && visibilityRef.current[config.key]) {
          const loaded = loadedRef.current[config.key]
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

    // 2. Check division layer if requested
    if (targetKind === 'division' || targetKind === 'any') {
      if (visibilityRef.current.divisions) {
        const loaded = loadedRef.current.divisions
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
    }

    return null
  }

  // Select and highlight a feature polygon and show the single inspector panel
  const selectFeature = (
    layerKey: LayerKey,
    feature: EstateFeature,
    leafletLayer?: L.Layer | null,
  ) => {
    const config = ESTATE_LAYERS.find((c) => c.key === layerKey)
    if (!config) return

    clearSelectionHighlight()

    let chosenPath: L.Path | null = null
    if (leafletLayer instanceof L.Path) {
      chosenPath = leafletLayer
    } else {
      const loaded = loadedRef.current[layerKey]
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
      chosenPath.setStyle({
        weight: config.kind === 'division' ? 4.0 : 3.0,
        fillOpacity: config.kind === 'division' ? 0.35 : 0.45,
      })
      activeSelectedLayerRef.current = chosenPath
    }

    const center = chosenPath ? getFeatureCenter(chosenPath) : getFeatureCenter(null)
    setSelection({
      layerKey: config.key,
      layerLabel: config.label,
      kind: config.kind,
      feature,
      center,
    })
  }

  // Update styles dynamically when inspection mode or layer visibility changes
  useEffect(() => {
    ESTATE_LAYERS.forEach((config) => {
      const loaded = loadedRef.current[config.key]
      if (!loaded) return

      loaded.layer.eachLayer((child) => {
        if (child instanceof L.Path && child !== activeSelectedLayerRef.current) {
          child.setStyle(getLayerDefaultStyle(config, mode))
        }
      })
    })
  }, [mode, visibility])

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return

    const map = L.map(hostRef.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 12,
      maxZoom: 22,
      zoomSnap: 0.5,
    })

    map.createPane('basemap')
    map.getPane('basemap')!.style.zIndex = '100'
    map.createPane('imagery')
    map.getPane('imagery')!.style.zIndex = '200'
    // Divisions layer sits at 410, fields sit on top at 420 for direct DOM interaction
    map.createPane('divisions')
    map.getPane('divisions')!.style.zIndex = '410'
    map.createPane('fields')
    map.getPane('fields')!.style.zIndex = '420'

    // Initial center; fitBounds executes upon GeoJSON loading
    map.setView([7.05894, 80.70995], 15)
    mapRef.current = map

    // Base OSM layer
    const osm = L.tileLayer(OSM_TILE_URL, {
      pane: 'basemap',
      minZoom: 1,
      maxZoom: 22,
      maxNativeZoom: 19,
      keepBuffer: 5,
      attribution: '&copy; OpenStreetMap contributors',
    })
    osm.addTo(map)
    osmRef.current = osm

    // VisiGeo orthophoto layers
    let successfulVisiGeoTiles = 0
    const imageryLayers = VISIGEO_IMAGERY_LAYERS.map((source) => {
      const layer = L.tileLayer(source.url, {
        pane: 'imagery',
        minZoom: 14,
        maxZoom: 22,
        maxNativeZoom: 22,
        keepBuffer: 5,
        opacity: 1,
        attribution: 'Weddamulle imagery · VisiGeo',
      })

      layer.on('tileload', () => {
        successfulVisiGeoTiles += 1
        setImageryStatus('ready')
      })

      return layer
    })

    const imageryGroup = L.layerGroup(imageryLayers)
    imageryGroup.addTo(map)
    imageryGroupRef.current = imageryGroup

    const imageryHealthTimer = window.setTimeout(() => {
      if (successfulVisiGeoTiles === 0) setImageryStatus('error')
    }, 5000)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Centralized background & spatial click dispatcher
    const handleMapClick = (event: L.LeafletMouseEvent) => {
      const currentMode = modeRef.current
      const primaryKind = currentMode === 'field' ? 'field' : 'division'
      const secondaryKind = currentMode === 'field' ? 'division' : 'field'

      let hit = findFeatureAtPoint(event.latlng, primaryKind)
      if (!hit) {
        hit = findFeatureAtPoint(event.latlng, secondaryKind)
      }

      if (hit) {
        selectFeature(hit.layerKey, hit.feature, hit.pathLayer)
      } else {
        handleCloseSelection()
      }
    }
    map.on('click', handleMapClick)

    const controller = new AbortController()

    Promise.all(
      ESTATE_LAYERS.map(async (config) => {
        const data = await fetchGeoJson(config.url, controller.signal)
        const layer = L.geoJSON(data as never, {
          pane: config.kind === 'division' ? 'divisions' : 'fields',
          style: getLayerDefaultStyle(config, modeRef.current),
          onEachFeature: (rawFeature, leafletLayer) => {
            const feature = rawFeature as unknown as EstateFeature

            // Provide responsive tooltip for quick hover identification
            leafletLayer.bindTooltip(featureTitle(feature, config.kind), {
              sticky: true,
              direction: 'top',
              className: 'estate-tooltip',
            })

            leafletLayer.on({
              click: (event: L.LeafletMouseEvent) => {
                L.DomEvent.stopPropagation(event)

                // If in field mode and a division received click, check if a field lies underneath
                if (config.kind === 'division' && modeRef.current === 'field') {
                  const fieldHit = findFeatureAtPoint(event.latlng, 'field')
                  if (fieldHit) {
                    selectFeature(fieldHit.layerKey, fieldHit.feature, fieldHit.pathLayer)
                    return
                  }
                }

                selectFeature(config.key, feature, leafletLayer)
              },
              mouseover: () => {
                if (leafletLayer instanceof L.Path && leafletLayer !== activeSelectedLayerRef.current) {
                  leafletLayer.setStyle({
                    weight: config.kind === 'division' ? 3.5 : 2.4,
                    fillOpacity: config.kind === 'division' ? 0.25 : 0.40,
                  })
                }
              },
              mouseout: () => {
                if (leafletLayer instanceof L.Path && leafletLayer !== activeSelectedLayerRef.current) {
                  leafletLayer.setStyle(getLayerDefaultStyle(config, modeRef.current))
                }
              },
            })
          },
        })

        if (INITIAL_LAYER_VISIBILITY[config.key]) layer.addTo(map)
        loadedRef.current[config.key] = { config, data, layer }
        return { config, data, layer }
      }),
    )
      .then((loaded) => {
        const bounds = L.latLngBounds([])
        const features: Array<{ layerKey: LayerKey; feature: EstateFeature }> = []
        loaded.forEach(({ config, data, layer }) => {
          if (layer && typeof layer.getBounds === 'function') {
            const layerBounds = layer.getBounds()
            if (layerBounds && layerBounds.isValid()) bounds.extend(layerBounds)
          }
          if (data && Array.isArray(data.features)) {
            data.features.forEach((feature) => {
              if (feature && feature.properties) {
                features.push({ layerKey: config.key, feature })
              }
            })
          }
        })

        if (bounds.isValid()) {
          estateBoundsRef.current = bounds
          map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 })
        }
        setAllFeatures(features)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Failed to load estate GIS data.')
      })

    return () => {
      controller.abort()
      window.clearTimeout(imageryHealthTimer)
      map.off('click', handleMapClick)
      map.remove()
      mapRef.current = null
      osmRef.current = null
      imageryGroupRef.current = null
      loadedRef.current = {}
      activeSelectedLayerRef.current = null
    }
  }, [])

  const toggleLayer = (key: LayerKey) => {
    const map = mapRef.current
    const loaded = loadedRef.current[key]
    if (!map || !loaded) return

    setVisibility((current) => {
      const next = !current[key]
      if (next) loaded.layer.addTo(map)
      else {
        loaded.layer.removeFrom(map)
        if (selection?.layerKey === key) {
          handleCloseSelection()
        }
      }
      return { ...current, [key]: next }
    })
  }

  const toggleImagery = () => {
    const map = mapRef.current
    const imageryGroup = imageryGroupRef.current
    if (!map || !imageryGroup) return

    setImageryVisible((current) => {
      if (current) imageryGroup.removeFrom(map)
      else imageryGroup.addTo(map)
      return !current
    })
  }

  const resetView = () => {
    const map = mapRef.current
    const bounds = estateBoundsRef.current
    if (map && bounds?.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 })
    }
    handleCloseSelection()
  }

  const focusSearchHit = (hit: SearchHit) => {
    const map = mapRef.current
    const loaded = loadedRef.current[hit.layerKey]
    const config = ESTATE_LAYERS.find((layer) => layer.key === hit.layerKey)
    if (!map || !loaded || !config) return

    // Auto-switch mode based on feature kind
    if (config.kind === 'field') setMode('field')
    else setMode('division')

    if (!visibility[hit.layerKey]) {
      loaded.layer.addTo(map)
      setVisibility((current) => ({ ...current, [hit.layerKey]: true }))
    }

    clearSelectionHighlight()

    loaded.layer.eachLayer((candidate) => {
      const raw = (candidate as L.Layer & { feature?: EstateFeature }).feature
      if (raw !== hit.feature) return

      if (candidate instanceof L.Path) {
        candidate.setStyle({
          weight: config.kind === 'division' ? 4.0 : 3.0,
          fillOpacity: config.kind === 'division' ? 0.35 : 0.45,
        })
        activeSelectedLayerRef.current = candidate
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

      <div className="map-left-rail">
        <LayerController
          visibility={visibility}
          imageryVisible={imageryVisible}
          imageryStatus={imageryStatus}
          onToggleLayer={toggleLayer}
          onToggleImagery={toggleImagery}
          onResetView={resetView}
        />
      </div>

      <FeatureDetailPanel selection={selection} onClose={handleCloseSelection} />

      {loadError && <div className="map-error">{loadError}</div>}

      <div className="map-source-badge">
        <span>GIS</span>
        Uploaded Weddamulle estate data · VisiGeo imagery
      </div>
    </div>
  )
}
