import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db/pool.js'
import { requireAuth, requireRole, ROLES } from '../middleware/auth.js'
import {
  DUMMY_PASSWORD_HASH,
  loginRateLimit,
  isUsernameLocked,
  recordLoginFailure,
  recordLoginSuccess,
} from '../middleware/loginLimit.js'
import {
  signAccessToken,
  setSessionCookie,
  clearSessionCookie,
} from '../utils/jwt.js'

const router = Router()

function publicUser(row) {
  return {
    id: String(row.id),
    username: row.username,
    name: row.full_name,
    role: row.role,
    department: row.department || '',
  }
}

router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim()
    const password = String(req.body?.password || '')

    if (!username || !password || username.length > 64 || password.length > 128) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    if (isUsernameLocked(username)) {
      return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' })
    }

    const { rows, _db } = await query(
      `SELECT id, username, password_hash, full_name, role, department, active
       FROM app_auth.dashboard_users
       WHERE username = $1
       LIMIT 1`,
      [username]
    )

    const row = rows[0]
    const hash = row?.password_hash || DUMMY_PASSWORD_HASH
    const passwordOk = await bcrypt.compare(password, hash)
    const allowed = Boolean(row?.active) && passwordOk

    if (!allowed) {
      recordLoginFailure(username)
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    recordLoginSuccess(username)
    const user = publicUser(row)
    const token = await signAccessToken(user)
    setSessionCookie(res, token)
    res.json({ user, db: _db })
  } catch (err) {
    console.error('[auth] login failed', err.message)
    res.status(500).json({ error: 'Unable to sign in. Try again.' })
  }
})

router.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const exp = Number(req.tokenPayload?.exp || 0) * 1000
    const remainingMs = exp - Date.now()
    if (remainingMs > 0 && remainingMs < 2 * 60 * 60 * 1000) {
      const token = await signAccessToken(req.user)
      setSessionCookie(res, token)
    }
    res.json({ user: req.user })
  } catch (err) {
    console.error('[auth] me failed', err.message)
    res.status(500).json({ error: 'Unable to load session' })
  }
})

router.get('/users', requireAuth, requireRole(ROLES.admin), async (_req, res) => {
  try {
    const { rows, _db } = await query(
      `SELECT id, username, full_name AS name, role, department, active, created_at
       FROM app_auth.dashboard_users
       ORDER BY id`
    )
    res.json({ data: rows, db: _db })
  } catch (err) {
    console.error('[auth] users list failed', err.message)
    res.status(500).json({ error: 'Unable to load users' })
  }
})

export default router