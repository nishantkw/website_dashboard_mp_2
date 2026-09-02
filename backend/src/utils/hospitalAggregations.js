import { divisionForDistrict } from '../data/mpDivisions.js'

function topEntries(entries, limit = 10, valueKey = 'value', othersLabel = 'Others') {
  const sorted = [...entries].sort((a, b) => Number(b[valueKey] ?? 0) - Number(a[valueKey] ?? 0))
  if (sorted.length <= limit) return sorted
  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit)
  const others = { name: othersLabel, [valueKey]: rest.reduce((sum, row) => sum + Number(row[valueKey] ?? 0), 0) }
  return [...top, others]
}

function countBy(rows, keyFn, valueKey = 'value') {
  const acc = {}
  for (const row of rows) {
    const key = keyFn(row)
    acc[key] = (acc[key] || 0) + 1
  }
  return Object.entries(acc).map(([name, val]) => ({ name, [valueKey]: val }))
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function labelStatus(val, map) {
  const s = String(val ?? '').trim()
  if (!s) return 'Unknown'
  for (const [pattern, label] of map) {
    if (pattern.test(s)) return label
  }
  return s
}

function labelEmpanelmentStatus(row) {
  const desc = String(row.hosp_status_desc ?? '').trim()
  if (desc) return desc
  return labelStatus(row.enrl_status, [
    [/^de[- ]?empane/i, 'De-empanelled'],
    [/^empane/i, 'Empanelled'],
    [/^pending/i, 'Pending'],
    [/^inactive/i, 'Inactive'],
    [/^active/i, 'Empanelled'],
    [/^1$/, 'Empanelled'],
    [/^0$/, 'De-empanelled'],
    [/^2$/, 'Pending'],
  ])
}

function formatMonthLabel(ym) {
  const m = String(ym).match(/^(\d{4})-(\d{2})$/)
  if (!m) return String(ym)
  const month = MONTH_SHORT[Number(m[2]) - 1]
  return month ? `${month} ${m[1]}` : String(ym)
}

function buildEmpanelmentTrend(rows) {
  const byMonth = {}
  for (const row of rows) {
    const month = String(row.hosp_empaneled_date || row.empaneled_date || '').slice(0, 7)
    if (!month || month.length < 7) continue
    byMonth[month] = (byMonth[month] || 0) + 1
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name: formatMonthLabel(name), value }))
}

export function buildHospitalCharts(rows) {
  const byType = topEntries(countBy(rows, (r) => String(r.hospital_type || 'Unknown')), 4)
  const byDistrict = topEntries(countBy(rows, (r) => String(r.district_name || 'Unknown')))
  const byDivision = topEntries(
    countBy(rows, (r) => divisionForDistrict(String(r.district_name || ''))),
    8
  )
  const byEnroll = topEntries(countBy(rows, (r) => labelEmpanelmentStatus(r)), 6)
  const byActive = countBy(rows, (r) =>
    labelStatus(r.active_status, [
      [/^(1|active|yes|true)$/i, 'Active'],
      [/^(0|inactive|no|false)$/i, 'Inactive'],
    ])
  )

  return {
    type: byType,
    district: byDistrict,
    division: byDivision,
    enrollment: byEnroll,
    activeStatus: byActive,
    empanelmentTrend: buildEmpanelmentTrend(rows),
  }
}

export function buildLookupCharts(rows) {
  const category = countBy(rows, (r) => String(r.lookup_cd || 'Unknown').trim() || 'Unknown')
  const status = countBy(rows, (r) => {
    const yn = String(r.active_yn ?? '').trim()
    if (yn === '1') return 'Active'
    if (yn === '0') return 'Inactive'
    return yn || 'Unknown'
  })
  return { lookupCategory: category, lookupStatus: status }
}

function buildDeempanelTrend(rows) {
  const byMonth = {}
  for (const row of rows) {
    const month = String(row.start_date || row.created_dt || '').slice(0, 7)
    if (!month || month.length < 7) continue
    byMonth[month] = (byMonth[month] || 0) + 1
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name: formatMonthLabel(name), value }))
}

export function buildDeempanelCharts(rows) {
  const byType = countBy(rows, (r) => String(r.type || 'Unknown').trim() || 'Unknown')
  const knownType = byType.some((e) => e.name !== 'Unknown')
  return {
    deempanelType: knownType ? [...byType].sort((a, b) => Number(b.value) - Number(a.value)) : [],
    deempanelTrend: buildDeempanelTrend(rows),
  }
}

export function buildHemCharts(rows) {
  const ownership = countBy(rows, (r) => String(r.hosp_type_cd || r.hospital_type || 'Unknown').trim() || 'Unknown')
  const active = countBy(rows, (r) => {
    const s = String(r.active_status ?? '').trim()
    if (/^(1|active|yes|true)$/i.test(s)) return 'Active'
    if (/^(0|inactive|no|false)$/i.test(s)) return 'Inactive'
    return s || 'Unknown'
  })
  const knownOwn = ownership.some((e) => e.name !== 'Unknown')
  const knownActive = active.some((e) => e.name !== 'Unknown')
  return {
    hemOwnership: knownOwn ? [...ownership].sort((a, b) => Number(b.value) - Number(a.value)) : [],
    hemActive: knownActive ? active : [],
  }
}
