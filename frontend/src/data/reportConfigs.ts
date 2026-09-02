import type { TableColumn } from '../types'
import {
  FRAUD_AUDIT_REPORT_TABLES,
  schemaColumns,
  FRAUD_CASE_COLUMNS,
  FRAUD_TRIGGER_COLUMNS,
  HOSPITAL_MASTER_COLUMNS,
  WORKFLOW_USERS_COLUMNS,
  WORKFLOW_AUDIT_COLUMNS,
} from './fraudSchema'

const EMPTY_ROWS: Record<string, string | number>[] = []

export interface ReportDefinition {
  id: string
  title: string
  description: string
  tables: {
    title: string
    columns: TableColumn[]
    data: Record<string, string | number>[]
  }[]
}

export const REPORT_CATALOG: Omit<ReportDefinition, 'tables'>[] = [
  {
    id: 'claims',
    title: 'Master Report TMS — Claims & Payments',
    description: 'FRS claim lifecycle KPIs, TMS Recovery, and payment details (dmart_mp.payment_dtls)',
  },
  {
    id: 'beneficiaries',
    title: 'Beneficiaries Report',
    description: 'Enrollment, eKYC, ABHA, source family, disabled, and BIS raw beneficiary details',
  },
  {
    id: 'hospitals',
    title: 'Hospitals & Empanelment Report',
    description: 'Hospital master, NABH, de-empanelment, and m_lookup hospital reference codes',
  },
  {
    id: 'patients',
    title: 'Patients & Treatment Report',
    description: 'Patient master (t_patient_dtls), treatment details (treatment_dtls), and MORTH patients (t_morth_patient_details)',
  },
  {
    id: 'fraud-audit',
    title: 'Fraud and Audit Report',
    description:
      'Schema tables only: t_suspicious_api_case_data, t_suspicious_api_case_dtls, hospital_master_with_quality_certification_final, workflow_users_t, t_workflow_transaction_audit',
  },
  {
    id: 'users',
    title: 'Users & Workflow Report',
    description: 'Workflow users, roles, audit events, and pro workflow users (dmart_mp.pro_workflow_users_t)',
  },
  {
    id: 'lms',
    title: 'LMS Training Report',
    description: 'AB-PMJAY and ABDM course completion by role and entity',
  },
]

const FRAUD_EMPTY_DATA: Record<string, Record<string, string | number>[]> = {
  case: EMPTY_ROWS,
  trigger: EMPTY_ROWS,
  hospital: EMPTY_ROWS,
  workflowUsers: EMPTY_ROWS,
  workflowAudit: EMPTY_ROWS,
}

const FRAUD_DEMO_COLUMNS: Record<string, TableColumn[]> = {
  case: FRAUD_CASE_COLUMNS,
  trigger: FRAUD_TRIGGER_COLUMNS,
  hospital: HOSPITAL_MASTER_COLUMNS,
  workflowUsers: WORKFLOW_USERS_COLUMNS,
  workflowAudit: WORKFLOW_AUDIT_COLUMNS,
}

