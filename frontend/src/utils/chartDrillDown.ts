import { filterRowsForClaimKpi } from './claimKpi'
import { isRuralFlag, isUrbanFlag, rowRuralUrbanFlag, labelRuralUrban } from './ruralUrban'
import { labelEntityType } from './fraudAggregations'
import {
  labelGender,
  labelEnrlStatus,
  labelCardStatus,
  labelAadhaarStatus,
  labelRelation,
  labelSourceType,
  labelHospitalType,
  isActiveRecord,
} from './beneficiaryCodes'

import { districtsMatch } from './geoMatch'
import { resolveDivisionForDistrict } from '../data/filterOptions'
import { isHospitalServingClaims } from '../components/ui/HospitalStatusCells'

function normalizeEmpanelmentSlice(val: unknown) {
  return String(val ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function labelRowEmpanelmentStatus(row: Record<string, string | number>) {
  const desc = String(row.hosp_status_desc ?? '').trim()
  if (desc) {
    if (/de[- ]?empane|disempanel/i.test(desc)) return 'De-empanelled'
    if (/^empane/i.test(desc)) return 'Empanelled'
    if (/pending/i.test(desc)) return 'Pending'
    if (/inactive/i.test(desc)) return 'Inactive'
    if (/reject/i.test(desc)) return 'Rejected'
    if (/draft/i.test(desc)) return 'Draft'
    if (/invalid/i.test(desc)) return 'Invalid'
    if (/suspend/i.test(desc)) return 'Suspended'
    return desc
  }
  const s = String(row.enrl_status ?? '').trim()
  if (!s) return 'Unknown'
  if (/de[- ]?empane|disempanel/i.test(s) || s === '0') return 'De-empanelled'
  if (/^empane/i.test(s) || s === '1') return 'Empanelled'
  if (/pending/i.test(s) || s === '2') return 'Pending'
  if (/inactive/i.test(s)) return 'Inactive'
  if (/^active$/i.test(s)) return 'Empanelled'
  return s
}

export type ChartClickPayload = Record<string, string | number | undefined> & {
  /** Bar/line series key from Recharts click */
  _seriesKey?: string
  /** JSON list of named categories to exclude when the "Others" bucket is clicked */
  _othersExclude?: string
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
    dateFields: ['start_date', 'end_date', 'due_date', 'created_dt'],
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
    test: (t) => /enroll trend|enrollment trend/i.test(t),
    fields: [],
    dateFields: ['enrol_date', 'enroll_date'],
  },
  {
    test: (t) => /claims (amount|volume) trend|claims amount trend/i.test(t),
    fields: [],
    dateFields: [...CLAIM_TREND_DATE_FIELDS],
  },
  {
    // Fallback for claim-style trends only — specific * trend rules above must come first.
    test: (t) =>
      /trend/i.test(t) &&
      !/enroll|enrollment|disabled|payment|audit|treatment|empanel|deempanel/i.test(t),
    fields: [],
    dateFields: [...CLAIM_TREND_DATE_FIELDS],
  },
  {
    test: (t) => /district.*claim|district claims/i.test(t),
    fields: ['patient_district_name', '_patient_district', '_district', 'hosp_district_name', 'district_name', 'district'],
  },
  {
    test: (t) => /hospital types?|type distribution/i.test(t) && !/pro workflow|outcomes/i.test(t),
    fields: ['hospital_type', 'hosp_type_cd', 'hosp_type', '_hospital_type'],
  },
  {
    test: (t) => /hospital type outcomes/i.test(t),
    fields: ['entity_type', 'hospital_type'],
  },
  {
    test: (t) => /division hospital/i.test(t),
    fields: ['district_name', 'district', 'dist_name'],
  },
  {
    test: (t) => /state type/i.test(t),
    fields: ['_state_type', 'state_type'],
  },
  {
    test: (t) => /district hospital/i.test(t),
    fields: ['district_name', 'district', 'dist_name'],
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
    test: (t) => /de[- ]?empanelment action type|deempanel type|deempanel action/i.test(t),
    fields: ['type', 'action_type', 'action'],
    exact: true,
  },
  {
    test: (t) => /deempanel stop|stop payment/i.test(t),
    fields: ['stop_payment'],
  },
  {
    test: (t) => /^active status$/i.test(t) || /active vs inactive/i.test(t),
    fields: [],
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
    test: (t) => /manpower type/i.test(t),
    fields: ['manpower_type'],
  },
  {
    test: (t) => /manpower specialization|specialization/i.test(t),
    fields: ['specialization'],
  },
  {
    test: (t) => /manpower active/i.test(t),
    fields: ['active_status'],
    exact: true,
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
  const mdy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/)
  if (mdy) {
    const year = Number(mdy[3]) < 50 ? 2000 + Number(mdy[3]) : 1900 + Number(mdy[3])
    return `${year}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`
  }
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return ''
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function isOthersCategory(name: string): boolean {
  return /^others$/i.test(String(name ?? '').trim())
}

function parseOthersExclude(payload: ChartClickPayload): string[] {
  const raw = payload._othersExclude
  if (!raw) return []
  try {
    const parsed = JSON.parse(String(raw))
    return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : []
  } catch {
    return String(raw)
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

const DISTRICT_FIELDS = [
  'patient_district_name',
  '_patient_district',
  '_district',
  'hosp_district_name',
  'district_name',
  'dist_name',
  'district',
]

/** Map raw coded column values to the same display labels charts use. */
function labelledFieldValue(field: string, raw: unknown): string {
  const f = field.toLowerCase()
  if (f.includes('gender')) return labelGender(raw)
  if (f.includes('enrl_status') || f.includes('enrollment')) return labelEnrlStatus(raw)
  if (f.includes('card_status') || f.includes('card_print') || f === 'print_status') return labelCardStatus(raw)
  if (f.includes('aadhar') || f.includes('aadhaar')) return labelAadhaarStatus(raw)
  if (f === 'relation') return labelRelation(raw)
  if (f.includes('source_type') || f === 'bis_source' || f === 'src_flag') return labelSourceType(raw)
  if (f.includes('rural') || f.includes('urban')) return labelRuralUrban(raw)
  if (f.includes('entity_type')) return labelEntityType(raw)
  if (f === 'hospital_type' || f === 'hosp_type' || f === 'hosp_type_cd' || f === '_hospital_type') {
    return labelHospitalType(raw)
  }
  if (f === 'active_yn') {
    const s = String(raw ?? '').trim()
    if (s === '1') return 'Active'
    if (s === '0') return 'Inactive'
    return s
  }
  return String(raw ?? '').trim()
}

function matchesCategory(
  row: Record<string, string | number>,
  fields: string[],
  category: string,
  exact = false
): boolean {
  const cat = normalize(category)
  if (!cat) return false

  for (const field of fields) {
    const raw = String(row[field] ?? '').trim()
    // Unknown / empty buckets
    if (/^unknown$/i.test(category) && !raw) return true
    if (!raw) continue

    if (/district/i.test(field) || field === '_district' || field === 'dist_name') {
      if (districtsMatch(raw, category)) return true
      continue
    }

    const val = normalize(raw)
    const labelled = normalize(labelledFieldValue(field, raw))
    const catAsLabel = normalize(labelledFieldValue(field, category))

    if (val === cat || labelled === cat || labelled === catAsLabel || val === catAsLabel) return true

    if (field === 'hospital_type' || field === 'hosp_type' || field === 'hosp_type_cd') {
      if (labelled === cat || labelled === catAsLabel) return true
      continue
    }

    if (!exact && cat.length > 2 && (val.includes(cat) || labelled.includes(cat) || (cat.length >= 4 && cat.includes(val)))) {
      return true
    }
  }
  return false
}

function findRule(chartTitle: string): ChartRule | undefined {
  return CHART_RULES.find((rule) => rule.test(chartTitle))
}

/** Mirrors backend paymentAggregations.js — paid / rejected / pending buckets. */
function isPaidPaymentRow(row: Record<string, string | number>): boolean {
  const f = String(row.paid_flag ?? '').trim()
  if (/^(1|y|yes|true|paid|p)$/i.test(f)) return true
  return Boolean(String(row.payment_paid_dt ?? '').trim())
}

function isRejectedPaymentRow(row: Record<string, string | number>): boolean {
  const f = String(row.reject_flag ?? '').trim()
  if (/^(1|y|yes|true|r)$/i.test(f)) return true
  if (String(row.reject_code ?? '').trim()) return true
  return Boolean(String(row.payment_reject_dt ?? '').trim())
}

function filterRowsForPaymentStatus(
  rows: Record<string, string | number>[],
  category: string
): Record<string, string | number>[] {
  const cat = normalize(category)
  return rows.filter((row) => {
    const rejected = isRejectedPaymentRow(row)
    const paid = isPaidPaymentRow(row)
    if (cat === 'rejected') return rejected
    if (cat === 'paid') return paid && !rejected
    if (cat === 'pending') return !paid && !rejected
    return false
  })
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

  if (/payment status/i.test(chartTitle)) {
    return filterRowsForPaymentStatus(rows, category)
  }

  // Labelled coded fields must run before generic field matching (A/N vs Approved/New, etc.).
  // Skip "Others" — handled below with _othersExclude / rule fields.
  if (
    !isOthersCategory(category) &&
    /hospital types?|type distribution/i.test(chartTitle) &&
    !/pro workflow|outcomes/i.test(chartTitle)
  ) {
    const want = labelHospitalType(category)
    return rows.filter((row) => {
      const raw = row.hospital_type ?? row.hosp_type_cd ?? row.hosp_type ?? row._hospital_type
      return labelHospitalType(raw) === want
    })
  }

  if (!isOthersCategory(category) && /hospital type outcomes/i.test(chartTitle)) {
    const want = normalize(labelEntityType(category) || category)
    return rows.filter((row) => {
      const labelled = normalize(labelEntityType(row.entity_type || row.hospital_type))
      return labelled === want
    })
  }

  if (!isOthersCategory(category) && /division hospital/i.test(chartTitle)) {
    const want = normalize(category)
    return rows.filter((row) => {
      const dist = String(row.district_name ?? row.district ?? row.dist_name ?? '').trim()
      const div = resolveDivisionForDistrict(dist)
      return normalize(div) === want
    })
  }

  if (
    !isOthersCategory(category) &&
    /de[- ]?empanelment action type|deempanel type|deempanel action/i.test(chartTitle)
  ) {
    const want = normalize(category)
    return rows.filter((row) => {
      const raw = String(row.type ?? row.action_type ?? row.action ?? '').trim()
      return normalize(raw) === want
    })
  }

  if (!isOthersCategory(category) && /state type/i.test(chartTitle)) {
    const want = normalize(category)
    return rows.filter((row) => {
      const raw = String(row._state_type ?? row.state_type ?? '').trim()
      return normalize(raw) === want
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

  if (/card status/i.test(chartTitle) && !/print status|card print/i.test(chartTitle)) {
    const want = labelCardStatus(category)
    return rows.filter((row) => labelCardStatus(row.card_status ?? row.card_print_status) === want)
  }

  if (/aadhaar/i.test(chartTitle)) {
    const want = labelAadhaarStatus(category)
    return rows.filter((row) => labelAadhaarStatus(row.aadhar_status ?? row.aadhaar_status) === want)
  }

  if (
    /^relation$/i.test(chartTitle) ||
    /beneficiary relation/i.test(chartTitle) ||
    /source relation/i.test(chartTitle)
  ) {
    const want = normalize(labelRelation(category))
    return rows.filter((row) => normalize(labelRelation(row.relation)) === want)
  }

  const rule = findRule(chartTitle)
  const othersExclude = parseOthersExclude(payload)
  if (isOthersCategory(category) || othersExclude.length) {
    const exclude = othersExclude.length ? othersExclude : []

    if (exclude.length && /division hospital/i.test(chartTitle)) {
      const wantExclude = exclude.map(normalize)
      return rows.filter((row) => {
        const dist = String(row.district_name ?? row.district ?? row.dist_name ?? '').trim()
        const div = normalize(resolveDivisionForDistrict(dist))
        return Boolean(div) && !wantExclude.includes(div)
      })
    }

    if (
      exclude.length &&
      /hospital types?|type distribution/i.test(chartTitle) &&
      !/pro workflow|outcomes/i.test(chartTitle)
    ) {
      const wantExclude = exclude.map((n) => labelHospitalType(n))
      return rows.filter((row) => {
        const labelled = labelHospitalType(
          row.hospital_type ?? row.hosp_type_cd ?? row.hosp_type ?? row._hospital_type
        )
        return labelled !== 'Unknown' && !wantExclude.includes(labelled)
      })
    }

    const fields = rule?.fields?.length ? rule.fields : DISTRICT_FIELDS
    if (exclude.length) {
      return rows.filter((row) => !exclude.some((name) => matchesCategory(row, fields, name, Boolean(rule?.exact))))
    }
    return rows.filter((row) => {
      const raw = fields.map((field) => String(row[field] ?? '').trim()).find(Boolean) || ''
      return raw && !isOthersCategory(raw)
    })
  }

  if (!rule) {
    const cat = normalize(category)
    return rows.filter((row) =>
      Object.entries(row).some(([key, val]) => {
        if (val == null || String(val).trim() === '') {
          return cat === 'unknown'
        }
        if (normalize(String(val)) === cat) return true
        const labelled = normalize(labelledFieldValue(key, val))
        if (labelled === cat) return true
        if (labelled === normalize(labelledFieldValue(key, category))) return true
        return false
      })
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

  if ((/^active status$/i.test(chartTitle) || /active vs inactive/i.test(chartTitle)) && !/hem|user|manpower/i.test(chartTitle)) {
    const wantServing = /^active$/i.test(category)
    return rows.filter((row) => isHospitalServingClaims(row) === wantServing)
  }

  if (/manpower active/i.test(chartTitle)) {
    const wantActive = /^active$/i.test(category)
    return rows.filter((row) => {
      const s = String(row.active_status ?? '').trim()
      const isActive = /^(1|active|yes|true)$/i.test(s)
      return wantActive ? isActive : !isActive
    })
  }

  if (/empanelment status/i.test(chartTitle)) {
    const want = normalizeEmpanelmentSlice(category)
    return rows.filter((row) => normalizeEmpanelmentSlice(labelRowEmpanelmentStatus(row)) === want)
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

  if (/pro workflow hospital type/i.test(chartTitle)) {
    const want = labelHospitalType(category)
    return rows.filter((row) => {
      const raw = row.hospital_type ?? row.hosp_type_cd ?? row._hospital_type
      return labelHospitalType(raw) === want
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
