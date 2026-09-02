import type { UserRole } from './types'

/** Local/dev helper only — real login always goes through the API. */
export const demoAccounts: { id: string; username: string; password: string; role: UserRole; name: string }[] = [
  {
    id: '0',
    username: 'superadmin',
    password: 'admin123',
    name: 'Super Administrator',
    role: 'super_admin',
  },
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    role: 'state_admin',
  },
  {
    id: '2',
    username: 'bis.user',
    password: 'demo123',
    name: 'Priya Sharma',
    role: 'bis_user',
  },
  {
    id: '4',
    username: 'mp.user',
    password: 'demo123',
    name: 'Rajesh Kumar',
    role: 'mp_user',
  },
  {
    id: '5',
    username: 'ump.user',
    password: 'demo123',
    name: 'Sunita Desai',
    role: 'ump_user',
  },
]
