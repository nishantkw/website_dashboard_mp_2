import type { TableColumn } from '../types'

/** Column keys sourced from backend/sql/001_init_schemas.sql (SAFU API tables). */
export const FRAUD_CASE_COLUMN_KEYS = [
  'suspicion_id',
  'reference_number',
  'application_type',
  'entity_type',
  'entity_id',
  'hospital_name',
  'division_name',
  'district_name',
  'state_lgd_code',
  'fraud_type',
  'investigation_status',
  'amount_risk',
  'amount_recovered',
  'investigator',
  'lst_trigger_event_date',
  'crt_date',
  'updt_date',
] as const

/** Column keys sourced from backend/sql/001_init_schemas.sql. */
export const FRAUD_TRIGGER_COLUMN_KEYS = [
  'id_pk',
  'state_lgd_code',
  'reference_number',
  'application_type',
  'vendor_id',
  'trigger_type',
  'trigger_code',
  'trigger_time',
  'trigger_reason',
  'crt_date',
  'crt_usr',
  'flag',
  'district_name',
] as const

/** Column keys from hospital_master_with_quality_certification_final (database_documentation.docx). */
export const HOSPITAL_MASTER_COLUMN_KEYS = [
  'hosp_id',
  'facility_id',
  'hosp_name',
  'hospital_type',
  'district_name',
  'state_name',
  'hosp_spec_type',
  'enrl_status',
  'active_status',
  'accreditation_status',
  'quality_certification',
  'hosp_empaneled_date',
  'deempanel_date',
  'deempanel_status',
  'bed_size',
  'hospital_subtype',
] as const

/** Column keys from Data dictionary — Redshift TMS workflow table (workflow_users_t). */
export const WORKFLOW_USERS_COLUMN_KEYS = [
  'table_name',
  'id_pk',
  'registration_id',
  'workflow_role',
  'status_id',
  'status_descrption',
  'workflow_process_code',
  'workflow_user',
  'created_dt',
  'last_action_dt',
  'initiated_amount',
  'approved_amount',
  'transaction_dt',
  'final_level',
  'active_flag',
  'created_by',
  'remarks',
  'json_object',
  'patient_state_code',
  'patient_district_code',
  'patient_state_name',
  'patient_district_name',
  'hospital_code',
  'hospital_name',
  'hospital_state_cd',
  'hospital_district_cd',
  'hosp_district_name',
  'hosp_state_name',
  'hospital_type',
  'mobile_number',
  'user_id',
  'user_name',
  'last_insert_dt',
  'm_flag',
  'dashboard_workflow_role',
  'pendency_age',
  'ppd_tat',
  'overall_tat',
] as const

/** Column keys from Data dictionary — Redshift BIS workflow table (t_workflow_transaction_audit). */
export const WORKFLOW_AUDIT_COLUMN_KEYS = [
  'work_id_pk',
  'workflow_transaction_id',
  'status_id',
  'service_request_type',
  'json_object',
  'workflow_process_code',
  'remarks',
  'criteria_code',
  'workflow_id',
  'previous_workflow_role',
  'acted_workflow_user',
  'version',
  'final_level',
  'cluster_id',
  'active_flag',
  'transaction_dt',
  'verified',
  'time_taken_by_user',
  'time_taken_at_level',
  'current_entity_id',
  'current_tpa_group',
  'created_by',
  'created_dt',
  'updated_by',
  'updated_dt',
  'hist_created_by',
  'hist_created_dt',
  'check_list_json',
  'is_migrated',
  'reason_desc',
  'reason_id',
  'priority',
] as const

const LABEL_OVERRIDES: Record<string, string> = {
  id_pk: 'ID',
  suspicion_id: 'Suspicion ID',
  reference_number: 'Reference No.',
  state_lgd_code: 'State LGD Code',
  entity_id: 'Entity ID',
  fraud_type: 'Fraud Type',
  investigation_status: 'Investigation Status',
  amount_risk: 'Amount at Risk',
  amount_recovered: 'Amount Recovered',
  investigator: 'Investigator (SAFU Doctor)',
  lst_trigger_event_date: 'Last Trigger Event Date',
  crt_date: 'Created Date',
  crt_usr: 'Created By',
  updt_date: 'Updated Date',
  trigger_type: 'Trigger Type',
  trigger_code: 'Trigger Code',
  trigger_time: 'Trigger Time',
  trigger_reason: 'Trigger Reason',
  workflow_user: 'Workflow User',
  dashboard_workflow_role: 'Dashboard Workflow Role',
  registration_id: 'Registration / Reference ID',
  acted_workflow_user: 'Acted Workflow User',
  workflow_transaction_id: 'Workflow Transaction ID',
  nabh_certified: 'NABH Certified',
  enrl_status: 'Enrollment Status',
  hosp_spec_type: 'Hospital Specialty Type',
  empaneled_date: 'Empaneled On',
  hosp_empaneled_date: 'Empaneled On',
  deempanel_date: 'De-empanelment Date',
  deempanel_status: 'De-empanelment Status',
}

