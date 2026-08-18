import { useCallback } from 'react'
import { useGlobalFilters } from '../context/FilterContext'
import { rowKeyMap } from '../data/pageFilters'

export function useGlobalFilterData() {
  const { globalFilters, search } = useGlobalFilters()

  const filterData = useCallback(
    <T extends Record<string, string | number>>(data: T[]): T[] => {
      return data.filter((row) => {
        if (search) {
          const haystack = Object.values(row).join(' ').toLowerCase()
          if (!haystack.includes(search.toLowerCase())) return false
        }

        const checks: [string, string][] = [
          ['state', 'state'],
          ['district', 'district'],
          ['status', 'status'],
          ['gender', 'gender'],
          ['ekyc', 'ekyc'],
          ['role', 'role'],
          ['department', 'department'],
          ['course', 'course'],
          ['hospital_type', 'type'],
          ['nabh', 'nabH'],
          ['fraud_type', 'type'],
        ]

        for (const [filterKey, defaultRowKey] of checks) {
          const val = globalFilters[filterKey]
          if (!val) continue
          const rowKey = rowKeyMap[filterKey] ?? defaultRowKey
          const rowVal = String(row[rowKey] ?? '').toLowerCase()
          if (!rowVal.includes(val.toLowerCase())) return false
        }

        if (globalFilters.date_from || globalFilters.date_to) {
          const dateKey = Object.keys(row).find((k) =>
            ['enroll_date', 'admission', 'created', 'last_login', 'completed_on'].includes(k)
          )
          if (dateKey) {
            const rowDate = String(row[dateKey])
            if (globalFilters.date_from && rowDate < globalFilters.date_from) return false
            if (globalFilters.date_to && rowDate > globalFilters.date_to) return false
          }
        }

        return true
      })
    },
    [globalFilters, search]
  )

  return { filterData, globalFilters, search }
}
