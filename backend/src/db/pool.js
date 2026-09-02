import pg from 'pg'
import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

const { Pool } = pg

/** @type {{ name: string, pool: import('pg').Pool }[]} */
const pools = []

function addPool(name, connectionString) {
  if (!connectionString) return
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase') || connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  })
  pool.on('error', (err) => {
    console.error(`[db:${name}] idle client error`, err.message)
  })
  pools.push({ name, pool })
}

if (config.dbPrimary === 'supabase') {
  addPool('supabase', config.supabaseDbUrl)
  addPool('postgres', config.databaseUrl)
} else {
  addPool('postgres', config.databaseUrl)
  addPool('supabase', config.supabaseDbUrl)
}

export const supabaseRest =
  config.supabaseUrl && config.supabaseServiceKey
    ? createClient(config.supabaseUrl, config.supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null

let activeName = pools[0]?.name || 'none'

/**
 * Run a SQL query with automatic failover between Postgres and Supabase.
 * Tries each configured pool in order until one succeeds.
 */
export async function query(text, params = []) {
  if (pools.length === 0) {
    throw new Error('No database configured. Set DATABASE_URL and/or SUPABASE_DB_URL in backend/.env')
  }

  const errors = []
  for (const { name, pool } of pools) {
    try {
      const result = await pool.query(text, params)
      if (activeName !== name) {
        console.log(`[db] switched active connection → ${name}`)
        activeName = name
      }
      return { ...result, _db: name }
    } catch (err) {
      const msg = err?.message || err?.code || String(err)
      errors.push(`${name}: ${msg}`)
      console.warn(`[db] ${name} failed: ${msg}`)
    }
  }

  throw new Error(`All databases failed. ${errors.join(' | ')}`)
}

export async function healthCheck() {
  const status = {}
  for (const { name, pool } of pools) {
    try {
      const r = await pool.query('SELECT 1 AS ok, current_database() AS db, now() AS ts')
      status[name] = { ok: true, database: r.rows[0].db, ts: r.rows[0].ts }
    } catch (err) {
      status[name] = { ok: false, error: err.message }
    }
  }
  if (supabaseRest) {
    try {
      const { error } = await supabaseRest.from('dashboard_users').select('id').limit(1).schema('app_auth')
      status.supabase_rest = { ok: !error, error: error?.message || null }
    } catch (err) {
      status.supabase_rest = { ok: false, error: err.message }
    }
  }
  return { active: activeName, backends: status }
}

export function getActiveDbName() {
  return activeName
}

export async function closePools() {
  await Promise.all(pools.map(({ pool }) => pool.end()))
}
