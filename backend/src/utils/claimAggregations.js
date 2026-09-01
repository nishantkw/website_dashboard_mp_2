import { divisionForDistrict } from '../data/mpDivisions.js'
import {
  classifyClaimKpi,
  isClaimInitiated,
  deriveStateType,
  deriveHospitalType,
  deriveSpecialty,
  deriveSpecialtyCode,
  deriveSpecialtyData,
  derivePatientState,
  deriveDistrict,
  initiatedAmount,
  preauthAmount,
  approvedAmount,
  toCrores,
  CLAIM_KPI_KEYS,
  CLAIM_KPI_LABELS,
} from './claimStatusMapping.js'

function emptyKpiBucket() {
  return { count: 0, initiatedCr: 0, approvedCr: 0 }
}

function addToBucket(bucket, row, amountFn = initiatedAmount) {
  bucket.count += 1
  bucket.initiatedCr += toCrores(amountFn(row))
  bucket.approvedCr += toCrores(approvedAmount(row))
}

export function enrichClaimRow(row) {
  const patientState = derivePatientState(row)
  const district = deriveDistrict(row)
  const division = divisionForDistrict(district)
  return {
    ...row,
    _state_type: deriveStateType(row, division),
    _hospital_type: deriveHospitalType(row),
    _patient_state: patientState,
    _patient_district: district,
    division,
    _division: division,
    _district: district,
    _specialty: deriveSpecialty(row),
    _specialty_code: deriveSpecialtyCode(row),
    _specialty_data: deriveSpecialtyData(row),
    _kpi_bucket: classifyClaimKpi(row.case_status),
  }
}

