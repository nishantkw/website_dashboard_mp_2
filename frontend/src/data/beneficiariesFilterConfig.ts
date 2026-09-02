import type { FilterField } from '../types'
import {
  DIVISION_OPTIONS,
  DISTRICT_OPTIONS,
  GENDER_OPTIONS,
  EKYC_OPTIONS,
  URBAN_RURAL_OPTIONS,
} from './filterOptions'

const BEN_CARD_STATUS_OPTIONS = [
  { value: '', label: 'All Card Status' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Disabled', label: 'Disabled' },
]

const BEN_ENROLLMENT_OPTIONS = [
  { value: '', label: 'All Enrollment Status' },
  { value: 'Approved', label: 'Approved' },
  { value: 'New', label: 'New' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Disabled', label: 'Disabled' },
]

/** Filters for t_bis_beneficiary_dtls — enrollment, eKYC, ABHA and card status by district. */
export const BENEFICIARIES_FILTER_FIELDS: FilterField[] = [
  { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division' },
  { key: 'district', label: 'District', type: 'select', options: DISTRICT_OPTIONS, column: 'dist_name' },
  { key: 'gender', label: 'Gender', type: 'select', options: GENDER_OPTIONS, column: 'gender' },
  { key: 'ekyc', label: 'eKYC Status', type: 'select', options: EKYC_OPTIONS, column: 'json_obj_ben_ekyc_dtl' },
  { key: 'urban_rural', label: 'Urban / Rural', type: 'select', options: URBAN_RURAL_OPTIONS, column: 'rural_urban_flag' },
  { key: 'card_status', label: 'Card Status', type: 'select', options: BEN_CARD_STATUS_OPTIONS, column: 'card_status' },
  {
    key: 'enrollment_status',
    label: 'Enrollment Status',
    type: 'select',
    options: BEN_ENROLLMENT_OPTIONS,
    column: 'enrl_status',
  },
]

export const BENEFICIARIES_SEARCH_COLUMNS = [
  'ben_id',
  'name',
  'family_id',
  'member_id',
  'dist_name',
  'district',
  'card_no',
  'abha_id',
]

export function getBeneficiariesFiltersForPage(): FilterField[] {
  return BENEFICIARIES_FILTER_FIELDS
}
