import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader, PortalTab } from '../components/navigation/AppHeader'
import { PlantationMap, LocateTarget } from '../components/map/PlantationMap'
import { WorkforceView } from '../components/workforce/WorkforceView'
import { TaskKanbanBoard } from '../components/tasks/TaskKanbanBoard'
import { HarvestYieldDashboard } from '../components/harvest/HarvestYieldDashboard'
import { WorkforceDirectoryModal } from '../components/workforce/WorkforceDirectoryModal'
import { AttendanceMarkingView } from '../components/workforce/AttendanceMarkingView'
import { DailyHarvestEntryView } from '../components/harvest/DailyHarvestEntryView'
import { useAuth } from '../context/AuthContext'
import type { Worker } from '../types/workforce'

const VALID_TABS: PortalTab[] = ['map', 'workforce', 'tasks', 'harvest', 'attendance', 'daily_harvest']
const OFFICER_ONLY_TABS: PortalTab[] = ['attendance', 'daily_harvest']

export function EstateMapPage() {
  const { currentUser } = useAuth()
  const isFieldOfficer = currentUser?.role === 'field_officer' || (currentUser?.role as string) === 'kangany'

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as PortalTab | null

  // Ensure initial tab adheres to field officer role permission
  const safeTabParam =
    tabParam && VALID_TABS.includes(tabParam)
      ? (!isFieldOfficer && OFFICER_ONLY_TABS.includes(tabParam) ? 'map' : tabParam)
      : 'map'

  const [activeTab, setActiveTab] = useState<PortalTab>(safeTabParam)
  const [locateTarget, setLocateTarget] = useState<LocateTarget | null>(null)
  const [isWorkforceModalOpen, setIsWorkforceModalOpen] = useState(false)

  // Active Role Guard: Fallback to map if non-field-officer attempts to open officer tabs
  useEffect(() => {
    if (!isFieldOfficer && OFFICER_ONLY_TABS.includes(activeTab)) {
      handleTabChange('map')
    }
  }, [isFieldOfficer, activeTab])

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      if (!isFieldOfficer && OFFICER_ONLY_TABS.includes(tabParam)) {
        handleTabChange('map')
      } else {
        setActiveTab(tabParam)
      }
    }
  }, [tabParam, isFieldOfficer])

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
      worker,
    })
    handleTabChange('map')
  }

  return (
    <main className={`estate-page ${activeTab !== 'map' ? 'estate-page--scrollable' : ''}`}>
      <AppHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenWorkforceModal={() => setIsWorkforceModalOpen(true)}
      />

      {/* Map View: Kept mounted to maintain WebGL/Leaflet layers, drawing state & performance */}
      <div
        className={`estate-map-stage ${activeTab !== 'map' ? 'estate-map-stage--hidden' : ''}`}
        style={{ display: activeTab === 'map' ? 'flex' : 'none' }}
      >
        <PlantationMap
          isActive={activeTab === 'map'}
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

      {/* Field Officer: Attendance Roll-Call View */}
      {activeTab === 'attendance' && isFieldOfficer && (
        <div className="estate-view-stage">
          <AttendanceMarkingView />
        </div>
      )}

      {/* Field Officer: Daily Harvest Weigh-In View */}
      {activeTab === 'daily_harvest' && isFieldOfficer && (
        <div className="estate-view-stage">
          <DailyHarvestEntryView />
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
