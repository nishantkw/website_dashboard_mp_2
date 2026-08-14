export type UserRole = 'super_admin' | 'state_admin' | 'bis_user' | 'mh_user' | 'mp_user' | 'ump_user'

export interface AuthUser {
  id: string
  username: string
  name: string
  role: UserRole
  department: string
}

export interface LoginCredentials {
  username: string
  password: string
  role: UserRole
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrator',
  state_admin: 'State Administrator',
  bis_user: 'BIS Operator',
  mh_user: 'Maharashtra Analyst',
  mp_user: 'Madhya Pradesh Analyst',
  ump_user: 'UMP Administrator',
}

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Administrator' },
  { value: 'state_admin', label: 'State Administrator' },
  { value: 'bis_user', label: 'BIS Operator' },
  { value: 'mh_user', label: 'Maharashtra Analyst' },
  { value: 'mp_user', label: 'Madhya Pradesh Analyst' },
  { value: 'ump_user', label: 'UMP Administrator' },
]
