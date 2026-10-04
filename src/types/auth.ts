export type UserRole = 'estate_manager' | 'field_officer' | 'kangany' | 'agronomist'

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

export type UserProfile = {
  id: string
  name: string
  role: UserRole
  roleTitle: string
  badgeColor: string
  avatar: string
  divisionScope: 'All Divisions' | 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'
  assignedDivision?: string
  phone: string
  email: string
  permissions: Permission[]
  description: string
}
