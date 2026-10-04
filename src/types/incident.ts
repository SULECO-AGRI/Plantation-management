export type IncidentType =
  | 'pest_outbreak'
  | 'soil_erosion'
  | 'road_blockage'
  | 'irrigation_leak'

export type IncidentSeverity = 'critical' | 'moderate' | 'advisory'

export type IncidentStatus = 'reported' | 'acknowledged' | 'resolved'

export type Incident = {
  id: string
  incidentNumber: string
  type: IncidentType
  typeLabel: string
  title: string
  description: string
  division: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  fieldBlock?: string
  lat: number
  lng: number
  severity: IncidentSeverity
  status: IncidentStatus
  reportedBy: string
  reportedAt: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedBy?: string
  resolvedAt?: string
  resolutionNotes?: string
}
