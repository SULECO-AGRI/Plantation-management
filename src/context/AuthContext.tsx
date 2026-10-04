import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockAuthService } from '../services/mockAuthService'
import type { Permission, UserProfile, UserRole } from '../types/auth'

type AuthContextType = {
  currentUser: UserProfile | null
  users: UserProfile[]
  isLoading: boolean
  switchRole: (role: UserRole) => Promise<void>
  hasPermission: (permission: Permission) => boolean
  selectedDivisionFilter: string
  setSelectedDivisionFilter: (division: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('All Divisions')

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const [active, allUsers] = await Promise.all([
          mockAuthService.getCurrentUser(),
          mockAuthService.getAllUsers(),
        ])
        if (mounted) {
          setCurrentUser(active)
          setUsers(allUsers)
          if (active.divisionScope !== 'All Divisions') {
            setSelectedDivisionFilter(active.divisionScope)
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  const switchRole = async (role: UserRole) => {
    try {
      setIsLoading(true)
      const updatedUser = await mockAuthService.switchRole(role)
      setCurrentUser(updatedUser)
      if (updatedUser.divisionScope !== 'All Divisions') {
        setSelectedDivisionFilter(updatedUser.divisionScope)
      } else {
        setSelectedDivisionFilter('All Divisions')
      }
    } catch (err) {
      console.error('Failed to switch role:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false
    return mockAuthService.hasPermission(currentUser, permission)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isLoading,
        switchRole,
        hasPermission,
        selectedDivisionFilter,
        setSelectedDivisionFilter,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
