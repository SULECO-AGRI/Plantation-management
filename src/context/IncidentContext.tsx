import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockIncidentService, ReportIncidentDTO } from '../services/mockIncidentService'
import type { Incident, IncidentSeverity, IncidentStatus } from '../types/incident'

type IncidentContextType = {
  incidents: Incident[]
  isLoading: boolean
  isIncidentLayerVisible: boolean
  setIsIncidentLayerVisible: (visible: boolean) => void
  selectedIncident: Incident | null
  setSelectedIncident: (incident: Incident | null) => void
  isReportModalOpen: boolean
  setIsReportModalOpen: (open: boolean) => void
  dropLocation: { lat: number; lng: number } | null
  setDropLocation: (loc: { lat: number; lng: number } | null) => void
  reportIncident: (dto: ReportIncidentDTO) => Promise<Incident>
  acknowledgeIncident: (id: string, name: string) => Promise<Incident>
  resolveIncident: (id: string, name: string, notes?: string) => Promise<Incident>
  refreshIncidents: () => Promise<void>
  severityFilter: IncidentSeverity | 'all'
  setSeverityFilter: (sev: IncidentSeverity | 'all') => void
  statusFilter: IncidentStatus | 'all'
  setStatusFilter: (status: IncidentStatus | 'all') => void
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined)

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isIncidentLayerVisible, setIsIncidentLayerVisible] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [dropLocation, setDropLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all')

  const fetchIncidents = async () => {
    try {
      setIsLoading(true)
      const data = await mockIncidentService.getIncidents({
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      setIncidents(data)
    } catch (err) {
      console.error('Failed to load incidents:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [severityFilter, statusFilter])

  const reportIncident = async (dto: ReportIncidentDTO): Promise<Incident> => {
    const created = await mockIncidentService.reportIncident(dto)
    setIncidents((prev) => [created, ...prev])
    return created
  }

  const acknowledgeIncident = async (id: string, name: string): Promise<Incident> => {
    const updated = await mockIncidentService.acknowledgeIncident(id, name)
    setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)))
    if (selectedIncident?.id === id) setSelectedIncident(updated)
    return updated
  }

  const resolveIncident = async (id: string, name: string, notes?: string): Promise<Incident> => {
    const updated = await mockIncidentService.resolveIncident(id, name, notes)
    setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)))
    if (selectedIncident?.id === id) setSelectedIncident(updated)
    return updated
  }

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        isLoading,
        isIncidentLayerVisible,
        setIsIncidentLayerVisible,
        selectedIncident,
        setSelectedIncident,
        isReportModalOpen,
        setIsReportModalOpen,
        dropLocation,
        setDropLocation,
        reportIncident,
        acknowledgeIncident,
        resolveIncident,
        refreshIncidents: fetchIncidents,
        severityFilter,
        setSeverityFilter,
        statusFilter,
        setStatusFilter,
      }}
    >
      {children}
    </IncidentContext.Provider>
  )
}

export const useIncident = (): IncidentContextType => {
  const context = useContext(IncidentContext)
  if (!context) {
    throw new Error('useIncident must be used within an IncidentProvider')
  }
  return context
}
