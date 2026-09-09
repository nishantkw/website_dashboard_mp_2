import { useState, useEffect, useMemo, memo } from 'react'
import { useLocation } from 'react-router-dom'
import { RotateCcw, Search } from 'lucide-react'
import CompactFilterLayout from './CompactFilterLayout'
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
import {
  compactClearClass,
  compactClearLabelClass,
  compactFilterFieldClass,
  compactFilterLabelClass,
  compactSearchInputClass,
  compactSearchWrapClass,
  compactSelectClass,
} from './compactFilterStyles'

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
    <div className={`${compactFilterFieldClass} ${grow ? 'min-w-0 flex-1' : ''}`}>
      <label className={compactFilterLabelClass}>{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={compactSelectClass(active, disabled, grow ? 'w-full min-w-0' : 'min-w-[118px] max-w-[168px]')}
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
    <CompactFilterLayout
      title="Filters"
      activeCount={activeGlobalCount}
      sticky={false}
      renderSearch={() =>
        overviewOnly ? null : (
          <div className={compactSearchWrapClass}>
            <Search className="h-3.5 w-3.5 shrink-0 text-[#2d8a4e]" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search records..."
              className={compactSearchInputClass}
            />
          </div>
        )
      }
      renderClear={() => (
        <button
          type="button"
          onClick={clearGlobalFilters}
          title="Reset all filters"
          aria-label="Clear filters"
          className={compactClearClass(activeGlobalCount > 0)}
        >
          <RotateCcw className="h-3 w-3" />
          <span className={compactClearLabelClass}>Clear</span>
        </button>
      )}
    >
      <FilterSelect label="State" value={globalFilters.state_type ?? ''} options={STATE_TYPE_OPTIONS} onChange={(v) => setGlobalFilter('state_type', v)} grow={overviewOnly} />
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
    </CompactFilterLayout>
  )
}
