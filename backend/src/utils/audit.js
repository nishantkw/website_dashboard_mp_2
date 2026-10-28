import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { query } from '../db/pool.js'

const DDL_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../sql/013_audit_log.sql')

let ensured = null

function ensureAuditTable() {
  if (!ensured) {
    const statements = fs
      .readFileSync(DDL_PATH, 'utf8')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    ensured = statements
      .reduce((p, sql) => p.then(() => query(sql)), Promise.resolve())
      .catch((err) => {
      ensured = null
      throw err
    })
  }
  return ensured
}

export function clientIp(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
  const ip = forwarded || req.ip || req.socket?.remoteAddress || ''
  return ip.replace(/^::ffff:/, '')
}

/**
 * Record an audit event. Never throws — audit failures must not break the request.
 */
export async function recordAudit(req, { action, module = '', details = '', status = 'Success', user } = {}) {
  try {
    await ensureAuditTable()
    const actor = user || req.user || null
    await query(
      `INSERT INTO app_auth.audit_log (user_id, username, user_role, action, module, details, ip_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        actor?.id != null && /^\d+$/.test(String(actor.id)) ? Number(actor.id) : null,
        actor?.username || null,
        actor?.role || null,
        action,
        module || null,
        details ? String(details).slice(0, 500) : null,
        clientIp(req) || null,
        status,
      ]
    )
  } catch (err) {
    console.error('[audit] record failed', err.message)
  }
}

export async function listAuditLogs({ limit = 200 } = {}) {
  await ensureAuditTable()
  const { rows } = await query(
    `SELECT id, created_at, username, user_role, action, module, details, ip_address, status
     FROM app_auth.audit_log
     ORDER BY created_at DESC, id DESC
     LIMIT $1`,
    [Math.min(Math.max(Number(limit) || 200, 1), 1000)]
  )
  return rows
}
