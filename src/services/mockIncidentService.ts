import { MOCK_INCIDENTS } from '../data/mockIncidents'
import type { Incident, IncidentSeverity, IncidentStatus, IncidentType } from '../types/incident'
import { delay, loadFromStorage, saveToStorage } from './apiClient'

const INCIDENTS_STORAGE_KEY = 'plantation_incidents_data'

export type ReportIncidentDTO = {
  type: IncidentType
  title: string
  description: string
  division: 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  fieldBlock?: string
  lat: number
  lng: number
  severity: IncidentSeverity
  reportedBy?: string
}

export interface IIncidentService {
  getIncidents(filters?: { division?: string; status?: IncidentStatus; severity?: IncidentSeverity }): Promise<Incident[]>
  getIncidentById(id: string): Promise<Incident | null>
  reportIncident(dto: ReportIncidentDTO): Promise<Incident>
  acknowledgeIncident(id: string, acknowledgedBy: string): Promise<Incident>
  resolveIncident(id: string, resolvedBy: string, notes?: string): Promise<Incident>
}

class MockIncidentService implements IIncidentService {
  private getStore(): Incident[] {
    return loadFromStorage<Incident[]>(INCIDENTS_STORAGE_KEY, MOCK_INCIDENTS)
  }

  private setStore(incidents: Incident[]): void {
    saveToStorage(INCIDENTS_STORAGE_KEY, incidents)
  }

  private typeLabels: Record<IncidentType, string> = {
    pest_outbreak: 'Pest Outbreak',
    soil_erosion: 'Soil Erosion / Landslip Risk',
    road_blockage: 'Road Network Obstruction',
    irrigation_leak: 'Hydrology / Irrigation Leak',
  }

  async getIncidents(filters?: { division?: string; status?: IncidentStatus; severity?: IncidentSeverity }): Promise<Incident[]> {
    await delay(180)
    let list = this.getStore()

    if (filters?.division && filters.division !== 'All Divisions') {
      list = list.filter((i) => i.division === filters.division)
    }
    if (filters?.status) {
      list = list.filter((i) => i.status === filters.status)
    }
    if (filters?.severity) {
      list = list.filter((i) => i.severity === filters.severity)
    }

    return list
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    await delay(120)
    const list = this.getStore()
    return list.find((i) => i.id === id) || null
  }

  async reportIncident(dto: ReportIncidentDTO): Promise<Incident> {
    await delay(250)
    const list = this.getStore()
    const nextSeq = list.length + 15
    const now = new Date()
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`

    const newIncident: Incident = {
      id: `INC-${Date.now()}`,
      incidentNumber: `ALR-2026-${String(nextSeq).padStart(3, '0')}`,
      type: dto.type,
      typeLabel: this.typeLabels[dto.type] || dto.type,
      title: dto.title,
      description: dto.description,
      division: dto.division,
      fieldBlock: dto.fieldBlock,
      lat: dto.lat,
      lng: dto.lng,
      severity: dto.severity,
      status: 'reported',
      reportedBy: dto.reportedBy || 'Field Reporter',
      reportedAt: timestamp,
    }

    const updated = [newIncident, ...list]
    this.setStore(updated)
    return newIncident
  }

  async acknowledgeIncident(id: string, acknowledgedBy: string): Promise<Incident> {
    await delay(160)
    const list = this.getStore()
    const index = list.findIndex((i) => i.id === id)
    if (index === -1) throw new Error(`Incident with id ${id} not found`)

    const now = new Date()
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`

    const updated: Incident = {
      ...list[index],
      status: 'acknowledged',
      acknowledgedBy,
      acknowledgedAt: timestamp,
    }

    list[index] = updated
    this.setStore(list)
    return updated
  }

  async resolveIncident(id: string, resolvedBy: string, notes?: string): Promise<Incident> {
    await delay(180)
    const list = this.getStore()
    const index = list.findIndex((i) => i.id === id)
    if (index === -1) throw new Error(`Incident with id ${id} not found`)

    const now = new Date()
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`

    const updated: Incident = {
      ...list[index],
      status: 'resolved',
      resolvedBy,
      resolvedAt: timestamp,
      resolutionNotes: notes || 'Incident resolved and verified on-site.',
    }

    list[index] = updated
    this.setStore(list)
    return updated
  }
}

export const mockIncidentService = new MockIncidentService()
