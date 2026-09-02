/**
 * KPI helpers only — table columns come exclusively from schema / Data dictionary tables.
 */

import { getPrimaryTableForModule } from './schemaRegistry.js'
import { buildKpi } from './kpiChange.js'

const hospPrimary = getPrimaryTableForModule('hospitals')

export const FRAUD_CASE_SCHEMA = 'dmart_mp'
export const FRAUD_CASE_TABLE = 't_suspicious_api_case_data'
export const FRAUD_TRIGGER_SCHEMA = 'dmart_mp'
export const FRAUD_TRIGGER_TABLE = 't_suspicious_api_case_dtls'
export const HOSPITAL_SCHEMA = hospPrimary?.schema ?? 'dmart_mp'
export const HOSPITAL_TABLE = hospPrimary?.table ?? 'hospital_master_with_quality_certification_final'
export const WORKFLOW_USERS_SCHEMA = 'dmart_mp'
export const WORKFLOW_USERS_TABLE = 'workflow_users_t'
export const WORKFLOW_AUDIT_SCHEMA = 'dmart_mp'
export const WORKFLOW_AUDIT_TABLE = 't_workflow_transaction_audit'

function filled(val) {
  return Boolean(String(val ?? '').trim())
}

export function labelEntityType(val) {
  const s = String(val ?? '').trim()
  if (!s) return ''
  if (/^(g|gov|govt|government)$/i.test(s)) return 'Government'
  if (/^(p|pvt|priv|private)$/i.test(s)) return 'Private'
  return s
}

/** Map investigation_status to FRS labels when the text matches; otherwise keep the raw value. */
export function mapInvestigationStatus(status) {
  const raw = String(status ?? '').trim()
  if (!raw) return null
  const s = raw.toLowerCase()
  if (/abuse/.test(s)) return { label: 'Abuse', color: 'red' }
  if (/non[- ]?fraud|cleared|not fraud/.test(s)) return { label: 'Non-Fraud', color: 'green' }
  if (/confirm.*fraud|fraud.*confirm|fraud detected/.test(s) || /^fraud$/.test(s)) {
    return { label: 'Fraud', color: 'red' }
  }
  if (/query\s*iii\b|query\s*3\b|query.*safu|query.*doctor/.test(s)) {
    return { label: 'Query III Pending', color: 'orange' }
  }
  if (/query\s*ii\b|query\s*2\b|query.*cpd/.test(s)) {
    return { label: 'Query II Pending', color: 'orange' }
  }
  if (/query\s*i\b|query\s*1\b|query.*hospital/.test(s)) {
    return { label: 'Query I Pending', color: 'orange' }
  }
  if (/under process|under investigation|pending|open|active/.test(s)) {
    return { label: 'Under Process', color: 'blue' }
  }
  return { label: raw, color: 'indigo' }
}

export function classifySafuStatus(status) {
  const mapped = mapInvestigationStatus(status)
  if (!mapped) return null
  const byLabel = {
    Abuse: 'abuse',
    Fraud: 'fraud',
    'Non-Fraud': 'non_fraud',
    'Under Process': 'under_process',
    'Query I Pending': 'query_hospital',
    'Query II Pending': 'query_cpd',
    'Query III Pending': 'query_safu',
  }
  return byLabel[mapped.label] || 'other'
}

export function statsForRows(rows) {
  const buckets = {
    suspicious: rows,
    abuse: [],
    fraud: [],
    non_fraud: [],
    under_process: [],
    query_hospital: [],
    query_cpd: [],
    query_safu: [],
    other: [],
  }
  for (const row of rows) {
    const key = classifySafuStatus(row.investigation_status)
    if (key && buckets[key]) buckets[key].push(row)
  }
  return {
    suspicious: { count: rows.length },
    abuse: { count: buckets.abuse.length },
    fraud: { count: buckets.fraud.length },
    non_fraud: { count: buckets.non_fraud.length },
    under_process: { count: buckets.under_process.length },
    query_hospital: { count: buckets.query_hospital.length },
    query_cpd: { count: buckets.query_cpd.length },
    query_safu: { count: buckets.query_safu.length },
    buckets,
  }
}

