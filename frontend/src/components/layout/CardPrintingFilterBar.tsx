import { useState, useEffect, memo } from 'react'
import { Filter, RotateCcw, Search } from 'lucide-react'
import type { FilterField } from '../../types'
import DateRangeFilter from '../ui/DateRangeFilter'
import StackedHeading from '../ui/StackedHeading'

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
    <div className="flex shrink-0 flex-col items-center">
      <label className="mb-1 block w-full text-center text-[9px] font-bold uppercase tracking-wider text-[#1a5c38]" title={column}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-w-[118px] max-w-[148px] cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs outline-none transition-all ${
          active
            ? 'border-[#2d8a4e] bg-[#edf7f0] font-semibold text-[#1a5c38] shadow-sm shadow-emerald-900/5'
            : 'border-[#c5e0ce] bg-white text-slate-700 hover:border-[#2d8a4e]/60 hover:shadow-sm'
        } focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/15`}
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

interface CardPrintingFilterBarProps {
  fields: FilterField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  search: string
  onSearchChange: (value: string) => void
  onClear: () => void
  activeCount: number
  subtitle?: string
}

export default function CardPrintingFilterBar({
  fields,
  values,
  onChange,
  search,
  onSearchChange,
  onClear,
  activeCount,
  subtitle = 'Division, district, print status, urban/rural, enroll date range',
}: CardPrintingFilterBarProps) {
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
    <div className="mb-5 rounded-xl border border-[#b8dcc4] bg-white shadow-[0_4px_20px_-4px_rgba(26,92,56,0.18)]">
      <div className="flex flex-col gap-3 border-b border-[#dceee3] bg-gradient-to-r from-[#f4fbf6] to-white px-3 py-3 sm:px-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a5c38] to-[#2d8a4e] shadow-sm">
            <Filter className="h-3.5 w-3.5 text-white" />
          </div>
          <StackedHeading
            size="filter"
            titleAs="span"
            title="Card Printing Filters"
            subtitle={subtitle}
            className="min-w-0 flex-1"
            badge={
              activeCount > 0 ? (
                <span className="rounded-full bg-[#2d8a4e] px-2 py-0.5 text-[10px] font-bold leading-normal text-white">
                  {activeCount} active
                </span>
              ) : undefined
            }
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end lg:self-start lg:pt-0.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#c5e0ce] bg-white px-2.5 py-1 shadow-sm">
            <Search className="h-3.5 w-3.5 text-[#2d8a4e]" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Card / Ben ID..."
              className="w-24 bg-transparent text-xs text-slate-700 outline-none placeholder:text-[#6b9e7a] sm:w-36"
            />
          </div>
          <button
            type="button"
            onClick={onClear}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
              activeCount > 0
                ? 'border-[#1a5c38] bg-gradient-to-r from-[#1a5c38] to-[#2d8a4e] text-white shadow-sm'
                : 'border-[#c5e0ce] bg-white text-[#4a7c59]'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            Clear Filters
          </button>
        </div>
      </div>

      <div className="scrollbar-visible flex flex-wrap gap-2.5 px-3 pb-3 pt-3 sm:px-4">
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
        <DateRangeFilter
          variant="labeled"
          dateFrom={values.date_from ?? ''}
          dateTo={values.date_to ?? ''}
          onChange={(from, to) => {
            onChange('date_from', from)
            onChange('date_to', to)
          }}
        />
      </div>
    </div>
  )
}
