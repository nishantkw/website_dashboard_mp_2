import { query } from '../db/pool.js'
import { serializeRows } from './serialize.js'
import { resolveColumns } from './schemaColumns.js'
import { assertSafeIdent } from './schemaRegistry.js'

/**
 * Best-effort SELECT * from schema.table (empty on missing table / errors).
 * @param {string} schema
 * @param {string} table
 * @param {{ orderBy?: string, limit?: number, label?: string }} [opts]
 */
export async function loadTableSafe(schema, table, opts = {}) {
  const label = opts.label || `${schema}.${table}`
  const limit = opts.limit ?? 10000
  const orderBy = opts.orderBy || '1 DESC'
  try {
    assertSafeIdent(schema, 'schema')
    assertSafeIdent(table, 'table')
    // orderBy is internal-only (never from user input)
    const { rows, _db } = await query(
      `SELECT * FROM ${schema}.${table} ORDER BY ${orderBy} LIMIT ${Number(limit)}`
    )
    const tableRows = serializeRows(rows)
    const columns = await resolveColumns(schema, table, tableRows)
    return { table: tableRows, columns, db: _db, schema: `${schema}.${table}` }
  } catch (err) {
    console.warn(`[${label}] skipped: ${err.message}`)
    return { table: [], columns: [], db: null, schema: '' }
  }
}

export function countByField(rows, field, fallback = 'Unknown') {
  const acc = {}
  for (const row of rows) {
    const key = String(row[field] ?? '').trim() || fallback
    acc[key] = (acc[key] || 0) + 1
  }
  return Object.entries(acc)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}
