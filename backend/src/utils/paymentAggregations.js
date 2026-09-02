/** Charts and KPIs from dmart_mp.payment_dtls. */

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function labelOrUnknown(val) {
  const s = String(val ?? '').trim()
  return s || 'Unknown'
}

function topEntries(entries, limit = 8, valueKey = 'value') {
  const sorted = [...entries].sort((a, b) => Number(b[valueKey] ?? 0) - Number(a[valueKey] ?? 0))
  if (sorted.length <= limit) return sorted
  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit)
  return [...top, { name: 'Others', [valueKey]: rest.reduce((sum, row) => sum + Number(row[valueKey] ?? 0), 0) }]
}

function countBy(rows, keyFn) {
  const acc = {}
  for (const row of rows) {
    const key = keyFn(row)
    acc[key] = (acc[key] || 0) + 1
  }
  return Object.entries(acc).map(([name, value]) => ({ name, value }))
}

function hasKnown(entries) {
  return entries.some((e) => e.name !== 'Unknown')
}

function toNumber(val) {
  const n = Number(String(val ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

function parseDate(value) {
  const s = String(value ?? '').trim()
  if (!s) return ''
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return ''
}

function rowDate(row) {
  return parseDate(row.transaction_dt || row.payment_paid_dt || row.payment_reject_dt)
}

function formatInr(n) {
  if (n >= 10000000) {
    const cr = n / 10000000
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`
  }
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function formatMonthLabel(ym) {
  const m = String(ym).match(/^(\d{4})-(\d{2})$/)
  if (!m) return String(ym)
  const month = MONTH_SHORT[Number(m[2]) - 1]
  return month ? `${month} ${m[1]}` : String(ym)
}

export function isPaidPayment(row) {
  const f = String(row.paid_flag ?? '').trim()
  if (/^(1|y|yes|true|paid|p)$/i.test(f)) return true
  return Boolean(String(row.payment_paid_dt ?? '').trim())
}

export function isRejectedPayment(row) {
  const f = String(row.reject_flag ?? '').trim()
  if (/^(1|y|yes|true|r)$/i.test(f)) return true
  if (String(row.reject_code ?? '').trim()) return true
  return Boolean(String(row.payment_reject_dt ?? '').trim())
}

function paymentStatusLabel(row) {
  if (isRejectedPayment(row)) return 'Rejected'
  if (isPaidPayment(row)) return 'Paid'
  return 'Pending'
}

export function filterPaymentRows(rows, q = {}) {
  const search = String(q.search || '').trim().toLowerCase()
  const from = String(q.date_from || '').slice(0, 10)
  const to = String(q.date_to || '').slice(0, 10)

  return rows.filter((row) => {
    if (from || to) {
      const d = rowDate(row)
      if (from && d && d < from) return false
      if (to && d && d > to) return false
    }
    if (search) {
      const hay = [
        row.case_id,
        row.payment_unique_id,
        row.bank_name,
        row.payer_id,
        row.payment_type,
        row.careplan_id,
        row.paid_remarks,
        row.payment_remarks,
        row.state_code,
      ]
        .map((v) => String(v ?? ''))
        .join(' ')
        .toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

export function buildPaymentKpis(rows) {
  const paid = rows.filter(isPaidPayment).length
  const rejected = rows.filter(isRejectedPayment).length
  const amount = rows.reduce((sum, row) => sum + toNumber(row.transaction_amount), 0)
  return [
    { label: 'Payment Records', value: rows.length, color: 'orange' },
    { label: 'Payments Paid', value: paid, color: 'green' },
    { label: 'Payments Rejected', value: rejected, color: 'red' },
    { label: 'Payment Amount', value: formatInr(amount), color: 'indigo' },
  ]
}

export function buildPaymentCharts(rows) {
  const paymentType = topEntries(countBy(rows, (r) => labelOrUnknown(r.payment_type)), 6)
  const paymentStatus = countBy(rows, paymentStatusLabel)
  const paymentBank = topEntries(countBy(rows, (r) => labelOrUnknown(r.bank_name)), 6)

  const byMonth = {}
  for (const row of rows) {
    const d = rowDate(row)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue
    const ym = d.slice(0, 7)
    if (!byMonth[ym]) byMonth[ym] = { name: formatMonthLabel(ym), payments: 0, amount: 0 }
    byMonth[ym].payments += 1
    byMonth[ym].amount += toNumber(row.transaction_amount) / 10000000
  }
  const paymentTrend = Object.keys(byMonth)
    .sort()
    .map((ym) => ({
      name: byMonth[ym].name,
      payments: byMonth[ym].payments,
      amount: Number(byMonth[ym].amount.toFixed(4)),
    }))

  return {
    paymentType: hasKnown(paymentType) ? paymentType : [],
    paymentStatus: paymentStatus.filter((e) => e.value > 0),
    paymentBank: hasKnown(paymentBank) ? paymentBank : [],
    paymentTrend,
  }
}
