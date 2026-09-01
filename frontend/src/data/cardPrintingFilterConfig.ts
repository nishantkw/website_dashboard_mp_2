import type { FilterField } from '../types'
import {
  DIVISION_OPTIONS,
  DISTRICT_OPTIONS,
  URBAN_RURAL_OPTIONS,
} from './filterOptions'

const CARD_PRINT_STATUS_OPTIONS = [
  { value: '', label: 'All Print Status' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Marked for Download', label: 'Marked for Download' },
  { value: 'Downloaded', label: 'Downloaded' },
  { value: 'Distributed', label: 'Distributed' },
  { value: 'Printed', label: 'Printed' },
  { value: 'Delivered', label: 'Delivered' },
]

/** Filters for t_card_printing_status — division, district, print status, urban/rural, enroll dates. */
export const CARD_PRINTING_FILTER_FIELDS: FilterField[] = [
  { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division_name' },
  { key: 'district', label: 'District', type: 'select', options: DISTRICT_OPTIONS, column: 'district_name' },
  {
    key: 'card_status',
    label: 'Card Print Status',
    type: 'select',
    options: CARD_PRINT_STATUS_OPTIONS,
    column: 'card_print_status',
  },
  { key: 'urban_rural', label: 'Urban / Rural', type: 'select', options: URBAN_RURAL_OPTIONS, column: 'urban_or_rural' },
  { key: 'date_from', label: 'Enroll From', type: 'date', column: 'enroll_date' },
  { key: 'date_to', label: 'Enroll To', type: 'date', column: 'enroll_date' },
]

export const CARD_PRINTING_SEARCH_COLUMNS = [
  'card_no',
  'ben_id',
  'family_id',
  'card_name',
  'district_name',
  'card_print_status',
  'source_type',
]

export function getCardPrintingFiltersForPage(): FilterField[] {
  return CARD_PRINTING_FILTER_FIELDS
}
