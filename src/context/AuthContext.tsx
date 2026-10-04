import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockAuthService } from '../services/mockAuthService'
import type { Permission, UserProfile, UserRole } from '../types/auth'

type AuthContextType = {
  currentUser: UserProfile | null
  users: UserProfile[]
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<UserProfile>
  logout: () => Promise<void>
  switchRole: (role: UserRole) => Promise<void>
  hasPermission: (permission: Permission) => boolean
  selectedDivisionFilter: string
  setSelectedDivisionFilter: (division: string) => void
  getRoleDefaultTab: (role: UserRole) => 'map' | 'workforce' | 'tasks' | 'harvest' | 'incidents'
}

export const getRoleDefaultTab = (role: UserRole): 'map' | 'workforce' | 'tasks' | 'harvest' | 'incidents' => {
  switch (role) {
    case 'estate_manager':
      return 'map'
    case 'field_officer':
      return 'tasks'
    case 'kangany':
      return 'harvest'
    case 'agronomist':
      return 'incidents'
    default:
      return 'map'
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('All Divisions')

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const [active, allUsers, authStatus] = await Promise.all([
          mockAuthService.getCurrentUser(),
          mockAuthService.getAllUsers(),
          mockAuthService.checkIsAuthenticated(),
        ])
        if (mounted) {
          setCurrentUser(active)
          setUsers(allUsers)
          setIsAuthenticated(authStatus)
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

  const login = async (username: string, password: string): Promise<UserProfile> => {
    try {
      setIsLoading(true)
      const user = await mockAuthService.login(username, password)
      setCurrentUser(user)
      setIsAuthenticated(true)
      if (user.divisionScope !== 'All Divisions') {
        setSelectedDivisionFilter(user.divisionScope)
      } else {
        setSelectedDivisionFilter('All Divisions')
      }
      return user
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await mockAuthService.logout()
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

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
        isAuthenticated,
        login,
        logout,
        switchRole,
        hasPermission,
        selectedDivisionFilter,
        setSelectedDivisionFilter,
        getRoleDefaultTab,
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
