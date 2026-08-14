import type { AuthUser, UserRole } from './types'

interface MockUserRecord extends AuthUser {
  password: string
}

export const mockUsers: MockUserRecord[] = [
  {
    id: '0',
    username: 'superadmin',
    password: 'admin123',
    name: 'Super Administrator',
    role: 'super_admin',
    department: 'State Health Agency',
  },
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    role: 'state_admin',
    department: 'State Health Agency',
  },
  {
    id: '2',
    username: 'bis.user',
    password: 'demo123',
    name: 'Priya Sharma',
    role: 'bis_user',
    department: 'BIS - Card Printing',
  },
  {
    id: '3',
    username: 'mh.user',
    password: 'demo123',
    name: 'Amit Patil',
    role: 'mh_user',
    department: 'Maharashtra Data Mart',
  },
  {
    id: '4',
    username: 'mp.user',
    password: 'demo123',
    name: 'Rajesh Kumar',
    role: 'mp_user',
    department: 'Madhya Pradesh Data Mart',
  },
  {
    id: '5',
    username: 'ump.user',
    password: 'demo123',
    name: 'Sunita Desai',
    role: 'ump_user',
    department: 'User Management Platform',
  },
]

export function authenticateUser(
  username: string,
  password: string,
  role: UserRole
): AuthUser | null {
  const user = mockUsers.find(
    (u) =>
      u.username === username.trim() &&
      u.password === password &&
      u.role === role
  )
  if (!user) return null
  const { password: _, ...authUser } = user
  return authUser
}

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/dashboard/admin/user-management'
    case 'state_admin':
      return '/dashboard'
    case 'bis_user':
      return '/dashboard/bis/card-printing'
    case 'mh_user':
      return '/dashboard/mh/claims'
    case 'mp_user':
      return '/dashboard/mp/claims-payments'
    case 'ump_user':
      return '/dashboard/ump/users'
  }
}
