import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { FilterValues } from '../types'

interface FilterContextValue {
  globalFilters: FilterValues
  setGlobalFilter: (key: string, value: string) => void
  clearGlobalFilters: () => void
  activeGlobalCount: number
  search: string
  setSearch: (value: string) => void
}

export const defaultGlobalFilters: FilterValues = {
  schema: '',
  state: '',
  district: '',
  status: '',
  gender: '',
  urban_rural: '',
  hospital_type: '',
  case_type: '',
  role: '',
  department: '',
  ekyc: '',
  fraud_type: '',
  course: '',
  nabh: '',
  date_from: '',
  date_to: '',
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [globalFilters, setGlobalFilters] = useState<FilterValues>(defaultGlobalFilters)
  const [search, setSearch] = useState('')

  const setGlobalFilter = useCallback((key: string, value: string) => {
    setGlobalFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearGlobalFilters = useCallback(() => {
    setGlobalFilters(defaultGlobalFilters)
    setSearch('')
  }, [])

  const activeGlobalCount =
    Object.values(globalFilters).filter(Boolean).length + (search ? 1 : 0)

  return (
    <FilterContext.Provider value={{ globalFilters, setGlobalFilter, clearGlobalFilters, activeGlobalCount, search, setSearch }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useGlobalFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useGlobalFilters must be used within FilterProvider')
  return ctx
}
