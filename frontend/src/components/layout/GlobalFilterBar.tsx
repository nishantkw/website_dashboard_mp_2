import { useState, useEffect, useMemo, memo } from 'react'
import { useLocation } from 'react-router-dom'
import { Filter, RotateCcw, Search } from 'lucide-react'
import {
  DIVISION_OPTIONS, getDistrictsForDivision, STATE_TYPE_OPTIONS,
  CLAIM_STATUS_OPTIONS, CARD_STATUS_OPTIONS, USER_STATUS_OPTIONS,
  HOSPITAL_STATUS_OPTIONS, PATIENT_STATUS_OPTIONS, INVESTIGATION_STATUS_OPTIONS,
  TRAINING_STATUS_OPTIONS, ENROLLMENT_STATUS_OPTIONS,
  GENDER_OPTIONS, URBAN_RURAL_OPTIONS, HOSPITAL_TYPE_OPTIONS,
  CASE_TYPE_OPTIONS, ROLE_OPTIONS, DEPARTMENT_OPTIONS, EKYC_OPTIONS,
  FRAUD_TYPE_OPTIONS, COURSE_OPTIONS, NABH_OPTIONS,
} from '../../data/filterOptions'
import { useGlobalFilters } from '../../context/FilterContext'
import DateRangeFilter from '../ui/DateRangeFilter'

interface FilterSelectProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  /** Fill available row width instead of a fixed shrink-0 size — for filter bars with few fields, so the card doesn't look sparse. */
  grow?: boolean
  disabled?: boolean
}

