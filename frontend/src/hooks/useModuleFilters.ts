import { useState, useMemo, useCallback } from 'react'
import type { FilterField, FilterValues } from '../types'
import { getDistrictsForDivision, getDivisionForDistrict, deriveGeoStateType } from '../data/filterOptions'
import { MODULE_FILTER_META, type ModuleFilterKey } from '../data/moduleFilterConfig'

function matchesSelect(row: Record<string, string | number>, columns: string[], filterVal: string) {
  if (!filterVal) return true
  const needle = filterVal.toLowerCase()
  return columns.some((col) => {
    const rowVal = String(row[col] ?? '').toLowerCase()
    return rowVal === needle || rowVal.includes(needle)
  })
}

export function moduleFiltersToQueryString(filters: FilterValues, search: string): string {
  const params = new URLSearchParams()
  for (const [key, val] of Object.entries(filters)) {
    if (val) params.set(key, val)
  }
  if (search) params.set('search', search)
  return params.toString() ? `?${params.toString()}` : ''
}

export function useModuleFilters(module: ModuleFilterKey, fields: FilterField[]) {
  const meta = MODULE_FILTER_META[module]
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
          if (!allowed.includes(prev.district)) updated.district = ''
        }
      } else if (key === 'district' && value) {
        const div = getDivisionForDistrict(value)
        if (div && !prev.division) updated.division = div
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
      return rows.filter((row) => {
        if (search) {
          const haystack = meta.searchColumns
            .filter((c) => c in row)
            .map((c) => String(row[c] ?? ''))
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(search.toLowerCase())) return false
        }

        if (filters.state_type && filters.state_type !== 'Both') {
          if (deriveGeoStateType(row) !== filters.state_type) return false
        }

        if (filters.state_type !== 'Portability' && filters.division) {
          const district = String(row.district_name ?? row.dist_name ?? row.patient_district_name ?? row.hosp_district_name ?? '')
          const div = getDivisionForDistrict(district)
          if (div !== filters.division) return false
        }

        for (const field of fields) {
          const val = filters[field.key]
          if (!val || field.type === 'date') continue
          if (field.key === 'state_type' || field.key === 'division') continue
          if (filters.state_type === 'Portability' && field.key === 'district') continue
          const cols = [field.column, field.key].filter(Boolean)
          if (!matchesSelect(row, cols, val)) return false
        }

        if (filters.date_from || filters.date_to) {
          const dateKey = Object.keys(row).find((k) =>
            ['admission_dt', 'registration_date', 'created_dt', 'hosp_empaneled_date', 'empaneled_date', 'deempanel_date', 'last_login'].includes(k)
          )
          if (dateKey) {
            const rowDate = String(row[dateKey]).slice(0, 10)
            if (filters.date_from && rowDate < filters.date_from) return false
            if (filters.date_to && rowDate > filters.date_to) return false
          }
        }

        return true
      })
    },
    [filters, search, fields, meta.searchColumns]
  )

  const queryString = useMemo(() => moduleFiltersToQueryString(filters, search), [filters, search])

  return {
    filters,
    setFilter,
    search,
    setSearch,
    clearFilters,
    activeCount,
    filterRows,
    queryString,
    resolvedFields,
    meta,
  }
}
