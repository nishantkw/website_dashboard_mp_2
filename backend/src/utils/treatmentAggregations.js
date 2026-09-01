/** Charts and KPIs from dmart_mp.treatment_dtls. Dates may be ISO or DD/MM/YYYY. */

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function parseTreatmentDate(value) {
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

function toNumber(val) {
  const n = Number(String(val ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

function formatMonthLabel(ym) {
  const m = String(ym).match(/^(\d{4})-(\d{2})$/)
  if (!m) return String(ym)
  const month = MONTH_SHORT[Number(m[2]) - 1]
  return month ? `${month} ${m[1]}` : String(ym)
}

function formatInr(n) {
  if (n >= 10000000) {
    const cr = n / 10000000
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`
  }
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export function filterTreatmentRows(rows, q = {}) {
  const search = String(q.search || '').trim().toLowerCase()
  const from = String(q.date_from || '').slice(0, 10)
  const to = String(q.date_to || '').slice(0, 10)

  return rows.filter((row) => {
    if (from || to) {
      const d = parseTreatmentDate(row.date_on_which)
      if (from && d && d < from) return false
      if (to && d && d > to) return false
    }
    if (search) {
      const hay = [
        row.registration_id,
        row.caseid,
        row.item_id,
        row.type,
        row.type_desc,
        row.procedure_name,
        row.procedure_code,
        row.status,
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

export function buildTreatmentCharts(rows) {
  const specialty = topEntries(countBy(rows, (r) => labelOrUnknown(r.type_desc)))
  const procedureType = countBy(rows, (r) => labelOrUnknown(r.type))
  const status = countBy(rows, (r) => labelOrUnknown(r.status)).filter((e) => e.name !== 'Unknown')

  const byMonth = {}
  for (const row of rows) {
    const iso = parseTreatmentDate(row.date_on_which)
    if (!iso) continue
    const ym = iso.slice(0, 7)
    byMonth[ym] = (byMonth[ym] || 0) + 1
  }
  const trend = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name: formatMonthLabel(name), value }))

  const amountBySpecialty = {}
  for (const row of rows) {
    const amt = toNumber(row.approved_amount) || toNumber(row.net_amount) || toNumber(row.amount)
    if (!amt) continue
    const key = labelOrUnknown(row.type_desc)
    amountBySpecialty[key] = (amountBySpecialty[key] || 0) + amt
  }
  const amount = topEntries(
    Object.entries(amountBySpecialty).map(([name, value]) => ({ name, value: Math.round(value) })),
    8
  )

  return {
    specialty,
    procedureType,
    status,
    trend,
    amount,
  }
}

export function buildTreatmentKpis(rows) {
  const specialties = new Set(rows.map((r) => String(r.type_desc || '').trim()).filter(Boolean))
  const procedures = new Set(
    rows.map((r) => String(r.procedure_name || r.item_id || '').trim()).filter(Boolean)
  )
  const totalAmt = rows.reduce(
    (sum, r) => sum + (toNumber(r.approved_amount) || toNumber(r.net_amount) || toNumber(r.amount)),
    0
  )

  const kpis = [
    { label: 'Treatment Records', value: String(rows.length), color: 'green' },
    { label: 'Specialties', value: String(specialties.size), color: 'purple' },
    { label: 'Procedures', value: String(procedures.size), color: 'cyan' },
  ]
  if (totalAmt > 0) {
    kpis.push({ label: 'Treatment Amount', value: formatInr(totalAmt), color: 'orange' })
  }
  return kpis
}
