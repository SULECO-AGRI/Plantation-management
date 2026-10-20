import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader, PortalTab } from '../components/navigation/AppHeader'
import { PlantationMap, LocateTarget } from '../components/map/PlantationMap'
import { WatawalaMap } from '../components/map/WatawalaMap'
import { WorkforceView } from '../components/workforce/WorkforceView'
import { TaskKanbanBoard } from '../components/tasks/TaskKanbanBoard'
import { HarvestYieldDashboard } from '../components/harvest/HarvestYieldDashboard'
import { WorkforceDirectoryModal } from '../components/workforce/WorkforceDirectoryModal'
import { AttendanceMarkingView } from '../components/workforce/AttendanceMarkingView'
import { DailyHarvestEntryView } from '../components/harvest/DailyHarvestEntryView'
import { InventoryView } from '../components/inventory/InventoryView'
import { DailySalaryPayView } from '../components/salary/DailySalaryPayView'
import { useAuth } from '../context/AuthContext'
import type { Worker } from '../types/workforce'

const VALID_TABS: PortalTab[] = [
  'map',
  'workforce',
  'tasks',
  'harvest',
  'attendance',
  'daily_harvest',
  'inventory',
  'daily_salary',
]
const OFFICER_ONLY_TABS: PortalTab[] = ['attendance', 'daily_harvest']

type EstateMapPageProps = {
  defaultPlantation?: 'Watawala' | 'Agalawatte'
}

export function EstateMapPage({ defaultPlantation }: EstateMapPageProps) {
  const { currentUser, role, plantationScope, setPlantationScope } = useAuth()
  const isFieldOfficer =
    role === 'Officer' ||
    currentUser?.role === 'field_officer' ||
    (currentUser?.role as string) === 'kangany'

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as PortalTab | null
  const plantationParam = searchParams.get('plantation')

  // Resolve active plantation context based strictly on authenticated credentials:
  // admin_wat, manager_wat, officer_wat -> Watawala
  // admin, manager, officer -> Agalawatte
  const userScope = currentUser?.plantationScope || plantationScope
  const activePlantation: 'Watawala' | 'Agalawatte' =
    userScope?.toLowerCase() === 'watawala'
      ? 'Watawala'
      : userScope?.toLowerCase() === 'agalawatte'
      ? 'Agalawatte'
      : plantationParam?.toLowerCase() === 'watawala'
      ? 'Watawala'
      : plantationParam?.toLowerCase() === 'agalawatte'
      ? 'Agalawatte'
      : defaultPlantation || 'Watawala'

  const isWatawala = activePlantation === 'Watawala'

  // Sync plantation scope to AuthContext if different
  useEffect(() => {
    if (activePlantation && activePlantation !== plantationScope) {
      setPlantationScope(activePlantation)
    }
  }, [activePlantation, plantationScope, setPlantationScope])

  // Synchronize URL query parameter to match active plantation
  useEffect(() => {
    const expectedParam = activePlantation.toLowerCase()
    if (plantationParam?.toLowerCase() !== expectedParam) {
      const currentParams = Object.fromEntries(searchParams.entries())
      setSearchParams({ ...currentParams, plantation: expectedParam }, { replace: true })
    }
  }, [activePlantation, plantationParam, searchParams, setSearchParams])

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
    const currentParams = Object.fromEntries(searchParams.entries())
    setSearchParams({ ...currentParams, tab }, { replace: true })
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

      {/* Map View Stage: Kept mounted to maintain WebGL/Leaflet layers, drawing state & performance.
          Automatically displays WatawalaMap or PlantationMap based on user credentials/authorization */}
      <div
        className={`estate-map-stage ${activeTab !== 'map' ? 'estate-map-stage--hidden' : ''}`}
        style={{ display: activeTab === 'map' ? 'flex' : 'none' }}
      >
        {isWatawala ? (
          <WatawalaMap isActive={activeTab === 'map'} />
        ) : (
          <PlantationMap
            isActive={activeTab === 'map'}
            locateTarget={locateTarget}
            onClearLocateTarget={() => setLocateTarget(null)}
          />
        )}
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

      {/* Inventory Management View */}
      {activeTab === 'inventory' && (
        <div className="estate-view-stage">
          <InventoryView />
        </div>
      )}

      {/* Daily Salary Payment View */}
      {activeTab === 'daily_salary' && (
        <div className="estate-view-stage">
          <DailySalaryPayView />
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
