export type MoneyNotation = 'indian' | 'international'

const CRORE = 10_000_000
const LAKH = 100_000
const MILLION = 1_000_000

/** True for claim/payment/recovery money fields — not dates, IDs, or counts. */
export function isAmountColumn(key: string, label?: string): boolean {
  const k = String(key ?? '').toLowerCase()
  const l = String(label ?? '').toLowerCase()
  if (/(^|_)(amt|amount)s?(_|$)/.test(k)) return true
  if (k.includes('amount') || k.includes('_amt') || /(^|_)amt$/.test(k)) return true
  if (/(initiated_cr|approved_cr)$/.test(k) || k === 'initiatedcr' || k === 'approvedcr') return true
  if (/\b(amount|amt|rupees?|inr)\b/.test(l) || l.includes('₹')) return true
  return false
}

export function parseMoneyValue(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  let s = String(value).trim()
  if (!s || s === '—' || s === '-') return null
  s = s.replace(/₹/g, '').replace(/,/g, '').replace(/\s+/g, ' ').trim()

  const unit = s.match(/^(-?\d+(?:\.\d+)?)\s*(crores?|crs?|lakhs?|lacs?|millions?|mn|m)$/i)
  if (unit) {
    const n = Number(unit[1])
    if (!Number.isFinite(n)) return null
    const u = unit[2].toLowerCase()
    if (u.startsWith('cr')) return n * CRORE
    if (u.startsWith('l')) return n * LAKH
    return n * MILLION
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function formatMoneyValue(value: unknown, notation: MoneyNotation): string {
  const n = parseMoneyValue(value)
  if (n == null) {
    if (value == null || String(value).trim() === '') return ''
    return String(value)
  }
  const locale = notation === 'indian' ? 'en-IN' : 'en-US'
  const abs = Math.abs(n)
  const fraction = Number.isInteger(n) ? 0 : abs >= 1 ? 2 : 2
  const formatted = abs.toLocaleString(locale, {
    minimumFractionDigits: fraction,
    maximumFractionDigits: 2,
  })
  return `${n < 0 ? '-' : ''}₹${formatted}`
}

export function formatRowMoney(
  row: Record<string, string | number>,
  notation: MoneyNotation,
  columns?: { key: string; label?: string }[]
): Record<string, string | number> {
  const next = { ...row }
  const keys = columns?.length ? columns.map((c) => c.key) : Object.keys(next)
  const labelByKey = Object.fromEntries((columns ?? []).map((c) => [c.key, c.label]))
  for (const key of keys) {
    if (isAmountColumn(key, labelByKey[key])) {
      next[key] = formatMoneyValue(next[key], notation)
    }
  }
  return next
}
