import { useState, useEffect, memo } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import CompactFilterLayout from './CompactFilterLayout'
import type { FilterField } from '../../types'
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

interface BeneficiariesFilterBarProps {
  fields: FilterField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  search: string
  onSearchChange: (value: string) => void
  onClear: () => void
  activeCount: number
  subtitle?: string
}

export default function BeneficiariesFilterBar({
  fields,
  values,
  onChange,
  search,
  onSearchChange,
  onClear,
  activeCount,
}: BeneficiariesFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search)

  useEffect(() => setLocalSearch(search), [search])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localSearch !== search) onSearchChange(localSearch)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [localSearch, search, onSearchChange])

  const selectFields = fields.filter((f) => f.type === 'select')

  return (
    <CompactFilterLayout
      title="Beneficiary Filters"
      activeCount={activeCount}
      renderSearch={() => (
        <div className={compactSearchWrapClass}>
          <Search className="h-3.5 w-3.5 shrink-0 text-[#2d8a4e]" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Ben ID / Name..."
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
    </CompactFilterLayout>
  )
}
