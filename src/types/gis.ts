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

export type LayerKey =
  | 'divisions'
  | 'rambodaFields'
  | 'wewandonFields'
  | 'lillieslandFields'
  | 'camnethanFields'
  | 'weddamullaFields'

export type LayerKind = 'division' | 'field'

export type EstateLayerConfig = {
  key: LayerKey
  label: string
  shortLabel: string
  kind: LayerKind
  url: string
  color: string
  fillColor: string
  defaultVisible: boolean
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
