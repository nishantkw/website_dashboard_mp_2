import { useState, useEffect, useMemo, memo } from 'react'
import { useLocation } from 'react-router-dom'
import { RotateCcw, Search } from 'lucide-react'
import CompactFilterLayout from './CompactFilterLayout'
import {
  DIVISION_OPTIONS, getDistrictsForDivision, STATE_TYPE_OPTIONS,
  CARD_STATUS_OPTIONS, USER_STATUS_OPTIONS,
  HOSPITAL_STATUS_OPTIONS, PATIENT_STATUS_OPTIONS,
  TRAINING_STATUS_OPTIONS,
  URBAN_RURAL_OPTIONS, HOSPITAL_TYPE_OPTIONS,
  ROLE_OPTIONS, NABH_OPTIONS,
} from '../../data/filterOptions'
import { getApplicableGlobalFilterKeys } from '../../data/globalFilterScope'
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
  const allowed = useMemo(
    () => new Set(getApplicableGlobalFilterKeys(location.pathname)),
    [location.pathname]
  )
  const show = (key: string) => allowed.has(key)

  const { globalFilters, setGlobalFilter, clearGlobalFilters, search, setSearch } = useGlobalFilters()
  const [localSearch, setLocalSearch] = useState(search)

  const activeCount = useMemo(() => {
    let n = 0
    for (const key of allowed) {
      if (globalFilters[key]) n += 1
    }
    if (!overviewOnly && search) n += 1
    return n
  }, [allowed, globalFilters, overviewOnly, search])

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

  const grow = overviewOnly || allowed.size <= 5

  return (
    <CompactFilterLayout
      title="Filters"
      activeCount={activeCount}
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
          className={compactClearClass(activeCount > 0)}
        >
          <RotateCcw className="h-3 w-3" />
          <span className={compactClearLabelClass}>Clear</span>
        </button>
      )}
    >
      {show('state_type') && (
        <FilterSelect
          label="State"
          value={globalFilters.state_type ?? ''}
          options={STATE_TYPE_OPTIONS}
          onChange={(v) => setGlobalFilter('state_type', v)}
          grow={grow}
        />
      )}
      {show('division') && (
        <FilterSelect
          label="Division"
          value={globalFilters.division}
          options={DIVISION_OPTIONS}
          onChange={(v) => setGlobalFilter('division', v)}
          grow={grow}
          disabled={globalFilters.state_type === 'Portability'}
        />
      )}
      {show('district') && (
        <FilterSelect
          label="District"
          value={globalFilters.district}
          options={dynamicDistrictOptions}
          onChange={(v) => setGlobalFilter('district', v)}
          grow={grow}
          disabled={globalFilters.state_type === 'Portability'}
        />
      )}
      {show('card_status') && (
        <FilterSelect label="Card Status" value={globalFilters.card_status} options={CARD_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('card_status', v)} />
      )}
      {show('user_status') && (
        <FilterSelect label="User Status" value={globalFilters.user_status} options={USER_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('user_status', v)} />
      )}
      {show('hospital_status') && (
        <FilterSelect label="Hospital Status" value={globalFilters.hospital_status} options={HOSPITAL_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('hospital_status', v)} />
      )}
      {show('patient_status') && (
        <FilterSelect label="Patient Status" value={globalFilters.patient_status} options={PATIENT_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('patient_status', v)} />
      )}
      {show('training_status') && (
        <FilterSelect label="Training Status" value={globalFilters.training_status} options={TRAINING_STATUS_OPTIONS} onChange={(v) => setGlobalFilter('training_status', v)} />
      )}
      {show('urban_rural') && (
        <FilterSelect label="Urban/Rural" value={globalFilters.urban_rural} options={URBAN_RURAL_OPTIONS} onChange={(v) => setGlobalFilter('urban_rural', v)} />
      )}
      {show('hospital_type') && (
        <FilterSelect label="Hospital Type" value={globalFilters.hospital_type} options={HOSPITAL_TYPE_OPTIONS} onChange={(v) => setGlobalFilter('hospital_type', v)} />
      )}
      {show('role') && (
        <FilterSelect label="Role" value={globalFilters.role} options={ROLE_OPTIONS} onChange={(v) => setGlobalFilter('role', v)} />
      )}
      {show('nabh') && (
        <FilterSelect label="NABH" value={globalFilters.nabh} options={NABH_OPTIONS} onChange={(v) => setGlobalFilter('nabh', v)} />
      )}

      {(show('date_from') || show('date_to')) && (
        <DateRangeFilter
          variant="labeled"
          dateFrom={globalFilters.date_from}
          dateTo={globalFilters.date_to}
          onChange={(from, to) => {
            setGlobalFilter('date_from', from)
            setGlobalFilter('date_to', to)
          }}
          grow={grow}
        />
      )}
    </CompactFilterLayout>
  )
}