function labelize(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key]
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function schemaColumns(keys: readonly string[], alignRight: string[] = []): TableColumn[] {
  return keys.map((key) => ({
    key,
    label: labelize(key),
    ...(alignRight.includes(key) ? { align: 'right' as const } : {}),
  }))
}

export const FRAUD_CASE_COLUMNS = schemaColumns(FRAUD_CASE_COLUMN_KEYS, [
  'amount_risk',
  'amount_recovered',
  'suspicion_id',
])
export const FRAUD_TRIGGER_COLUMNS = schemaColumns(FRAUD_TRIGGER_COLUMN_KEYS, ['id_pk'])
export const HOSPITAL_MASTER_COLUMNS = schemaColumns(HOSPITAL_MASTER_COLUMN_KEYS, ['hosp_id', 'bed_size'])
export const WORKFLOW_USERS_COLUMNS = schemaColumns(WORKFLOW_USERS_COLUMN_KEYS, [
  'id_pk',
  'status_id',
  'initiated_amount',
  'approved_amount',
  'mobile_number',
])
export const WORKFLOW_AUDIT_COLUMNS = schemaColumns(WORKFLOW_AUDIT_COLUMN_KEYS, [
  'work_id_pk',
  'workflow_transaction_id',
  'status_id',
  'time_taken_by_user',
  'time_taken_at_level',
  'priority',
])

export const FRAUD_SCHEMA_TABLES = {
  case: 'dmart_mp.t_suspicious_api_case_data',
  trigger: 'dmart_mp.t_suspicious_api_case_dtls',
  hospital: 'dmart_mp.hospital_master_with_quality_certification_final',
  workflowUsers: 'dmart_mp.workflow_users_t',
  workflowAudit: 'dmart_mp.t_workflow_transaction_audit',
} as const

/** Tables shown per FRS tab — each uses only Data dictionary / schema columns. */
export const FRAUD_VIEW_TABLES: Record<
  string,
  { tableKey: keyof typeof FRAUD_SCHEMA_TABLES; title: string; columnKeys: readonly string[] }[]
> = {
  overall: [
    { tableKey: 'case', title: FRAUD_SCHEMA_TABLES.case, columnKeys: FRAUD_CASE_COLUMN_KEYS },
    { tableKey: 'trigger', title: FRAUD_SCHEMA_TABLES.trigger, columnKeys: FRAUD_TRIGGER_COLUMN_KEYS },
    { tableKey: 'hospital', title: FRAUD_SCHEMA_TABLES.hospital, columnKeys: HOSPITAL_MASTER_COLUMN_KEYS },
  ],
  'doctor-wise': [
    { tableKey: 'case', title: `${FRAUD_SCHEMA_TABLES.case} (group by investigator)`, columnKeys: FRAUD_CASE_COLUMN_KEYS },
    { tableKey: 'trigger', title: FRAUD_SCHEMA_TABLES.trigger, columnKeys: FRAUD_TRIGGER_COLUMN_KEYS },
  ],
  'sha-afo-wise': [
    { tableKey: 'workflowUsers', title: FRAUD_SCHEMA_TABLES.workflowUsers, columnKeys: WORKFLOW_USERS_COLUMN_KEYS },
    { tableKey: 'case', title: FRAUD_SCHEMA_TABLES.case, columnKeys: FRAUD_CASE_COLUMN_KEYS },
    { tableKey: 'workflowAudit', title: FRAUD_SCHEMA_TABLES.workflowAudit, columnKeys: WORKFLOW_AUDIT_COLUMN_KEYS },
  ],
  'trigger-analytics': [
    { tableKey: 'trigger', title: FRAUD_SCHEMA_TABLES.trigger, columnKeys: FRAUD_TRIGGER_COLUMN_KEYS },
    { tableKey: 'case', title: FRAUD_SCHEMA_TABLES.case, columnKeys: FRAUD_CASE_COLUMN_KEYS },
    { tableKey: 'hospital', title: FRAUD_SCHEMA_TABLES.hospital, columnKeys: HOSPITAL_MASTER_COLUMN_KEYS },
  ],
}

export const FRAUD_AUDIT_REPORT_TABLES = [
  { tableKey: 'case' as const, title: FRAUD_SCHEMA_TABLES.case, columnKeys: FRAUD_CASE_COLUMN_KEYS },
  { tableKey: 'trigger' as const, title: FRAUD_SCHEMA_TABLES.trigger, columnKeys: FRAUD_TRIGGER_COLUMN_KEYS },
  { tableKey: 'hospital' as const, title: FRAUD_SCHEMA_TABLES.hospital, columnKeys: HOSPITAL_MASTER_COLUMN_KEYS },
  { tableKey: 'workflowUsers' as const, title: FRAUD_SCHEMA_TABLES.workflowUsers, columnKeys: WORKFLOW_USERS_COLUMN_KEYS },
  { tableKey: 'workflowAudit' as const, title: FRAUD_SCHEMA_TABLES.workflowAudit, columnKeys: WORKFLOW_AUDIT_COLUMN_KEYS },
]
