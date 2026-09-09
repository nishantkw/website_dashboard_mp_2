import { useState, useMemo, useCallback } from 'react'
import type { FilterField, FilterValues } from '../types'
import { useGlobalFilters } from '../context/FilterContext'
import { applyPageFilters } from '../utils/applyPageFilters'

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

  const activeCount = Object.values(pageFilters).filter(Boolean).length + (search ? 1 : 0)

  const filterData = useCallback(
    <T extends Record<string, string | number>>(data: T[]): T[] => {
      return applyPageFilters(data, fields, allFilters, search)
    },
    [allFilters, fields, search]
  )

  return { pageFilters, setFilter, search, setSearch, clearFilters, activeCount, filterData, allFilters }
}
