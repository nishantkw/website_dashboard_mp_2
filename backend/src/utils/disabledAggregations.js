/** Charts and KPIs from dmart_mp.t_bis_beneficiary_disabled. */

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

function includesIlike(rowVal, filterVal) {
  if (!filterVal) return true
  return String(rowVal ?? '')
    .toLowerCase()
    .includes(String(filterVal).trim().toLowerCase())
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
  return parseDate(row.disabled_date || row.created_dt || row.updated_dt)
}

function formatMonthLabel(ym) {
  const m = String(ym).match(/^(\d{4})-(\d{2})$/)
  if (!m) return String(ym)
  const month = MONTH_SHORT[Number(m[2]) - 1]
  return month ? `${month} ${m[1]}` : String(ym)
}

export function filterDisabledRows(rows, q = {}) {
  const search = String(q.search || '').trim().toLowerCase()
  const card = String(q.card_status || '').trim()
  const district = String(q.district || '').trim()

  return rows.filter((row) => {
    if (!includesIlike(row.card_status, card)) return false
    if (district && !includesIlike(row.state_cd, district) && !includesIlike(row.dist_cd, district)) {
      return false
    }
    if (search) {
      const hay = [
        row.name,
        row.card_no,
        row.family_id,
        row.member_id,
        row.aadhaar_no,
        row.reason_desc,
        row.reason_id,
        row.source_type,
        row.acted_workflow_user,
      ]
        .map((v) => String(v ?? ''))
        .join(' ')
        .toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

export function buildDisabledKpis(rows) {
  const families = new Set(
    rows.map((r) => String(r.family_id ?? '').trim()).filter(Boolean)
  ).size
  const withCard = rows.filter((r) => String(r.card_no ?? '').trim()).length
  return [
    { label: 'Disabled Records', value: rows.length, color: 'orange' },
    { label: 'Disabled Families', value: families, color: 'indigo' },
    { label: 'Disabled Cards', value: withCard, color: 'red' },
  ]
}

export function buildDisabledCharts(rows) {
  const disabledCardStatus = topEntries(countBy(rows, (r) => labelOrUnknown(r.card_status)), 6)
  const disabledSourceType = topEntries(countBy(rows, (r) => labelOrUnknown(r.source_type)), 6)
  const disabledReason = topEntries(countBy(rows, (r) => labelOrUnknown(r.reason_desc || r.reason_id)), 8)

  const byMonth = {}
  for (const row of rows) {
    const d = rowDate(row)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue
    const ym = d.slice(0, 7)
    byMonth[ym] = (byMonth[ym] || 0) + 1
  }
  const disabledTrend = Object.keys(byMonth)
    .sort()
    .map((ym) => ({ name: formatMonthLabel(ym), value: byMonth[ym] }))

  return {
    disabledCardStatus: hasKnown(disabledCardStatus) ? disabledCardStatus : [],
    disabledSourceType: hasKnown(disabledSourceType) ? disabledSourceType : [],
    disabledReason: hasKnown(disabledReason) ? disabledReason : [],
    disabledTrend,
  }
}
