import { MOCK_USERS } from '../data/mockUsers'
import type { Permission, UserProfile, UserRole } from '../types/auth'
import { delay, loadFromStorage, saveToStorage } from './apiClient'

const AUTH_STORAGE_KEY = 'plantation_active_user_role'

export interface IAuthService {
  getCurrentUser(): Promise<UserProfile>
  switchRole(role: UserRole): Promise<UserProfile>
  getAllUsers(): Promise<UserProfile[]>
  hasPermission(user: UserProfile, permission: Permission): boolean
}

class MockAuthService implements IAuthService {
  private users: UserProfile[] = MOCK_USERS

  async getCurrentUser(): Promise<UserProfile> {
    await delay(150)
    const storedRole = loadFromStorage<UserRole>(AUTH_STORAGE_KEY, 'estate_manager')
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
}

export const mockAuthService = new MockAuthService()
