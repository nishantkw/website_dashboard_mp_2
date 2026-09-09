import { useState, useEffect, memo } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import CompactFilterLayout from './CompactFilterLayout'
import type { FilterField } from '../../types'
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
  column: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  wide?: boolean
  disabled?: boolean
}

const FilterSelect = memo(function FilterSelect({ label, column, value, options, onChange, wide, disabled }: FilterSelectProps) {
  const active = Boolean(value)
  return (
    <div className={compactFilterFieldClass}>
      <label className={compactFilterLabelClass} title={column}>
        {label}
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={compactSelectClass(
          active,
          disabled,
          wide ? 'min-w-[128px] max-w-[168px]' : 'min-w-[96px] max-w-[128px]'
        )}
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

interface ModuleFilterBarProps {
  title: string
  subtitle?: string
  searchPlaceholder?: string
  fields: FilterField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  search: string
  onSearchChange: (value: string) => void
  onClear: () => void
  activeCount: number
}

export default function ModuleFilterBar({
  title,
  searchPlaceholder = 'Search records...',
  fields,
  values,
  onChange,
  search,
  onSearchChange,
  onClear,
  activeCount,
}: ModuleFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search)

  useEffect(() => setLocalSearch(search), [search])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localSearch !== search) onSearchChange(localSearch)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [localSearch, search, onSearchChange])

  const selectFields = fields.filter((f) => f.type === 'select')
  const hasDateRange = fields.some((f) => f.key === 'date_from' || f.key === 'date_to')

  return (
    <CompactFilterLayout
      title={title}
      activeCount={activeCount}
      renderSearch={() => (
        <div className={compactSearchWrapClass}>
          <Search className="h-3.5 w-3.5 shrink-0 text-[#2d8a4e]" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={searchPlaceholder}
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
          wide={field.key === 'state_type'}
          disabled={
            (field.key === 'division' || field.key === 'district') && values.state_type === 'Portability'
          }
        />
      ))}
      {hasDateRange && (
        <DateRangeFilter
          variant="labeled"
          dateFrom={values.date_from ?? ''}
          dateTo={values.date_to ?? ''}
          onChange={(from, to) => {
            onChange('date_from', from)
            onChange('date_to', to)
          }}
        />
      )}
    </CompactFilterLayout>
  )
}