const FilterSelect = memo(function FilterSelect({ label, value, options, onChange, grow, disabled }: FilterSelectProps) {
  const active = Boolean(value)
  return (
    <div className={`flex flex-col items-center ${grow ? 'min-w-[160px] flex-1' : 'shrink-0'}`}>
      <label className="mb-1 block w-full text-center text-[9px] font-bold uppercase tracking-wider text-[#1a5c38]">
        {label}
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${grow ? 'w-full' : 'min-w-[118px] max-w-[148px]'} cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs outline-none transition-all ${
          disabled
            ? 'cursor-not-allowed border-[#dceee3] bg-slate-50 text-slate-400'
            : active
            ? 'border-[#2d8a4e] bg-[#edf7f0] font-semibold text-[#1a5c38] shadow-sm shadow-emerald-900/5'
            : 'border-[#c5e0ce] bg-white text-slate-700 hover:border-[#2d8a4e]/60 hover:shadow-sm'
        } focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/15`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
})

function isOverviewPath(pathname: string) {
  const p = pathname.replace(/\/+$/, '') || '/'
  return p === '/dashboard'
}

export default function GlobalFilterBar() {
  const location = useLocation()
  const overviewOnly = isOverviewPath(location.pathname)
  const { globalFilters, setGlobalFilter, clearGlobalFilters, activeGlobalCount, search, setSearch } = useGlobalFilters()
  const [localSearch, setLocalSearch] = useState(search)

  const dynamicDistrictOptions = useMemo(
    () => getDistrictsForDivision(globalFilters.division),
    [globalFilters.division]
  )

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localSearch !== search) setSearch(localSearch)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [localSearch, search, setSearch])

  return (
    <div className="overflow-hidden rounded-xl border border-[#b8dcc4] bg-white shadow-[0_4px_20px_-4px_rgba(26,92,56,0.18)]">
      <div className="flex items-center justify-between gap-2 border-b border-[#dceee3] bg-gradient-to-r from-[#f4fbf6] to-white px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a5c38] to-[#2d8a4e] shadow-sm">
            <Filter className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#1a5c38]">Filters</span>
            {activeGlobalCount > 0 && (
              <span className="ml-2 rounded-full bg-[#2d8a4e] px-2 py-0.5 text-[10px] font-bold text-white">
                {activeGlobalCount} active
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!overviewOnly && (
            <div className="flex items-center gap-1.5 rounded-lg border border-[#c5e0ce] bg-white px-2.5 py-1 shadow-sm">
              <Search className="h-3.5 w-3.5 text-[#2d8a4e]" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search records..."
                className="w-24 bg-transparent text-xs text-slate-700 outline-none placeholder:text-[#6b9e7a] sm:w-36"
              />
            </div>
          )}
          <button
            type="button"
            onClick={clearGlobalFilters}
            title="Reset all filters"
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
              activeGlobalCount > 0
                ? 'border-[#1a5c38] bg-gradient-to-r from-[#1a5c38] to-[#2d8a4e] text-white shadow-sm hover:shadow-md'
                : 'border-[#c5e0ce] bg-white text-[#4a7c59] hover:border-[#2d8a4e] hover:text-[#1a5c38]'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            Clear Filters
          </button>
        </div>
      </div>

      <div className={overviewOnly ? 'flex flex-wrap gap-3 px-3 pb-3 pt-3 sm:px-4' : 'scrollbar-visible flex gap-2.5 overflow-x-auto px-3 pb-3 pt-3 sm:px-4'}>
        <FilterSelect label="State Type" value={globalFilters.state_type ?? ''} options={STATE_TYPE_OPTIONS} onChange={(v) => setGlobalFilter('state_type', v)} grow={overviewOnly} />
        <FilterSelect
          label="Division"
          value={globalFilters.division}
          options={DIVISION_OPTIONS}
          onChange={(v) => setGlobalFilter('division', v)}
          grow={overviewOnly}
          disabled={globalFilters.state_type === 'Portability'}
        />
        <FilterSelect
          label="District"
          value={globalFilters.district}
          options={dynamicDistrictOptions}
          onChange={(v) => setGlobalFilter('district', v)}
          grow={overviewOnly}
          disabled={globalFilters.state_type === 'Portability'}
        />

        {!overviewOnly && (
          <>
            <FilterSelect label="Claim Status" value={globalFilters.claim_status} options={CLAIM_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('claim_status', v)} />
            <FilterSelect label="Card Status" value={globalFilters.card_status} options={CARD_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('card_status', v)} />
            <FilterSelect label="User Status" value={globalFilters.user_status} options={USER_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('user_status', v)} />
            <FilterSelect label="Hospital Status" value={globalFilters.hospital_status} options={HOSPITAL_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('hospital_status', v)} />
            <FilterSelect label="Patient Status" value={globalFilters.patient_status} options={PATIENT_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('patient_status', v)} />
            <FilterSelect label="Investigation" value={globalFilters.investigation_status} options={INVESTIGATION_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('investigation_status', v)} />
            <FilterSelect label="Training Status" value={globalFilters.training_status} options={TRAINING_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('training_status', v)} />
            <FilterSelect label="Enrollment" value={globalFilters.enrollment_status} options={ENROLLMENT_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('enrollment_status', v)} />
            <FilterSelect label="Gender" value={globalFilters.gender} options={GENDER_OPTIONS} onChange={(v) => setGlobalFilter('gender', v)} />
            <FilterSelect label="Urban/Rural" value={globalFilters.urban_rural} options={URBAN_RURAL_OPTIONS} onChange={(v) => setGlobalFilter('urban_rural', v)} />
            <FilterSelect label="Hospital Type" value={globalFilters.hospital_type} options={HOSPITAL_TYPE_OPTIONS} onChange={(v) => setGlobalFilter('hospital_type', v)} />
            <FilterSelect label="Case Type" value={globalFilters.case_type} options={CASE_TYPE_OPTIONS} onChange={(v) => setGlobalFilter('case_type', v)} />
            <FilterSelect label="Role" value={globalFilters.role} options={ROLE_OPTIONS} onChange={(v) => setGlobalFilter('role', v)} />
            <FilterSelect label="Department" value={globalFilters.department} options={DEPARTMENT_OPTIONS} onChange={(v) => setGlobalFilter('department', v)} />
            <FilterSelect label="eKYC" value={globalFilters.ekyc} options={EKYC_OPTIONS} onChange={(v) => setGlobalFilter('ekyc', v)} />
            <FilterSelect label="Fraud Type" value={globalFilters.fraud_type} options={FRAUD_TYPE_OPTIONS} onChange={(v) => setGlobalFilter('fraud_type', v)} />
            <FilterSelect label="Course" value={globalFilters.course} options={COURSE_OPTIONS} onChange={(v) => setGlobalFilter('course', v)} />
            <FilterSelect label="NABH" value={globalFilters.nabh} options={NABH_OPTIONS} onChange={(v) => setGlobalFilter('nabh', v)} />
          </>
        )}

        <DateRangeFilter
          variant="labeled"
          dateFrom={globalFilters.date_from}
          dateTo={globalFilters.date_to}
          onChange={(from, to) => {
            setGlobalFilter('date_from', from)
            setGlobalFilter('date_to', to)
          }}
          grow={overviewOnly}
        />
      </div>
    </div>
  )
}
