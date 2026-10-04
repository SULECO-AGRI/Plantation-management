import React from 'react'
import { AuthProvider } from './AuthContext'
import { WorkforceProvider } from './WorkforceContext'
import { TaskProvider } from './TaskContext'
import { HarvestProvider } from './HarvestContext'
import { IncidentProvider } from './IncidentContext'

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <WorkforceProvider>
        <TaskProvider>
          <HarvestProvider>
            <IncidentProvider>
              {children}
            </IncidentProvider>
          </HarvestProvider>
        </TaskProvider>
      </WorkforceProvider>
    </AuthProvider>
  )
}
