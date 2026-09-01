/**
 * Compute month-over-month % change from row date fields (backend DB data).
 * Comparison window: current calendar month vs previous calendar month.
 */

const DEFAULT_DATE_FIELDS = [
  'crt_date',
  'created_at',
  'created_dt',
  'created_on',
  'upd_date',
  'updated_at',
  'claim_init_date',
  'preauth_init_date',
  'admission_dt',
  'enroll_date',
  'enrol_date',
  'enrl_date',
  'registration_date',
  'empaneled_date',
  'hosp_empaneled_date',
  'deempanel_date',
  'card_print_date',
  'card_gen_date',
  'approve_date',
  'issue_date',
  'txn_date',
  'transaction_date',
  'completed_at',
  'ab_pmjay_completed_at_utc',
  'abdm_completed_at_utc',
  'last_login',
]

export const CHANGE_LABEL_VS_LAST_MONTH = 'vs last month'

function parseDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function pickRowDate(row, dateFields = DEFAULT_DATE_FIELDS) {
  for (const field of dateFields) {
    if (row[field] != null && row[field] !== '') {
      const d = parseDate(row[field])
      if (d) return d
    }
  }
  // Fallback: first column that looks like a date
  for (const [key, val] of Object.entries(row)) {
    if (/date|time|_at$|_dt$|_on$/i.test(key)) {
      const d = parseDate(val)
      if (d) return d
    }
  }
  return null
}

function monthBounds(ref = new Date()) {
  const y = ref.getUTCFullYear()
  const m = ref.getUTCMonth()
  const curStart = new Date(Date.UTC(y, m, 1))
  const prevStart = new Date(Date.UTC(y, m - 1, 1))
  const nextStart = new Date(Date.UTC(y, m + 1, 1))
  return { curStart, prevStart, nextStart }
}

export function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/**
 * @param {Record<string, unknown>[]} rows
 * @param {{ dateFields?: string[], predicate?: (row: Record<string, unknown>) => boolean, now?: Date }} [options]
 * @returns {{ change: number, changeLabel: string, currentCount: number, previousCount: number }}
 */
export function monthOverMonthChange(rows, options = {}) {
  const { dateFields = DEFAULT_DATE_FIELDS, predicate, now = new Date() } = options
  const list = predicate ? rows.filter(predicate) : rows
  const { curStart, prevStart, nextStart } = monthBounds(now)

  let currentCount = 0
  let previousCount = 0
  let dated = 0

  for (const row of list) {
    const d = pickRowDate(row, dateFields)
    if (!d) continue
    dated += 1
    const t = d.getTime()
    if (t >= curStart.getTime() && t < nextStart.getTime()) currentCount += 1
    else if (t >= prevStart.getTime() && t < curStart.getTime()) previousCount += 1
  }

  // If no rows fall in either window but we have dated rows, compare
  // the two most recent calendar months present in the data.
  if (dated > 0 && currentCount === 0 && previousCount === 0) {
    const byMonth = new Map()
    for (const row of list) {
      const d = pickRowDate(row, dateFields)
      if (!d) continue
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
      byMonth.set(key, (byMonth.get(key) || 0) + 1)
    }
    const keys = [...byMonth.keys()].sort().reverse()
    if (keys.length >= 2) {
      currentCount = byMonth.get(keys[0]) || 0
      previousCount = byMonth.get(keys[1]) || 0
    } else if (keys.length === 1) {
      currentCount = byMonth.get(keys[0]) || 0
      previousCount = 0
    }
  }

  return {
    change: percentChange(currentCount, previousCount),
    changeLabel: CHANGE_LABEL_VS_LAST_MONTH,
    currentCount,
    previousCount,
  }
}

/**
 * Build a KPI object with MoM change derived from DB rows.
 */
export function buildKpi({ label, value, color, rows = [], predicate, dateFields }) {
  const { change, changeLabel } = monthOverMonthChange(rows, { predicate, dateFields })
  return {
    label,
    value: String(value),
    change,
    changeLabel,
    color,
  }
}

/**
 * Attach the same MoM change (from full row set) to every KPI in a list.
 */
export function attachChangeToKpis(kpis, rows, options = {}) {
  const meta = monthOverMonthChange(rows, options)
  return kpis.map((k) => ({
    ...k,
    change: k.change ?? meta.change,
    changeLabel: k.changeLabel ?? meta.changeLabel,
  }))
}

/**
 * SQL helper result → change meta (for overview-style COUNT queries).
 */
export function changeFromCounts(currentCount, previousCount) {
  return {
    change: percentChange(Number(currentCount) || 0, Number(previousCount) || 0),
    changeLabel: CHANGE_LABEL_VS_LAST_MONTH,
    currentCount: Number(currentCount) || 0,
    previousCount: Number(previousCount) || 0,
  }
}

/** Safe identifier check for SQL column names. */
export function isSafeIdent(name) {
  return typeof name === 'string' && /^[a-z_][a-z0-9_]*$/i.test(name)
}