function kpisFromField(rows, field, labelFn, colorFn) {
  const grouped = {}
  for (const row of rows) {
    if (!filled(row[field])) continue
    const name = labelFn ? labelFn(row[field]) : String(row[field]).trim()
    if (!name) continue
    if (!grouped[name]) grouped[name] = []
    grouped[name].push(row)
  }
  return Object.entries(grouped).map(([name, group]) =>
    buildKpi({
      label: `${name} (${field})`,
      value: group.length,
      color: colorFn?.(name) || 'blue',
      rows,
      predicate: (row) => {
        if (!filled(row[field])) return false
        const mapped = labelFn ? labelFn(row[field]) : String(row[field]).trim()
        return mapped === name
      },
    })
  )
}

function investigationStatusKpis(cases) {
  const grouped = {}
  for (const row of cases) {
    const mapped = mapInvestigationStatus(row.investigation_status)
    if (!mapped) continue
    if (!grouped[mapped.label]) grouped[mapped.label] = { color: mapped.color, rows: [] }
    grouped[mapped.label].rows.push(row)
  }
  return Object.entries(grouped).map(([label, group]) =>
    buildKpi({
      label: `${label} (investigation_status)`,
      value: group.rows.length,
      color: group.color,
      rows: cases,
      predicate: (row) => mapInvestigationStatus(row.investigation_status)?.label === label,
    })
  )
}

function amountKpi(cases, field, label, color) {
  const withAmount = cases.filter((row) => Number(row[field]) > 0)
  if (!withAmount.length) return []
  const total = Math.round(withAmount.reduce((sum, row) => sum + (Number(row[field]) || 0), 0))
  return [
    buildKpi({
      label: `${label} (${field})`,
      value: total,
      color,
      rows: cases,
      predicate: (row) => Number(row[field]) > 0,
    }),
  ]
}

function schemaCaseKpis(cases) {
  const kpis = [
    buildKpi({ label: 'Suspicious Cases', value: cases.length, color: 'orange', rows: cases }),
    ...investigationStatusKpis(cases),
    ...kpisFromField(cases, 'entity_type', labelEntityType, (name) =>
      name === 'Government' ? 'green' : name === 'Private' ? 'purple' : 'blue'
    ),
    ...kpisFromField(cases, 'application_type', (v) => String(v).trim(), () => 'cyan'),
    ...kpisFromField(cases, 'fraud_type', (v) => String(v).trim(), () => 'red'),
    ...amountKpi(cases, 'amount_risk', 'Amount at Risk', 'orange'),
    ...amountKpi(cases, 'amount_recovered', 'Amount Recovered', 'green'),
  ]
  const hospitals = new Set(cases.map((c) => String(c.entity_id ?? '').trim()).filter(Boolean))
  if (hospitals.size) {
    kpis.push(
      buildKpi({
        label: 'Hospitals (entity_id)',
        value: hospitals.size,
        color: 'blue',
        rows: cases,
        predicate: (row) => filled(row.entity_id),
      })
    )
  }
  return kpis
}

function schemaTriggerKpis(triggers) {
  if (!triggers.length) return []
  return [
    buildKpi({
      label: 'Triggers',
      value: triggers.length,
      color: 'blue',
      rows: triggers,
      dateFields: ['trigger_time', 'crt_date'],
    }),
    ...kpisFromField(triggers, 'trigger_type', (v) => String(v).trim(), () => 'red'),
    ...kpisFromField(triggers, 'trigger_code', (v) => String(v).trim(), () => 'orange'),
  ]
}

export function buildSafuKpis(view, cases, triggers) {
  const caseKpis = schemaCaseKpis(cases)
  const triggerKpis = schemaTriggerKpis(triggers)

  if (view === 'doctor-wise') {
    const doctors = new Set(cases.map((c) => c.investigator).filter(filled))
    const extra = doctors.size
      ? [buildKpi({ label: 'Active Investigators (investigator)', value: doctors.size, color: 'blue', rows: cases, predicate: (row) => filled(row.investigator) })]
      : []
    return [...extra, ...caseKpis]
  }

  if (view === 'trigger-analytics') {
    return [...triggerKpis, ...caseKpis.filter((k) => k.label !== 'Triggers')]
  }

  return [...caseKpis, ...triggerKpis]
}

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
    if (key == null || String(key).trim() === '') continue
    acc[key] = (acc[key] || 0) + 1
  }
  return Object.entries(acc).map(([name, val]) => ({ name, [valueKey]: val }))
}

function sumBy(rows, keyFn, amountKey) {
  const acc = {}
  let any = false
  for (const row of rows) {
    const key = keyFn(row)
    if (key == null || String(key).trim() === '') continue
    const amount = Number(row[amountKey]) || 0
    if (amount) any = true
    acc[key] = (acc[key] || 0) + amount
  }
  if (!any) return []
  return Object.entries(acc).map(([name, value]) => ({ name, value: Math.round(value) }))
}

