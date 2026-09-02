/**
 * Serialize a Postgres row so every schema column is JSON-safe for the UI.
 */
export function serializeRow(row) {
  if (!row || typeof row !== 'object') return {}
  const out = {}
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      out[key] = ''
    } else if (value instanceof Date) {
      out[key] = value.toISOString().replace('T', ' ').slice(0, 19)
    } else if (typeof value === 'bigint') {
      out[key] = Number(value)
    } else if (typeof value === 'object') {
      out[key] = JSON.stringify(value)
    } else if (typeof value === 'number') {
      out[key] = Number.isFinite(value) ? value : String(value)
    } else {
      out[key] = value
    }
  }
  return out
}

export function serializeRows(rows) {
  return (rows || []).map(serializeRow)
}

/** Human-readable label from a DB column name. */
export function columnLabel(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
