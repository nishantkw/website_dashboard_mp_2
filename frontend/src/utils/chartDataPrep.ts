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

export function districtEnrollmentChart(rows: GroupedBarRow[], limit = 10) {
  return prepareGroupedBarChart(rows, {
    sortKey: 'enrolled',
    valueKeys: ['enrolled', 'active'],
    limit,
  })
}
