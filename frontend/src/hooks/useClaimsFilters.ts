import { useState, useMemo, useCallback } from 'react'
import type { FilterField, FilterValues } from '../types'
import { getDistrictsForDivision, getDivisionForDistrict } from '../data/filterOptions'
import { CLAIMS_SEARCH_COLUMNS } from '../data/claimsFilterConfig'
import { applyPageFilters } from '../utils/applyPageFilters'

export function claimsFiltersToQueryString(filters: FilterValues, search: string): string {
  const params = new URLSearchParams()
  for (const [key, val] of Object.entries(filters)) {
    if (val) params.set(key, val)
  }
  if (search) params.set('search', search)
  return params.toString() ? `?${params.toString()}` : ''
}

export function useClaimsFilters(fields: FilterField[]) {
  const [filters, setFilters] = useState<FilterValues>({})
  const [search, setSearch] = useState('')

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value }
      if (key === 'state_type') {
        if (value === 'Portability') {
          updated.division = ''
          updated.district = ''
        }
      } else if (key === 'division') {
        if (value && prev.district) {
          const allowed = getDistrictsForDivision(value).map((d) => d.value)
          if (
            !allowed.includes(prev.district) &&
            !allowed.some((d) => d.toLowerCase() === prev.district.toLowerCase())
          ) {
            updated.district = ''
          }
        }
      } else if (key === 'district' && value) {
        const div = getDivisionForDistrict(value)
        if (div) updated.division = div
      }
      return updated
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearch('')
  }, [])

  const activeCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const resolvedFields = useMemo(
    () =>
      fields.map((field) => {
        if (field.key === 'district') {
          return { ...field, options: getDistrictsForDivision(filters.division) }
        }
        return field
      }),
    [fields, filters.division]
  )

  const filterRows = useCallback(
    <T extends Record<string, string | number>>(rows: T[]): T[] => {
      return applyPageFilters(rows, fields, filters, search, CLAIMS_SEARCH_COLUMNS)
    },
    [fields, filters, search]
  )

  const queryString = useMemo(() => claimsFiltersToQueryString(filters, search), [filters, search])

  return {
    filters,
    setFilter,
    search,
    setSearch,
    clearFilters,
    activeCount,
    filterRows,
    resolvedFields,
    queryString,
    searchColumns: CLAIMS_SEARCH_COLUMNS,
  }
}
