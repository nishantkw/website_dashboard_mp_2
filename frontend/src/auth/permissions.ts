import type { UserRole } from './types'

const ROLE_ROUTE_ACCESS: Record<UserRole, string[]> = {
  super_admin: ['*'],
  state_admin: ['*'],
  bis_user: ['/dashboard/bis'],
  mh_user: ['/dashboard/mh'],
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
    super_admin: ['overview', 'user_management', 'bis', 'mh', 'mp', 'ump'],
    state_admin: ['overview', 'user_management', 'bis', 'mh', 'mp', 'ump'],
    bis_user: ['bis'],
    mh_user: ['mh'],
    mp_user: ['mp'],
    ump_user: ['ump'],
  }
  return navAccess[role]?.includes(navId) ?? false
}
