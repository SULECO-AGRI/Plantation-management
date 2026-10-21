import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import {
  ChevronDown,
  Crosshair,
  Layers,
  Minus,
  RotateCcw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import { loadPlantationGeoJson, WATAWALA_METADATA } from '../../utils/layerLoader'
import { GOOGLE_SATELLITE_TILE_URL, OSM_TILE_URL } from '../../data/layers'
import { BaseMapSwitcher } from './BaseMapSwitcher'
import { MapTopBar } from './MapTopBar'
import type { SearchHit, EstateFeature } from '../../types/gis'

type WatawalaMapProps = {
  isActive?: boolean
}

/**
 * Key Watawala Plantation divisions & landmarks for quick search navigation
 */
const WATAWALA_ESTATES = [
  {
    id: 'homadola',
    name: 'Homadola Estate',
    subtitle: 'Watawala Plantations PLC · Palm & Rubber Division',
    center: [6.182, 80.325] as [number, number],
  },
  {
    id: 'nakiyadeniya',
    name: 'Nakiyadeniya Estate',
    subtitle: 'Watawala Plantations PLC · Palm Oil Mill & Estate',
    center: [6.215, 80.355] as [number, number],
  },
  {
    id: 'thalangaha',
    name: 'Thalangaha Estate',
    subtitle: 'Watawala Plantations PLC · Agricultural Division',
    center: [6.155, 80.310] as [number, number],
  },
  {
    id: 'udugama',
    name: 'Udugama Center',
    subtitle: 'Provincial Junction & Transport Hub',
    center: [6.218, 80.332] as [number, number],
  },
]

/**
 * Watawala Plantations PLC live RGB Orthophoto tile sets (Sets 01 - 09).
 * Directly rendered on the current Leaflet canvas.
 */
const WATAWALA_RGB_SETS = [
  'https://watawala-plantations-plc.visigeo.com/rgb/set%2001/{z}/{x}/{y}.png',
  'https://watawala-plantations-plc.visigeo.com/rgb/set%2002/{z}/{x}/{y}.png',
  'https://watawala-plantations-plc.visigeo.com/rgb/set%2003/{z}/{x}/{y}.png',
  'https://watawala-plantations-plc.visigeo.com/rgb/set%2004/{z}/{x}/{y}.png',
  'https://watawala-plantations-plc.visigeo.com/rgb/Set%2005/{z}/{x}/{y}.png',
  'https://watawala-plantations-plc.visigeo.com/rgb/set%2006/{z}/{x}/{y}.png',
  'https://watawala-plantations-plc.visigeo.com/rgb/set%2007/{z}/{x}/{y}.png',
  'https://watawala-plantations-plc.visigeo.com/rgb/set%2008/{z}/{x}/{y}.png',
  'https://watawala-plantations-plc.visigeo.com/rgb/set%2009/{z}/{x}/{y}.png',
]

const WATAWALA_BOUNDS = L.latLngBounds(
  L.latLng(6.142522718162986, 80.28276443481447),
  L.latLng(6.23731597333188, 80.37683486938478)
)

export const WatawalaMap: React.FC<WatawalaMapProps> = ({
  isActive = true,
}) => {
  const { role, plantationScope } = useAuth()
  const { t } = useTranslation()
  const activeRole = role || 'Officer'

  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const osmTileLayerRef = useRef<L.TileLayer | null>(null)
  const satTileLayerRef = useRef<L.TileLayer | null>(null)
  const rgbGroupRef = useRef<L.LayerGroup | null>(null)
  const estateRoadsGroupRef = useRef<L.LayerGroup | null>(null)
  const provincialRoadsGroupRef = useRef<L.LayerGroup | null>(null)
  const rdaRoadsGroupRef = useRef<L.LayerGroup | null>(null)
  const estateRoadsLayerRef = useRef<L.GeoJSON | null>(null)
  const provincialRoadsLayerRef = useRef<L.GeoJSON | null>(null)
  const rdaRoadsLayerRef = useRef<L.GeoJSON | null>(null)
  const geojsonDataRef = useRef<GeoJSON.FeatureCollection | null>(null)
  const boundsRef = useRef<L.LatLngBounds | null>(null)

  // Search state
  const [query, setQuery] = useState('')

  // Map state - RGB and road types are ON by default
  const [isSatellite, setIsSatellite] = useState(false)
  const [isRgbActive, setIsRgbActive] = useState(true)
  const [isEstateRoadsVisible, setIsEstateRoadsVisible] = useState(true)
  const [isProvincialRoadsVisible, setIsProvincialRoadsVisible] = useState(true)
  const [isRdaRoadsVisible, setIsRdaRoadsVisible] = useState(true)
  const [isLoadingVector, setIsLoadingVector] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Track visibility in refs to prevent stale closure bugs during async fetch & mount cycles
  const isEstateRoadsVisibleRef = useRef(true)
  const isProvincialRoadsVisibleRef = useRef(true)
  const isRdaRoadsVisibleRef = useRef(true)
  const isRgbActiveRef = useRef(true)

  // Layer panel state
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isInfraOpen, setIsInfraOpen] = useState(true)

  // Helper to construct individual road category GeoJSON layers
  const createRoadSubLayer = (
    features: GeoJSON.Feature[],
    color: string,
    weight: number,
    opacity: number,
    defaultTypeKey: 'estateRoad' | 'provincialRoad' | 'rdaRoad'
  ): L.GeoJSON => {
    return L.geoJSON(
      { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection,
      {
        pane: 'vectorPane',
        style: () => ({
          color,
          weight,
          opacity,
        }),
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {}
          const fid = props.FID !== undefined ? `#${props.FID}` : ''

          layer.bindPopup(
            () => {
              const rawType = String(props.RdType || '').trim().toLowerCase()
              let typeLabel = t(`watawala.${defaultTypeKey}`)
              if (rawType.includes('rda')) typeLabel = t('watawala.rdaRoad')
              else if (rawType.includes('provincial')) typeLabel = t('watawala.provincialRoad')
              else if (rawType.includes('estate')) typeLabel = t('watawala.estateRoad')

              const lengthVal = props.Length ? `${Number(props.Length).toFixed(1)} m` : 'N/A'

              return `
              <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; padding: 4px 6px; line-height: 1.4; min-width: 170px;">
                <div style="font-weight: 700; color: #071712; font-size: 13px; margin-bottom: 4px; border-bottom: 1px solid #e2ede6; padding-bottom: 4px;">
                  ${typeLabel} <span style="color: #6b7f75; font-size: 11px; font-weight: 500;">${fid}</span>
                </div>
                <div style="color: #3c5248; margin-top: 5px;">${t('watawala.length')} <strong style="color: #071712;">${lengthVal}</strong></div>
                <div style="color: #6b7f75; font-size: 10.5px; margin-top: 6px; display: flex; align-items: center; gap: 4px;">
                  <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${color};"></span>
                  ${t('watawala.companyName')}
                </div>
              </div>
            `
            },
            {
              className: 'estate-leaflet-popup',
            }
          )
        },
      }
    )
  }

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return
    let isMounted = true
    const abortController = new AbortController()

    const map = L.map(hostRef.current, {
      center: WATAWALA_METADATA.center,
      zoom: WATAWALA_METADATA.defaultZoom,
      zoomControl: false,
    })

    // Custom positioned zoom control on bottomright
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Ensure custom pane for vector lines exists above the tile pane (620 z-index)
    if (!map.getPane('vectorPane')) {
      const vectorPane = map.createPane('vectorPane')
      vectorPane.style.zIndex = '620'
    }

    // Base OSM Layer (default base)
    const osmLayer = L.tileLayer(OSM_TILE_URL, {
      attribution: '&copy; OpenStreetMap contributors | Watawala Plantations PLC',
      maxZoom: 19,
    })
    osmLayer.addTo(map)
    osmTileLayerRef.current = osmLayer

    // Satellite Layer (Google Satellite)
    const satLayer = L.tileLayer(GOOGLE_SATELLITE_TILE_URL, {
      attribution: '&copy; Google / Maxar Technologies | Watawala Plantations PLC',
      maxZoom: 20,
    })
    satTileLayerRef.current = satLayer

    // RGB Orthophoto Tile Layer Group (Directly mounted on current canvas)
    const rgbLayers = WATAWALA_RGB_SETS.map((url) => {
      return L.tileLayer(url, {
        minZoom: 8,
        maxZoom: 22,
        maxNativeZoom: 22,
        minNativeZoom: 12,
        bounds: WATAWALA_BOUNDS,
        keepBuffer: 4,
        opacity: 1.0,
        attribution: 'Watawala Orthophoto © VisiGeo',
      })
    })
    const rgbGroup = L.layerGroup(rgbLayers)
    rgbGroupRef.current = rgbGroup
    if (isRgbActiveRef.current) {
      rgbGroup.addTo(map)
    }

    // Initialize dedicated LayerGroups for each road network category
    const estateGroup = L.layerGroup()
    const provincialGroup = L.layerGroup()
    const rdaGroup = L.layerGroup()

    estateRoadsGroupRef.current = estateGroup
    provincialRoadsGroupRef.current = provincialGroup
    rdaRoadsGroupRef.current = rdaGroup

    if (isEstateRoadsVisibleRef.current) estateGroup.addTo(map)
    if (isProvincialRoadsVisibleRef.current) provincialGroup.addTo(map)
    if (isRdaRoadsVisibleRef.current) rdaGroup.addTo(map)

    // Fit view to Watawala plantation bounds immediately
    map.fitBounds(WATAWALA_BOUNDS, { padding: [25, 25] })
    mapRef.current = map

    // Fetch Watawala road network GeoJSON and populate individual category groups
    setIsLoadingVector(true)
    setLoadError(null)

    loadPlantationGeoJson<GeoJSON.FeatureCollection>(
      'Watawala/Road_Layer.geojson.geojson',
      abortController.signal
    )
      .then((geojson) => {
        if (!isMounted || !mapRef.current) return
        geojsonDataRef.current = geojson

        const estateFeatures: GeoJSON.Feature[] = []
        const provincialFeatures: GeoJSON.Feature[] = []
        const rdaFeatures: GeoJSON.Feature[] = []

        geojson.features.forEach((f) => {
          const t = String(f.properties?.RdType || '').trim().toLowerCase()
          if (t.includes('rda')) {
            rdaFeatures.push(f)
          } else if (t.includes('provincial')) {
            provincialFeatures.push(f)
          } else {
            estateFeatures.push(f)
          }
        })

        // Always clear groups first to guarantee zero duplicate vectors from StrictMode/remounts
        estateGroup.clearLayers()
        provincialGroup.clearLayers()
        rdaGroup.clearLayers()

        // 1. Estate Roads layer (#D84F4F)
        const estateLayer = createRoadSubLayer(estateFeatures, '#D84F4F', 1.5, 0.88, 'estateRoad')
        estateRoadsLayerRef.current = estateLayer
        estateGroup.addLayer(estateLayer)

        // 2. Provincial Roads layer (#ff7800)
        const provincialLayer = createRoadSubLayer(provincialFeatures, '#ff7800', 2.2, 0.95, 'provincialRoad')
        provincialRoadsLayerRef.current = provincialLayer
        provincialGroup.addLayer(provincialLayer)

        // 3. RDA Roads layer (#ca8a04)
        const rdaLayer = createRoadSubLayer(rdaFeatures, '#ca8a04', 2.5, 0.95, 'rdaRoad')
        rdaRoadsLayerRef.current = rdaLayer
        rdaGroup.addLayer(rdaLayer)

        // Deterministically synchronize group attachment with live visibility refs
        if (isEstateRoadsVisibleRef.current) {
          if (!map.hasLayer(estateGroup)) estateGroup.addTo(map)
        } else {
          if (map.hasLayer(estateGroup)) map.removeLayer(estateGroup)
        }

        if (isProvincialRoadsVisibleRef.current) {
          if (!map.hasLayer(provincialGroup)) provincialGroup.addTo(map)
        } else {
          if (map.hasLayer(provincialGroup)) map.removeLayer(provincialGroup)
        }

        if (isRdaRoadsVisibleRef.current) {
          if (!map.hasLayer(rdaGroup)) rdaGroup.addTo(map)
        } else {
          if (map.hasLayer(rdaGroup)) map.removeLayer(rdaGroup)
        }

        try {
          const b = estateLayer.getBounds()
          if (b.isValid()) {
            boundsRef.current = b
            mapRef.current.fitBounds(b, { padding: [25, 25] })
          }
        } catch {
          // ignore invalid bounds
        }
      })
      .catch((err) => {
        if (!isMounted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('Failed to load Watawala roads layer:', err)
        setLoadError(err instanceof Error ? err.message : 'Failed to load Watawala road data.')
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingVector(false)
        }
      })

    return () => {
      isMounted = false
      abortController.abort()
      estateGroup.clearLayers()
      provincialGroup.clearLayers()
      rdaGroup.clearLayers()
      try {
        map.remove()
      } catch (err) {
        console.warn('Leaflet cleanup notice:', err)
      }
      mapRef.current = null
      estateRoadsGroupRef.current = null
      provincialRoadsGroupRef.current = null
      rdaRoadsGroupRef.current = null
      estateRoadsLayerRef.current = null
      provincialRoadsLayerRef.current = null
      rdaRoadsLayerRef.current = null
    }
  }, [])

  // Invalidate size when active tab changes
  useEffect(() => {
    if (isActive && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 200)
    }
  }, [isActive])

  // Direct toggle handlers ensuring instantaneous Leaflet layer detachment/attachment
  const handleToggleEstateRoads = () => {
    setIsEstateRoadsVisible((prev) => {
      const next = !prev
      isEstateRoadsVisibleRef.current = next
      const map = mapRef.current
      const group = estateRoadsGroupRef.current
      if (map && group) {
        if (next) {
          if (!map.hasLayer(group)) group.addTo(map)
        } else {
          if (map.hasLayer(group)) map.removeLayer(group)
          group.removeFrom(map)
        }
      }
      return next
    })
  }

  const handleToggleProvincialRoads = () => {
    setIsProvincialRoadsVisible((prev) => {
      const next = !prev
      isProvincialRoadsVisibleRef.current = next
      const map = mapRef.current
      const group = provincialRoadsGroupRef.current
      if (map && group) {
        if (next) {
          if (!map.hasLayer(group)) group.addTo(map)
        } else {
          if (map.hasLayer(group)) map.removeLayer(group)
          group.removeFrom(map)
        }
      }
      return next
    })
  }

  const handleToggleRdaRoads = () => {
    setIsRdaRoadsVisible((prev) => {
      const next = !prev
      isRdaRoadsVisibleRef.current = next
      const map = mapRef.current
      const group = rdaRoadsGroupRef.current
      if (map && group) {
        if (next) {
          if (!map.hasLayer(group)) group.addTo(map)
        } else {
          if (map.hasLayer(group)) map.removeLayer(group)
          group.removeFrom(map)
        }
      }
      return next
    })
  }

  // 2. BaseMap Switching (Standard OSM vs Google Satellite)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (isSatellite) {
      if (osmTileLayerRef.current && map.hasLayer(osmTileLayerRef.current)) map.removeLayer(osmTileLayerRef.current)
      if (satTileLayerRef.current && !map.hasLayer(satTileLayerRef.current)) satTileLayerRef.current.addTo(map)
    } else {
      if (satTileLayerRef.current && map.hasLayer(satTileLayerRef.current)) map.removeLayer(satTileLayerRef.current)
      if (osmTileLayerRef.current && !map.hasLayer(osmTileLayerRef.current)) osmTileLayerRef.current.addTo(map)
    }
  }, [isSatellite])

  // 3. RGB Orthophoto Tile Layer Toggle (Directly on Current Map)
  useEffect(() => {
    isRgbActiveRef.current = isRgbActive
    const map = mapRef.current
    const rgbGroup = rgbGroupRef.current
    if (!map || !rgbGroup) return

    if (isRgbActive) {
      if (!map.hasLayer(rgbGroup)) {
        rgbGroup.addTo(map)
      }
    } else {
      if (map.hasLayer(rgbGroup)) {
        map.removeLayer(rgbGroup)
      }
      rgbGroup.removeFrom(map)
    }
  }, [isRgbActive])

  // Synchronize road group visibility when states change externally (e.g. reset layers)
  useEffect(() => {
    isEstateRoadsVisibleRef.current = isEstateRoadsVisible
    const map = mapRef.current
    const group = estateRoadsGroupRef.current
    if (!map || !group) return

    if (isEstateRoadsVisible) {
      if (!map.hasLayer(group)) group.addTo(map)
    } else {
      if (map.hasLayer(group)) map.removeLayer(group)
      group.removeFrom(map)
    }
  }, [isEstateRoadsVisible])

  useEffect(() => {
    isProvincialRoadsVisibleRef.current = isProvincialRoadsVisible
    const map = mapRef.current
    const group = provincialRoadsGroupRef.current
    if (!map || !group) return

    if (isProvincialRoadsVisible) {
      if (!map.hasLayer(group)) group.addTo(map)
    } else {
      if (map.hasLayer(group)) map.removeLayer(group)
      group.removeFrom(map)
    }
  }, [isProvincialRoadsVisible])

  useEffect(() => {
    isRdaRoadsVisibleRef.current = isRdaRoadsVisible
    const map = mapRef.current
    const group = rdaRoadsGroupRef.current
    if (!map || !group) return

    if (isRdaRoadsVisible) {
      if (!map.hasLayer(group)) group.addTo(map)
    } else {
      if (map.hasLayer(group)) map.removeLayer(group)
      group.removeFrom(map)
    }
  }, [isRdaRoadsVisible])

  // Search filtering over Watawala estates & road network
  const searchHits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const hits: SearchHit[] = []

    // 1. Search landmark divisions/estates
    WATAWALA_ESTATES.forEach((e) => {
      const localizedSubtitle =
        e.id === 'homadola'
          ? t('watawala.homadolaSubtitle')
          : e.id === 'nakiyadeniya'
          ? t('watawala.nakiyadeniyaSubtitle')
          : e.id === 'thalangaha'
          ? t('watawala.thalangahaSubtitle')
          : e.id === 'udugama'
          ? t('watawala.udugamaSubtitle')
          : e.subtitle

      if (e.name.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q) || localizedSubtitle.toLowerCase().includes(q)) {
        hits.push({
          id: `estate-${e.id}`,
          layerKey: 'boundary',
          label: e.name,
          subtitle: localizedSubtitle,
          feature: {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [e.center[1], e.center[0]] },
            properties: { Name: e.name },
          },
        })
      }
    })

    // 2. Search road features
    if (geojsonDataRef.current && Array.isArray(geojsonDataRef.current.features)) {
      for (const f of geojsonDataRef.current.features) {
        if (hits.length >= 8) break
        const props = f.properties || {}
        const fid = props.FID !== undefined ? String(props.FID) : ''
        const rdType = String(props.RdType || 'Estate Road').trim()

        const matchesFid = fid === q || `fid ${fid}` === q || `road ${fid}` === q || `#${fid}` === q
        const matchesType = rdType.toLowerCase().includes(q)

        if (matchesFid || matchesType) {
          const rawType = rdType.toLowerCase()
          let localizedType = t('watawala.estateRoad')
          if (rawType.includes('rda')) localizedType = t('watawala.rdaRoad')
          else if (rawType.includes('provincial')) localizedType = t('watawala.provincialRoad')

          const lengthStr = props.Length ? `${t('watawala.length')} ${Number(props.Length).toFixed(1)} m · ` : ''
          hits.push({
            id: `road-${props.FID}`,
            layerKey: 'roads',
            label: `${localizedType} #${props.FID}`,
            subtitle: `${lengthStr}${t('watawala.companyName')}`,
            feature: f as unknown as EstateFeature,
          })
        }
      }
    }

    return hits
  }, [query, t])

  // Hit selection handler
  const handleSelectHit = (hit: SearchHit) => {
    const map = mapRef.current
    if (!map) return

    if (hit.id.startsWith('estate-')) {
      const estate = WATAWALA_ESTATES.find((e) => `estate-${e.id}` === hit.id)
      if (estate) {
        const localizedSubtitle =
          estate.id === 'homadola'
            ? t('watawala.homadolaSubtitle')
            : estate.id === 'nakiyadeniya'
            ? t('watawala.nakiyadeniyaSubtitle')
            : estate.id === 'thalangaha'
            ? t('watawala.thalangahaSubtitle')
            : estate.id === 'udugama'
            ? t('watawala.udugamaSubtitle')
            : estate.subtitle

        map.flyTo(estate.center, 15.5, { duration: 1.2 })
        L.popup()
          .setLatLng(estate.center)
          .setContent(`
            <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px 6px;">
              <strong style="color: #071712; font-size: 13px;">${estate.name}</strong>
              <div style="color: #6b7f75; font-size: 11px; margin-top: 3px;">${localizedSubtitle}</div>
            </div>
          `)
          .openOn(map)
      }
    } else {
      const allRoadLayers = [
        estateRoadsLayerRef.current,
        provincialRoadsLayerRef.current,
        rdaRoadsLayerRef.current,
      ]

      // Auto-enable the road layer if it is currently hidden so the selected feature is visible
      const rdType = String((hit.feature as any)?.properties?.RdType || '').trim().toLowerCase()
      if (rdType.includes('rda')) {
        if (!isRdaRoadsVisibleRef.current) handleToggleRdaRoads()
      } else if (rdType.includes('provincial')) {
        if (!isProvincialRoadsVisibleRef.current) handleToggleProvincialRoads()
      } else {
        if (!isEstateRoadsVisibleRef.current) handleToggleEstateRoads()
      }

      for (const group of allRoadLayers) {
        if (!group) continue
        group.eachLayer((layer: any) => {
          if (
            layer.feature &&
            layer.feature.properties?.FID === (hit.feature as any)?.properties?.FID
          ) {
            if (typeof layer.getBounds === 'function') {
              map.flyToBounds(layer.getBounds(), { maxZoom: 18, duration: 1.2 })
            }
            if (typeof layer.openPopup === 'function') {
              setTimeout(() => layer.openPopup(), 400)
            }
          }
        })
      }
    }

    setQuery('')
  }

  // Re-center map to Watawala road bounds
  const handleResetView = () => {
    if (!mapRef.current) return
    mapRef.current.flyToBounds(WATAWALA_BOUNDS, { padding: [25, 25], duration: 1.2 })
  }

  const handleResetLayers = () => {
    setIsEstateRoadsVisible(true)
    isEstateRoadsVisibleRef.current = true
    setIsProvincialRoadsVisible(true)
    isProvincialRoadsVisibleRef.current = true
    setIsRdaRoadsVisible(true)
    isRdaRoadsVisibleRef.current = true
    setIsRgbActive(true)
    isRgbActiveRef.current = true
    setIsSatellite(false)

    const map = mapRef.current
    if (map) {
      if (estateRoadsGroupRef.current && !map.hasLayer(estateRoadsGroupRef.current)) {
        estateRoadsGroupRef.current.addTo(map)
      }
      if (provincialRoadsGroupRef.current && !map.hasLayer(provincialRoadsGroupRef.current)) {
        provincialRoadsGroupRef.current.addTo(map)
      }
      if (rdaRoadsGroupRef.current && !map.hasLayer(rdaRoadsGroupRef.current)) {
        rdaRoadsGroupRef.current.addTo(map)
      }
      if (rgbGroupRef.current && !map.hasLayer(rgbGroupRef.current)) {
        rgbGroupRef.current.addTo(map)
      }
    }
    handleResetView()
  }

  const activeRoadsCount =
    (isEstateRoadsVisible ? 1 : 0) +
    (isProvincialRoadsVisible ? 1 : 0) +
    (isRdaRoadsVisible ? 1 : 0)
  const activeLayersCount = activeRoadsCount + (isRgbActive ? 1 : 0)

  return (
    <div className="plantation-map-shell">
      {/* Underlying Leaflet Map Canvas */}
      <div ref={hostRef} className="plantation-map" />

      {/* Top Bar with Search & Watawala Plantation Center Button */}
      <MapTopBar
        query={query}
        onQueryChange={setQuery}
        onClearQuery={() => setQuery('')}
        searchHits={searchHits}
        onSelectHit={handleSelectHit}
        onResetView={handleResetView}
        estateLabel={t('watawala.estateLabel')}
        placeholder={t('watawala.searchPlaceholder')}
        style={{
          left: isCollapsed ? '160px' : '366px',
          transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Top-Left Rail: Floating Layer Controller (Matching Agalawatte Design) */}
      <div className="map-top-left-rail">
        {isCollapsed ? (
          /* Minimized Floating Pill */
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
              <span className="layer-count-chip">{t('layers.activeCount', { count: activeLayersCount })}</span>
            </span>
            <ChevronDown size={14} className="layer-controller-pill__chevron" />
          </button>
        ) : (
          /* Expanded Layer Controller Panel */
          <section className="map-card layer-controller-floating" aria-label="Watawala Map layers and overlays">
            {/* Header */}
            <div className="map-card__header">
              <div className="layer-controller-header__title">
                <h2>
                  <Layers size={15} />
                  <span>{t('layers.title')}</span>
                  <span className="layer-count-chip">{t('layers.activeCount', { count: activeLayersCount })}</span>
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
                    {t(`roles.${activeRole.toLowerCase()}`) || activeRole}
                  </span>
                </h2>
              </div>
              <div className="layer-controller-header__actions">
                <button
                  className="icon-btn"
                  type="button"
                  title={t('layers.resetTitle')}
                  onClick={handleResetLayers}
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

            {/* Scrollable Layer Groups */}
            <div className="layer-controller__scroll-body">
              {/* Category: Infrastructure & Hydrology */}
              <div className="layer-category">
                <button
                  type="button"
                  className="layer-category__header"
                  onClick={() => setIsInfraOpen((prev) => !prev)}
                  aria-expanded={isInfraOpen}
                >
                  <span className="category-title">{t('layers.infraTitle')}</span>
                  <span className="category-meta">
                    {activeRoadsCount > 0 && (
                      <span className="category-active-tag">{activeRoadsCount}</span>
                    )}
                    <ChevronDown
                      size={13}
                      className={`category-chevron ${isInfraOpen ? 'category-chevron--open' : ''}`}
                    />
                  </span>
                </button>

                {isInfraOpen && (
                  <div className="layer-category__content">
                    {/* 1. Estate Roads */}
                    <button
                      type="button"
                      className={`layer-row ${isEstateRoadsVisible ? 'layer-row--active' : ''}`}
                      onClick={handleToggleEstateRoads}
                      aria-label={t('watawala.estateRoads')}
                    >
                      <span
                        className="layer-swatch"
                        style={{
                          borderColor: isEstateRoadsVisible ? '#D84F4F' : '#94a3b8',
                          background: '#FFFFFF',
                          borderWidth: '2px',
                          opacity: isEstateRoadsVisible ? 1 : 0.6,
                        }}
                      />
                      <span className="layer-copy">
                        <strong style={{ color: isEstateRoadsVisible ? '#172d23' : '#64748b' }}>
                          {t('watawala.estateRoads')}
                        </strong>
                        <small style={{ color: '#6b7f75', fontSize: '10.5px' }}>
                          {t('watawala.segmentsCount', { count: '4,362' })}
                        </small>
                      </span>
                      <span
                        className={`layer-toggle-switch ${isEstateRoadsVisible ? 'layer-toggle-switch--active' : ''}`}
                        aria-hidden="true"
                      >
                        <span className="layer-toggle-switch__thumb" />
                      </span>
                    </button>

                    {/* 2. Provincial Roads */}
                    <button
                      type="button"
                      className={`layer-row ${isProvincialRoadsVisible ? 'layer-row--active' : ''}`}
                      onClick={handleToggleProvincialRoads}
                      aria-label={t('watawala.provincialRoads')}
                    >
                      <span
                        className="layer-swatch"
                        style={{
                          borderColor: isProvincialRoadsVisible ? '#ff7800' : '#94a3b8',
                          background: '#FFFFFF',
                          borderWidth: '2px',
                          opacity: isProvincialRoadsVisible ? 1 : 0.6,
                        }}
                      />
                      <span className="layer-copy">
                        <strong style={{ color: isProvincialRoadsVisible ? '#172d23' : '#64748b' }}>
                          {t('watawala.provincialRoads')}
                        </strong>
                        <small style={{ color: '#6b7f75', fontSize: '10.5px' }}>
                          {t('watawala.segmentsCount', { count: '1,267' })}
                        </small>
                      </span>
                      <span
                        className={`layer-toggle-switch ${isProvincialRoadsVisible ? 'layer-toggle-switch--active' : ''}`}
                        aria-hidden="true"
                      >
                        <span className="layer-toggle-switch__thumb" />
                      </span>
                    </button>

                    {/* 3. RDA Roads */}
                    <button
                      type="button"
                      className={`layer-row ${isRdaRoadsVisible ? 'layer-row--active' : ''}`}
                      onClick={handleToggleRdaRoads}
                      aria-label={t('watawala.rdaRoads')}
                    >
                      <span
                        className="layer-swatch"
                        style={{
                          borderColor: isRdaRoadsVisible ? '#ca8a04' : '#94a3b8',
                          background: '#FFFFFF',
                          borderWidth: '2px',
                          opacity: isRdaRoadsVisible ? 1 : 0.6,
                        }}
                      />
                      <span className="layer-copy">
                        <strong style={{ color: isRdaRoadsVisible ? '#172d23' : '#64748b' }}>
                          {t('watawala.rdaRoads')}
                        </strong>
                        <small style={{ color: '#6b7f75', fontSize: '10.5px' }}>
                          {t('watawala.segmentsCount', { count: '5' })}
                        </small>
                      </span>
                      <span
                        className={`layer-toggle-switch ${isRdaRoadsVisible ? 'layer-toggle-switch--active' : ''}`}
                        aria-hidden="true"
                      >
                        <span className="layer-toggle-switch__thumb" />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Bottom-Left BaseMap & Imagery Layers (Modern Card) */}
      <BaseMapSwitcher
        isSatelliteActive={isSatellite}
        onToggleSatellite={() => setIsSatellite((prev) => !prev)}
        onSelectBaseMap={(bm) => setIsSatellite(bm === 'satellite')}
        isRgbActive={isRgbActive}
        onToggleRgb={() => setIsRgbActive((prev) => !prev)}
      />

      {/* Watawala Estate Stats Badge (Matching VisiGeo info panel) */}
      <div
        style={{
          position: 'absolute',
          bottom: '18px',
          right: '54px',
          zIndex: 700,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #d2ded5',
          borderRadius: '7px',
          padding: '6px 11px',
          fontSize: '11px',
          color: '#1a3328',
          lineHeight: '1.4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#0f291e', marginBottom: '2px' }}>
          {t('watawala.companyName')}
        </div>
        <div style={{ color: '#4b6357', fontSize: '10.5px' }}>
          <strong>{t('watawala.statsEstates')}</strong> {t('watawala.statsEstatesList')}
        </div>
        <div style={{ color: '#4b6357', fontSize: '10.5px' }}>
          <strong>{t('watawala.statsArea')}</strong> 5,900 ha &bull; <strong>{t('watawala.statsOilPalm')}</strong> 347,074 &bull; <strong>{t('watawala.statsCoconut')}</strong> 4,774
        </div>
      </div>

      {/* Vector Data Loading Indicator */}
      {isLoadingVector && (
        <div className="watawala-loading-overlay">
          <div className="clean-spinner" />
          <span>{t('watawala.loadingRoads')}</span>
        </div>
      )}

      {/* Load Error Notice */}
      {loadError && (
        <div className="watawala-error-banner">
          <strong>{t('watawala.gisNotice')}</strong>
          <p>{loadError}</p>
        </div>
      )}
    </div>
  )
}


