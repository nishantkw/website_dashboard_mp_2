import { useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useGlobalFilters } from '../context/FilterContext'
import type { FilterField } from '../types'
import { FILTER_COLUMN_ALIASES, applyPageFilters } from '../utils/applyPageFilters'
import { getApplicableGlobalFilterKeys } from '../data/globalFilterScope'

function fieldsForKeys(keys: string[]): FilterField[] {
  return keys.map((key) => ({
    key,
    label: key,
    type: key.includes('date') ? 'date' : 'select',
    column: FILTER_COLUMN_ALIASES[key]?.[0] ?? key,
  }))
}

export function useGlobalFilterData() {
  const location = useLocation()
  const { globalFilters, search } = useGlobalFilters()

  const applicableKeys = useMemo(
    () => getApplicableGlobalFilterKeys(location.pathname),
    [location.pathname]
  )

  const fields = useMemo(() => fieldsForKeys(applicableKeys), [applicableKeys])

  const scopedFilters = useMemo(() => {
    const next: Record<string, string> = {}
    for (const key of applicableKeys) {
      const val = globalFilters[key]
      if (val) next[key] = val
    }
    return next
  }, [applicableKeys, globalFilters])

  const filterData = useCallback(
    <T extends Record<string, string | number>>(data: T[]): T[] => {
      return applyPageFilters(data, fields, scopedFilters, search)
    },
    [fields, scopedFilters, search]
  )

  return { filterData, globalFilters, search }
}