export function filterClaimRows(rows, query = {}) {
  let out = rows

  if (query.state_type && query.state_type !== 'Both') {
    out = out.filter((r) => r._state_type === query.state_type)
  }
  if (query.division) {
    out = out.filter((r) => r._division.toLowerCase() === String(query.division).toLowerCase())
  }
  if (query.district) {
    out = out.filter((r) =>
      r._patient_district.toLowerCase().includes(String(query.district).toLowerCase())
    )
  }
  if (query.hospital_type && query.hospital_type !== 'Both') {
    out = out.filter((r) => r._hospital_type === query.hospital_type)
  }
  if (query.hospital_name) {
    const q = String(query.hospital_name).toLowerCase()
    out = out.filter((r) => String(r.hospital_name || '').toLowerCase().includes(q))
  }
  if (query.specialty) {
    const q = String(query.specialty).toLowerCase()
    out = out.filter(
      (r) =>
        r._specialty_code.toLowerCase().includes(q) ||
        r._specialty_data.toLowerCase().includes(q)
    )
  }
  if (query.date_from) {
    out = out.filter((r) => {
      const d = String(r.claim_init_date || r.preauth_init_date || r.admission_dt || '').slice(0, 10)
      return !d || d >= query.date_from
    })
  }
  if (query.date_to) {
    out = out.filter((r) => {
      const d = String(r.claim_init_date || r.preauth_init_date || r.admission_dt || '').slice(0, 10)
      return !d || d <= query.date_to
    })
  }
  if (query.search) {
    const q = String(query.search).toLowerCase()
    out = out.filter((r) =>
      [r.case_id, r.hospital_name, r.patient_name, r.case_status, r.category_details, r.procedure_details]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }

  return out
}

function aggregateKpis(rows) {
  const buckets = Object.fromEntries(CLAIM_KPI_KEYS.map((k) => [k, emptyKpiBucket()]))
  for (const row of rows) {
    const key = row._kpi_bucket || classifyClaimKpi(row.case_status)
    addToBucket(buckets.preauth_initiated, row, preauthAmount)
    if (isClaimInitiated(row, key)) addToBucket(buckets.claims_initiated, row, initiatedAmount)
    if (key && key !== 'preauth_initiated' && key !== 'claims_initiated' && buckets[key]) {
      addToBucket(buckets[key], row, initiatedAmount)
    }
  }

  return CLAIM_KPI_KEYS.map((key) => ({
    key,
    label: CLAIM_KPI_LABELS[key],
    count: buckets[key].count,
    initiatedCr: Math.round(buckets[key].initiatedCr * 100) / 100,
    approvedCr: Math.round(buckets[key].approvedCr * 100) / 100,
  }))
}

function kpiFieldsForRow(row) {
  const fields = {}
  for (const key of CLAIM_KPI_KEYS) {
    fields[`${key}_count`] = 0
    fields[`${key}_initiated_cr`] = 0
    fields[`${key}_approved_cr`] = 0
  }
  const bucket = row._kpi_bucket || classifyClaimKpi(row.case_status)
  const claimInitCr = toCrores(initiatedAmount(row))
  const preauthInitCr = toCrores(preauthAmount(row))
  const apprCr = toCrores(approvedAmount(row))

  fields.preauth_initiated_count = 1
  fields.preauth_initiated_initiated_cr = preauthInitCr

  if (isClaimInitiated(row, bucket)) {
    fields.claims_initiated_count = 1
    fields.claims_initiated_initiated_cr = claimInitCr
  }

  if (bucket && bucket !== 'preauth_initiated' && bucket !== 'claims_initiated' && fields[`${bucket}_count`] !== undefined) {
    fields[`${bucket}_count`] = 1
    fields[`${bucket}_initiated_cr`] = claimInitCr || preauthInitCr
    fields[`${bucket}_approved_cr`] = apprCr
  }
  return fields
}

function mergeGroupRow(target, source) {
  for (const key of CLAIM_KPI_KEYS) {
    target[`${key}_count`] = (target[`${key}_count`] || 0) + (source[`${key}_count`] || 0)
    target[`${key}_initiated_cr`] = Math.round(((target[`${key}_initiated_cr`] || 0) + (source[`${key}_initiated_cr`] || 0)) * 100) / 100
    target[`${key}_approved_cr`] = Math.round(((target[`${key}_approved_cr`] || 0) + (source[`${key}_approved_cr`] || 0)) * 100) / 100
  }
}

function groupRows(rows, keyFn, labelFn) {
  const map = new Map()
  for (const row of rows) {
    const key = keyFn(row)
    const kpi = kpiFieldsForRow(row)
    if (!map.has(key)) {
      map.set(key, { ...labelFn(row), ...kpi, _hospitals: new Set() })
    } else {
      mergeGroupRow(map.get(key), kpi)
    }
    if (row.hospital_name) map.get(key)._hospitals.add(row.hospital_name)
  }
  return [...map.values()].map((r, idx) => ({
    sr_no: idx + 1,
    ...r,
    hospital_count: r._hospitals?.size ?? 0,
  }))
}

export function buildStateHospitalSummary(rows) {
  const grouped = groupRows(
    rows,
    (r) => `${r._state_type}|${r._hospital_type}`,
    (r) => ({ state_type: r._state_type, hospital_type: r._hospital_type })
  )

  const withTotals = []
  for (const state of ['MP', 'Portability']) {
    const stateRows = grouped.filter((g) => g.state_type === state)
    withTotals.push(...stateRows)
    if (stateRows.length) {
      const total = { sr_no: 0, state_type: `${state} Total`, hospital_type: '-', hospital_count: 0 }
      for (const r of stateRows) mergeGroupRow(total, r)
      withTotals.push(total)
    }
  }
  return withTotals.map((r, i) => ({ ...r, sr_no: r.sr_no || i + 1 }))
}

function specialtyFields(r) {
  return {
    specialty: r._specialty_code,
    specialty_code: r._specialty_code,
    specialty_data: r._specialty_data,
  }
}

const REPORT_BUILDERS = {
  'state-type-wise': (rows) =>
    groupRows(rows, (r) => r._state_type, (r) => ({ state_type: r._state_type })),
  'division-wise': (rows) =>
    groupRows(rows, (r) => `${r._state_type}|${r._division}`, (r) => ({
      state_type: r._state_type,
      division: r._division,
    })),
  'district-wise': (rows) =>
    groupRows(rows, (r) => `${r._state_type}|${r._division}|${r._patient_district}`, (r) => ({
      state_type: r._state_type,
      division: r._division,
      district: r._patient_district,
    })),
  'hospital-wise': (rows) =>
    groupRows(
      rows,
      (r) => `${r._state_type}|${r._division}|${r._patient_district}|${r.hospital_name}`,
      (r) => ({
        state_type: r._state_type,
        division: r._division,
        district: r._patient_district,
        hospital_name: r.hospital_name || 'Unknown',
        hospital_type: r._hospital_type,
      })
    ),
  'specialty-wise': (rows) =>
    groupRows(rows, (r) => `${r._specialty_code}|${r._specialty_data}`, (r) => specialtyFields(r)),
  'state-hospital-type': (rows) => buildStateHospitalSummary(rows),
  'district-hospital-type': (rows) =>
    groupRows(
      rows,
      (r) => `${r._division}|${r._patient_district}|${r._hospital_type}`,
      (r) => ({
        division: r._division,
        district: r._patient_district,
        hospital_type: r._hospital_type,
      })
    ),
  'hospital-specialty': (rows) =>
    groupRows(
      rows,
      (r) => `${r._division}|${r._patient_district}|${r.hospital_name}|${r._specialty_code}|${r._specialty_data}`,
      (r) => ({
        division: r._division,
        district: r._patient_district,
        hospital_name: r.hospital_name || 'Unknown',
        ...specialtyFields(r),
      })
    ),
  'full-detail': (rows) =>
    groupRows(
      rows,
      (r) =>
        `${r._state_type}|${r._division}|${r._patient_district}|${r.hospital_name}|${r._hospital_type}|${r._specialty_code}|${r._specialty_data}`,
      (r) => ({
        state_type: r._state_type,
        division: r._division,
        district: r._patient_district,
        hospital_name: r.hospital_name || 'Unknown',
        hospital_type: r._hospital_type,
        ...specialtyFields(r),
      })
    ),
}

export function buildMasterReport(reportId, rows) {
  const builder = REPORT_BUILDERS[reportId]
  if (!builder) return []
  return builder(rows)
}

export function buildClaimsDashboard(rows) {
  return {
    kpis: aggregateKpis(rows),
    stateHospitalSummary: buildStateHospitalSummary(rows),
    charts: buildClaimsCharts(rows),
  }
}

function topEntries(entries, limit = 10, valueKey = 'value', othersLabel = 'Others') {
  const sorted = [...entries].sort((a, b) => Number(b[valueKey] ?? 0) - Number(a[valueKey] ?? 0))
  if (sorted.length <= limit) return sorted

  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit)
  const others = { name: othersLabel, [valueKey]: rest.reduce((sum, row) => sum + Number(row[valueKey] ?? 0), 0) }
  return [...top, others]
}

