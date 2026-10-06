import { MOCK_USERS } from '../data/mockUsers'
import type { Permission, UserProfile, UserRole } from '../types/auth'
import { delay, loadFromStorage, saveToStorage } from './apiClient'

const AUTH_STORAGE_KEY = 'plantation_active_user_role'
const AUTH_LOGGED_IN_KEY = 'plantation_user_logged_in'

export interface IAuthService {
  getCurrentUser(): Promise<UserProfile>
  switchRole(role: UserRole): Promise<UserProfile>
  getAllUsers(): Promise<UserProfile[]>
  hasPermission(user: UserProfile, permission: Permission): boolean
  login(username: string, password: string): Promise<UserProfile>
  logout(): Promise<void>
  checkIsAuthenticated(): Promise<boolean>
}

class MockAuthService implements IAuthService {
  private users: UserProfile[] = MOCK_USERS

  async getCurrentUser(): Promise<UserProfile> {
    await delay(150)
    let storedRole = loadFromStorage<string>(AUTH_STORAGE_KEY, 'super_admin')
    if (storedRole === 'estate_manager') {
      storedRole = 'super_admin'
      saveToStorage(AUTH_STORAGE_KEY, 'super_admin')
    } else if (storedRole === 'kangany' || storedRole === 'agronomist') {
      storedRole = 'field_officer'
      saveToStorage(AUTH_STORAGE_KEY, 'field_officer')
    }
    const found = this.users.find((u) => u.role === storedRole)
    return found || this.users[0]
  }

  async switchRole(role: UserRole): Promise<UserProfile> {
    await delay(180)
    const target = this.users.find((u) => u.role === role)
    if (!target) {
      throw new Error(`Role "${role}" does not exist.`)
    }
    saveToStorage(AUTH_STORAGE_KEY, role)
    return target
  }

  async getAllUsers(): Promise<UserProfile[]> {
    await delay(120)
    return [...this.users]
  }

  hasPermission(user: UserProfile, permission: Permission): boolean {
    return user.permissions.includes(permission)
  }

  async login(username: string, password: string): Promise<UserProfile> {
    await delay(250)
    const trimmedUser = username.trim().toLowerCase()
    const trimmedPass = password.trim()

    if (!trimmedUser) {
      throw new Error('Please enter your username or work email address.')
    }
    if (!trimmedPass) {
      throw new Error('Please enter your access password.')
    }

    const matched = this.users.find((u) => {
      const uName = (u.username || '').toLowerCase()
      const uEmail = (u.email || '').toLowerCase()
      const uRole = (u.role || '').toLowerCase()
      return uName === trimmedUser || uEmail === trimmedUser || uRole === trimmedUser
    })

    if (!matched) {
      throw new Error(`No user profile found for "${username}". Try "admin", "manager", "officer", or "worker".`)
    }

    // Accept user password or standard demo passwords
    const validPasswords = [matched.password, 'estate123', 'password', 'password123', 'admin', matched.role]
    if (!validPasswords.includes(trimmedPass)) {
      throw new Error('Incorrect password. For testing, you may use "estate123" or click any Demo Account below.')
    }

    saveToStorage(AUTH_STORAGE_KEY, matched.role)
    saveToStorage(AUTH_LOGGED_IN_KEY, true)
    return matched
  }

  async logout(): Promise<void> {
    await delay(150)
    saveToStorage(AUTH_LOGGED_IN_KEY, false)
  }

  async checkIsAuthenticated(): Promise<boolean> {
    await delay(100)
    return loadFromStorage<boolean>(AUTH_LOGGED_IN_KEY, false)
  }
}

export const mockAuthService = new MockAuthService()