const REPORT_TABLES: Record<string, ReportDefinition['tables']> = {
  claims: [
    {
      title: 'Claims & Payments Records',
      columns: [
        { key: 'case_id', label: 'Case ID' },
        { key: 'patient', label: 'Patient' },
        { key: 'hospital_code', label: 'Hosp Code' },
        { key: 'hospital', label: 'Hospital' },
        { key: 'district', label: 'District' },
        { key: 'case_type', label: 'Case Type' },
        { key: 'procedure', label: 'Procedure' },
        { key: 'status', label: 'Status' },
        { key: 'preauth_date', label: 'Preauth Date' },
        { key: 'surgery_dt', label: 'Surgery Date' },
        { key: 'discharge_dt', label: 'Discharge' },
        { key: 'claim_date', label: 'Claim Init' },
        { key: 'payment_dt', label: 'Payment Date' },
        { key: 'amount', label: 'Amount', align: 'right' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'Payment Details (dmart_mp.payment_dtls)',
      columns: [
        { key: 'case_id', label: 'Case ID' },
        { key: 'payment_type', label: 'Payment Type' },
        { key: 'bank_name', label: 'Bank' },
        { key: 'payment_unique_id', label: 'Payment Unique ID' },
        { key: 'transaction_amount', label: 'Amount', align: 'right' },
        { key: 'transaction_dt', label: 'Transaction Date' },
        { key: 'paid_flag', label: 'Paid Flag' },
        { key: 'payment_paid_dt', label: 'Paid Date' },
        { key: 'reject_flag', label: 'Reject Flag' },
        { key: 'payer_id', label: 'Payer ID' },
        { key: 'state_code', label: 'State Code' },
      ],
      data: EMPTY_ROWS,
    },
  ],
  beneficiaries: [
    {
      title: 'Beneficiary Records',
      columns: [
        { key: 'ben_id', label: 'Ben ID' },
        { key: 'name', label: 'Name' },
        { key: 'family_id', label: 'Family ID' },
        { key: 'member_id', label: 'Member' },
        { key: 'gender', label: 'Gender' },
        { key: 'district', label: 'District' },
        { key: 'rural_urban_flag', label: 'Rural / Urban' },
        { key: 'active_status', label: 'Active Status' },
        { key: 'enrl_status', label: 'Enroll Status' },
        { key: 'card_status', label: 'Card Status' },
        { key: 'aadhar_status', label: 'Aadhaar' },
        { key: 'abha_id', label: 'ABHA ID' },
        { key: 'ekyc', label: 'eKYC' },
        { key: 'enrol_date', label: 'Enrol Date' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'Source Family Data (dmart_mp.m_source_data)',
      columns: [
        { key: 'id_pk', label: 'ID' },
        { key: 'src_family_id', label: 'Source Family ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
        { key: 'gender', label: 'Gender' },
        { key: 'rural_urban_flag', label: 'Rural / Urban' },
        { key: 'relation', label: 'Relation' },
        { key: 'father_guardian_name', label: 'Father / Guardian' },
        { key: 'dist_cd', label: 'District Code' },
        { key: 'enrl_status', label: 'Enroll Status' },
        { key: 'card_status', label: 'Card Status' },
        { key: 'card_no', label: 'Card No' },
        { key: 'source_type', label: 'Source Type' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'Disabled Beneficiaries (dmart_mp.t_bis_beneficiary_disabled)',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'card_no', label: 'Card No' },
        { key: 'family_id', label: 'Family ID' },
        { key: 'member_id', label: 'Member ID' },
        { key: 'card_status', label: 'Card Status' },
        { key: 'source_type', label: 'Source Type' },
        { key: 'reason_desc', label: 'Disable Reason' },
        { key: 'disabled_date', label: 'Disabled Date' },
        { key: 'state_cd', label: 'State Code' },
        { key: 'acted_workflow_user', label: 'Acted By' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'BIS Raw Beneficiaries (bis_raw.t_bis_beneficiary_dtls)',
      columns: [
        { key: 'id_pk', label: 'ID' },
        { key: 'ben_id', label: 'Ben ID' },
        { key: 'name', label: 'Name' },
        { key: 'family_id', label: 'Family ID' },
        { key: 'member_id', label: 'Member ID' },
        { key: 'gender', label: 'Gender' },
        { key: 'dist_name', label: 'District' },
        { key: 'dist_cd', label: 'District Code' },
        { key: 'enrl_status', label: 'Enroll Status' },
        { key: 'card_status', label: 'Card Status' },
        { key: 'card_no', label: 'Card No' },
      ],
      data: EMPTY_ROWS,
    },
  ],
  hospitals: [
    {
      title: 'Hospital Empanelment Records',
      columns: [
        { key: 'code', label: 'Hospital Code' },
        { key: 'facility_id', label: 'Facility ID' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'district', label: 'District' },
        { key: 'spec_type', label: 'Specialty' },
        { key: 'nabh', label: 'NABH' },
        { key: 'enrl_status', label: 'Enroll Status' },
        { key: 'active_status', label: 'Active' },
        { key: 'accreditation', label: 'Accreditation' },
        { key: 'empaneled_date', label: 'Empaneled On' },
        { key: 'deempanel_date', label: 'De-empanelment Date' },
        { key: 'deempanel_status', label: 'De-empanelment Status' },
        { key: 'pgdnb_status', label: 'PGDNB' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'De-empanelment Details (dmart_mp.t_deempanelment_details)',
      columns: [
        { key: 'hosp_id', label: 'Hospital ID' },
        { key: 'hospital_name', label: 'Hospital' },
        { key: 'type', label: 'Action Type' },
        { key: 'status', label: 'Status' },
        { key: 'stop_payment', label: 'Stop Payment' },
        { key: 'start_date', label: 'Start Date' },
        { key: 'end_date', label: 'End Date' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'deempanel_scheme', label: 'Scheme' },
        { key: 'remarks', label: 'Remarks' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'HEM Hospital (dmart_mp.t_hem_hospital)',
      columns: [
        { key: 'hosp_id', label: 'Hospital ID' },
        { key: 'facility_id', label: 'Facility ID' },
        { key: 'hosp_name', label: 'Name' },
        { key: 'hosp_type_cd', label: 'Type' },
        { key: 'hosp_city', label: 'City' },
        { key: 'state_cd', label: 'State' },
        { key: 'active_status', label: 'Active' },
        { key: 'enrl_status', label: 'Enroll Status' },
        { key: 'hfr_hosp_id', label: 'HFR ID' },
        { key: 'nodal_officer_name', label: 'Nodal Officer' },
        { key: 'empaneled_date', label: 'Empaneled On' },
        { key: 'certificate_expiry_date', label: 'Certificate Expiry' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'Hospital Lookup (dmart_mp.m_lookup)',
      columns: [
        { key: 'id_pk', label: 'ID' },
        { key: 'lookup_cd', label: 'Lookup Code' },
        { key: 'lookup_value', label: 'Lookup Value' },
        { key: 'active_yn', label: 'Active' },
        { key: 'created_by', label: 'Created By' },
        { key: 'created_dt', label: 'Created' },
      ],
      data: EMPTY_ROWS,
    },
  ],
  patients: [
    {
      title: 'Patient Records',
      columns: [
        { key: 'registration_id', label: 'Reg ID' },
        { key: 'name', label: 'Name' },
        { key: 'hospital_name', label: 'Hospital' },
        { key: 'district_code', label: 'District Code' },
        { key: 'gender', label: 'Gender' },
        { key: 'registration_date', label: 'Registration Date' },
        { key: 'ip_op', label: 'IP/OP' },
        { key: 'status_id', label: 'Status' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'Treatment Details (dmart_mp.treatment_dtls)',
      columns: [
        { key: 'registration_id', label: 'Reg ID' },
        { key: 'caseid', label: 'Case ID' },
        { key: 'item_id', label: 'Item ID' },
        { key: 'type', label: 'Type' },
        { key: 'type_desc', label: 'Specialty' },
        { key: 'date_on_which', label: 'Date' },
        { key: 'procedure_name', label: 'Procedure' },
        { key: 'amount', label: 'Amount', align: 'right' },
        { key: 'approved_amount', label: 'Approved Amount', align: 'right' },
        { key: 'status', label: 'Status' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'MORTH Patients (dmart_mp.t_morth_patient_details)',
      columns: [
        { key: 'patient_registration_id', label: 'Reg ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
        { key: 'gender', label: 'Gender' },
        { key: 'hospital_name', label: 'Hospital' },
        { key: 'accident_severity', label: 'Severity' },
        { key: 'date_of_accident', label: 'Accident Date' },
        { key: 'care_plan', label: 'Care Plan' },
        { key: 'patient_con_uncon', label: 'Conscious' },
        { key: 'govt_id_type', label: 'ID Type' },
      ],
      data: EMPTY_ROWS,
    },
  ],
  'fraud-audit': FRAUD_AUDIT_REPORT_TABLES.map((spec) => ({
    title: spec.title,
    columns: FRAUD_DEMO_COLUMNS[spec.tableKey] ?? schemaColumns(spec.columnKeys),
    data: FRAUD_EMPTY_DATA[spec.tableKey] ?? EMPTY_ROWS,
  })),
  users: [
    {
      title: 'Workflow User Records',
      columns: [
        { key: 'user_id', label: 'User ID' },
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'department', label: 'Department' },
        { key: 'district', label: 'District' },
        { key: 'transactions', label: 'Transactions', align: 'right' },
        { key: 'avg_time', label: 'Avg Time' },
        { key: 'status', label: 'Status' },
        { key: 'last_login', label: 'Last Login' },
        { key: 'pending', label: 'Pending Actions', align: 'right' },
      ],
      data: EMPTY_ROWS,
    },
    {
      title: 'Pro Workflow Users (dmart_mp.pro_workflow_users_t)',
      columns: [
        { key: 'id_pk', label: 'ID' },
        { key: 'registration_id', label: 'Reg ID' },
        { key: 'workflow_user', label: 'User' },
        { key: 'user_name', label: 'User Name' },
        { key: 'workflow_role', label: 'Role' },
        { key: 'workflow_process_code', label: 'Process' },
        { key: 'status_descrption', label: 'Status' },
        { key: 'hospital_name', label: 'Hospital' },
        { key: 'patient_district_name', label: 'District' },
        { key: 'initiated_amount', label: 'Initiated', align: 'right' },
        { key: 'approved_amount', label: 'Approved', align: 'right' },
        { key: 'service_request_type', label: 'Service Request' },
      ],
      data: EMPTY_ROWS,
    },
  ],
  lms: [
    {
      title: 'LMS Training Records',
      columns: [
        { key: 'userid', label: 'User ID' },
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'entity', label: 'Entity' },
        { key: 'parententity', label: 'Parent Entity' },
        { key: 'entitytype', label: 'Entity Type' },
        { key: 'ab_pmjay_status', label: 'AB-PMJAY Status' },
        { key: 'abdm_status', label: 'ABDM Status' },
        { key: 'ab_pmjay_completed', label: 'PMJAY Completed' },
        { key: 'abdm_completed', label: 'ABDM Completed' },
      ],
      data: EMPTY_ROWS,
    },
  ],
}

const REPORT_ALIASES: Record<string, string> = {
  fraud: 'fraud-audit',
  'safu-overall': 'fraud-audit',
  'safu-doctor-wise': 'fraud-audit',
  'safu-sha-afo-wise': 'fraud-audit',
  'safu-trigger-analytics': 'fraud-audit',
  'safu-trigger-cases': 'fraud-audit',
}

export function getReportDefinition(reportId: string): ReportDefinition | null {
  const resolvedId = REPORT_ALIASES[reportId] ?? reportId
  const meta = REPORT_CATALOG.find((r) => r.id === resolvedId)
  const tables = REPORT_TABLES[resolvedId]
  if (!meta || !tables) return null
  return { ...meta, tables }
}

export { FRAUD_AUDIT_REPORT_TABLES }
