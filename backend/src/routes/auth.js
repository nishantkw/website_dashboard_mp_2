import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db/pool.js'
import { requireAuth, requireRole, ROLES } from '../middleware/auth.js'
import { clientError } from '../utils/clientError.js'
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

const ALLOWED_ROLES = new Set(['super_admin', 'state_admin', 'bis_user', 'mp_user', 'ump_user'])
const MIN_PASSWORD_LENGTH = 10

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

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    return `Password must be ${MIN_PASSWORD_LENGTH}–128 characters`
  }
  return null
}

router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim()
    const password = String(req.body?.password || '')
    const role = String(req.body?.role || '').trim()

    if (!username || !password || !role || username.length > 64 || password.length > 128) {
      return res.status(400).json({ error: 'Username, password, and role are required' })
    }
    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ error: 'Invalid role' })
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
    const roleOk = row?.role === role
    const allowed = Boolean(row?.active) && passwordOk && roleOk

    if (!allowed) {
      recordLoginFailure(username)
      return res.status(401).json({ error: 'Invalid username, password, or role' })
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

router.post('/users', requireAuth, requireRole(ROLES.admin), async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim()
    const fullName = String(req.body?.name || req.body?.full_name || '').trim()
    const role = String(req.body?.role || '').trim()
    const department = String(req.body?.department || '').trim()
    const password = String(req.body?.password || '')

    if (!username || username.length > 64 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
      return res.status(400).json({ error: 'Valid username is required' })
    }
    if (!fullName || fullName.length > 120) {
      return res.status(400).json({ error: 'Full name is required' })
    }
    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }
    const passwordError = validatePassword(password)
    if (passwordError) return res.status(400).json({ error: passwordError })

    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await query(
      `INSERT INTO app_auth.dashboard_users (username, password_hash, full_name, role, department, active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, username, full_name AS name, role, department, active, created_at`,
      [username, passwordHash, fullName, role, department || null]
    )
    res.status(201).json({ user: rows[0] })
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' })
    }
    console.error('[auth] create user failed', err.message)
    res.status(500).json({ error: clientError(err, 'Unable to create user') })
  }
})

router.patch('/users/:id', requireAuth, requireRole(ROLES.admin), async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid user id' })

    if (String(req.user.id) === String(id) && req.body?.active === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' })
    }

    const fields = []
    const params = [id]
    let i = 2

    if (typeof req.body?.active === 'boolean') {
      fields.push(`active = $${i++}`)
      params.push(req.body.active)
    }
    if (req.body?.name != null || req.body?.full_name != null) {
      const fullName = String(req.body?.name || req.body?.full_name || '').trim()
      if (!fullName || fullName.length > 120) {
        return res.status(400).json({ error: 'Full name is required' })
      }
      fields.push(`full_name = $${i++}`)
      params.push(fullName)
    }
    if (req.body?.department != null) {
      fields.push(`department = $${i++}`)
      params.push(String(req.body.department).trim() || null)
    }
    if (req.body?.role != null) {
      const role = String(req.body.role).trim()
      if (!ALLOWED_ROLES.has(role)) {
        return res.status(400).json({ error: 'Invalid role' })
      }
      fields.push(`role = $${i++}`)
      params.push(role)
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    const { rows } = await query(
      `UPDATE app_auth.dashboard_users
       SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING id, username, full_name AS name, role, department, active, created_at`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })
    res.json({ user: rows[0] })
  } catch (err) {
    console.error('[auth] update user failed', err.message)
    res.status(500).json({ error: clientError(err, 'Unable to update user') })
  }
})

router.post('/users/:id/password', requireAuth, requireRole(ROLES.admin), async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid user id' })

    const password = String(req.body?.password || '')
    const passwordError = validatePassword(password)
    if (passwordError) return res.status(400).json({ error: passwordError })

    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await query(
      `UPDATE app_auth.dashboard_users
       SET password_hash = $2
       WHERE id = $1
       RETURNING id, username`,
      [id, passwordHash]
    )
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })
    res.json({ ok: true, user: { id: String(rows[0].id), username: rows[0].username } })
  } catch (err) {
    console.error('[auth] reset password failed', err.message)
    res.status(500).json({ error: clientError(err, 'Unable to reset password') })
  }
})

export default router
