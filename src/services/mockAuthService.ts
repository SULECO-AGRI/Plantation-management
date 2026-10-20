import { MOCK_USERS } from '../data/mockUsers'
import { normalizeRole, type Permission, type UserProfile, type UserRole } from '../types/auth'
import { delay, loadFromStorage, saveToStorage } from './apiClient'

const AUTH_STORAGE_KEY = 'plantation_active_user_role'
const AUTH_LOGGED_IN_KEY = 'plantation_user_logged_in'
const AUTH_USER_DATA_KEY = 'plantation_active_user_data'
const PLANTATION_SCOPE_KEY = 'plantation_active_scope'

export interface IAuthService {
  getCurrentUser(): Promise<UserProfile | null>
  switchRole(role: UserRole): Promise<UserProfile>
  getAllUsers(): Promise<UserProfile[]>
  hasPermission(user: UserProfile, permission: Permission): boolean
  login(username: string, password?: string): Promise<UserProfile>
  logout(): Promise<void>
  checkIsAuthenticated(): Promise<boolean>
  getPlantationScope(): string
  setPlantationScope(scope: string): void
}

class MockAuthService implements IAuthService {
  private users: UserProfile[] = MOCK_USERS

  getPlantationScope(): string {
    return loadFromStorage<string>(PLANTATION_SCOPE_KEY, 'Watawala')
  }

  setPlantationScope(scope: string): void {
    saveToStorage(PLANTATION_SCOPE_KEY, scope)
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    await delay(120)
    const isLoggedIn = loadFromStorage<boolean>(AUTH_LOGGED_IN_KEY, false)
    if (!isLoggedIn) {
      return null
    }

    const storedUser = loadFromStorage<UserProfile | null>(AUTH_USER_DATA_KEY, null)
    if (storedUser) {
      return storedUser
    }

    let storedRole = loadFromStorage<string>(AUTH_STORAGE_KEY, 'super_admin')
    if (storedRole === 'estate_manager') {
      storedRole = 'super_admin'
      saveToStorage(AUTH_STORAGE_KEY, 'super_admin')
    } else if (storedRole === 'kangany' || storedRole === 'agronomist') {
      storedRole = 'field_officer'
      saveToStorage(AUTH_STORAGE_KEY, 'field_officer')
    }

    const norm = normalizeRole(storedRole)
    const storedScope = this.getPlantationScope()
    const isWatawala = storedScope.toLowerCase() === 'watawala'
    const found = this.users.find((u) => {
      const uIsWat = (u.plantationScope || '').toLowerCase() === 'watawala'
      return normalizeRole(u.role) === norm && uIsWat === isWatawala
    }) || this.users[0]
    return found
  }

  async switchRole(role: UserRole): Promise<UserProfile> {
    await delay(150)
    const norm = normalizeRole(role)
    const target = this.users.find((u) => normalizeRole(u.role) === norm) || this.users.find((u) => u.role === role)
    if (!target) {
      throw new Error(`Role "${role}" does not exist.`)
    }
    const currentScope = this.getPlantationScope()
    const updated = { ...target, plantationScope: currentScope }
    saveToStorage(AUTH_STORAGE_KEY, target.role)
    saveToStorage(AUTH_USER_DATA_KEY, updated)
    return updated
  }

  async getAllUsers(): Promise<UserProfile[]> {
    await delay(100)
    return [...this.users]
  }

  hasPermission(user: UserProfile, permission: Permission): boolean {
    return user.permissions.includes(permission)
  }

