import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockAuthService } from '../services/mockAuthService'
import {
  normalizeRole,
  type Permission,
  type StandardRole,
  type UserProfile,
  type UserRole,
} from '../types/auth'

type AuthContextType = {
  currentUser: UserProfile | null
  role: StandardRole | 'Worker'
  plantationScope: string
  setPlantationScope: (plantation: string) => void
  users: UserProfile[]
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password?: string) => Promise<UserProfile>
  logout: () => Promise<void>
  switchRole: (role: UserRole) => Promise<void>
  hasPermission: (permission: Permission) => boolean
  selectedDivisionFilter: string
  setSelectedDivisionFilter: (division: string) => void
  getRoleDefaultTab: (role: UserRole) => 'map' | 'workforce' | 'tasks' | 'harvest' | 'incidents'
}

export const getRoleDefaultTab = (role: UserRole): 'map' | 'workforce' | 'tasks' | 'harvest' | 'incidents' => {
  const norm = normalizeRole(role)
  switch (norm) {
    case 'Admin':
      return 'map'
    case 'Manager':
      return 'harvest'
    case 'Officer':
      return 'tasks'
    case 'Worker':
      return 'workforce'
    default:
      return 'map'
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [plantationScope, setPlantationScopeState] = useState<string>('Watawala')
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
          const userToSet = authStatus && active ? active : null
          const scope = userToSet?.plantationScope || mockAuthService.getPlantationScope() || 'Watawala'
          setCurrentUser(userToSet)
          setPlantationScopeState(scope)
          setUsers(allUsers)
          setIsAuthenticated(authStatus && !!userToSet)
          if (userToSet?.divisionScope && userToSet.divisionScope !== 'All Divisions') {
            setSelectedDivisionFilter(userToSet.divisionScope)
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

  const setPlantationScope = (plantation: string) => {
    setPlantationScopeState(plantation)
    mockAuthService.setPlantationScope(plantation)
    if (currentUser) {
      const updated = { ...currentUser, plantationScope: plantation }
      setCurrentUser(updated)
    }
  }

  const login = async (username: string, password?: string): Promise<UserProfile> => {
    try {
      setIsLoading(true)
      const user = await mockAuthService.login(username, password)
      setCurrentUser(user)
      setIsAuthenticated(true)
      const scope = user.plantationScope || 'Watawala'
      setPlantationScopeState(scope)

      if (user.divisionScope && user.divisionScope !== 'All Divisions') {
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
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const switchRole = async (role: UserRole) => {
    try {
      setIsLoading(true)
      const updatedUser = await mockAuthService.switchRole(role)
      setCurrentUser(updatedUser)
      if (updatedUser.divisionScope && updatedUser.divisionScope !== 'All Divisions') {
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

  const role = normalizeRole(currentUser?.role)

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        plantationScope,
        setPlantationScope,
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