function statusBreakdownChart(rows) {
  const acc = {}
  for (const row of rows) {
    const mapped = mapInvestigationStatus(row.investigation_status)
    if (!mapped) continue
    acc[mapped.label] = (acc[mapped.label] || 0) + 1
  }
  return Object.entries(acc)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function buildHospitalTypeOutcomes(cases) {
  const hasStatus = cases.some((row) => mapInvestigationStatus(row.investigation_status))
  if (!hasStatus) return []
  const acc = {}
  for (const row of cases) {
    const ht = labelEntityType(row.entity_type || row.hospital_type)
    if (!ht) continue
    if (!acc[ht]) acc[ht] = { fraud: 0, nonFraud: 0, other: 0 }
    const bucket = classifySafuStatus(row.investigation_status)
    if (bucket === 'fraud') acc[ht].fraud += 1
    else if (bucket === 'non_fraud') acc[ht].nonFraud += 1
    else acc[ht].other += 1
  }
  return Object.entries(acc).map(([name, counts]) => ({
    name,
    fraud: counts.fraud,
    nonFraud: counts.nonFraud,
    other: counts.other,
  }))
}

function buildCommonCharts(cases, triggers) {
  const recoveredByMonth = {}
  let recoveredAny = false
  for (const d of cases) {
    const amount = Number(d.amount_recovered) || 0
    if (!amount) continue
    recoveredAny = true
    const month = String(d.crt_date || '').slice(0, 7)
    if (!month || month.length < 7) continue
    recoveredByMonth[month] = (recoveredByMonth[month] || 0) + amount
  }

  return {
    fraudType: countBy(cases, (r) => String(r.fraud_type || '').trim()),
    district: topEntries(countBy(cases, (r) => String(r.district_name || '').trim()), 10),
    triggerType: countBy(triggers, (r) => String(r.trigger_type || '').trim()),
    triggerCode: countBy(triggers, (r) => String(r.trigger_code || '').trim()),
    entityType: countBy(cases, (r) => labelEntityType(r.entity_type)),
    applicationType: countBy(cases, (r) => String(r.application_type || '').trim()),
    amountRecovered: recoveredAny
      ? Object.entries(recoveredByMonth).map(([name, value]) => ({ name, value: Math.round(value) }))
      : [],
  }
}

export function buildSafuCharts(view, cases, triggers, _workflowUsers = []) {
  const common = buildCommonCharts(cases, triggers)
  const doctorsFilled = cases.filter((r) => filled(r.investigator))
  const officersFromCases = cases.filter((r) => filled(r.investigator) || filled(r.medag_or_safo))

  if (view === 'doctor-wise') {
    return {
      ...common,
      byDoctor: doctorsFilled.length
        ? topEntries(countBy(doctorsFilled, (r) => String(r.investigator).trim(), 'cases'), 10, 'cases')
        : [],
      statusBreakdown: statusBreakdownChart(cases),
      amountByDoctor: doctorsFilled.length
        ? topEntries(sumBy(doctorsFilled, (r) => String(r.investigator).trim(), 'amount_risk'), 8)
        : [],
    }
  }

  if (view === 'sha-afo-wise') {
    return {
      ...common,
      byOfficer: officersFromCases.length
        ? topEntries(
            countBy(officersFromCases, (r) => String(r.investigator || r.medag_or_safo).trim(), 'cases'),
            10,
            'cases'
          )
        : [],
      statusBreakdown: statusBreakdownChart(cases),
      workloadByStatus: statusBreakdownChart(cases).map((e) => ({ name: e.name, cases: e.value })),
    }
  }

  if (view === 'trigger-analytics') {
    return {
      ...common,
      triggerCode: topEntries(common.triggerCode, 10),
      triggerTrend: buildTriggerTrend(triggers),
      hospitalTypeOutcomes: buildHospitalTypeOutcomes(cases),
      statusBreakdown: statusBreakdownChart(cases),
    }
  }

  return common
}

/** Month buckets from trigger_time / crt_date. */
function buildTriggerTrend(triggers) {
  const byMonth = {}
  for (const row of triggers) {
    const month = String(row.trigger_time || row.crt_date || '').slice(0, 7)
    if (!month || month.length < 7) continue
    byMonth[month] = (byMonth[month] || 0) + 1
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }))
}

