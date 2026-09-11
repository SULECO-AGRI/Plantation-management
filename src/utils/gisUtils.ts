import L from 'leaflet'
import type {
  DivisionBreakdown,
  DivisionProperties,
  EstateFeature,
  EstateFeatureCollection,
  EstateFeatureProperties,
  GisScalar,
  LayerKind,
} from '../types/gis'

/**
 * Fetch and parse a GeoJSON file from the given URL.
 */
export async function fetchGeoJson(url: string, signal?: AbortSignal): Promise<EstateFeatureCollection> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Failed to load ${url} (${response.status})`)
  }
  const json = await response.json()
  return json as EstateFeatureCollection
}

/**
 * Safely converts a scalar to a trimmed string.
 */
export function text(value: GisScalar | undefined | null): string {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

/**
 * Safely extracts a finite number from a scalar.
 */
export function numeric(value: GisScalar | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/**
 * Format a numeric value with standard formatting.
 */
export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
  }).format(value)
}

/**
 * Conversion formulas
 */
export function squareMetresToHectares(squareMetres: number): number {
  return squareMetres / 10_000
}

export function squareMetresToAcres(squareMetres: number): number {
  return squareMetres / 4046.8564224
}

export function acresToHectares(acres: number): number {
  return acres * 0.40468564224
}

/**
 * Get formatted division title (e.g. "WEWANDON DIVISION", "WEDDAMULLA DIVISION").
 */
export function getDivisionName(feature: EstateFeature | null | undefined): string {
  if (!feature) return 'Estate Division'
  const p = feature.properties || {}
  const rawName = String(p.Name || '').trim()
  if (rawName && rawName.toLowerCase() !== 'division') {
    return rawName.toUpperCase().includes('DIVISION') ? rawName.toUpperCase() : `${rawName.toUpperCase()} DIVISION`
  }
  const id = String(feature.id ?? p.ID ?? p.OBJECTID ?? '')
  if (id === '1' || id.toLowerCase().includes('wewandon')) return 'WEWANDON DIVISION'
  if (id === '2' || id.toLowerCase().includes('weddamulla')) return 'WEDDAMULLA DIVISION'
  if (id === '3' || id.toLowerCase().includes('ramboda')) return 'RAMBODA DIVISION'
  if (id === '4' || id.toLowerCase().includes('lilliesland')) return 'LILLIESLAND DIVISION'
  if (id === '5' || id.toLowerCase().includes('camnethan')) return 'CAMNETHAN DIVISION'
  return 'ESTATE DIVISION'
}

/**
 * Safe title for a feature based on its properties and layer kind.
 */
export function featureTitle(feature: EstateFeature | null | undefined, kind: LayerKind): string {
  if (!feature || !feature.properties) return 'Unknown Feature'
  const p = feature.properties
  if (kind === 'boundary') {
    return 'Weddamulle Estate Boundary'
  }
  if (kind === 'infrastructure') {
    return text(p.Name) || text(p.Type) || (p.OBJECTID ? `Infrastructure #${p.OBJECTID}` : 'Estate Infrastructure')
  }
  if (kind === 'division') {
    return getDivisionName(feature)
  }
  return `Field ${text(p.Field_No) || text(p.OBJECTID) || 'Unknown'}`
}

/**
 * Safe subtitle for a feature based on its properties and layer kind.
 */
export function featureSubtitle(feature: EstateFeature | null | undefined, kind: LayerKind): string {
  if (!feature || !feature.properties) return 'Estate feature'
  const p = feature.properties
  if (kind === 'boundary') {
    return 'Outer plantation perimeter'
  }
  if (kind === 'infrastructure') {
    return text(p.Type) || 'Infrastructure asset'
  }
  if (kind === 'field') {
    const div = text(p.Division)
    return div ? `Division ${div}` : 'Estate field'
  }
  const area = numeric(p.Area)
  return area ? `${formatNumber(area)} acres` : 'Estate division'
}

/**
 * Safe calculation of area metrics in acres and hectares.
 */
export function getAreaSummary(
  properties: EstateFeatureProperties | null | undefined,
  kind: LayerKind,
): { primary: string; secondary: string; source: string } | null {
  if (!properties) return null

  if (kind === 'division') {
    const acres = numeric(properties.Area)
    if (acres !== undefined && acres > 0) {
      return {
        primary: `${formatNumber(acres)} ac`,
        secondary: `${formatNumber(acresToHectares(acres))} ha`,
        source: 'Area',
      }
    }
  }

  const squareMetres = numeric(properties.Shape_Area)
  if (squareMetres !== undefined && squareMetres > 0) {
    return {
      primary: `${formatNumber(squareMetresToHectares(squareMetres))} ha`,
      secondary: `${formatNumber(squareMetresToAcres(squareMetres))} ac`,
      source: 'Shape_Area',
    }
  }

  const directAcres = numeric(properties.Area) ?? numeric(properties.Total_area)
  if (directAcres !== undefined && directAcres > 0) {
    return {
      primary: `${formatNumber(directAcres)} ac`,
      secondary: `${formatNumber(acresToHectares(directAcres))} ha`,
      source: 'Area',
    }
  }

  return null
}

