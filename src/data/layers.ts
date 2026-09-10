import type {
  BaseMapId,
  EstateLayerConfig,
  ImageryBaseLayerId,
  LayerKey,
  RasterLayerId,
  RasterOverlayConfig,
} from '../types/gis'

/**
 * Base Map Tile Layer Providers
 */
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const GOOGLE_SATELLITE_TILE_URL = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'

export const BASE_MAP_OPTIONS: Array<{
  id: BaseMapId
  label: string
  subtitle: string
  attribution: string
}> = [
    {
      id: 'osm',
      label: 'OpenStreetMap',
      subtitle: 'Standard OSM vector/raster tiles',
      attribution: '&copy; OpenStreetMap contributors',
    },
    {
      id: 'googleSatellite',
      label: 'Google Satellite',
      subtitle: 'High-res satellite raster imagery',
      attribution: '&copy; Google / Maxar Technologies',
    },
  ]

export const IMAGERY_BASE_LAYER_OPTIONS: Array<{
  id: ImageryBaseLayerId
  label: string
  shortLabel: string
  subtitle: string
  thumbnailType: 'satellite' | 'rgb'
}> = [
  {
    id: 'rgb',
    label: 'RGB Orthomosaic',
    shortLabel: 'RGB Ortho',
    subtitle: 'Weddamulle + Street Map',
    thumbnailType: 'rgb',
  },
  {
    id: 'googleSatellite',
    label: 'Satellite + Weddamulle',
    shortLabel: 'Satellite',
    subtitle: 'Weddamulle + Satellite',
    thumbnailType: 'satellite',
  },
]

/**
 * Root of the supplied Weddemulle VisiGeo site.
 * Can be overridden via local environment variable VITE_VISIGEO_ROOT.
 */
export const VISIGEO_ROOT =
  (import.meta.env.VITE_VISIGEO_ROOT as string | undefined)?.replace(/\/$/, '') ||
  'https://weddemulle-estate.visigeo.com'

/**
 * Weddemulle VisiGeo orthophoto is partitioned into 4 distinct quadrants/areas.
 */
export const VISIGEO_IMAGERY_LAYERS = [
  {
    key: 'area01',
    label: 'VisiGeo Area 01',
    url: `${VISIGEO_ROOT}/rgb/Area%2001/{z}/{x}/{y}.png`,
  },
  {
    key: 'area02',
    label: 'VisiGeo Area 02',
    url: `${VISIGEO_ROOT}/rgb/Area%2002/{z}/{x}/{y}.png`,
  },
  {
    key: 'area03',
    label: 'VisiGeo Area 03',
    url: `${VISIGEO_ROOT}/rgb/Area%2003/{z}/{x}/{y}.png`,
  },
  {
    key: 'area04',
    label: 'VisiGeo Area 04',
    url: `${VISIGEO_ROOT}/rgb/Area%2004/{z}/{x}/{y}.png`,
  },
] as const

/**
 * Terrain & Remote Sensing Layer Definitions
 */
export const TERRAIN_RASTER_LAYERS: RasterOverlayConfig[] = [
  {
    id: 'visigeo',
    label: 'VisiGeo RGB Imagery (Areas 01-04)',
    shortLabel: 'RGB',
    description: 'Weddamulle orthophoto RGB mosaic (Areas 01-04)',
    urlTemplate: `${VISIGEO_ROOT}/rgb/Area%2001/{z}/{x}/{y}.png`,
    category: 'terrain',
    defaultVisible: true,
    minZoom: 13,
    maxZoom: 22,
    opacity: 1.0,
    type: 'visigeo-multi',
  },
  {
    id: 'chm',
    label: 'Canopy Height Model (CHM)',
    shortLabel: 'Canopy Height',
    description: 'LiDAR / photogrammetry tea canopy elevation',
    urlTemplate: `${VISIGEO_ROOT}/rgb/chm/{z}/{x}/{y}.png`,
    category: 'terrain',
    defaultVisible: false,
    minZoom: 13,
    maxZoom: 22,
    opacity: 0.75,
    type: 'raster-tile',
  },
  {
    id: 'slope',
    label: 'Slope Gradient Analysis',
    shortLabel: 'Slope',
    description: 'Thematic slope gradient and steepness analysis',
    urlTemplate: `${VISIGEO_ROOT}/rgb/slope2/{z}/{x}/{y}.png`,
    category: 'terrain',
    defaultVisible: false,
    minZoom: 13,
    maxZoom: 22,
    opacity: 0.7,
    type: 'raster-tile',
  },
  {
    id: 'landuse',
    label: 'Landuse Classification',
    shortLabel: 'Land Use',
    description: 'Vegetation, tea crop and ground classification',
    urlTemplate: `${VISIGEO_ROOT}/rgb/landuse2/{z}/{x}/{y}.png`,
    category: 'terrain',
    defaultVisible: false,
    minZoom: 13,
    maxZoom: 22,
    opacity: 0.75,
    type: 'raster-tile',
  },
]

