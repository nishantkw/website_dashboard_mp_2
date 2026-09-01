import { useState, useMemo, useCallback } from 'react'
import type { FilterField, FilterValues } from '../types'
import { rowKeyMap } from '../data/pageFilters'
import { useGlobalFilters } from '../context/FilterContext'

export function usePageFilters(fields: FilterField[]) {
  const { globalFilters } = useGlobalFilters()
  const [pageFilters, setPageFilters] = useState<FilterValues>({})
  const [search, setSearch] = useState('')

  const setFilter = useCallback((key: string, value: string) => {
    setPageFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setPageFilters({})
    setSearch('')
  }, [])

  const allFilters = useMemo(() => ({ ...globalFilters, ...pageFilters }), [globalFilters, pageFilters])

  const activeCount =
    Object.values(pageFilters).filter(Boolean).length +
    (search ? 1 : 0)

  const filterData = useCallback(
    <T extends Record<string, string | number>>(data: T[]): T[] => {
      return data.filter((row) => {
        // Text search across all values
        if (search) {
          const haystack = Object.values(row).join(' ').toLowerCase()
          if (!haystack.includes(search.toLowerCase())) return false
        }

        for (const field of fields) {
          const filterVal = allFilters[field.key]
          if (!filterVal) continue

          const rowKey = rowKeyMap[field.key] ?? field.key
          const rowVal = String(row[rowKey] ?? '').toLowerCase()

          if (field.type === 'date') {
            const dateKey = rowKeyMap['date'] ?? Object.keys(row).find((k) => k.includes('date') || k === 'admission' || k === 'created' || k === 'last_login')
            if (dateKey) {
              const rowDate = String(row[dateKey])
              if (field.key === 'date_from' && rowDate < filterVal) return false
              if (field.key === 'date_to' && rowDate > filterVal) return false
            }
            continue
          }

          if (field.key === 'state' && rowKey === 'state') {
            if (!rowVal.includes(filterVal.toLowerCase())) return false
          } else if (field.key === 'fraud_type' && (rowKey === 'fraud_type' || rowKey === 'type')) {
            if (!rowVal.includes(filterVal.toLowerCase())) return false
          } else if (field.key === 'course' && rowKey === 'course') {
            if (rowVal !== filterVal.toLowerCase()) return false
          } else if (rowKey && row[rowKey] !== undefined) {
            if (rowVal !== filterVal.toLowerCase()) return false
          }
        }

        // Global state filter
        if (globalFilters.state && row.state) {
          if (!String(row.state).toLowerCase().includes(globalFilters.state.toLowerCase())) return false
        }

        return true
      })
    },
    [allFilters, fields, search, globalFilters.state]
  )

  return { pageFilters, setFilter, search, setSearch, clearFilters, activeCount, filterData, allFilters }
}