  async login(username: string, password: string = ''): Promise<UserProfile> {
    await delay(200)
    const trimmedUser = username.trim().toLowerCase()
    const trimmedPass = password.trim()

    if (!trimmedUser) {
      throw new Error('Please enter your username or work email address.')
    }

    let matched: UserProfile | undefined

    // 1. Exact match on username or email
    matched = this.users.find((u) => {
      const uName = (u.username || '').toLowerCase()
      const uEmail = (u.email || '').toLowerCase()
      return uName === trimmedUser || uEmail === trimmedUser
    })

    // 2. Direct aliases for Watawala (admin_wat, manager_wat, officer_wat)
    if (!matched) {
      if (
        trimmedUser === 'admin_wat' ||
        trimmedUser === 'admin.wat' ||
        trimmedUser === 'admin_watawala' ||
        trimmedUser === 'admin@watawala.lk'
      ) {
        matched = this.users.find((u) => u.id === 'user-watawala-admin')
      } else if (
        trimmedUser === 'manager_wat' ||
        trimmedUser === 'manager.wat' ||
        trimmedUser === 'manager_watawala' ||
        trimmedUser === 'manager@watawala.lk'
      ) {
        matched = this.users.find((u) => u.id === 'user-watawala-manager')
      } else if (
        trimmedUser === 'officer_wat' ||
        trimmedUser === 'officer.wat' ||
        trimmedUser === 'officer_watawala' ||
        trimmedUser === 'officer@watawala.lk'
      ) {
        matched = this.users.find((u) => u.id === 'user-watawala-officer')
      }
    }

    // 3. Direct aliases for Agalawatte (admin, manager, officer)
    if (!matched) {
      if (
        trimmedUser === 'admin' ||
        trimmedUser === 'admin_agalawatte' ||
        trimmedUser === 'admin@weddamulla-tea.lk' ||
        trimmedUser === 'admin@agalawatte.lk'
      ) {
        matched = this.users.find((u) => u.id === 'user-agalawatte-admin')
      } else if (
        trimmedUser === 'manager' ||
        trimmedUser === 'manager_agalawatte' ||
        trimmedUser === 'manager@weddamulla-tea.lk' ||
        trimmedUser === 'manager@agalawatte.lk'
      ) {
        matched = this.users.find((u) => u.id === 'user-agalawatte-manager')
      } else if (
        trimmedUser === 'officer' ||
        trimmedUser === 'officer_agalawatte' ||
        trimmedUser === 'officer@weddamulla-tea.lk' ||
        trimmedUser === 'officer@agalawatte.lk'
      ) {
        matched = this.users.find((u) => u.id === 'user-agalawatte-officer')
      }
    }

    if (!matched) {
      throw new Error(
        `Invalid credentials. Please use:\n• Agalawatte Map: admin, manager, officer (Password: estate123)\n• Watawala Map: admin_wat, manager_wat, officer_wat (Password: estate123)`
      )
    }

    // Validate password if provided
    if (trimmedPass) {
      const validPasswords = [
        matched.password,
        'estate123',
        'password',
        'password123',
        'admin',
      ]
      if (!validPasswords.includes(trimmedPass)) {
        throw new Error('Incorrect password. For testing access, use "estate123".')
      }
    }

    const plantationScope = matched.plantationScope || 'Agalawatte'
    const authenticatedUser: UserProfile = {
      ...matched,
      plantationScope,
    }

    this.setPlantationScope(plantationScope)
    saveToStorage(AUTH_STORAGE_KEY, matched.role)
    saveToStorage(AUTH_USER_DATA_KEY, authenticatedUser)
    saveToStorage(AUTH_LOGGED_IN_KEY, true)

    return authenticatedUser
  }

  async logout(): Promise<void> {
    await delay(100)
    saveToStorage(AUTH_LOGGED_IN_KEY, false)
    try {
      localStorage.removeItem(AUTH_USER_DATA_KEY)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(PLANTATION_SCOPE_KEY)
    } catch {
      // Ignore in environments without window.localStorage
    }
  }

  async checkIsAuthenticated(): Promise<boolean> {
    await delay(50)
    return loadFromStorage<boolean>(AUTH_LOGGED_IN_KEY, false)
  }
}

export const mockAuthService = new MockAuthService()
