import { query } from '../db/pool.js'
import { readAccessToken, verifyAccessToken } from '../utils/jwt.js'

export const ROLES = {
  admin: ['super_admin', 'state_admin'],
  bis: ['super_admin', 'state_admin', 'bis_user'],
  mp: ['super_admin', 'state_admin', 'mp_user'],
  ump: ['super_admin', 'state_admin', 'ump_user'],
  import: ['super_admin', 'state_admin', 'bis_user', 'mp_user', 'ump_user'],
}

function publicUser(row) {
  return {
    id: String(row.id),
    username: row.username,
    name: row.full_name,
    role: row.role,
    department: row.department || '',
  }
}

export async function requireAuth(req, res, next) {
  const token = readAccessToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const payload = await verifyAccessToken(token)
    const { rows } = await query(
      `SELECT id, username, full_name, role, department, active
       FROM app_auth.dashboard_users
       WHERE id = $1
       LIMIT 1`,
      [payload.sub]
    )
    const row = rows[0]
    if (!row || !row.active) {
      return res.status(401).json({ error: 'Session expired' })
    }
    req.user = publicUser(row)
    req.tokenPayload = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Authentication required' })
  }
}

export function requireRole(...roles) {
  const allowed = roles.flat()
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have access to this resource' })
    }
    next()
  }
}