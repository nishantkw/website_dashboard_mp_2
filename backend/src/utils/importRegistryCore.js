/** Shared import validation helpers (no registry I/O). */

const SAFE_IDENT = /^[a-z][a-z0-9_]*$/

export function assertSafeIdent(name, label) {
  if (!SAFE_IDENT.test(name)) {
    throw new Error(`Invalid ${label}: ${name}`)
  }
}

export function validateMappedRows(tableDef, rows) {
  const allowed = new Set(tableDef.columns.map((c) => c.name))

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, errors: ['No rows to import'] }
  }

  const usedCols = new Set()
  for (const row of rows) {
    for (const key of Object.keys(row || {})) {
      if (allowed.has(key)) usedCols.add(key)
    }
  }

  if (usedCols.size === 0) {
    return { ok: false, errors: [`None of the mapped columns exist on ${tableDef.id}`] }
  }

  return { ok: true, errors: [] }
}

export function normalizeCell(value, colType) {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (s === '' || s === '—' || s === '-') return null

  if (/boolean/.test(colType || '')) {
    const v = s.toLowerCase()
    if (['1', 't', 'true', 'yes', 'y'].includes(v)) return true
    if (['0', 'f', 'false', 'no', 'n'].includes(v)) return false
    return null
  }

  if (/\b(integer|smallint)\b/.test(colType || '')) {
    const n = Number(s.replace(/[₹,\s]/g, ''))
    if (!Number.isFinite(n)) return null
    // Values larger than int4 belong in bigint/text columns (NHA registration_id etc.)
    // Return a string so node-pg does not send the value as int4.
    if (!Number.isSafeInteger(n) || Math.abs(n) > 2147483647) return String(Math.trunc(n))
    return n
  }

  if (/numeric|bigint|real|double/.test(colType || '')) {
    const n = Number(s.replace(/[₹,\s]/g, ''))
    if (!Number.isFinite(n)) return null
    // node-pg infers JS numbers as int4, which rejects NHA ids like 100005858984.
    return String(n)
  }

  if (/timestamp|date/.test(colType || '')) {
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s
    return s
  }

  return s
}

export function suggestMapping(csvHeaders, tableDef) {
  const dbCols = tableDef.columns.map((c) => c.name)
  const mapping = {}
  const used = new Set()

  for (const header of csvHeaders) {
    const norm = header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').trim()
    const exact = dbCols.find((c) => c === header || c === norm)
    if (exact && !used.has(exact)) {
      mapping[header] = exact
      used.add(exact)
      continue
    }
    const compactHeader = norm.replace(/_/g, '')
    const fuzzy = dbCols.find((c) => {
      if (used.has(c)) return false
      const compactCol = c.replace(/_/g, '')
      if (compactCol === compactHeader) return true
      return compactHeader.length >= 4 && (compactCol.includes(compactHeader) || compactHeader.includes(compactCol))
    })
    if (fuzzy) {
      mapping[header] = fuzzy
      used.add(fuzzy)
    }
  }

  return mapping
}
