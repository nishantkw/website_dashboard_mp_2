/** RURAL_URBAN_FLAG stores R = Rural, U = Urban. */

export function labelRuralUrban(val) {
  const s = String(val ?? '').trim()
  if (/^(r|rural)$/i.test(s)) return 'Rural'
  if (/^(u|urban)$/i.test(s)) return 'Urban'
  return s || 'Unknown'
}

export function isRuralFlag(val) {
  return labelRuralUrban(val) === 'Rural'
}

export function isUrbanFlag(val) {
  return labelRuralUrban(val) === 'Urban'
}

export function rowRuralUrbanFlag(row) {
  return row?.rural_urban_flag ?? row?.rural_urban ?? row?.urban_rural ?? row?.urban_or_rural ?? ''
}

export function matchesRuralUrbanFilter(rowVal, filterVal) {
  if (!filterVal) return true
  const want = labelRuralUrban(filterVal)
  if (want === 'Rural' || want === 'Urban') return labelRuralUrban(rowVal) === want
  return String(rowVal ?? '')
    .toLowerCase()
    .includes(String(filterVal).trim().toLowerCase())
}

export function ruralUrbanSqlMatch(column, labelled) {
  if (labelled === 'Rural') return `(TRIM(COALESCE(${column}::text, '')) ~* '^(r|rural)$')`
  if (labelled === 'Urban') return `(TRIM(COALESCE(${column}::text, '')) ~* '^(u|urban)$')`
  return null
}
