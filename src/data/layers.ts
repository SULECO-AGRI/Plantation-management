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
  thumbnailType: 'osm' | 'osmOrtho' | 'satellite' | 'satelliteOrtho'
}> = [
  {
    id: 'osm',
    label: 'OpenStreetMap (Base Map)',
    shortLabel: 'Street Map',
    subtitle: 'Standard Map',
    thumbnailType: 'osm',
  },
  {
    id: 'osmOrtho',
    label: 'Street Map + RGB Ortho',
    shortLabel: 'RGB Ortho',
    subtitle: 'Street + RGB Drone',
    thumbnailType: 'osmOrtho',
  },
  {
    id: 'googleSatellite',
    label: 'Google Satellite Base',
    shortLabel: 'Satellite',
    subtitle: 'Satellite Map',
    thumbnailType: 'satellite',
  },
  {
    id: 'satelliteOrtho',
    label: 'Satellite + RGB Ortho',
    shortLabel: 'Sat + Ortho',
    subtitle: 'Satellite + RGB Drone',
    thumbnailType: 'satelliteOrtho',
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
    minZoom: 12,
    maxZoom: 22,
    opacity: 1.0,
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
    minZoom: 12,
    maxZoom: 22,
    opacity: 1.0,
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
    minZoom: 12,
    maxZoom: 22,
    opacity: 1.0,
    type: 'raster-tile',
  },
]

export const ANALYSIS_RASTER_LAYERS: RasterOverlayConfig[] = TERRAIN_RASTER_LAYERS.filter(
  (layer) => layer.id !== 'visigeo',
)

/**
 * Exact Cartographic HEX & RGB Color Definitions Sampled from Survey Sheets
 */
export const CARTOGRAPHIC_COLORS = {
  // General Features & Infrastructure
  estateBoundary: { hex: '#333430', rgb: 'rgb(51, 52, 48)', label: 'Estate Outer Boundary' },
  fieldBoundary: { hex: '#3A3A36', rgb: 'rgb(58, 58, 54)', label: 'Field Parcel Boundary (Thin Light Black)' },
  selectedField: { hex: '#6C004B', rgb: 'rgb(108, 0, 75)', label: 'Selected Field Border (Survey Plum)' },
  divisionBoundary: { hex: '#6E716B', rgb: 'rgb(110, 113, 107)', label: 'Division Boundary' },
  divisionFill: { hex: '#F1F0EB', rgb: 'rgb(241, 240, 235)', label: 'All Divisions Base Fill' },
  buildings: { hex: '#6C004B', rgb: 'rgb(108, 0, 75)', label: 'Buildings / Built-up Footprints' },
  roadsPrimary: { hex: '#B86B3E', rgb: 'rgb(184, 107, 62)', label: 'Roads (Primary / Collector / Main)' },
  roadsLocal: { hex: '#8E8A85', rgb: 'rgb(142, 138, 133)', label: 'Roads (Local Road / Track / Footpath)' },
  streams: { hex: '#7EB9C4', rgb: 'rgb(126, 185, 196)', label: 'Streams & Watercourses' },
  contourIndex: { hex: '#C18A5A', rgb: 'rgb(193, 138, 90)', label: 'Contour Lines (Index)' },
  contourMinor: { hex: '#DBC9A9', rgb: 'rgb(219, 201, 169)', label: 'Contour Lines (Intermediate / Minor)' },

  // Division & Agricultural Field Thematic Fills
  divisions: {
    weddamulla: { hex: '#F0D090', rgb: 'rgb(240, 208, 144)', label: 'Weddamulla', tone: 'Soft warm amber' },
    camnethan: { hex: '#F0D8D8', rgb: 'rgb(240, 216, 216)', label: 'Camnethan', tone: 'Soft pale blush peach' },
    lilliesland: { hex: '#E8D8F0', rgb: 'rgb(232, 216, 240)', label: 'Lilliesland', tone: 'Soft pale pastel lilac' },
    ramboda: { hex: '#C0BFB3', rgb: 'rgb(192, 191, 179)', label: 'Ramboda', tone: 'Neutral warm stone grey' },
    wewandon: { hex: '#E0F0C0', rgb: 'rgb(224, 240, 192)', label: 'Wewandon', tone: 'Pale light chartreuse' },
  },

  // Land Use Categories (Land Cover Maps)
  landUse: {
    tea: { hex: '#B04818', rgb: 'rgb(176, 72, 24)', label: 'Tea Cultivation' },
    shrubs: { hex: '#E8A018', rgb: 'rgb(232, 160, 24)', label: 'Green Shrubs / Scrub' },
    forest: { hex: '#408018', rgb: 'rgb(64, 128, 24)', label: 'High Vegetation / Forest' },
    vegetable: { hex: '#80B018', rgb: 'rgb(128, 176, 24)', label: 'Vegetable Cultivation' },
    developed: { hex: '#6C004B', rgb: 'rgb(108, 0, 75)', label: 'Developed Area' },
  },

  // Canopy Height Model (CHM / Vegetation Strata)
  chm: [
    { range: '0–2 m', label: 'Low / Undergrowth (0–2 m)', hex: '#FFFFBE', rgb: 'rgb(255, 255, 190)' },
    { range: '2–5 m', label: 'Medium Canopy (Tea / Shrubs, 2–5 m)', hex: '#8CD056', rgb: 'rgb(140, 208, 86)' },
    { range: '5–15 m+', label: 'High Canopy / Shade Trees (5–15 m+)', hex: '#236B15', rgb: 'rgb(35, 107, 21)' },
  ],

  // Slope Classification (Topographic Gradient)
  slope: [
    { range: '0°–15°', label: 'Gentle / Flat (0°–15°)', hex: '#38A800', rgb: 'rgb(56, 168, 0)' },
    { range: '15°–30°', label: 'Moderate Slope (15°–30°)', hex: '#FFD300', rgb: 'rgb(255, 211, 0)' },
    { range: '30°–45°', label: 'Steep Slope (30°–45°)', hex: '#FF7F00', rgb: 'rgb(255, 127, 0)' },
    { range: '>45°', label: 'Very Steep / Cliff (>45°)', hex: '#E60000', rgb: 'rgb(230, 0, 0)' },
  ],
} as const

