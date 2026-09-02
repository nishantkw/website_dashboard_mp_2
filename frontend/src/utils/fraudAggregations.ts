import type { ChartDataPoint, KPI } from '../types'
import type { SafuView } from '../data/safuConfig'

function filled(val: unknown) {
  return Boolean(String(val ?? '').trim())
}

export function labelEntityType(val: unknown): string {
  const s = String(val ?? '').trim()
  if (!s) return ''
  if (/^(g|gov|govt|government)$/i.test(s)) return 'Government'
  if (/^(p|pvt|priv|private)$/i.test(s)) return 'Private'
  return s
}

export function mapInvestigationStatus(status: unknown): { label: string; color: KPI['color'] } | null {
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

export function classifySafuStatus(status: unknown): string | null {
  const mapped = mapInvestigationStatus(status)
  if (!mapped) return null
  const byLabel: Record<string, string> = {
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

function withMomLabel(kpi: Omit<KPI, 'changeLabel'> & { changeLabel?: string }): KPI {
  return {
    ...kpi,
    change: kpi.change ?? 0,
    changeLabel: kpi.changeLabel ?? 'vs last month',
  }
}

function kpisFromField(
  rows: Record<string, unknown>[],
  field: string,
  labelFn: (val: unknown) => string,
  colorFn: (name: string) => KPI['color']
): KPI[] {
  const grouped: Record<string, number> = {}
  for (const row of rows) {
    if (!filled(row[field])) continue
    const name = labelFn(row[field])
    if (!name) continue
    grouped[name] = (grouped[name] || 0) + 1
  }
  return Object.entries(grouped).map(([name, value]) =>
    withMomLabel({ label: `${name} (${field})`, value: String(value), color: colorFn(name) })
  )
}

function investigationStatusKpis(cases: Record<string, unknown>[]): KPI[] {
  const grouped: Record<string, { color: KPI['color']; count: number }> = {}
  for (const row of cases) {
    const mapped = mapInvestigationStatus(row.investigation_status)
    if (!mapped) continue
    if (!grouped[mapped.label]) grouped[mapped.label] = { color: mapped.color, count: 0 }
    grouped[mapped.label].count += 1
  }
  return Object.entries(grouped).map(([label, group]) =>
    withMomLabel({
      label: `${label} (investigation_status)`,
      value: String(group.count),
      color: group.color,
    })
  )
}

function schemaCaseKpis(cases: Record<string, unknown>[]): KPI[] {
  const kpis: KPI[] = [
    withMomLabel({ label: 'Suspicious Cases', value: String(cases.length), color: 'orange' }),
    ...investigationStatusKpis(cases),
    ...kpisFromField(cases, 'entity_type', labelEntityType, (name) =>
      name === 'Government' ? 'green' : name === 'Private' ? 'purple' : 'blue'
    ),
    ...kpisFromField(cases, 'application_type', (v) => String(v).trim(), () => 'cyan'),
    ...kpisFromField(cases, 'fraud_type', (v) => String(v).trim(), () => 'red'),
  ]
  const hospitals = new Set(cases.map((c) => String(c.entity_id ?? '').trim()).filter(Boolean))
  if (hospitals.size) {
    kpis.push(withMomLabel({ label: 'Hospitals (entity_id)', value: String(hospitals.size), color: 'blue' }))
  }
  return kpis
}

function schemaTriggerKpis(triggers: Record<string, unknown>[]): KPI[] {
  if (!triggers.length) return []
  return [
    withMomLabel({ label: 'Triggers', value: String(triggers.length), color: 'blue' }),
    ...kpisFromField(triggers, 'trigger_type', (v) => String(v).trim(), () => 'red'),
    ...kpisFromField(triggers, 'trigger_code', (v) => String(v).trim(), () => 'orange'),
  ]
}

export function buildSafuKpis(
  view: SafuView,
  cases: Record<string, unknown>[],
  triggers: Record<string, unknown>[]
): KPI[] {
  const caseKpis = schemaCaseKpis(cases)
  const triggerKpis = schemaTriggerKpis(triggers)

  if (view === 'doctor-wise') {
    const doctors = new Set(cases.map((c) => c.investigator).filter(filled))
    const extra = doctors.size
      ? [withMomLabel({ label: 'Active Investigators (investigator)', value: String(doctors.size), color: 'blue' })]
      : []
    return [...extra, ...caseKpis]
  }

  if (view === 'trigger-analytics') {
    return [...triggerKpis, ...caseKpis.filter((k) => k.label !== 'Triggers')]
  }

  return [...caseKpis, ...triggerKpis]
}

export function filterRowsForFraudKpi<T extends Record<string, unknown>>(
  label: string,
  cases: T[],
  triggers: T[]
): { rows: T[]; source: 'case' | 'trigger' } | null {
  if (/^suspicious cases$/i.test(label)) return { rows: cases, source: 'case' }
  if (/^triggers$/i.test(label)) return { rows: triggers, source: 'trigger' }
  if (/^hospitals \(entity_id\)$/i.test(label)) {
    return { rows: cases.filter((row) => filled(row.entity_id)), source: 'case' }
  }
  if (/^active investigators/i.test(label)) {
    return { rows: cases.filter((row) => filled(row.investigator)), source: 'case' }
  }

  const fieldMatch = label.match(/^(.*)\s+\((investigation_status|entity_type|application_type|fraud_type|trigger_type|trigger_code)\)$/i)
  if (!fieldMatch) return null
  const name = fieldMatch[1].trim()
  const field = fieldMatch[2]
  const source = field.startsWith('trigger') ? 'trigger' : 'case'
  const rows = source === 'trigger' ? triggers : cases
  const filtered = rows.filter((row) => {
    if (field === 'investigation_status') return mapInvestigationStatus(row.investigation_status)?.label === name
    if (field === 'entity_type') return labelEntityType(row.entity_type) === name
    return String(row[field] ?? '').trim() === name
  })
  return { rows: filtered, source }
}

export function aggregateByField(
  rows: Record<string, unknown>[],
  field: string,
  labelFn?: (val: unknown) => string
): ChartDataPoint[] {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const key = (labelFn ? labelFn(row[field]) : String(row[field] ?? '')).trim()
    if (!key) continue
    counts[key] = (counts[key] || 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export function buildFraudCharts(
  cases: Record<string, unknown>[],
  triggers: Record<string, unknown>[]
) {
  return {
    fraudType: aggregateByField(cases, 'fraud_type'),
    district: aggregateByField(cases, 'district_name'),
    entityType: aggregateByField(cases, 'entity_type', labelEntityType),
    applicationType: aggregateByField(cases, 'application_type'),
    triggerType: aggregateByField(triggers, 'trigger_type'),
    triggerCode: aggregateByField(triggers, 'trigger_code'),
    amountRecovered: [] as ChartDataPoint[],
  }
}
