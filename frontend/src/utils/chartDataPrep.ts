import { canonicalMpDistrict } from '../data/filterOptions'

/** Prepare grouped bar chart rows: sort, cap categories, optional "Others" bucket. */
export interface GroupedBarRow {
  name: string
  [key: string]: string | number
}

export function prepareGroupedBarChart(
  rows: GroupedBarRow[],
  options: {
    sortKey: string
    valueKeys: string[]
    limit?: number
    othersLabel?: string
  }
): GroupedBarRow[] {
  const { sortKey, valueKeys, limit = 10, othersLabel = 'Others' } = options
  if (!rows.length) return []

  const sorted = [...rows].sort(
    (a, b) => Number(b[sortKey] ?? 0) - Number(a[sortKey] ?? 0)
  )

  if (sorted.length <= limit) return sorted

  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit)
  const others: GroupedBarRow = { name: othersLabel }

  for (const key of valueKeys) {
    others[key] = rest.reduce((sum, row) => sum + Number(row[key] ?? 0), 0)
  }

  return [...top, others]
}

/** Named bars = MP districts; every other state/unknown name rolls into Others. */
export function mpDistrictsWithOthers(
  rows: GroupedBarRow[],
  options: { valueKeys: string[]; sortKey?: string; othersLabel?: string }
): GroupedBarRow[] {
  const { valueKeys, sortKey = valueKeys[0], othersLabel = 'Others' } = options
  const mp = new Map<string, Record<string, number>>()
  const others: Record<string, number> = Object.fromEntries(valueKeys.map((key) => [key, 0]))

  for (const row of rows) {
    const name = String(row.name ?? '').trim() || 'Unknown'
    const canonical = /^others$/i.test(name) ? null : canonicalMpDistrict(name)
    if (canonical) {
      const cur = mp.get(canonical) ?? Object.fromEntries(valueKeys.map((key) => [key, 0]))
      for (const key of valueKeys) cur[key] += Number(row[key] ?? 0)
      mp.set(canonical, cur)
    } else {
      for (const key of valueKeys) others[key] += Number(row[key] ?? 0)
    }
  }

  const named: GroupedBarRow[] = [...mp.entries()]
    .map(([name, vals]) => ({ name, ...vals }))
    .filter((row) => valueKeys.some((key) => Number(row[key] ?? 0) > 0))
    .sort((a, b) => Number(b[sortKey] ?? 0) - Number(a[sortKey] ?? 0))

  const othersTotal = valueKeys.reduce((sum, key) => sum + Number(others[key] ?? 0), 0)
  if (othersTotal > 0) named.push({ name: othersLabel, ...others })
  return named
}

export function districtEnrollmentChart(rows: GroupedBarRow[]) {
  return mpDistrictsWithOthers(rows, {
    sortKey: 'enrolled',
    valueKeys: ['enrolled', 'active'],
  })
}
