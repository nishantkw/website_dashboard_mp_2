import type { FilterField } from '../types'
import type { SafuView } from './safuConfig'
import {
  DIVISION_OPTIONS,
  getDistrictsForDivision,
  HOSPITAL_TYPE_OPTIONS,
  SAFU_CASE_STATUS_OPTIONS,
  FRAUD_TYPE_OPTIONS,
  TRIGGER_TYPE_OPTIONS,
  TRIGGER_CODE_OPTIONS,
  APPLICATION_TYPE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  SAFU_DOCTOR_OPTIONS,
  SHA_AFO_OPTIONS,
} from './filterOptions'

/** FRS §5 Common Dashboard Filters — each `column` is a schema field name. */
export const FRAUD_COMMON_FILTERS: FilterField[] = [
  { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division_name' },
  { key: 'district', label: 'District', type: 'select', options: getDistrictsForDivision(), column: 'district_name' },
  {
    key: 'investigation_status',
    label: 'Case Status',
    type: 'select',
    options: SAFU_CASE_STATUS_OPTIONS,
    column: 'investigation_status',
  },
  {
    key: 'fraud_type',
    label: 'Trigger Category',
    type: 'select',
    options: FRAUD_TYPE_OPTIONS,
    column: 'fraud_type',
  },
  {
    key: 'hospital_type',
    label: 'Hospital Type',
    type: 'select',
    options: HOSPITAL_TYPE_OPTIONS,
    column: 'hospital_type',
  },
  {
    key: 'application_type',
    label: 'Application Type',
    type: 'select',
    options: APPLICATION_TYPE_OPTIONS,
    column: 'application_type',
  },
  {
    key: 'entity_type',
    label: 'Entity Type',
    type: 'select',
    options: ENTITY_TYPE_OPTIONS,
    column: 'entity_type',
  },
  {
    key: 'investigator',
    label: 'SAFU Doctor',
    type: 'select',
    options: SAFU_DOCTOR_OPTIONS,
    column: 'investigator',
  },
  {
    key: 'workflow_user',
    label: 'SHA-AFO Officer',
    type: 'select',
    options: SHA_AFO_OPTIONS,
    column: 'workflow_user',
  },
  {
    key: 'trigger_type',
    label: 'Trigger Type',
    type: 'select',
    options: TRIGGER_TYPE_OPTIONS,
    column: 'trigger_type',
  },
  {
    key: 'trigger_code',
    label: 'Trigger Code',
    type: 'select',
    options: TRIGGER_CODE_OPTIONS,
    column: 'trigger_code',
  },
  { key: 'date_from', label: 'From Date', type: 'date', column: 'crt_date' },
  { key: 'date_to', label: 'To Date', type: 'date', column: 'crt_date' },
  { key: 'trigger_date_from', label: 'Trigger From', type: 'date', column: 'trigger_time' },
  { key: 'trigger_date_to', label: 'Trigger To', type: 'date', column: 'trigger_time' },
]

/** Per-tab emphasis — all filters remain schema-backed; tabs reorder/highlight relevant ones. */
const VIEW_FILTER_KEYS: Record<SafuView, string[]> = {
  overall: [
    'division',
    'district',
    'investigation_status',
    'fraud_type',
    'hospital_type',
    'application_type',
    'entity_type',
    'date_from',
    'date_to',
  ],
  'doctor-wise': [
    'division',
    'district',
    'investigator',
    'investigation_status',
    'fraud_type',
    'hospital_type',
    'date_from',
    'date_to',
  ],
  'sha-afo-wise': [
    'division',
    'district',
    'workflow_user',
    'investigation_status',
    'fraud_type',
    'hospital_type',
    'date_from',
    'date_to',
  ],
  'trigger-analytics': [
    'division',
    'district',
    'trigger_type',
    'trigger_code',
    'fraud_type',
    'application_type',
    'hospital_type',
    'investigation_status',
    'trigger_date_from',
    'trigger_date_to',
    'date_from',
    'date_to',
  ],
}

export function getFraudFiltersForView(view: SafuView): FilterField[] {
  const keys = VIEW_FILTER_KEYS[view]
  const byKey = Object.fromEntries(FRAUD_COMMON_FILTERS.map((f) => [f.key, f]))
  return keys.map((k) => byKey[k]).filter(Boolean)
}

/** Full set for standalone Fraud and Audit report. */
export function getFraudReportFilters(): FilterField[] {
  return FRAUD_COMMON_FILTERS
}

export const FRAUD_SEARCH_COLUMNS = [
  'reference_number',
  'hospital_name',
  'fraud_type',
  'investigator',
  'entity_id',
  'entity_type',
  'workflow_user',
  'trigger_code',
  'trigger_type',
] as const