export const ANALYSIS_RASTER_LAYERS: RasterOverlayConfig[] = TERRAIN_RASTER_LAYERS.filter(
  (layer) => layer.id !== 'visigeo',
)

/**
 * Infrastructure & Hydrology Vector Layers
 */
export const INFRASTRUCTURE_LAYERS: EstateLayerConfig[] = [
  {
    key: 'boundary',
    label: 'Estate Boundary',
    shortLabel: 'Boundary',
    kind: 'boundary',
    url: '/data/boundary.geojson',
    color: '#064e3b',
    fillColor: '#047857',
    fillOpacity: 0.05,
    weight: 2.8,
    defaultVisible: false,
    interactive: false,
    pane: 'boundary_lines',
  },
  {
    key: 'buildings',
    label: 'Estate Buildings',
    shortLabel: 'Buildings',
    kind: 'infrastructure',
    url: '/data/Buildings.geojson',
    color: '#334155',
    fillColor: '#64748b',
    fillOpacity: 0.8,
    weight: 1.5,
    defaultVisible: false,
    interactive: true,
    pane: 'buildings',
  },
  {
    key: 'roads',
    label: 'Estate Road Network',
    shortLabel: 'Roads',
    kind: 'infrastructure',
    url: '/data/Roads.geojson',
    color: '#e11d48',
    weight: 2.2,
    defaultVisible: false,
    interactive: false,
    pane: 'road_network',
  },
  {
    key: 'streams',
    label: 'Streams & Hydrology',
    shortLabel: 'Streams',
    kind: 'infrastructure',
    url: '/data/Streams.geojson',
    color: '#0284c7',
    weight: 2.2,
    defaultVisible: false,
    interactive: false,
    pane: 'hydrology_streams',
  },
]

/**
 * Estate & Agricultural Block Vector Layers
 */
export const ESTATE_LAYERS: EstateLayerConfig[] = [
  {
    key: 'divisions',
    label: 'Weddamulla Divisions',
    shortLabel: 'Divisions',
    kind: 'division',
    url: '/data/Division.geojson',
    color: '#047857',
    fillColor: '#10b981',
    fillOpacity: 0.12,
    weight: 2.4,
    defaultVisible: false,
    interactive: true,
    pane: 'divisions',
  },
  {
    key: 'weddamullaFields',
    label: 'Weddamulla Fields',
    shortLabel: 'Weddamulla',
    kind: 'field',
    url: '/data/Weddamulla_Fields.geojson',
    color: '#f97316',
    fillColor: '#fed7aa',
    fillOpacity: 0.42,
    weight: 1.6,
    defaultVisible: false,
    interactive: true,
    pane: 'fields',
  },
  {
    key: 'rambodaFields',
    label: 'Ramboda Fields',
    shortLabel: 'Ramboda',
    kind: 'field',
    url: '/data/Ramboda_Fields.geojson',
    color: '#ef4444',
    fillColor: '#fecaca',
    fillOpacity: 0.42,
    weight: 1.6,
    defaultVisible: false,
    interactive: true,
    pane: 'fields',
  },
  {
    key: 'camnethanFields',
    label: 'Camnethan Fields',
    shortLabel: 'Camnethan',
    kind: 'field',
    url: '/data/Camnethan_Fields.geojson',
    color: '#3b82f6',
    fillColor: '#bfdbfe',
    fillOpacity: 0.42,
    weight: 1.6,
    defaultVisible: false,
    interactive: true,
    pane: 'fields',
  },
  {
    key: 'lillieslandFields',
    label: 'Lilliesland Fields',
    shortLabel: 'Lilliesland',
    kind: 'field',
    url: '/data/Lilliesland_Fields.geojson',
    color: '#10b981',
    fillColor: '#a7f3d0',
    fillOpacity: 0.42,
    weight: 1.6,
    defaultVisible: false,
    interactive: true,
    pane: 'fields',
  },
  {
    key: 'wewandonFields',
    label: 'Wewandon Fields',
    shortLabel: 'Wewandon',
    kind: 'field',
    url: '/data/Wewandon_Fileds.geojson',
    color: '#a855f7',
    fillColor: '#e9d5ff',
    fillOpacity: 0.42,
    weight: 1.6,
    defaultVisible: false,
    interactive: true,
    pane: 'fields',
  },
]

export const ALL_VECTOR_LAYERS: EstateLayerConfig[] = [
  ...INFRASTRUCTURE_LAYERS,
  ...ESTATE_LAYERS,
]

/**
 * Initial Default Visibility Maps
 */
export const INITIAL_BASEMAP: BaseMapId = 'osm'

export const INITIAL_RASTER_VISIBILITY: Record<RasterLayerId, boolean> = {
  visigeo: true,
  chm: false,
  slope: false,
  landuse: false,
}

export const INITIAL_VECTOR_VISIBILITY: Record<LayerKey, boolean> = Object.fromEntries(
  ALL_VECTOR_LAYERS.map((layer) => [layer.key, layer.defaultVisible]),
) as Record<LayerKey, boolean>

// Legacy export for backward compatibility
export const INITIAL_LAYER_VISIBILITY = INITIAL_VECTOR_VISIBILITY
