import type { FilterField, FilterValues } from '../types'
import { deriveGeoStateType } from '../data/filterOptions'
import {
  districtColumnsForField,
  rowDistrictValue,
  rowMatchesDistrict,
  rowMatchesDivision,
} from './geoMatch'
import { matchesRuralUrbanFilter } from './ruralUrban'
import {
  matchesCardFilter,
  matchesEkycFilter,
  matchesEnrlFilter,
  matchesGenderFilter,
} from './beneficiaryCodes'

/** Same filter *name* can map to different schema columns on each page. */
export const FILTER_COLUMN_ALIASES: Record<string, string[]> = {
  district: [
    'district_name',
    'dist_name',
    'patient_district_name',
    'hosp_district_name',
    'district',
    '_patient_district',
    '_district',
    'district_cd',
    'sub_district_name',
  ],
  division: ['division_name', 'division', '_division'],
  state_type: ['_state_type', 'state_type'],
  urban_rural: ['urban_or_rural', 'rural_urban_flag', 'rural_urban', 'urban_rural'],
  card_status: ['card_print_status', 'card_status'],
  gender: ['gender', 'card_gender'],
  enrollment_status: ['enrl_status', 'enrollment_status'],
  // Do not alias bare `type` — on deempanel rows that column is action type, not ownership.
  hospital_type: ['hospital_type', '_hospital_type', 'hosp_type_cd'],
  hospital_status: ['enrl_status', 'active_status', 'hosp_status_desc', 'accreditation_status'],
  hospital_name: ['hospital_name', 'hosp_name'],
  specialty: ['category_details', 'specialty', '_specialty_data', 'type_desc', 'procedure_details'],
  role: ['workflow_role', 'previous_workflow_role', 'role', 'role_name', 'dashboard_workflow_role'],
  user_status: ['status_descrption', 'status_description', 'user_status', 'active_status'],
  patient_status: ['patient_status', 'status_id', 'ip_op'],
  nabh: ['quality_certification', 'nabh_certified', 'nabh'],
  ekyc: ['json_obj_ben_ekyc_dtl', 'ekyc', 'ekyc_status'],
  training_status: ['ab_pmjay_status', 'training_status'],
  workflow_user: ['workflow_user', 'dashboard_workflow_role'],
  state: ['state', 'state_name', 'patient_state_name'],
  department: ['department'],
  course: ['course'],
  claim_status: ['case_status', 'claim_status', 'status'],
  case_type: ['case_type'],
  investigation_status: ['investigation_status', 'status'],
  date_from: [
    'enroll_date',
    'claim_init_date',
    'admission_dt',
    'registration_date',
    'created_dt',
    'crt_date',
    'hosp_empaneled_date',
    'empaneled_date',
    'deempanel_date',
    'last_login',
  ],
  date_to: [
    'enroll_date',
    'claim_init_date',
    'admission_dt',
    'registration_date',
    'created_dt',
    'crt_date',
    'hosp_empaneled_date',
    'empaneled_date',
    'deempanel_date',
    'last_login',
  ],
  trigger_date_from: ['trigger_time', 'lst_trigger_event_date', 'crt_date'],
  trigger_date_to: ['trigger_time', 'lst_trigger_event_date', 'crt_date'],
}

const SKIP_KEYS = new Set(['reporting_period'])

function unique(cols: Array<string | undefined>) {
  return [...new Set(cols.filter((c): c is string => Boolean(c)))]
}

export function columnsForField(field: FilterField): string[] {
  return unique([field.column, field.key, ...(FILTER_COLUMN_ALIASES[field.key] ?? [])])
}

function hasAnyColumn(row: Record<string, unknown>, columns: string[]) {
  return columns.some((col) => Object.prototype.hasOwnProperty.call(row, col))
}

function firstValue(row: Record<string, unknown>, columns: string[]) {
  for (const col of columns) {
    const val = row[col]
    if (val != null && String(val).trim() !== '') return val
  }
  return undefined
}

function textMatches(rowVal: unknown, filterVal: string) {
  const rowText = String(rowVal ?? '').toLowerCase()
  const needle = filterVal.toLowerCase()
  return rowText === needle || rowText.includes(needle)
}

function isNabhCertified(row: Record<string, unknown>) {
  const text = `${row.quality_certification ?? ''} ${row.nabh_certified ?? ''} ${row.nabh ?? ''}`
  return /nabh/i.test(text)
}

function matchesNabh(row: Record<string, unknown>, val: string) {
  const s = val.trim()
  if (/^(no|false|0|not[- ]?certified)$/i.test(s)) return !isNabhCertified(row)
  if (/^(yes|true|1|certified)$/i.test(s)) return isNabhCertified(row)
  return isNabhCertified(row) && textMatches(firstValue(row, FILTER_COLUMN_ALIASES.nabh), val)
}

