export type GisScalar = string | number | boolean | null
export type GisProperties = Record<string, GisScalar>

export type DivisionProperties = GisProperties & {
  OBJECTID?: number
  Name?: string
  ID?: number
  Area?: number
  Total_area?: number
  Div_Pct?: number
  Tea_ac?: number
  Veg_ac?: number
  Grass_ac?: number
  HighVeg_ac?: number
  Dev_ac?: number
  Shape_Length?: number
  Shape_Area?: number
}

export type FieldProperties = GisProperties & {
  OBJECTID?: number
  Division?: string
  Field_No?: string
  Shape_Length?: number
  Shape_Area?: number
}

export type EstateFeatureProperties = DivisionProperties | FieldProperties

export type GeoJsonGeometry = {
  type: string
  coordinates: unknown
}

export type EstateFeature = {
  type: 'Feature'
  id?: string | number
  geometry: GeoJsonGeometry | null
  properties: EstateFeatureProperties
}

export type EstateFeatureCollection = {
  type: 'FeatureCollection'
  features: EstateFeature[]
}

export type BaseMapId = 'osm' | 'googleSatellite'

export type RasterLayerId =
  | 'visigeo'
  | 'chm'
  | 'slope'
  | 'landuse'

export type LayerKey =
  | 'boundary'
  | 'buildings'
  | 'roads'
  | 'streams'
  | 'divisions'
  | 'weddamullaFields'
  | 'rambodaFields'
  | 'camnethanFields'
  | 'lillieslandFields'
  | 'wewandonFields'

export type LayerKind = 'division' | 'field' | 'infrastructure' | 'boundary'

export type EstateLayerConfig = {
  key: LayerKey
  label: string
  shortLabel: string
  kind: LayerKind
  url: string
  color: string
  fillColor?: string
  fillOpacity?: number
  defaultVisible: boolean
  interactive?: boolean
  weight?: number
  pane?: string
}

export type RasterOverlayConfig = {
  id: RasterLayerId
  label: string
  shortLabel: string
  description: string
  urlTemplate: string
  category: 'terrain'
  defaultVisible: boolean
  minZoom?: number
  maxZoom?: number
  opacity?: number
  type: 'visigeo-multi' | 'raster-tile'
}

export type SelectedEstateFeature = {
  layerKey: LayerKey
  layerLabel: string
  kind: LayerKind
  feature: EstateFeature
  center: { lat: number; lng: number }
}

export type SearchHit = {
  id: string
  layerKey: LayerKey
  label: string
  subtitle: string
  feature: EstateFeature
}

export type DivisionBreakdown = {
  teaAcres?: number
  vegAcres?: number
  grassAcres?: number
  highVegAcres?: number
  devAcres?: number
  estateSharePct?: number
  totalEstateAcres?: number
}
