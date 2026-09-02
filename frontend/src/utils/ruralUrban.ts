/** RURAL_URBAN_FLAG stores R = Rural, U = Urban. */

export function labelRuralUrban(val: unknown): string {
  const s = String(val ?? '').trim()
  if (/^(r|rural)$/i.test(s)) return 'Rural'
  if (/^(u|urban)$/i.test(s)) return 'Urban'
  return s || 'Unknown'
}

export function isRuralFlag(val: unknown): boolean {
  return labelRuralUrban(val) === 'Rural'
}

export function isUrbanFlag(val: unknown): boolean {
  return labelRuralUrban(val) === 'Urban'
}

export function rowRuralUrbanFlag(row: Record<string, unknown>): unknown {
  return row.rural_urban_flag ?? row.rural_urban ?? row.urban_rural ?? row.urban_or_rural ?? ''
}

export function matchesRuralUrbanFilter(rowVal: unknown, filterVal: string): boolean {
  if (!filterVal) return true
  const want = labelRuralUrban(filterVal)
  if (want === 'Rural' || want === 'Urban') return labelRuralUrban(rowVal) === want
  return String(rowVal ?? '')
    .toLowerCase()
    .includes(filterVal.trim().toLowerCase())
}

export function isRuralUrbanColumn(key: string): boolean {
  return /^(rural_urban_flag|rural_urban|urban_rural|urban_or_rural)$/i.test(key)
}

/** Table/export label: R → Rural, U → Urban. Empty stays empty. */
export function formatRuralUrbanDisplay(val: unknown): string {
  const s = String(val ?? '').trim()
  if (!s) return ''
  const labelled = labelRuralUrban(s)
  return labelled === 'Rural' || labelled === 'Urban' ? labelled : s
}

export function filterRowsForRuralUrbanLabel<T extends Record<string, string | number>>(
  rows: T[],
  label: string
): T[] | null {
  if (/^rural$/i.test(label)) return rows.filter((row) => isRuralFlag(rowRuralUrbanFlag(row)))
  if (/^urban$/i.test(label)) return rows.filter((row) => isUrbanFlag(rowRuralUrbanFlag(row)))
  return null
}
