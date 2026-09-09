import { useState, useEffect, memo } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import CompactFilterLayout from './CompactFilterLayout'
import type { FilterField } from '../../types'
import DateRangeFilter from '../ui/DateRangeFilter'
import SearchableSelect from '../ui/SearchableSelect'
import { fetchClaimsFilterOptions } from '../../api/endpoints'
import { getDistrictsForDivision } from '../../data/filterOptions'
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
  column: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

const FilterSelect = memo(function FilterSelect({ label, column, value, options, onChange }: FilterSelectProps) {
  const active = Boolean(value)
  return (
    <div className={compactFilterFieldClass}>
      <label className={compactFilterLabelClass} title={column}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={compactSelectClass(active, false, 'min-w-[96px] max-w-[128px]')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
})

interface ClaimsFilterBarProps {
  fields: FilterField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  search: string
  onSearchChange: (value: string) => void
  onClear: () => void
  activeCount: number
  subtitle?: string
}

export default function ClaimsFilterBar({
  fields,
  values,
  onChange,
  search,
  onSearchChange,
  onClear,
  activeCount,
}: ClaimsFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search)
  const [lookups, setLookups] = useState<{
    hospitals: string[]
    specialties: string[]
    patientStates: string[]
    patientDistricts: string[]
    patientGeo: { state: string; district: string }[]
  }>({
    hospitals: [],
    specialties: [],
    patientStates: [],
    patientDistricts: [],
    patientGeo: [],
  })

  useEffect(() => setLocalSearch(search), [search])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localSearch !== search) onSearchChange(localSearch)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [localSearch, search, onSearchChange])
  useEffect(() => {
    fetchClaimsFilterOptions().then((res) => {
      if (res.ok) {
        setLookups({
          hospitals: res.data.hospitals ?? [],
          specialties: res.data.specialties ?? [],
          patientStates: res.data.patientStates ?? [],
          patientDistricts: res.data.patientDistricts ?? [],
          patientGeo: res.data.patientGeo ?? [],
        })
      }
    })
  }, [])

  const selectFields = fields.filter((f) => f.type === 'select')
  const searchableFields = fields.filter((f) => f.type === 'searchable')
  const textFields = fields.filter((f) => f.type === 'text')

  const optionsFor = (field: FilterField) => {
    if (field.key === 'hospital_name') return lookups.hospitals.map((name) => ({ value: name, label: name }))
    if (field.key === 'specialty') return lookups.specialties.map((name) => ({ value: name, label: name }))
    if (field.key === 'district') {
      const div = values.division
      const allowed = div
        ? getDistrictsForDivision(div)
            .map((d) => d.value)
            .filter(Boolean)
        : []
      const names = div
        ? lookups.patientDistricts.filter((n) =>
            allowed.some((a) => a.toLowerCase() === n.toLowerCase())
          )
        : lookups.patientDistricts
      return [...new Set(names)].map((name) => ({ value: name, label: name }))
    }
    if (field.options?.length) return field.options
    return []
  }

  return (
    <CompactFilterLayout
      title="TMS Claim Filters"
      activeCount={activeCount}
      renderSearch={() => (
        <div className={compactSearchWrapClass}>
          <Search className="h-3.5 w-3.5 shrink-0 text-[#2d8a4e]" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Case / Hospital..."
            className={compactSearchInputClass}
          />
        </div>
      )}
      renderClear={() => (
        <button
          type="button"
          onClick={onClear}
          title="Clear filters"
          aria-label="Clear filters"
          className={compactClearClass(activeCount > 0)}
        >
          <RotateCcw className="h-3 w-3" />
          <span className={compactClearLabelClass}>Clear</span>
        </button>
      )}
    >
      {selectFields.map((field) => (
        <FilterSelect
          key={field.key}
          label={field.label}
          column={field.column}
          value={values[field.key] ?? ''}
          options={field.options ?? [{ value: '', label: 'All' }]}
          onChange={(v) => onChange(field.key, v)}
        />
      ))}
      {searchableFields.map((field) => (
        <SearchableSelect
          key={field.key}
          label={field.label}
          value={values[field.key] ?? ''}
          placeholder={field.label}
          options={optionsFor(field)}
          onChange={(v) => onChange(field.key, v)}
        />
      ))}
      {textFields.map((field) => (
        <div key={field.key} className={compactFilterFieldClass}>
          <label className={compactFilterLabelClass}>{field.label}</label>
          <input
            type="text"
            value={values[field.key] ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.label}
            className={compactSelectClass(Boolean(values[field.key]), false, 'min-w-[130px]')}
          />
        </div>
      ))}
      <DateRangeFilter
        variant="labeled"
        dateFrom={values.date_from ?? ''}
        dateTo={values.date_to ?? ''}
        onChange={(from, to) => {
          onChange('date_from', from)
          onChange('date_to', to)
        }}
      />
    </CompactFilterLayout>
  )
}
