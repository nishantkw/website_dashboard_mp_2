import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db/pool.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body || {}
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password, and role are required' })
    }

    const { rows, _db } = await query(
      `SELECT id, username, password_hash, full_name, role, department, active
       FROM app_auth.dashboard_users
       WHERE username = $1 AND role = $2
       LIMIT 1`,
      [String(username).trim(), role]
    )

    const user = rows[0]
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid username, password, or role' })
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid username, password, or role' })
    }

    res.json({
      user: {
        id: String(user.id),
        username: user.username,
        name: user.full_name,
        role: user.role,
        department: user.department || '',
      },
      db: _db,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/users', async (_req, res) => {
  try {
    const { rows, _db } = await query(
      `SELECT id, username, full_name AS name, role, department, active, created_at
       FROM app_auth.dashboard_users
       ORDER BY id`
    )
    res.json({ data: rows, db: _db })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