function countBy(rows, keyFn) {
  const acc = {}
  for (const row of rows) {
    const key = keyFn(row)
    acc[key] = (acc[key] || 0) + 1
  }
  return acc
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatTrendMonth(ym) {
  const m = String(ym).match(/^(\d{4})-(\d{2})$/)
  if (!m) return String(ym)
  const month = MONTH_SHORT[Number(m[2]) - 1]
  return month ? `${month} ${m[1]}` : String(ym)
}

function buildClaimsTrend(rows) {
  const byMonth = {}
  for (const row of rows) {
    const raw = String(row.claim_init_date || row.preauth_init_date || row.admission_dt || '').slice(0, 7)
    if (!raw || raw.length < 7) continue
    if (!byMonth[raw]) byMonth[raw] = { name: formatTrendMonth(raw), claims: 0, amount: 0 }
    byMonth[raw].claims += 1
    byMonth[raw].amount += toCrores(initiatedAmount(row))
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, m]) => ({ ...m, amount: Math.round(m.amount * 100) / 100 }))
}

export function buildClaimsCharts(rows) {
  const kpis = aggregateKpis(rows)

  const district = topEntries(
    Object.entries(countBy(rows, (r) => r._patient_district)).map(([name, claims]) => ({ name, claims })),
    10,
    'claims'
  )

  const division = topEntries(
    Object.entries(countBy(rows, (r) => r._division)).map(([name, claims]) => ({ name, claims })),
    8,
    'claims'
  )

  const specialty = topEntries(
    Object.entries(countBy(rows, (r) => r._specialty_code)).map(([name, claims]) => ({ name, claims })),
    8,
    'claims'
  )

  return {
    status: kpis.filter((k) => k.count > 0).map((k) => ({ name: k.label, value: k.count })),
    caseType: Object.entries(countBy(rows, (r) => String(r.case_type || 'Unknown'))).map(([name, value]) => ({
      name,
      value,
    })),
    district,
    stateType: Object.entries(countBy(rows, (r) => r._state_type)).map(([name, value]) => ({ name, value })),
    hospitalType: Object.entries(countBy(rows, (r) => r._hospital_type)).map(([name, value]) => ({ name, value })),
    division,
    specialty,
    claimsTrend: buildClaimsTrend(rows),
  }
}
