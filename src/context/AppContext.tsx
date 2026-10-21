import React from 'react'
import { LanguageProvider } from './LanguageContext'
import { AuthProvider } from './AuthContext'
import { WorkforceProvider } from './WorkforceContext'
import { TaskProvider } from './TaskContext'
import { HarvestProvider } from './HarvestContext'
import { IncidentProvider } from './IncidentContext'
import { InventoryProvider } from './InventoryContext'
import { SalaryProvider } from './SalaryContext'

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <WorkforceProvider>
          <TaskProvider>
            <HarvestProvider>
              <IncidentProvider>
                <InventoryProvider>
                  <SalaryProvider>
                    {children}
                  </SalaryProvider>
                </InventoryProvider>
              </IncidentProvider>
            </HarvestProvider>
          </TaskProvider>
        </WorkforceProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}
