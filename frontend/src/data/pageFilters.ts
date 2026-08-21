import type { FilterField } from '../types'
import {
  DIVISION_OPTIONS, DISTRICT_OPTIONS,
  CLAIM_STATUS_OPTIONS, CARD_STATUS_OPTIONS, USER_STATUS_OPTIONS,
  HOSPITAL_STATUS_OPTIONS, PATIENT_STATUS_OPTIONS, INVESTIGATION_STATUS_OPTIONS,
  TRAINING_STATUS_OPTIONS, ENROLLMENT_STATUS_OPTIONS,
  GENDER_OPTIONS, URBAN_RURAL_OPTIONS, HOSPITAL_TYPE_OPTIONS,
  CASE_TYPE_OPTIONS, ROLE_OPTIONS, DEPARTMENT_OPTIONS, EKYC_OPTIONS,
  FRAUD_TYPE_OPTIONS, COURSE_OPTIONS, NABH_OPTIONS,
} from './filterOptions'

export const pageFilterConfigs: Record<string, FilterField[]> = {
  overview: [
    { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division_name' },
    { key: 'district', label: 'District', type: 'select', options: DISTRICT_OPTIONS, column: 'district_name' },
    { key: 'claim_status', label: 'Claim Status', type: 'select', options: CLAIM_STATUS_OPTIONS, column: 'case_status' },
    { key: 'date_from', label: 'From Date', type: 'date', column: 'created_dt' },
    { key: 'date_to', label: 'To Date', type: 'date', column: 'created_dt' },
  ],
  bis: [
    { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division_name' },
    { key: 'district', label: 'District', type: 'select', options: DISTRICT_OPTIONS, column: 'district_name' },
    { key: 'card_status', label: 'Card Print Status', type: 'select', options: CARD_STATUS_OPTIONS, column: 'card_print_status' },
    { key: 'urban_rural', label: 'Urban / Rural', type: 'select', options: URBAN_RURAL_OPTIONS, column: 'urban_or_rural' },
    { key: 'date_from', label: 'Enroll From', type: 'date', column: 'enroll_date' },
    { key: 'date_to', label: 'Enroll To', type: 'date', column: 'enroll_date' },
  ],
  mp_claims: [
    { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'patient_division_name' },
    { key: 'district', label: 'District', type: 'select', options: DISTRICT_OPTIONS, column: 'patient_district_name' },
    { key: 'claim_status', label: 'Case Status', type: 'select', options: CLAIM_STATUS_OPTIONS, column: 'case_status' },
    { key: 'case_type', label: 'Case Type', type: 'select', options: CASE_TYPE_OPTIONS, column: 'case_type' },
    { key: 'date_from', label: 'Admission From', type: 'date', column: 'admission_dt' },
    { key: 'date_to', label: 'Admission To', type: 'date', column: 'admission_dt' },
  ],
  mp_beneficiaries: [
    { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division_name' },
    { key: 'district', label: 'District', type: 'select', options: DISTRICT_OPTIONS, column: 'district_name' },
    { key: 'gender', label: 'Gender', type: 'select', options: GENDER_OPTIONS, column: 'gender' },
    { key: 'ekyc', label: 'eKYC Status', type: 'select', options: EKYC_OPTIONS, column: 'ekyc_status' },
    { key: 'urban_rural', label: 'Urban / Rural', type: 'select', options: URBAN_RURAL_OPTIONS, column: 'urban_or_rural' },
    { key: 'card_status', label: 'Card Status', type: 'select', options: CARD_STATUS_OPTIONS, column: 'card_status' },
    { key: 'enrollment_status', label: 'Enrollment Status', type: 'select', options: ENROLLMENT_STATUS_OPTIONS, column: 'enrl_status' },
  ],
  mp_hospitals: [
    { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division_name' },
    { key: 'district', label: 'District', type: 'select', options: DISTRICT_OPTIONS, column: 'district_name' },
    { key: 'hospital_type', label: 'Hospital Type', type: 'select', options: HOSPITAL_TYPE_OPTIONS, column: 'hospital_type' },
    { key: 'nabh', label: 'NABH Certification', type: 'select', options: NABH_OPTIONS, column: 'nabh_certified' },
    { key: 'hospital_status', label: 'Empanelment Status', type: 'select', options: HOSPITAL_STATUS_OPTIONS, column: 'empanelment_status' },
  ],
  mp_patients: [
    { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division_name' },
    { key: 'district', label: 'District', type: 'select', options: DISTRICT_OPTIONS, column: 'district_name' },
    { key: 'patient_status', label: 'Patient Status', type: 'select', options: PATIENT_STATUS_OPTIONS, column: 'patient_status' },
    { key: 'date_from', label: 'Admission From', type: 'date', column: 'admission_dt' },
    { key: 'date_to', label: 'Admission To', type: 'date', column: 'admission_dt' },
  ],
  mp_fraud: [
    { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division_name' },
    { key: 'district', label: 'District', type: 'select', options: DISTRICT_OPTIONS, column: 'district_name' },
    { key: 'fraud_type', label: 'Fraud Type', type: 'select', options: FRAUD_TYPE_OPTIONS, column: 'fraud_type' },
    { key: 'investigation_status', label: 'Investigation Status', type: 'select', options: INVESTIGATION_STATUS_OPTIONS, column: 'investigation_status' },
  ],
  mp_users: [
    { key: 'department', label: 'Department', type: 'select', options: DEPARTMENT_OPTIONS, column: 'department' },
    { key: 'role', label: 'Role', type: 'select', options: ROLE_OPTIONS, column: 'role' },
    { key: 'user_status', label: 'User Status', type: 'select', options: USER_STATUS_OPTIONS, column: 'user_status' },
  ],
  mp_lms: [
    { key: 'course', label: 'Course', type: 'select', options: COURSE_OPTIONS, column: 'course_name' },
    { key: 'training_status', label: 'Completion Status', type: 'select', options: TRAINING_STATUS_OPTIONS, column: 'completion_status' },
  ],
  ump: [
    { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division_name' },
    { key: 'role', label: 'Role', type: 'select', options: ROLE_OPTIONS, column: 'role' },
    { key: 'user_status', label: 'User Status', type: 'select', options: USER_STATUS_OPTIONS, column: 'user_status' },
  ],
}

export const rowKeyMap: Record<string, string> = {
  division: 'division',
  state: 'state',
  district: 'district',
  gender: 'gender',
  ekyc: 'ekyc',
  urban_rural: 'urban_rural',
  hospital_type: 'type',
  nabh: 'nabh',
  case_type: 'case_type',
  fraud_type: 'type',
  department: 'department',
  role: 'role',
  course: 'course',
}
