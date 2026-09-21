import type { TableColumn } from '../types'
import { isAmountColumn, parseMoneyValue } from './moneyFormat'

export type ReportChartType = 'bar' | 'pie' | 'line'

export interface ReportGraphSpec {
  id: string
  type: ReportChartType
  categoryKey: string
  /** '__count__' = row count per category; otherwise sum that numeric column */
  valueKey: string
  topN: number
}

export interface ChartSeriesPoint {
  name: string
  value: number
}

const ID_LIKE =
  /^(id|id_pk|sr_no|case_id|ben_id|member_id|family_id|registration_id|userid|user_id|hosp_id|facility_id|payment_unique_id|reference_number|suspicion_id)$/i

const DATE_LIKE = /(_dt|_date|_on|_time)$|^(created|updated|enrol|enroll|transaction|payment_paid|disabled)/i

/** Categorical columns suitable for grouping a chart. */
export function getCategoryColumns(columns: TableColumn[], rows: Record<string, string | number>[]): TableColumn[] {
  return columns.filter((col) => {
    if (!col.key || ID_LIKE.test(col.key)) return false
    if (DATE_LIKE.test(col.key)) return false
    if (isAmountColumn(col.key, col.label)) return false
    if (col.align === 'right' && isNumericColumn(col, rows)) return false
    // Prefer columns that actually have distinct values
    const distinct = new Set(
      rows
        .slice(0, 500)
        .map((r) => String(r[col.key] ?? '').trim())
        .filter(Boolean)
    )
    if (rows.length > 0 && distinct.size === 0) return false
    if (distinct.size > 80) return false
    return true
  })
}

/** Numeric / amount columns suitable for summing on Y axis. */
export function getValueColumns(columns: TableColumn[], rows: Record<string, string | number>[]): TableColumn[] {
  return columns.filter((col) => {
    if (!col.key || ID_LIKE.test(col.key)) return false
    if (DATE_LIKE.test(col.key)) return false
    if (isAmountColumn(col.key, col.label)) return true
    if (/_count$|count_|_cnt$|^count$/i.test(col.key)) return true
    if (col.align === 'right') return isNumericColumn(col, rows)
    return isNumericColumn(col, rows) && !/flag|status|code|type/i.test(col.key)
  })
}

function isNumericColumn(col: TableColumn, rows: Record<string, string | number>[]): boolean {
  let numeric = 0
  let seen = 0
  for (const row of rows.slice(0, 40)) {
    const raw = row[col.key]
    if (raw == null || String(raw).trim() === '' || String(raw) === '-') continue
    seen += 1
    if (parseMoneyValue(raw) != null) numeric += 1
  }
  return seen > 0 && numeric / seen >= 0.7
}

export function columnLabel(columns: TableColumn[], key: string): string {
  if (key === '__count__') return 'Record count'
  return columns.find((c) => c.key === key)?.label ?? key.replace(/_/g, ' ')
}

/** Aggregate table rows into chart series for a graph spec. */
export function aggregateReportGraph(
  rows: Record<string, string | number>[],
  spec: Pick<ReportGraphSpec, 'categoryKey' | 'valueKey' | 'topN'>
): ChartSeriesPoint[] {
  const acc = new Map<string, number>()

  for (const row of rows) {
    const name = String(row[spec.categoryKey] ?? '').trim() || 'Unknown'
    const add =
      spec.valueKey === '__count__'
        ? 1
        : parseMoneyValue(row[spec.valueKey]) ?? 0
    acc.set(name, (acc.get(name) ?? 0) + add)
  }

  const entries = [...acc.entries()]
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)

  const topN = Math.max(3, Math.min(20, spec.topN || 8))
  if (entries.length <= topN) return entries

  const top = entries.slice(0, topN)
  const rest = entries.slice(topN)
  const others = rest.reduce((sum, e) => sum + e.value, 0)
  return [...top, { name: 'Others', value: Math.round(others * 100) / 100 }]
}

export function createGraphSpec(
  columns: TableColumn[],
  rows: Record<string, string | number>[],
  partial?: Partial<Omit<ReportGraphSpec, 'id'>>
): ReportGraphSpec | null {
  const cats = getCategoryColumns(columns, rows)
  if (!cats.length) return null
  const vals = getValueColumns(columns, rows)
  return {
    id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: partial?.type ?? 'bar',
    categoryKey: partial?.categoryKey ?? cats[0].key,
    valueKey: partial?.valueKey ?? '__count__',
    topN: partial?.topN ?? 8,
  }
}

/** Suggested default graphs for a table (0–2), based on available columns. */
export function suggestGraphs(
  columns: TableColumn[],
  rows: Record<string, string | number>[]
): Omit<ReportGraphSpec, 'id'>[] {
  const cats = getCategoryColumns(columns, rows)
  if (!cats.length || !rows.length) return []
  const vals = getValueColumns(columns, rows)
  const suggestions: Omit<ReportGraphSpec, 'id'>[] = [
    { type: 'pie', categoryKey: cats[0].key, valueKey: '__count__', topN: 6 },
  ]
  if (cats.length > 1) {
    suggestions.push({
      type: 'bar',
      categoryKey: cats[1].key,
      valueKey: vals[0]?.key ?? '__count__',
      topN: 8,
    })
  } else if (vals[0]) {
    suggestions.push({
      type: 'bar',
      categoryKey: cats[0].key,
      valueKey: vals[0].key,
      topN: 8,
    })
  }
  return suggestions
}
