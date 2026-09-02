import { query } from '../db/pool.js'

/**
 * Column names from information_schema (works with 0 rows).
 */
export async function getSchemaColumns(schemaName, tableName) {
  const { rows } = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schemaName, tableName]
  )
  return rows.map((r) => r.column_name)
}

/**
 * Patient state must appear before patient district (DB ordinal has district first).
 */
export function preferPatientGeoOrder(cols = []) {
  const state = 'patient_state_name'
  const dist = 'patient_district_name'
  if (!cols.includes(state) || !cols.includes(dist)) return cols
  const insertAt = Math.min(cols.indexOf(state), cols.indexOf(dist))
  const out = cols.filter((c) => c !== state && c !== dist)
  out.splice(insertAt, 0, state, dist)
  return out
}

/**
 * Prefer DB schema metadata; fall back to first row keys if needed.
 */
export async function resolveColumns(schemaName, tableName, dataRows = []) {
  try {
    const cols = await getSchemaColumns(schemaName, tableName)
    if (cols.length) return preferPatientGeoOrder(cols)
  } catch {
    // fall through
  }
  return preferPatientGeoOrder(dataRows[0] ? Object.keys(dataRows[0]) : [])
}

/** Merge column lists from multiple tables (unique, preserve order). */
export async function resolveColumnsMany(tables, dataRows = []) {
  const seen = new Set()
  const out = []
  for (const [schemaName, tableName] of tables) {
    try {
      const cols = await getSchemaColumns(schemaName, tableName)
      for (const c of cols) {
        if (!seen.has(c)) {
          seen.add(c)
          out.push(c)
        }
      }
    } catch {
      // skip missing table
    }
  }
  if (!out.length && dataRows[0]) return preferPatientGeoOrder(Object.keys(dataRows[0]))
  return preferPatientGeoOrder(out)
}