export const DIVISION_THEME_COLORS: Record<string, string> = {
  weddamulla: CARTOGRAPHIC_COLORS.divisions.weddamulla.hex,
  ramboda: CARTOGRAPHIC_COLORS.divisions.ramboda.hex,
  camnethan: CARTOGRAPHIC_COLORS.divisions.camnethan.hex,
  lilliesland: CARTOGRAPHIC_COLORS.divisions.lilliesland.hex,
  wewandon: CARTOGRAPHIC_COLORS.divisions.wewandon.hex,
}

export const LANDUSE_THEME_COLORS: Record<string, string> = {
  'Tea Cultivation': CARTOGRAPHIC_COLORS.landUse.tea.hex,
  'Green Shrubs / Scrub': CARTOGRAPHIC_COLORS.landUse.shrubs.hex,
  'Grassland & Fodder': CARTOGRAPHIC_COLORS.landUse.shrubs.hex,
  'High Vegetation / Forest': CARTOGRAPHIC_COLORS.landUse.forest.hex,
  'High Mountain Forest': CARTOGRAPHIC_COLORS.landUse.forest.hex,
  'Vegetable Cultivation': CARTOGRAPHIC_COLORS.landUse.vegetable.hex,
  'Commercial Vegetable': CARTOGRAPHIC_COLORS.landUse.vegetable.hex,
  'Developed Area': CARTOGRAPHIC_COLORS.landUse.developed.hex,
  'Estate Development & Yards': CARTOGRAPHIC_COLORS.landUse.developed.hex,
}

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
    color: CARTOGRAPHIC_COLORS.estateBoundary.hex,
    fillColor: CARTOGRAPHIC_COLORS.estateBoundary.hex,
    fillOpacity: 0.04,
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
    color: CARTOGRAPHIC_COLORS.buildings.hex,
    fillColor: CARTOGRAPHIC_COLORS.buildings.hex,
    fillOpacity: 0.85,
    weight: 1.5,
    defaultVisible: true,
    interactive: true,
    pane: 'buildings',
  },
  {
    key: 'roads',
    label: 'Estate Road Network',
    shortLabel: 'Roads',
    kind: 'infrastructure',
    url: '/data/Roads.geojson',
    color: CARTOGRAPHIC_COLORS.roadsPrimary.hex,
    fillColor: '#FAF4EE',
    weight: 1.4,
    defaultVisible: true,
    interactive: false,
    pane: 'road_network',
  },
  {
    key: 'streams',
    label: 'Streams & Hydrology',
    shortLabel: 'Streams',
    kind: 'infrastructure',
    url: '/data/Streams.geojson',
    color: CARTOGRAPHIC_COLORS.streams.hex,
    fillColor: '#E8F2FA',
    weight: 1.2,
    defaultVisible: true,
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
    color: CARTOGRAPHIC_COLORS.divisionBoundary.hex,
    fillColor: CARTOGRAPHIC_COLORS.divisionFill.hex,
    fillOpacity: 0.50,
    weight: 1.8,
    defaultVisible: true,
    interactive: true,
    pane: 'divisions',
  },
  {
    key: 'weddamullaFields',
    label: 'Weddamulla Fields',
    shortLabel: 'Weddamulla',
    kind: 'field',
    url: '/data/Weddamulla_Fields.geojson',
    color: '#2A2A2A',
    fillColor: CARTOGRAPHIC_COLORS.divisions.weddamulla.hex,
    fillOpacity: 0.65,
    weight: 0.75,
    defaultVisible: true,
    interactive: true,
    pane: 'fields',
  },
  {
    key: 'rambodaFields',
    label: 'Ramboda Fields',
    shortLabel: 'Ramboda',
    kind: 'field',
    url: '/data/Ramboda_Fields.geojson',
    color: '#2A2A2A',
    fillColor: CARTOGRAPHIC_COLORS.divisions.ramboda.hex,
    fillOpacity: 0.65,
    weight: 0.75,
    defaultVisible: true,
    interactive: true,
    pane: 'fields',
  },
  {
    key: 'camnethanFields',
    label: 'Camnethan Fields',
    shortLabel: 'Camnethan',
    kind: 'field',
    url: '/data/Camnethan_Fields.geojson',
    color: '#2A2A2A',
    fillColor: CARTOGRAPHIC_COLORS.divisions.camnethan.hex,
    fillOpacity: 0.65,
    weight: 0.75,
    defaultVisible: true,
    interactive: true,
    pane: 'fields',
  },
  {
    key: 'lillieslandFields',
    label: 'Lilliesland Fields',
    shortLabel: 'Lilliesland',
    kind: 'field',
    url: '/data/Lilliesland_Fields.geojson',
    color: '#2A2A2A',
    fillColor: CARTOGRAPHIC_COLORS.divisions.lilliesland.hex,
    fillOpacity: 0.65,
    weight: 0.75,
    defaultVisible: true,
    interactive: true,
    pane: 'fields',
  },
  {
    key: 'wewandonFields',
    label: 'Wewandon Fields',
    shortLabel: 'Wewandon',
    kind: 'field',
    url: '/data/Wewandon_Fileds.geojson',
    color: '#2A2A2A',
    fillColor: CARTOGRAPHIC_COLORS.divisions.wewandon.hex,
    fillOpacity: 0.65,
    weight: 0.75,
    defaultVisible: true,
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
  visigeo: false,
  chm: false,
  slope: false,
  landuse: false,
}

export const INITIAL_VECTOR_VISIBILITY: Record<LayerKey, boolean> = Object.fromEntries(
  ALL_VECTOR_LAYERS.map((layer) => [layer.key, layer.defaultVisible]),
) as Record<LayerKey, boolean>

// Legacy export for backward compatibility
export const INITIAL_LAYER_VISIBILITY = INITIAL_VECTOR_VISIBILITY

