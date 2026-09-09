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
}

const FilterSelect = memo(function FilterSelect({
  label,
  column,
  value,
  options,
  onChange,
}: FilterSelectProps) {
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

interface FraudFilterBarProps {
  fields: FilterField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  search: string
  onSearchChange: (value: string) => void
  onClear: () => void
  activeCount: number
  subtitle?: string
}

export default function FraudFilterBar({
  fields,
  values,
  onChange,
  search,
  onSearchChange,
  onClear,
  activeCount,
}: FraudFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search)

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localSearch !== search) onSearchChange(localSearch)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [localSearch, search, onSearchChange])

  const selectFields = fields.filter((f) => f.type === 'select')
  const hasDateRange = fields.some((f) => f.key === 'date_from')
  const hasTriggerDate = fields.some((f) => f.key === 'trigger_date_from')

  return (
    <CompactFilterLayout
      title="Fraud & Audit Filters"
      activeCount={activeCount}
      renderSearch={() => (
        <div className={compactSearchWrapClass}>
          <Search className="h-3.5 w-3.5 shrink-0 text-[#2d8a4e]" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Case / Claim ID..."
            title="reference_number, hospital_name, investigator..."
            className={compactSearchInputClass}
          />
        </div>
      )}
      renderClear={() => (
        <button
          type="button"
          onClick={onClear}
          title="Reset all filters"
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
      {hasTriggerDate && (
        <div className={`${compactFilterFieldClass} max-lg:col-span-2`}>
          <label className={compactFilterLabelClass}>Trigger</label>
          <input
            type="date"
            value={values.trigger_date_from ?? ''}
            onChange={(e) => onChange('trigger_date_from', e.target.value)}
            className={compactSelectClass(Boolean(values.trigger_date_from), false, 'w-[110px]')}
            aria-label="Trigger from"
          />
          <span className="text-[10px] text-slate-400">–</span>
          <input
            type="date"
            value={values.trigger_date_to ?? ''}
            onChange={(e) => onChange('trigger_date_to', e.target.value)}
            className={compactSelectClass(Boolean(values.trigger_date_to), false, 'w-[110px]')}
            aria-label="Trigger to"
          />
        </div>
      )}
    </CompactFilterLayout>
  )
}
