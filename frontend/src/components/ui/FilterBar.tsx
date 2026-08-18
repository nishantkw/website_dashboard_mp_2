import { Filter, X, RotateCcw } from 'lucide-react'
import type { FilterField } from '../../types'

interface FilterBarProps {
  fields: FilterField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  search?: string
  onSearchChange?: (value: string) => void
  onClear: () => void
  activeCount: number
  schema?: string
}

export default function FilterBar({
  fields,
  values,
  onChange,
  search,
  onSearchChange,
  onClear,
  activeCount,
  schema,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-[#c6e6d0] shadow-sm mb-5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#e8f5ec] to-white border-b border-[#d4edda]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#2d8a4e]" />
          <span className="text-sm font-semibold text-[#1a5c38]">Filters</span>
          {schema && (
            <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{schema}</span>
          )}
          {activeCount > 0 && (
            <span className="text-[10px] font-bold bg-[#2d8a4e] text-white px-2 py-0.5 rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-[#2d8a4e] hover:text-red-600 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {onSearchChange && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Search</label>
              <input
                type="text"
                value={search ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search records..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e]/20 bg-gray-50"
              />
            </div>
          )}

          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wide">
                {field.label}
                <span className="text-gray-300 font-normal ml-1">({field.column})</span>
              </label>
              {field.type === 'select' ? (
                <select
                  value={values[field.key] ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e]/20 bg-white cursor-pointer"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  value={values[field.key] ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e]/20 bg-white"
                />
              )}
            </div>
          ))}
        </div>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {Object.entries(values).filter(([, v]) => v).map(([key, val]) => {
              const field = fields.find((f) => f.key === key)
              return (
                <span key={key} className="inline-flex items-center gap-1 text-xs bg-[#e8f5ec] text-[#1a5c38] px-2.5 py-1 rounded-full">
                  {field?.label}: <strong>{val}</strong>
                  <button onClick={() => onChange(key, '')} className="hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
            {search && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#e8f5ec] text-[#1a5c38] px-2.5 py-1 rounded-full">
                Search: <strong>{search}</strong>
                <button onClick={() => onSearchChange?.('')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
