import { normalizeRole, type StandardRole, type UserRole } from '../types/auth'

/**
 * Base data URL resolved dynamically relative to Vite's BASE_URL and public/data.
 * Guarantees zero machine-specific hardcoded paths.
 */
export const DATA_BASE_URL: string = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/data`

/**
 * Convert any data path (relative, public/data, or /data) to a safe public URL.
 */
export function resolveDataPath(relativePath: string): string {
  if (!relativePath) return DATA_BASE_URL
  
  // Clean up any potential hardcoded or absolute machine prefixes
  let clean = relativePath.replace(/\\/g, '/')
  
  // Strip common leading aliases
  clean = clean.replace(/^\/?public\/data\//, '')
  clean = clean.replace(/^\/?public\//, '')
  clean = clean.replace(/^\/?data\//, '')
  clean = clean.replace(/^\//, '')

  return `${DATA_BASE_URL}/${clean}`
}

export type LayerRolePermission = {
  roles: StandardRole[]
  category: 'operational' | 'monitoring' | 'administrative' | 'hydrology'
}

export type PlantationLayerDef = {
  key: string
  label: string
  shortLabel: string
  path?: string
  externalUrl?: string
  category: 'operational' | 'monitoring' | 'administrative' | 'hydrology'
  allowedRoles: StandardRole[]
  defaultVisible: boolean
  description: string
}

export const WATAWALA_METADATA = {
  id: 'Watawala',
  name: 'Watawala Plantations PLC',
  region: 'Southern & Central Provinces, Sri Lanka',
  visigeoUrl: 'https://watawala-plantations-plc.visigeo.com/',
  center: [6.208, 80.345] as [number, number],
  defaultZoom: 13,
  layers: [
    {
      key: 'watawala-roads',
      label: 'Estate Road & Access Network',
      shortLabel: 'Roads & Access',
      path: resolveDataPath('Watawala/Road_Layer.geojson.geojson'),
      category: 'operational',
      allowedRoles: ['Admin', 'Manager', 'Officer'],
      defaultVisible: true,
      description: 'Provincial and internal arterial estate access paths for harvest & field teams.',
    },
    {
      key: 'watawala-visigeo-aerial',
      label: 'VisiGeo High-Res Drone Orthophoto',
      shortLabel: 'Drone Ortho',
      externalUrl: 'https://watawala-plantations-plc.visigeo.com/',
      category: 'monitoring',
      allowedRoles: ['Admin', 'Manager'],
      defaultVisible: true,
      description: 'Centimeter-level drone imagery and remote sensing spatial layers.',
    },
    {
      key: 'watawala-blocks',
      label: 'Agricultural Blocks & Field Parcels',
      shortLabel: 'Field Blocks',
      category: 'operational',
      allowedRoles: ['Admin', 'Manager', 'Officer'],
      defaultVisible: true,
      description: 'Field zones and operational tea & rubber blocks.',
    },
    {
      key: 'watawala-telemetry',
      label: 'Workforce Muster & GPS Telemetry',
      shortLabel: 'Field Telemetry',
      category: 'operational',
      allowedRoles: ['Admin', 'Officer'],
      defaultVisible: false,
      description: 'Real-time GPS pinpoints of field teams and harvest muster check-ins.',
    },
    {
      key: 'watawala-analytics',
      label: 'NDVI & Vegetation Yield VRA',
      shortLabel: 'Yield & VRA',
      category: 'monitoring',
      allowedRoles: ['Admin', 'Manager'],
      defaultVisible: false,
      description: 'Spectral indices, canopy variability and variable-rate input maps.',
    },
    {
      key: 'watawala-boundary',
      label: 'Corporate Estate Concession Boundary',
      shortLabel: 'Boundary',
      category: 'administrative',
      allowedRoles: ['Admin'],
      defaultVisible: true,
      description: 'Official survey cadastral boundary limits for Watawala Plantations PLC.',
    },
  ] as PlantationLayerDef[],
}

export const AGALAWATTE_METADATA = {
  id: 'Agalawatte',
  name: 'Agalawatte / Weddamulla Estate',
  region: 'Nuwara Eliya / Central Highlands, Sri Lanka',
  visigeoUrl: 'https://weddemulle-estate.visigeo.com/',
  center: [6.953, 80.686] as [number, number],
  defaultZoom: 15,
  layers: [
    {
      key: 'roads',
      label: 'Estate Road Network',
      shortLabel: 'Roads',
      path: resolveDataPath('Agalawatte/Roads.geojson'),
      category: 'operational',
      allowedRoles: ['Admin', 'Manager', 'Officer'],
      defaultVisible: true,
      description: 'Field roads and logistical access paths.',
    },
    {
      key: 'divisions',
      label: 'Weddamulla Divisions',
      shortLabel: 'Divisions',
      path: resolveDataPath('Agalawatte/Division.geojson'),
      category: 'monitoring',
      allowedRoles: ['Admin', 'Manager'],
      defaultVisible: true,
      description: 'Five key divisions across the estate.',
    },
    {
      key: 'fields',
      label: 'Agricultural Fields',
      shortLabel: 'Fields',
      path: resolveDataPath('Agalawatte/Weddamulla_Fields.geojson'),
      category: 'operational',
      allowedRoles: ['Admin', 'Manager', 'Officer'],
      defaultVisible: true,
      description: 'Cultivated tea plots with plucking history.',
    },
    {
      key: 'boundary',
      label: 'Estate Perimeter Boundary',
      shortLabel: 'Boundary',
      path: resolveDataPath('Agalawatte/boundary.geojson'),
      category: 'administrative',
      allowedRoles: ['Admin'],
      defaultVisible: false,
      description: 'Outer cadastral survey perimeter.',
    },
    {
      key: 'streams',
      label: 'Streams & Hydrology',
      shortLabel: 'Streams',
      path: resolveDataPath('Agalawatte/Streams.geojson'),
      category: 'hydrology',
      allowedRoles: ['Admin', 'Manager'],
      defaultVisible: true,
      description: 'Catchment streams, natural drainage lines and waterways.',
    },
    {
      key: 'buildings',
      label: 'Estate Buildings & Infrastructure',
      shortLabel: 'Buildings',
      path: resolveDataPath('Agalawatte/Buildings.geojson'),
      category: 'administrative',
      allowedRoles: ['Admin', 'Manager', 'Officer'],
      defaultVisible: true,
      description: 'Tea factories, muster sheds, offices, and bungalows.',
    },
  ] as PlantationLayerDef[],
}

/**
 * Filter layer definitions according to the active role:
 * - Admin: Full access (operational, monitoring, administrative, hydrology)
 * - Manager: Monitoring layers (monitoring, operational fields, hydrology, overview)
 * - Officer: Operational field layers (operational roads, field plots, muster telemetry)
 */
export function getFilteredLayersByRole(
  role: UserRole | string | undefined | null,
  plantation: 'Watawala' | 'Agalawatte' | string = 'Watawala'
): PlantationLayerDef[] {
  const normRole = normalizeRole(role)
  const meta = plantation.toLowerCase() === 'agalawatte' ? AGALAWATTE_METADATA : WATAWALA_METADATA

  return meta.layers.filter((layer) => {
    if (normRole === 'Admin') return true // Admin has full access
    if (normRole === 'Worker') return false
    return layer.allowedRoles.includes(normRole)
  })
}

/**
 * Check whether a specific layer is accessible by a given role.
 */
export function isLayerAllowedForRole(
  layerKey: string,
  role: UserRole | string | undefined | null,
  plantation: 'Watawala' | 'Agalawatte' | string = 'Watawala'
): boolean {
  const normRole = normalizeRole(role)
  if (normRole === 'Admin') return true
  const layers = getFilteredLayersByRole(normRole, plantation)
  return layers.some((l) => l.key === layerKey)
}

/**
 * Utility to fetch GeoJSON with multi-path resolution and robust fallbacks.
 */
export async function loadPlantationGeoJson<T = unknown>(
  relativePath: string,
  signal?: AbortSignal
): Promise<T> {
  const targetUrl = resolveDataPath(relativePath)
  let response = await fetch(targetUrl, { signal })

  // Fallback try without subfolder if not found
  if (!response.ok && targetUrl.includes('/Watawala/')) {
    const flatUrl = targetUrl.replace('/Watawala/', '/')
    const fallbackRes = await fetch(flatUrl, { signal })
    if (fallbackRes.ok) {
      response = fallbackRes
    }
  } else if (!response.ok && targetUrl.includes('/Agalawatte/')) {
    const flatUrl = targetUrl.replace('/Agalawatte/', '/')
    const fallbackRes = await fetch(flatUrl, { signal })
    if (fallbackRes.ok) {
      response = fallbackRes
    }
  }

  if (!response.ok) {
    throw new Error(`Failed to load GIS data from ${targetUrl} (Status: ${response.status})`)
  }

  return (await response.json()) as T
}