/**
 * Extract structured division land use metrics.
 */
export function getDivisionBreakdown(properties: EstateFeatureProperties | null | undefined): DivisionBreakdown | null {
  if (!properties) return null
  const p = properties as DivisionProperties
  const teaAcres = numeric(p.Tea_ac)
  const vegAcres = numeric(p.Veg_ac)
  const grassAcres = numeric(p.Grass_ac)
  const highVegAcres = numeric(p.HighVeg_ac)
  const devAcres = numeric(p.Dev_ac)
  const estateSharePct = numeric(p.Div_Pct)
  const totalEstateAcres = numeric(p.Total_area)

  if (
    teaAcres === undefined &&
    vegAcres === undefined &&
    grassAcres === undefined &&
    estateSharePct === undefined
  ) {
    return null
  }

  return {
    teaAcres,
    vegAcres,
    grassAcres,
    highVegAcres,
    devAcres,
    estateSharePct,
    totalEstateAcres,
  }
}

/**
 * Safely compute the geographical center of a Leaflet layer.
 */
export function getFeatureCenter(layer: L.Layer | null | undefined): { lat: number; lng: number } {
  if (!layer) return { lat: 7.05894, lng: 80.70995 }

  try {
    if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
      const bounds = layer.getBounds()
      if (bounds && bounds.isValid()) {
        const center = bounds.getCenter()
        return { lat: center.lat, lng: center.lng }
      }
    }

    if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
      const latlng = layer.getLatLng()
      if (latlng) {
        return { lat: latlng.lat, lng: latlng.lng }
      }
    }
  } catch {
    // Return fallback coordinate if Leaflet layer methods fail
  }

  return { lat: 7.05894, lng: 80.70995 }
}

/**
 * Human-readable alias for GIS property keys.
 */
export function humanizePropertyKey(key: string): string {
  if (!key) return ''
  const aliases: Record<string, string> = {
    OBJECTID: 'Object ID',
    ID: 'Division ID',
    Name: 'Division Name',
    Division: 'Division',
    Field_No: 'Field Number',
    Total_area: 'Estate Total Area',
    Div_Pct: 'Estate Share',
    Tea_ac: 'Tea Cultivation Area',
    Veg_ac: 'Vegetation Area',
    Grass_ac: 'Grass Area',
    HighVeg_ac: 'High Vegetation Area',
    Dev_ac: 'Developed / Infrastructure Area',
    Shape_Length: 'Boundary Perimeter',
    Shape_Area: 'Geometry Area',
  }
  return aliases[key] || key.replace(/_/g, ' ')
}

/**
 * Format a GIS property value for display.
 */
export function formatPropertyValue(key: string, value: GisScalar | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = numeric(value)

  if (n !== undefined) {
    if (key.endsWith('_ac') || key === 'Area' || key === 'Total_area') {
      return `${formatNumber(n)} ac`
    }
    if (key === 'Div_Pct') {
      return `${formatNumber(n)}%`
    }
    if (key === 'Shape_Area') {
      return `${formatNumber(n)} m²`
    }
    if (key === 'Shape_Length') {
      return `${formatNumber(n)} m`
    }
    return formatNumber(n)
  }

  return String(value)
}

/**
 * Ray-casting point-in-polygon test for a single linear ring of coordinates [lng, lat].
 */
export function isPointInPolygon(point: { lat: number; lng: number }, ring: number[][]): boolean {
  if (!ring || ring.length < 3) return false
  let inside = false
  const x = point.lng
  const y = point.lat

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Check whether a geographic coordinate { lat, lng } falls inside a GeoJSON feature geometry.
 */
export function isPointInFeature(point: { lat: number; lng: number }, feature: EstateFeature): boolean {
  if (!feature || !feature.geometry) return false
  const geom = feature.geometry

  if (geom.type === 'Polygon') {
    const rings = geom.coordinates as number[][][]
    if (!Array.isArray(rings) || rings.length === 0) return false
    // Inside outer boundary and not inside holes
    if (isPointInPolygon(point, rings[0])) {
      for (let i = 1; i < rings.length; i++) {
        if (isPointInPolygon(point, rings[i])) return false
      }
      return true
    }
    return false
  }

  if (geom.type === 'MultiPolygon') {
    const polygons = geom.coordinates as number[][][][]
    if (!Array.isArray(polygons)) return false
    for (const polygon of polygons) {
      if (Array.isArray(polygon) && polygon.length > 0 && isPointInPolygon(point, polygon[0])) {
        let inHole = false
        for (let i = 1; i < polygon.length; i++) {
          if (isPointInPolygon(point, polygon[i])) {
            inHole = true
            break
          }
        }
        if (!inHole) return true
      }
    }
    return false
  }

  return false
}

/**
 * Extract searchable string from a feature's properties and identifiers.
 */
export function searchableText(feature: EstateFeature): string {
  if (!feature || !feature.properties) return ''
  return Object.values(feature.properties)
    .filter((v) => v !== null && v !== undefined)
    .map((v) => String(v).toLowerCase())
    .join(' ')
}
