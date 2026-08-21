import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { FilterValues } from '../types'
import { getDistrictsForDivision, getDivisionForDistrict } from '../data/filterOptions'

interface FilterContextValue {
  globalFilters: FilterValues
  setGlobalFilter: (key: string, value: string) => void
  clearGlobalFilters: () => void
  activeGlobalCount: number
  search: string
  setSearch: (value: string) => void
}

export const defaultGlobalFilters: FilterValues = {
  division: '',
  district: '',
  claim_status: '',
  card_status: '',
  user_status: '',
  hospital_status: '',
  patient_status: '',
  investigation_status: '',
  training_status: '',
  enrollment_status: '',
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
    setGlobalFilters((prev) => {
      const updated = { ...prev, [key]: value }

      if (key === 'division') {
        if (value && prev.district) {
          const allowedDistricts = getDistrictsForDivision(value).map((d) => d.value)
          if (!allowedDistricts.includes(prev.district)) {
            updated.district = ''
          }
        }
      } else if (key === 'district' && value) {
        const parentDiv = getDivisionForDistrict(value)
        if (parentDiv && !prev.division) {
          updated.division = parentDiv
        }
      }

      return updated
    })
  }, [])

  const clearGlobalFilters = useCallback(() => {
    setGlobalFilters(defaultGlobalFilters)
    setSearch('')
  }, [])

  const activeGlobalCount =
    Object.values(globalFilters).filter(Boolean).length + (search ? 1 : 0)

  const value = useMemo(
    () => ({
      globalFilters,
      setGlobalFilter,
      clearGlobalFilters,
      activeGlobalCount,
      search,
      setSearch,
    }),
    [globalFilters, setGlobalFilter, clearGlobalFilters, activeGlobalCount, search]
  )

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}

export function useGlobalFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useGlobalFilters must be used within FilterProvider')
  return ctx
}
