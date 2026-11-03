import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Columns3, Search } from 'lucide-react'

interface ColumnOption {
  key: string
  label: string
}

interface ColumnSelectorProps {
  columns: ColumnOption[]
  visibleKeys: string[]
  onToggle: (key: string) => void
  onSelectKeys: (keys: string[]) => void
  onDeselectKeys: (keys: string[]) => void
}

export default function ColumnSelector({
  columns,
  visibleKeys,
  onToggle,
  onSelectKeys,
  onDeselectKeys,
}: ColumnSelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuPos(null)
      return
    }

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(288, Math.max(256, window.innerWidth - 16))
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
      const top = Math.min(rect.bottom + 6, window.innerHeight - 8)
      setMenuPos({ top, left, width })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const id = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return columns
    return columns.filter((col) => {
      const hay = `${col.label} ${col.key}`.toLowerCase()
      return hay.includes(q)
    })
  }, [columns, query])

  const filteredKeys = filtered.map((col) => col.key)

  const menu = open && menuPos
    ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[200] rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
        >
          <div className="border-b border-slate-100 px-3 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Show columns
            </span>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 focus-within:border-[#2d8a4e] focus-within:bg-white">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search columns..."
                className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onSelectKeys(filteredKeys)}
                disabled={filteredKeys.length === 0}
                className="rounded-md border border-[#c5e0ce] bg-[#e8f6ed] px-2 py-1 text-[11px] font-semibold text-[#1a5c38] hover:border-[#2d8a4e] hover:bg-[#d4eedd] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => onDeselectKeys(filteredKeys)}
                disabled={filteredKeys.length === 0}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Deselect all
              </button>
            </div>
          </div>
          <div className="scrollbar-visible max-h-64 overflow-y-auto px-1 py-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-slate-500">
                No columns match “{query.trim()}”
              </p>
            ) : (
              filtered.map((col) => (
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
              ))
            )}
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
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
      {menu}
    </div>
  )
}
