import bcrypt from 'bcryptjs'
import { query } from './pool.js'

const DEFAULT_USERS = [
  {
    username: 'superadmin',
    password: 'admin123',
    full_name: 'Super Administrator',
    role: 'super_admin',
    department: 'State Health Agency',
  },
  {
    username: 'admin',
    password: 'admin123',
    full_name: 'Admin User',
    role: 'state_admin',
    department: 'State Health Agency',
  },
  {
    username: 'bis.user',
    password: 'demo123',
    full_name: 'Priya Sharma',
    role: 'bis_user',
    department: 'BIS - Card Printing',
  },
  {
    username: 'mp.user',
    password: 'demo123',
    full_name: 'Rajesh Kumar',
    role: 'mp_user',
    department: 'Madhya Pradesh Data Mart',
  },
  {
    username: 'ump.user',
    password: 'demo123',
    full_name: 'Sunita Desai',
    role: 'ump_user',
    department: 'User Management Platform',
  },
]

export async function seedDashboardUsersIfEmpty() {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM app_auth.dashboard_users')
  if (rows[0]?.n > 0) return 0

  for (const user of DEFAULT_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12)
    await query(
      `INSERT INTO app_auth.dashboard_users (username, password_hash, full_name, role, department, active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [user.username, passwordHash, user.full_name, user.role, user.department]
    )
  }

  console.log(
    `[auth] created ${DEFAULT_USERS.length} default login users — change these passwords before production`
  )
  return DEFAULT_USERS.length
}