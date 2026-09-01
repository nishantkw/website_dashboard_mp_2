import { useState, useMemo, useCallback } from 'react'
import type { FilterField, FilterValues } from '../types'
import { getDistrictsForDivision, getDivisionForDistrict } from '../data/filterOptions'
import { FRAUD_SEARCH_COLUMNS } from '../data/fraudFilterConfig'

const DATE_FILTER_KEYS = new Set([
  'date_from',
  'date_to',
  'trigger_date_from',
  'trigger_date_to',
])

const DATE_COLUMN_MAP: Record<string, string> = {
  date_from: 'crt_date',
  date_to: 'crt_date',
  trigger_date_from: 'trigger_time',
  trigger_date_to: 'trigger_time',
}

function rowDate(row: Record<string, string | number>, column: string): string {
  const raw = row[column] ?? row.lst_trigger_event_date ?? row.crt_date ?? row.trigger_time
  return String(raw ?? '').slice(0, 10)
}

function matchesSelect(row: Record<string, string | number>, column: string, filterVal: string) {
  if (!filterVal) return true
  const rowVal = String(row[column] ?? '').toLowerCase()
  return rowVal === filterVal.toLowerCase() || rowVal.includes(filterVal.toLowerCase())
}

export function filtersToQueryString(filters: FilterValues, search: string): string {
  const params = new URLSearchParams()
  for (const [key, val] of Object.entries(filters)) {
    if (val) params.set(key, val)
  }
  if (search) params.set('search', search)
  return params.toString() ? `?${params.toString()}` : ''
}

export function useFraudFilters(fields: FilterField[]) {
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

  const activeCount =
    Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const resolvedFields = useMemo(() => {
    return fields.map((field) => {
      if (field.key === 'district') {
        return { ...field, options: getDistrictsForDivision(filters.division) }
      }
      return field
    })
  }, [fields, filters.division])

  const filterRows = useCallback(
    <T extends Record<string, string | number>>(rows: T[], tableColumns?: string[]): T[] => {
      return rows.filter((row) => {
        if (search) {
          const cols = tableColumns?.length
            ? tableColumns
            : [...FRAUD_SEARCH_COLUMNS]
          const haystack = cols
            .filter((c) => c in row)
            .map((c) => String(row[c] ?? ''))
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(search.toLowerCase())) return false
        }

        for (const field of fields) {
          const val = filters[field.key]
          if (!val) continue

          if (DATE_FILTER_KEYS.has(field.key)) {
            const dateCol = DATE_COLUMN_MAP[field.key] ?? field.column
            const d = rowDate(row, dateCol)
            if (!d) continue
            if (field.key.endsWith('_from') && d < val) return false
            if (field.key.endsWith('_to') && d > val) return false
            continue
          }

          const col = field.column
          if (col in row) {
            if (!matchesSelect(row, col, val)) return false
            continue
          }

          if (col === 'workflow_user' && 'dashboard_workflow_role' in row) {
            if (
              !matchesSelect(row, 'workflow_user', val) &&
              !matchesSelect(row, 'dashboard_workflow_role', val)
            ) {
              return false
            }
          }
        }

        return true
      })
    },
    [fields, filters, search]
  )

  const queryString = useMemo(() => filtersToQueryString(filters, search), [filters, search])

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
