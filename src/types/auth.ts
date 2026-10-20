export type StandardRole = 'Admin' | 'Manager' | 'Officer'
export type LegacyRole = 'super_admin' | 'division_manager' | 'field_officer' | 'worker'
export type UserRole = StandardRole | LegacyRole

export function normalizeRole(role: UserRole | string | undefined | null): StandardRole | 'Worker' {
  if (!role) return 'Officer'
  const r = role.toLowerCase().trim()
  if (r === 'admin' || r === 'super_admin' || r === 'estate_manager') return 'Admin'
  if (r === 'manager' || r === 'division_manager') return 'Manager'
  if (r === 'officer' || r === 'field_officer' || r === 'kangany' || r === 'agronomist') return 'Officer'
  return 'Worker'
}

export type Permission =
  | 'view_all_divisions'
  | 'view_assigned_division_only'
  | 'view_financial_estimates'
  | 'approve_weigh_in'
  | 'create_task'
  | 'assign_task'
  | 'update_task_status'
  | 'log_harvest'
  | 'report_incident'
  | 'resolve_incident'
  | 'export_reports'

export type PlantationId = 'Watawala' | 'Agalawatte'

export type UserProfile = {
  id: string
  username: string
  name: string
  role: UserRole
  roleTitle: string
  badgeColor: string
  avatar: string
  plantationScope?: 'Watawala' | 'Agalawatte' | 'All' | string
  divisionScope?: 'All Divisions' | 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon' | string
  assignedDivision?: string
  assignedField?: string
  phone: string
  email: string
  permissions: Permission[]
  description: string
  password?: string
  defaultTab?: 'map' | 'workforce' | 'tasks' | 'harvest' | 'incidents' | 'attendance' | 'daily_harvest' | 'inventory' | 'daily_salary'
}

export type LoginCredentials = {
  username: string
  password?: string
  role?: StandardRole | UserRole
  plantationScope?: PlantationId | string
  rememberMe?: boolean
}

