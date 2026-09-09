import type { EstateLayerConfig, LayerKey } from '../types/gis'

/**
 * Public OpenStreetMap base layer.
 * This stays underneath the Weddemulle VisiGeo orthophoto imagery so that
 * roads, place names, rivers and other geographic context remain visible
 * anywhere the estate imagery has no coverage.
 */
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

/**
 * Root of the supplied Weddemulle VisiGeo site.
 * You can override it in a local .env file with VITE_VISIGEO_ROOT.
 */
export const VISIGEO_ROOT =
  (import.meta.env.VITE_VISIGEO_ROOT as string | undefined)?.replace(/\/$/, '') ||
  'https://weddemulle-estate.visigeo.com'

/**
 * Weddemulle VisiGeo does not expose one combined /rgb/{z}/{x}/{y}.png layer.
 * The estate orthophoto is split across four separate RGB tile sets.
 *
 * Example observed request:
 * https://weddemulle-estate.visigeo.com/rgb/Area%2001/16/47460/31479.png
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

export const ESTATE_LAYERS: EstateLayerConfig[] = [
  {
    key: 'divisions',
    label: 'Estate divisions',
    shortLabel: 'Divisions',
    kind: 'division',
    url: '/data/Division.geojson',
    color: '#e9c96f',
    fillColor: '#b18c31',
    defaultVisible: true,
  },
  {
    key: 'rambodaFields',
    label: 'Ramboda fields',
    shortLabel: 'Ramboda',
    kind: 'field',
    url: '/data/Ramboda_Fields.geojson',
    color: '#7dd3b0',
    fillColor: '#2b8c67',
    defaultVisible: true,
  },
  {
    key: 'wewandonFields',
    label: 'Wewandon fields',
    shortLabel: 'Wewandon',
    kind: 'field',
    url: '/data/Wewandon_Fileds.geojson',
    color: '#93c5fd',
    fillColor: '#3b82f6',
    defaultVisible: true,
  },
  {
    key: 'lillieslandFields',
    label: 'Lilliesland fields',
    shortLabel: 'Lilliesland',
    kind: 'field',
    url: '/data/Lilliesland_Fields.geojson',
    color: '#f9a8d4',
    fillColor: '#db2777',
    defaultVisible: true,
  },
  {
    key: 'camnethanFields',
    label: 'Camnethan fields',
    shortLabel: 'Camnethan',
    kind: 'field',
    url: '/data/Camnethan_Fields.geojson',
    color: '#fdba74',
    fillColor: '#ea580c',
    defaultVisible: true,
  },
  {
    key: 'weddamullaFields',
    label: 'Weddamulla fields',
    shortLabel: 'Weddamulla',
    kind: 'field',
    url: '/data/Weddamulla_Fields.geojson',
    color: '#c4b5fd',
    fillColor: '#7c3aed',
    defaultVisible: true,
  },
]

export const INITIAL_LAYER_VISIBILITY: Record<LayerKey, boolean> = Object.fromEntries(
  ESTATE_LAYERS.map((layer) => [layer.key, layer.defaultVisible]),
) as Record<LayerKey, boolean>
