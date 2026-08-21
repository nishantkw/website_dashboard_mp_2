import type { TableColumn } from '../types'
import {
  mpClaimsTableData,
  mpBeneficiaryTableData,
  mpHospitalTableData,
  mpPatientTableData,
  mpFraudTableData,
  mpFraudTriggerTableData,
  mpUsersTableData,
  mpLmsTableData,
} from './mockData'

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
    title: 'Claims & Payments Report',
    description: 'Preauth, claims volume, payment disbursements and case status',
  },
  {
    id: 'beneficiaries',
    title: 'Beneficiaries Report',
    description: 'Enrollment, eKYC, ABHA and card status by district',
  },
  {
    id: 'hospitals',
    title: 'Hospitals & Empanelment Report',
    description: 'Hospital master, NABH certification and de-empanelment',
  },
  {
    id: 'patients',
    title: 'Patients & Treatment Report',
    description: 'Admissions, specialties, ICD codes and discharge types',
  },
  {
    id: 'fraud',
    title: 'Fraud & Audit Report',
    description: 'Suspicious cases, rule triggers and investigation status',
  },
  {
    id: 'users',
    title: 'Users & Workflow Report',
    description: 'Workflow users, roles and transaction processing metrics',
  },
  {
    id: 'lms',
    title: 'LMS Training Report',
    description: 'AB-PMJAY and ABDM course completion by role and entity',
  },
]

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
      data: mpClaimsTableData,
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
        { key: 'dob', label: 'DOB' },
        { key: 'district', label: 'District' },
        { key: 'rural_urban', label: 'Rural/Urban' },
        { key: 'enrl_status', label: 'Enroll Status' },
        { key: 'card_status', label: 'Card Status' },
        { key: 'aadhar_status', label: 'Aadhaar' },
        { key: 'abha_id', label: 'ABHA ID' },
        { key: 'ekyc', label: 'eKYC' },
        { key: 'enrol_date', label: 'Enrol Date' },
      ],
      data: mpBeneficiaryTableData,
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
        { key: 'deempanel_status', label: 'De-Empanel Reason' },
        { key: 'pgdnb_status', label: 'PGDNB' },
      ],
      data: mpHospitalTableData,
    },
  ],
  patients: [
    {
      title: 'Patient & Treatment Records',
      columns: [
        { key: 'patient_id', label: 'Patient ID' },
        { key: 'name', label: 'Name' },
        { key: 'registration_id', label: 'Reg ID' },
        { key: 'case_id', label: 'Case ID' },
        { key: 'hospital', label: 'Hospital' },
        { key: 'district', label: 'District' },
        { key: 'treatment', label: 'Treatment' },
        { key: 'icd_code', label: 'ICD Code' },
        { key: 'admission_dt', label: 'Admission' },
        { key: 'discharge_dt', label: 'Discharge' },
        { key: 'admission_type', label: 'Admit Type' },
        { key: 'discharge_type', label: 'Discharge Type' },
        { key: 'cost', label: 'Cost', align: 'right' },
        { key: 'status', label: 'Status' },
      ],
      data: mpPatientTableData,
    },
  ],
  fraud: [
    {
      title: 'Suspicious Cases',
      columns: [
        { key: 'case_id', label: 'Case ID' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'hospital', label: 'Hospital / Entity' },
        { key: 'district', label: 'District' },
        { key: 'type', label: 'Fraud Type' },
        { key: 'status', label: 'Status' },
        { key: 'amount_risk', label: 'Amount at Risk', align: 'right' },
        { key: 'amount_recovered', label: 'Recovered', align: 'right' },
        { key: 'start_date', label: 'Started On' },
        { key: 'investigator', label: 'Investigator' },
      ],
      data: mpFraudTableData,
    },
    {
      title: 'Rule Trigger Details',
      columns: [
        { key: 'id_pk', label: 'ID' },
        { key: 'reference_number', label: 'Reference No.' },
        { key: 'application_type', label: 'Application Type' },
        { key: 'vendor_id', label: 'Vendor ID' },
        { key: 'trigger_type', label: 'Trigger Type' },
        { key: 'trigger_code', label: 'Trigger Code' },
        { key: 'trigger_reason', label: 'Trigger Reason' },
        { key: 'trigger_time', label: 'Trigger Time' },
        { key: 'flag', label: 'Flag' },
        { key: 'crt_usr', label: 'Created By' },
        { key: 'district', label: 'District' },
      ],
      data: mpFraudTriggerTableData,
    },
  ],
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
      data: mpUsersTableData,
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
      data: mpLmsTableData,
    },
  ],
}

export function getReportDefinition(reportId: string): ReportDefinition | null {
  const meta = REPORT_CATALOG.find((r) => r.id === reportId)
  const tables = REPORT_TABLES[reportId]
  if (!meta || !tables) return null
  return { ...meta, tables }
}
