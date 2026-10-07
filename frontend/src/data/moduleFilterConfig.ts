import type { FilterField } from '../types'
import { pageFilterConfigs } from './pageFilters'

export type ModuleFilterKey =
  | 'mp_hospitals'
  | 'mp_hospitals_overview'
  | 'mp_hospitals_deempanel'
  | 'mp_hospitals_hem'
  | 'mp_hospitals_lookup'
  | 'mp_nafu_safu_source'
  | 'mp_patients'
  | 'mp_doctors'
  | 'mp_icd_doctors'
  | 'mp_lms'
  | 'mp_workflow'

export const MODULE_FILTER_META: Record<
  ModuleFilterKey,
  { title: string; subtitle: string; searchPlaceholder: string; searchColumns: string[] }
> = {
  mp_hospitals: {
    title: 'Hospital Filters',
    subtitle: 'State type (MP / Portability), division, district, type, NABH and empanelment status',
    searchPlaceholder: 'Hospital / Facility ID...',
    searchColumns: ['hosp_id', 'facility_id', 'hosp_name', 'hospital_name', 'district_name', 'hospital_type'],
  },
  mp_hospitals_overview: {
    title: 'Overview Filters',
    subtitle: 'State type, division, district and hospital type for KPI / chart scope',
    searchPlaceholder: 'Hospital / Facility ID...',
    searchColumns: ['hosp_id', 'facility_id', 'hosp_name', 'hospital_name', 'district_name', 'hospital_type'],
  },
  mp_hospitals_deempanel: {
    title: 'De-empanelment Filters',
    subtitle: 'Scope by hospital geography and action date',
    searchPlaceholder: 'Hospital ID / Name / Action type...',
    searchColumns: ['hosp_id', 'hospital_name', 'type', 'reasons', 'status', 'stop_payment'],
  },
  mp_hospitals_hem: {
    title: 'HEM Filters',
    subtitle: 'Ownership type and currently serving status',
    searchPlaceholder: 'Hospital / Facility / HFR ID...',
    searchColumns: ['hosp_id', 'facility_id', 'hosp_name', 'hospital_name', 'hfr_hosp_id', 'nodal_officer_name'],
  },
  mp_hospitals_lookup: {
    title: 'Lookup Search',
    subtitle: 'Reference codes and values (no geography filters)',
    searchPlaceholder: 'Lookup code / value...',
    searchColumns: ['lookup_cd', 'lookup_value', 'type', 'created_by'],
  },
  mp_nafu_safu_source: {
    title: 'NAFU / SAFU Source Filters',
    subtitle: 'Status, trigger type, fraud flag, SAFU action and date range',
    searchPlaceholder: 'Suspicious ID / Entity / Trigger...',
    searchColumns: [
      'suspicious_id',
      'pmrssm_id',
      'status',
      'trigger_reason',
      'trigger_description',
      'suspicious_entity',
      'trigger_type',
      'file_name',
      'fraud_not_fraud',
      'safu_action',
    ],
  },
  mp_patients: {
    title: 'Patient Filters',
    subtitle: 'Division, district, patient status, dates — search also matches treatment case ID / specialty',
    searchPlaceholder: 'Reg ID / Name / Case ID...',
    searchColumns: [
      'registration_id',
      'name',
      'hospital_name',
      'referral_id',
      'program_id',
      'caseid',
      'type_desc',
      'procedure_name',
    ],
  },
  mp_doctors: {
    title: 'Doctor Details Filters',
    subtitle: 'Name, registration no., qualification and contact',
    searchPlaceholder: 'Doctor name / Reg No / Case...',
    searchColumns: [
      'docregnum',
      'docname',
      'docqualification',
      'doccontactnumber',
      'registration_id',
      'case_id',
    ],
  },
  mp_icd_doctors: {
    title: 'ICD Doctor Filters',
    subtitle: 'ICD code, display and type (separate from Doctor Details)',
    searchPlaceholder: 'ICD code / display / case...',
    searchColumns: [
      'code',
      'display',
      'type',
      'typedescription',
      'registration_id',
      'case_id',
      'idpk',
    ],
  },
  mp_lms: {
    title: 'LMS Training Filters',
    subtitle: 'Role and AB-PMJAY / ABDM completion status',
    searchPlaceholder: 'User ID / Name...',
    searchColumns: ['userid', 'username', 'firstname', 'lastname', 'role', 'parententity'],
  },
  mp_workflow: {
    title: 'Workflow Filters',
    subtitle: 'Division, district, workflow role and status',
    searchPlaceholder: 'User / Reg ID...',
    searchColumns: ['workflow_user', 'registration_id', 'hospital_name', 'user_name', 'user_id'],
  },
}

export function getModuleFilters(module: ModuleFilterKey): FilterField[] {
  return pageFilterConfigs[module] ?? []
}
