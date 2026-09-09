import { useCallback, useMemo } from 'react'
import { useGlobalFilters } from '../context/FilterContext'
import type { FilterField } from '../types'
import { FILTER_COLUMN_ALIASES, applyPageFilters } from '../utils/applyPageFilters'

const GLOBAL_FILTER_KEYS = [
  'state_type',
  'division',
  'state',
  'district',
  'gender',
  'ekyc',
  'urban_rural',
  'role',
  'department',
  'course',
  'hospital_type',
  'nabh',
  'fraud_type',
  'case_type',
  'claim_status',
  'card_status',
  'user_status',
  'hospital_status',
  'patient_status',
  'investigation_status',
  'training_status',
  'enrollment_status',
  'date_from',
  'date_to',
] as const

function globalFilterFields(): FilterField[] {
  return GLOBAL_FILTER_KEYS.map((key) => ({
    key,
    label: key,
    type: key.includes('date') ? 'date' : 'select',
    column: FILTER_COLUMN_ALIASES[key]?.[0] ?? key,
  }))
}

export function useGlobalFilterData() {
  const { globalFilters, search } = useGlobalFilters()
  const fields = useMemo(() => globalFilterFields(), [])

  const filterData = useCallback(
    <T extends Record<string, string | number>>(data: T[]): T[] => {
      return applyPageFilters(data, fields, globalFilters, search)
    },
    [fields, globalFilters, search]
  )

  return { filterData, globalFilters, search }
}
