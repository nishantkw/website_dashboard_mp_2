import type { FilterField } from '../types'
import { pageFilterConfigs } from './pageFilters'

export type ModuleFilterKey = 'mp_hospitals' | 'mp_patients' | 'mp_lms' | 'mp_workflow'

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
