import { useEffect, useRef, useState } from 'react'
import { Columns3 } from 'lucide-react'

interface ColumnOption {
  key: string
  label: string
}

interface ColumnSelectorProps {
  columns: ColumnOption[]
  visibleKeys: string[]
  onToggle: (key: string) => void
  onShowAll: () => void
}

export default function ColumnSelector({ columns, visibleKeys, onToggle, onShowAll }: ColumnSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#2d8a4e] hover:text-[#1a5c38]"
      >
        <Columns3 className="h-3.5 w-3.5 text-[#2d8a4e]" />
        Columns
        <span className="rounded-full bg-[#2d8a4e]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#1a5c38]">
          {visibleKeys.length}/{columns.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Show columns</span>
            <button
              type="button"
              onClick={onShowAll}
              className="text-[11px] font-medium text-[#2d8a4e] hover:underline"
            >
              Show all
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto px-1 py-1">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={visibleKeys.includes(col.key)}
                  onChange={() => onToggle(col.key)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#2d8a4e] focus:ring-[#2d8a4e]"
                />
                <span className="truncate">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
