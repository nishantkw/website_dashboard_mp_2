/**
 * Build a parameterized WHERE clause from express query params.
 * @param {Record<string, string>} q
 * @param {{ [key: string]: string[], searchCols?: string[] }} map
 */
export function buildFilterClause(q, map) {
  const parts = []
  const params = []

  for (const [paramKey, columns] of Object.entries(map)) {
    if (paramKey === 'searchCols') continue
    const val = q[paramKey]
    if (!val || !columns?.length) continue
    const ors = columns.map((col) => {
      params.push(`%${val}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    parts.push(`(${ors.join(' OR ')})`)
  }

  if (q.search && map.searchCols?.length) {
    const ors = map.searchCols.map((col) => {
      params.push(`%${q.search}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    parts.push(`(${ors.join(' OR ')})`)
  }

  if (q.date_from) {
    // best-effort: callers can ignore if no date col; use created_dt-like if present
  }

  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  return { clause, params }
}
