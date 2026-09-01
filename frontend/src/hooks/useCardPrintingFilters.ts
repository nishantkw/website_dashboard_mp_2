import { useState, useMemo, useCallback } from 'react'
import type { FilterField, FilterValues } from '../types'
import { getDistrictsForDivision, getDivisionForDistrict } from '../data/filterOptions'
import { CARD_PRINTING_SEARCH_COLUMNS } from '../data/cardPrintingFilterConfig'
import { matchesRuralUrbanFilter, rowRuralUrbanFlag } from '../utils/ruralUrban'
import { matchesCardFilter } from '../utils/beneficiaryCodes'

function matchesSelect(row: Record<string, string | number>, columns: string[], filterVal: string) {
  if (!filterVal) return true
  const needle = filterVal.toLowerCase()
  return columns.some((col) => {
    const rowVal = String(row[col] ?? '').toLowerCase()
    return rowVal === needle || rowVal.includes(needle)
  })
}

function rowDistrict(row: Record<string, string | number>) {
  return String(row.district_name ?? row.district ?? '')
}

export function cardPrintingFiltersToQueryString(filters: FilterValues, search: string): string {
  const params = new URLSearchParams()
  for (const [key, val] of Object.entries(filters)) {
    if (val) params.set(key, val)
  }
  if (search) params.set('search', search)
  return params.toString() ? `?${params.toString()}` : ''
}

export function useCardPrintingFilters(fields: FilterField[]) {
  const [filters, setFilters] = useState<FilterValues>({})
  const [search, setSearch] = useState('')

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value }
      if (key === 'division') {
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
          const haystack = CARD_PRINTING_SEARCH_COLUMNS.filter((c) => c in row)
            .map((c) => String(row[c] ?? ''))
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(search.toLowerCase())) return false
        }

        if (filters.division) {
          const district = rowDistrict(row)
          const div = getDivisionForDistrict(district)
          if (div !== filters.division) return false
        }

        if (filters.district && !matchesSelect(row, ['district_name', 'district'], filters.district)) {
          return false
        }

        if (
          filters.card_status &&
          !matchesCardFilter(row.card_print_status ?? row.card_status, filters.card_status)
        ) {
          return false
        }

        if (filters.urban_rural && !matchesRuralUrbanFilter(rowRuralUrbanFlag(row), filters.urban_rural)) {
          return false
        }

        if (filters.date_from || filters.date_to) {
          const rowDate = String(row.enroll_date ?? row.approve_date ?? row.created_dt ?? '').slice(0, 10)
          if (rowDate) {
            if (filters.date_from && rowDate < filters.date_from) return false
            if (filters.date_to && rowDate > filters.date_to) return false
          }
        }

        return true
      })
    },
    [filters, search]
  )

  const queryString = useMemo(() => cardPrintingFiltersToQueryString(filters, search), [filters, search])

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
  }
}
