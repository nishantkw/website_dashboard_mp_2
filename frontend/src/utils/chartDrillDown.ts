import { filterRowsForClaimKpi } from './claimKpi'
import { isRuralFlag, isUrbanFlag, rowRuralUrbanFlag } from './ruralUrban'
import { labelEntityType } from './fraudAggregations'
import {
  labelGender,
  labelEnrlStatus,
  labelCardStatus,
  labelAadhaarStatus,
  labelRelation,
  labelSourceType,
  isActiveRecord,
} from './beneficiaryCodes'

export type ChartClickPayload = Record<string, string | number | undefined> & {
  /** Bar/line series key from Recharts click */
  _seriesKey?: string
}

interface ChartRule {
  test: (chartTitle: string) => boolean
  fields: string[]
  series?: Record<string, { match: (row: Record<string, string | number>) => boolean }>
  /** Month-bucketed trend charts: match rows by date range (derived from the clicked "Mon YYYY" label) against this column, instead of exact-value matching. */
  dateField?: string
  /** Same as dateField but tried in order (first non-empty date wins — must match how the chart buckets). */
  dateFields?: string[]
  /** Exact field match (avoids Active matching Deactive via substring). */
  exact?: boolean
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** Same fallbacks the claims amount/volume trend charts use when bucketing by month. */
export const CLAIM_TREND_DATE_FIELDS = ['claim_init_date', 'preauth_init_date', 'admission_dt'] as const

function formatYmd(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** Parse a "Mon YYYY" or "YYYY-MM" chart-axis label into a calendar-month date range. */
export function monthLabelToRange(label: string): { from: string; to: string } | null {
  const raw = String(label).trim()
  const iso = raw.match(/^(\d{4})-(\d{2})$/)
  if (iso) {
    const year = Number(iso[1])
    const monthIndex = Number(iso[2]) - 1
    if (monthIndex < 0 || monthIndex > 11) return null
    return { from: formatYmd(year, monthIndex, 1), to: formatYmd(year, monthIndex, daysInMonth(year, monthIndex)) }
  }
  const m = raw.match(/^([A-Za-z]{3,})\s+(\d{4})$/)
  if (!m) return null
  const idx = MONTH_NAMES.indexOf(m[1].slice(0, 3).toLowerCase())
  if (idx === -1) return null
  const year = Number(m[2])
  return { from: formatYmd(year, idx, 1), to: formatYmd(year, idx, daysInMonth(year, idx)) }
}

const CHART_RULES: ChartRule[] = [
  {
    test: (t) => /empanelment trend/i.test(t) && !/de[- ]?empanel|deempanel/i.test(t),
    fields: [],
    dateField: 'empaneled_date',
  },
  {
    test: (t) => /deempanel trend|de[- ]?empanelment trend/i.test(t),
    fields: [],
    dateField: 'start_date',
  },
  {
    test: (t) => /treatment trend/i.test(t),
    fields: [],
    dateField: 'date_on_which',
  },
  {
    test: (t) => /audit trend/i.test(t),
    fields: [],
    dateField: 'created_dt',
  },
  {
    test: (t) => /pro workflow service|service request/i.test(t),
    fields: ['service_request_type'],
  },
  {
    test: (t) => /pro workflow role/i.test(t),
    fields: ['workflow_role', 'dashboard_workflow_role'],
  },
  {
    test: (t) => /workflow status/i.test(t),
    fields: ['status_descrption', 'status_description', 'status'],
  },
  {
    test: (t) => /workflow process|claim process/i.test(t),
    fields: ['workflow_process_code'],
  },
  {
    test: (t) => /audit process/i.test(t),
    fields: ['workflow_process_code'],
  },
  {
    test: (t) => /audit role/i.test(t),
    fields: ['previous_workflow_role', 'workflow_role'],
  },
  {
    test: (t) => /workflow district/i.test(t),
    fields: ['patient_district_name', 'hosp_district_name'],
  },
  {
    test: (t) => /workflow hospital/i.test(t),
    fields: ['hospital_name'],
  },
  {
    test: (t) => /scheme/i.test(t),
    fields: ['scheme_code'],
  },
  {
    test: (t) => /treatment specialty/i.test(t),
    fields: ['type_desc'],
  },
  {
    test: (t) => /procedure type/i.test(t),
    fields: ['type'],
  },
  {
    test: (t) => /treatment status/i.test(t),
    fields: ['status'],
  },
  {
    test: (t) => /treatment amount|amount by specialty/i.test(t),
    fields: ['type_desc'],
  },
  {
    test: (t) => /lookup categor/i.test(t),
    fields: ['lookup_cd'],
    exact: true,
  },
  {
    test: (t) => /lookup status/i.test(t),
    fields: ['active_yn'],
  },
  {
    test: (t) => /empanelment status/i.test(t),
    fields: ['hosp_status_desc', 'enrl_status'],
  },
  {
    test: (t) => /disabled trend/i.test(t),
    fields: [],
    dateField: 'disabled_date',
  },
  {
    test: (t) => /payment trend/i.test(t),
    fields: [],
    dateField: 'transaction_dt',
  },
  {
    test: (t) => /claims (amount|volume) trend|claims amount trend/i.test(t),
    fields: [],
    dateFields: [...CLAIM_TREND_DATE_FIELDS],
  },
  {
    test: (t) => /trend/i.test(t),
    fields: [],
    dateFields: [...CLAIM_TREND_DATE_FIELDS],
  },
  {
    test: (t) => /district.*claim|district claims/i.test(t),
    fields: ['patient_district_name', '_patient_district', '_district', 'hosp_district_name', 'district_name', 'district'],
  },
  {
    test: (t) => /division claims/i.test(t),
    fields: ['division', '_division'],
  },
  {
    test: (t) => /case type/i.test(t),
    fields: ['case_type'],
  },
  {
    test: (t) => /claim status/i.test(t),
    fields: ['case_status', 'status'],
  },
  {
    test: (t) => /morth gender/i.test(t),
    fields: ['gender'],
  },
  {
    test: (t) => /morth.*severity|accident severity/i.test(t),
    fields: ['accident_severity'],
  },
  {
    test: (t) => /gender/i.test(t),
    fields: ['gender', 'card_gender', 'user_gender'],
  },
  {
    test: (t) => /urban|rural/i.test(t),
    fields: ['urban_or_rural', 'urban_rural', 'rural_urban', 'rural_urban_flag', 'location_type', 'area_type'],
  },
  {
    test: (t) => /cards by district|card district|district-wise card/i.test(t),
    fields: ['district_name', 'district'],
  },
  {
    test: (t) => /district enrollment|district enroll/i.test(t),
    fields: ['dist_name', 'district_name', 'district'],
    series: {
      active: {
        match: (row) => isActiveRecord(row),
      },
    },
  },
  {
    test: (t) => /enroll trend/i.test(t),
    fields: [],
    dateField: 'enrol_date',
  },
  {
    test: (t) => /enroll status|enrollment status/i.test(t),
    fields: ['enrl_status', 'enrollment_status', 'status'],
  },
  {
    test: (t) => /card status/i.test(t),
    fields: ['card_status', 'card_print_status'],
  },
  {
    test: (t) => /aadhaar/i.test(t),
    fields: ['aadhar_status', 'aadhaar_status'],
  },
  {
    test: (t) => /^relation$/i.test(t) || /beneficiary relation/i.test(t),
    fields: ['relation'],
  },
  {
    test: (t) => /^scheme$/i.test(t),
    fields: ['scheme_code'],
  },
  {
    test: (t) => /auth mode/i.test(t),
    fields: ['auth_mode'],
  },
  {
    test: (t) => /beneficiary source/i.test(t),
    fields: ['source_type', 'src_flag'],
  },
  {
    test: (t) => /bis enroll/i.test(t),
    fields: ['enrl_status'],
  },
  {
    test: (t) => /bis card status/i.test(t),
    fields: ['card_status'],
  },
  {
    test: (t) => /bis source type/i.test(t),
    fields: ['source_type'],
  },
  {
    test: (t) => /disabled reason/i.test(t),
    fields: ['reason_desc', 'reason_id'],
  },
  {
    test: (t) => /disabled card status/i.test(t),
    fields: ['card_status'],
  },
  {
    test: (t) => /disabled source type/i.test(t),
    fields: ['source_type'],
  },
  {
    test: (t) => /source relation/i.test(t),
    fields: ['relation'],
    exact: true,
  },
  {
    test: (t) => /source card status/i.test(t),
    fields: ['card_status'],
  },
  {
    test: (t) => /source nfsa|nfsa type/i.test(t),
    fields: ['nfsa_type', 'nfsa_card_type'],
  },
  {
    test: (t) => /card status|print status|card print/i.test(t),
    fields: ['card_print_status', 'print_status', 'card_status', 'status'],
  },
  {
    test: (t) => /payment type/i.test(t),
    fields: ['payment_type'],
  },
  {
    test: (t) => /payment bank/i.test(t),
    fields: ['bank_name'],
  },
  {
    test: (t) => /source type/i.test(t),
    fields: ['source_type', 'bis_source'],
  },
  {
    test: (t) => /hem ownership/i.test(t),
    fields: ['hosp_type_cd', 'hospital_type'],
  },
  {
    test: (t) => /hem active/i.test(t),
    fields: ['active_status'],
    exact: true,
  },
  {
    test: (t) => /deempanel type|deempanel action/i.test(t),
    fields: ['type'],
  },
  {
    test: (t) => /deempanel stop|stop payment/i.test(t),
    fields: ['stop_payment'],
  },
  {
    test: (t) => /hospital type/i.test(t),
    fields: ['hospital_type', 'hosp_type'],
  },
  {
    test: (t) => /accreditation|nabh/i.test(t),
    fields: ['accreditation_status', 'nabh_certified', 'nabh_status'],
  },
  {
    test: (t) => /specialty|spec type/i.test(t),
    fields: ['hosp_spec_type', 'specialty', 'specialty_type'],
  },
  {
    test: (t) => /fraud type/i.test(t),
    fields: ['fraud_type'],
  },
  {
    test: (t) => /district case|cases by district/i.test(t),
    fields: ['district_name', 'dist_name', 'district', 'patient_district_name', '_district'],
  },
  {
    test: (t) => /entity type/i.test(t),
    fields: ['entity_type', 'entitytype'],
  },
  {
    test: (t) => /trigger code/i.test(t),
    fields: ['trigger_code'],
  },
  {
    test: (t) => /trigger type/i.test(t),
    fields: ['trigger_type'],
  },
  {
    test: (t) => /application type/i.test(t),
    fields: ['application_type'],
  },
  {
    test: (t) => /workflow status/i.test(t),
    fields: ['status_descrption', 'status_description', 'status'],
  },
  {
    test: (t) => /role distribution|^role$/i.test(t),
    fields: ['workflow_role', 'role', 'role_name'],
  },
  {
    test: (t) => /user status/i.test(t),
    fields: ['active_status', 'status'],
    exact: true,
  },
  {
    test: (t) => /user gender/i.test(t),
    fields: ['user_gender'],
    exact: true,
  },
  {
    test: (t) => /users by state|user state/i.test(t),
    fields: ['user_state_code'],
  },
  {
    test: (t) => /treatment|specialty/i.test(t),
    fields: ['specialty', 'category_details', 'procedure_details', 'treatment_type', 'department'],
  },
  {
    test: (t) => /admission type|ip\/op/i.test(t),
    fields: ['ip_op', 'admission_type'],
  },
  {
    test: (t) => /discharge/i.test(t),
    fields: ['discharge_type', 'discharge_status'],
  },
  {
    test: (t) => /icd/i.test(t),
    fields: ['icd_code', 'diagnosis_code', 'procedure_code'],
  },
  {
    test: (t) => /course|lms|training|pmjay|abdm/i.test(t),
    fields: ['course_name', 'ab_pmjay_status', 'abdm_status', 'role', 'entitytype'],
  },
]

function rowDateIso(value: unknown): string {
  const s = String(value ?? '').trim()
  if (!s) return ''
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  return ''
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function matchesCategory(
  row: Record<string, string | number>,
  fields: string[],
  category: string,
  exact = false
): boolean {
  const cat = normalize(category)
  if (!cat || cat === 'others') return false

  for (const field of fields) {
    const raw = String(row[field] ?? '').trim()
    if (!raw) continue
    const val = normalize(raw)
    if (val === cat) return true
    if (!exact && (val.includes(cat) || cat.includes(val))) return true
  }
  return false
}

function findRule(chartTitle: string): ChartRule | undefined {
  return CHART_RULES.find((rule) => rule.test(chartTitle))
}

/** Filter backend table rows for a chart segment click. */
export function filterRowsForChartClick(
  rows: Record<string, string | number>[],
  payload: ChartClickPayload,
  chartTitle: string
): Record<string, string | number>[] {
  if (!rows.length) return []

  const category = String(payload.name ?? '').trim()
  if (!category) return rows

  if (/lifecycle/i.test(chartTitle)) {
    const kpiFiltered = filterRowsForClaimKpi(rows, category)
    if (kpiFiltered) return kpiFiltered
  }

  const rule = findRule(chartTitle)
  if (!rule) {
    const cat = normalize(category)
    return rows.filter((row) =>
      Object.values(row).some((val) => normalize(String(val ?? '')) === cat)
    )
  }

  const dateFields = rule.dateFields?.length
    ? rule.dateFields
    : rule.dateField
      ? [rule.dateField]
      : []
  if (dateFields.length) {
    const range = monthLabelToRange(category)
    if (!range) return rows
    return rows.filter((row) => {
      let raw = ''
      for (const field of dateFields) {
        raw = rowDateIso(row[field])
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) break
        raw = ''
      }
      if (!raw) return false
      return raw >= range.from && raw <= range.to
    })
  }

  if (/users by state|user state/i.test(chartTitle)) {
    const code = category.match(/^(\d+)/)?.[1]
    if (code) {
      return rows.filter((row) => String(row.user_state_code ?? '').trim() === code)
    }
  }

  if (/lookup status/i.test(chartTitle)) {
    const wantActive = /^active$/i.test(category)
    return rows.filter((row) => {
      const yn = String(row.active_yn ?? '').trim()
      return wantActive ? yn === '1' : yn === '0'
    })
  }

  if (/urban|rural/i.test(chartTitle)) {
    const wantRural = /^(r|rural)$/i.test(category)
    const wantUrban = /^(u|urban)$/i.test(category)
    return rows.filter((row) => {
      const flag = rowRuralUrbanFlag(row)
      if (wantRural) return isRuralFlag(flag)
      if (wantUrban) return isUrbanFlag(flag)
      return matchesCategory(row, ['rural_urban_flag', 'rural_urban', 'urban_rural', 'urban_or_rural'], category)
    })
  }

  if (/gender/i.test(chartTitle)) {
    const want = labelGender(category)
    return rows.filter((row) => labelGender(row.gender ?? row.card_gender ?? row.user_gender) === want)
  }

  if ((/enroll status|enrollment status|bis enroll/i.test(chartTitle)) && !/trend/i.test(chartTitle)) {
    const want = labelEnrlStatus(category)
    return rows.filter((row) => labelEnrlStatus(row.enrl_status) === want)
  }

  if (/card status/i.test(chartTitle)) {
    const want = labelCardStatus(category)
    return rows.filter((row) => labelCardStatus(row.card_status ?? row.card_print_status) === want)
  }

  if (/aadhaar/i.test(chartTitle)) {
    const want = labelAadhaarStatus(category)
    return rows.filter((row) => labelAadhaarStatus(row.aadhar_status ?? row.aadhaar_status) === want)
  }

  if (/^relation$/i.test(chartTitle) || /beneficiary relation/i.test(chartTitle)) {
    const want = labelRelation(category)
    return rows.filter((row) => labelRelation(row.relation) === want)
  }

  if (/scheme/i.test(chartTitle)) {
    return rows.filter((row) => normalize(String(row.scheme_code ?? '')) === normalize(category))
  }

  if (/auth mode/i.test(chartTitle)) {
    return rows.filter((row) => normalize(String(row.auth_mode ?? '')) === normalize(category))
  }

  if (/beneficiary source/i.test(chartTitle)) {
    const want = labelSourceType(category)
    return rows.filter((row) => labelSourceType(row.source_type || row.src_flag) === want)
  }

  if (/payment status/i.test(chartTitle)) {
    const cat = normalize(category)
    return rows.filter((row) => {
      const rejected =
        /^(1|y|yes|true|r)$/i.test(String(row.reject_flag ?? '').trim()) ||
        Boolean(String(row.reject_code ?? '').trim()) ||
        Boolean(String(row.payment_reject_dt ?? '').trim())
      const paid =
        /^(1|y|yes|true|paid|p)$/i.test(String(row.paid_flag ?? '').trim()) ||
        Boolean(String(row.payment_paid_dt ?? '').trim())
      if (cat === 'rejected') return rejected
      if (cat === 'paid') return paid && !rejected
      if (cat === 'pending') return !paid && !rejected
      return false
    })
  }

  if (/pro workflow hospital type/i.test(chartTitle)) {
    const cat = normalize(category)
    return rows.filter((row) => {
      const raw = String(row.hospital_type ?? '').trim()
      const labelled = /^g$/i.test(raw) || /gov/i.test(raw) ? 'government' : /^p$/i.test(raw) || /priv/i.test(raw) ? 'private' : normalize(raw)
      return labelled === cat || normalize(raw) === cat
    })
  }

  if (/entity type/i.test(chartTitle)) {
    const cat = normalize(category)
    return rows.filter((row) => {
      const labelled = labelEntityType(row.entity_type)
      return normalize(labelled) === cat || normalize(String(row.entity_type ?? '')) === cat
    })
  }

  let filtered = rows.filter((row) => matchesCategory(row, rule.fields, category, Boolean(rule.exact)))

  const seriesKey = payload._seriesKey ? String(payload._seriesKey) : ''
  if (seriesKey && rule.series?.[seriesKey]) {
    filtered = filtered.filter((row) => rule.series![seriesKey].match(row))
  }

  return filtered
}