const GEO_STATE_COLUMNS = [
  '_state_type',
  'state_type',
  'district_name',
  'dist_name',
  'hosp_district_name',
  'patient_district_name',
  'district',
  'division_name',
  'division',
  '_division',
]

function matchesStateType(row: Record<string, string | number>, field: FilterField, val: string) {
  if (!val || val === 'Both') return true
  const labelled = firstValue(row, unique([field.column, '_state_type', 'state_type']))
  if (labelled != null && /^(MP|Portability)$/i.test(String(labelled))) {
    return String(labelled).toLowerCase() === val.toLowerCase()
  }
  // Tables without hospital geography (lookup, raw HEM, etc.) — do not invent Portability.
  if (!hasAnyColumn(row, unique([field.column, ...GEO_STATE_COLUMNS]))) return true
  return deriveGeoStateType(row) === val
}

function rowDateValue(row: Record<string, unknown>, field: FilterField) {
  const raw = firstValue(row, columnsForField(field))
  return raw != null ? String(raw).slice(0, 10) : ''
}

function matchesDate(row: Record<string, unknown>, field: FilterField, val: string) {
  const d = rowDateValue(row, field)
  if (!d) return true
  if (field.key.endsWith('_from') || field.key === 'date_from') return d >= val
  if (field.key.endsWith('_to') || field.key === 'date_to') return d <= val
  return textMatches(d, val)
}

export function rowMatchesPageFilters(
  row: Record<string, string | number>,
  fields: FilterField[],
  filters: FilterValues
): boolean {
  const districtField = fields.find((f) => f.key === 'district')
  const districtCols = districtColumnsForField(districtField)
  const skipGeo = filters.state_type === 'Portability'

  for (const field of fields) {
    const val = filters[field.key]
    if (!val || SKIP_KEYS.has(field.key)) continue

    if (field.key === 'state_type') {
      if (!matchesStateType(row, field, val)) return false
      continue
    }

    if (field.key === 'division') {
      if (skipGeo) continue
      const divisionCols = unique([field.column, 'division_name', 'division', '_division'])
      if (!hasAnyColumn(row, [...divisionCols, ...districtCols])) continue
      const stored = firstValue(row, divisionCols)
      if (stored != null && textMatches(stored, val)) continue
      const district = rowDistrictValue(row, districtCols)
      if (!rowMatchesDivision(district, val)) return false
      continue
    }

    if (field.key === 'district') {
      if (skipGeo) continue
      const cols = districtColumnsForField(field)
      if (!hasAnyColumn(row, cols)) continue
      const district = rowDistrictValue(row, cols)
      if (!rowMatchesDistrict(district, val)) return false
      continue
    }

    if (field.type === 'date' || /_from$|_to$|^date_/i.test(field.key)) {
      if (!matchesDate(row, field, val)) return false
      continue
    }

    const cols = columnsForField(field)
    if (!hasAnyColumn(row, cols)) continue

    if (field.key === 'nabh') {
      if (!matchesNabh(row, val)) return false
      continue
    }
    if (field.key === 'urban_rural') {
      if (!matchesRuralUrbanFilter(firstValue(row, cols), val)) return false
      continue
    }
    if (field.key === 'card_status') {
      if (!matchesCardFilter(firstValue(row, cols), val)) return false
      continue
    }
    if (field.key === 'gender') {
      if (!matchesGenderFilter(firstValue(row, cols), val)) return false
      continue
    }
    if (field.key === 'enrollment_status') {
      if (!matchesEnrlFilter(firstValue(row, cols), val)) return false
      continue
    }
    if (field.key === 'hospital_status') {
      const blob = cols.map((c) => String(row[c] ?? '')).join(' ')
      if (!textMatches(blob, val) && !matchesEnrlFilter(firstValue(row, cols), val)) return false
      continue
    }
    if (field.key === 'ekyc') {
      if (!matchesEkycFilter(row, val)) return false
      continue
    }

    const rowVal = firstValue(row, cols)
    if (rowVal == null || !textMatches(rowVal, val)) return false
  }

  return true
}

export function applyPageFilters<T extends Record<string, string | number>>(
  rows: T[],
  fields: FilterField[],
  filters: FilterValues,
  search = '',
  searchColumns?: readonly string[]
): T[] {
  const q = search.trim().toLowerCase()
  return rows.filter((row) => {
    if (q) {
      const cols = searchColumns?.length
        ? searchColumns.filter((c) => c in row)
        : Object.keys(row)
      const haystack = cols
        .map((c) => String(row[c] ?? ''))
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return rowMatchesPageFilters(row, fields, filters)
  })
}
