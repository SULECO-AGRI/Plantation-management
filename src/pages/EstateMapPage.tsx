import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader, PortalTab } from '../components/navigation/AppHeader'
import { PlantationMap, LocateTarget } from '../components/map/PlantationMap'
import { WorkforceView } from '../components/workforce/WorkforceView'
import { TaskKanbanBoard } from '../components/tasks/TaskKanbanBoard'
import { HarvestYieldDashboard } from '../components/harvest/HarvestYieldDashboard'
import { IncidentAlertsTable } from '../components/incidents/IncidentAlertsTable'
import { WorkforceDirectoryModal } from '../components/workforce/WorkforceDirectoryModal'
import type { Worker } from '../types/workforce'
import type { Incident } from '../types/incident'

const VALID_TABS: PortalTab[] = ['map', 'workforce', 'tasks', 'harvest', 'incidents']

export function EstateMapPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as PortalTab | null
  const initialTab: PortalTab = (tabParam && VALID_TABS.includes(tabParam)) ? tabParam : 'map'

  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab)
  const [locateTarget, setLocateTarget] = useState<LocateTarget | null>(null)
  const [isWorkforceModalOpen, setIsWorkforceModalOpen] = useState(false)

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (tab: PortalTab) => {
    setActiveTab(tab)
    setSearchParams({ tab }, { replace: true })
  }

  const handleLocateWorker = (worker: Worker) => {
    setLocateTarget({
      type: 'worker',
      id: worker.id,
      lat: worker.lat,
      lng: worker.lng,
      title: `${worker.name} (${worker.id})`,
    })
    handleTabChange('map')
  }

  const handleLocateIncident = (incident: Incident) => {
    setLocateTarget({
      type: 'incident',
      id: incident.id,
      lat: incident.lat,
      lng: incident.lng,
      title: `${incident.incidentNumber} - ${incident.title}`,
    })
    handleTabChange('map')
  }

  return (
    <main className="estate-page">
      <AppHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenWorkforceModal={() => setIsWorkforceModalOpen(true)}
      />

      {/* Map View: Kept mounted to maintain WebGL/Leaflet layers, drawing state & performance */}
      <div
        className="estate-map-stage"
        style={{ display: activeTab === 'map' ? 'block' : 'none' }}
      >
        <PlantationMap
          locateTarget={locateTarget}
          onClearLocateTarget={() => setLocateTarget(null)}
        />
      </div>

      {/* Workforce GPS View */}
      {activeTab === 'workforce' && (
        <div className="estate-view-stage">
          <WorkforceView onLocateOnMap={handleLocateWorker} />
        </div>
      )}

      {/* Task Kanban Dispatch View */}
      {activeTab === 'tasks' && (
        <div className="estate-view-stage">
          <TaskKanbanBoard />
        </div>
      )}

      {/* Harvest & Yield Logger View */}
      {activeTab === 'harvest' && (
        <div className="estate-view-stage">
          <HarvestYieldDashboard />
        </div>
      )}

      {/* Incident & Alerts Table View */}
      {activeTab === 'incidents' && (
        <div className="estate-view-stage">
          <IncidentAlertsTable onLocateOnMap={handleLocateIncident} />
        </div>
      )}

      {/* Workforce Directory Modal */}
      <WorkforceDirectoryModal
        isOpen={isWorkforceModalOpen}
        onClose={() => setIsWorkforceModalOpen(false)}
        onLocateWorker={handleLocateWorker}
      />
    </main>
  )
}
