import type { UserRole } from './types'

const ROLE_ROUTE_ACCESS: Record<UserRole, string[]> = {
  super_admin: ['*'],
  state_admin: ['*'],
  bis_user: ['/dashboard/bis'],
  mp_user: ['/dashboard/mp'],
  ump_user: ['/dashboard/ump'],
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const allowed = ROLE_ROUTE_ACCESS[role]
  if (!allowed) return false
  if (allowed.includes('*')) return true
  return allowed.some((prefix) => path.startsWith(prefix))
}

export function canAccessNavItem(role: UserRole, navId: string): boolean {
  const navAccess: Record<UserRole, string[]> = {
    super_admin: ['overview', 'user_management', 'import_bulk_data', 'bis', 'mp', 'ump'],
    state_admin: ['overview', 'user_management', 'import_bulk_data', 'bis', 'mp', 'ump'],
    bis_user: ['bis'],
    mp_user: ['mp'],
    ump_user: ['ump'],
  }
  return navAccess[role]?.includes(navId) ?? false
}

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/dashboard/admin/user-management'
    case 'state_admin':
      return '/dashboard'
    case 'bis_user':
      return '/dashboard/bis/card-printing'
    case 'mp_user':
      return '/dashboard/mp/claims-payments'
    case 'ump_user':
      return '/dashboard/ump/users'
    default:
      return '/dashboard'
  }
}
