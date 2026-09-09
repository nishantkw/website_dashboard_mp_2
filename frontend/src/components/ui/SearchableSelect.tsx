import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import { compactFilterFieldClass, compactFilterLabelClass } from '../layout/compactFilterStyles'

interface SearchableSelectProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  placeholder?: string
  onChange: (value: string) => void
  layout?: 'stacked' | 'inline'
}

export default function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  layout = 'inline',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const active = Boolean(value)

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.max(r.width, 168)
    const gap = 4
    const maxMenu = 208
    const spaceBelow = window.innerHeight - r.bottom - gap
    const spaceAbove = r.top - gap
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow
    const left = Math.min(r.left, Math.max(8, window.innerWidth - width - 8))

    setMenuStyle(
      openUp
        ? {
            position: 'fixed',
            bottom: window.innerHeight - r.top + gap,
            left,
            width,
            maxHeight: Math.min(maxMenu, spaceAbove),
            zIndex: 9999,
          }
        : {
            position: 'fixed',
            top: r.bottom + gap,
            left,
            width,
            maxHeight: Math.min(maxMenu, Math.max(120, spaceBelow)),
            zIndex: 9999,
          }
    )
  }, [])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    if (!open) return
    updateMenuPosition()
    const onReposition = () => updateMenuPosition()
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = options.filter((o) => o.value !== '')
    if (!q) return list.slice(0, 80)
    return list.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 80)
  }, [options, query])

  const displayValue = open ? query : value

  return (
    <div
      ref={rootRef}
      className={
        layout === 'inline'
          ? `relative ${compactFilterFieldClass}`
          : 'relative flex shrink-0 flex-col items-center'
      }
    >
      <label
        className={
          layout === 'inline'
            ? compactFilterLabelClass
            : 'mb-1 block w-full text-center text-[9px] font-bold uppercase tracking-wider text-[#1a5c38]'
        }
      >
        {label}
      </label>
      <div
        ref={triggerRef}
        className={`flex items-center rounded-md border px-2 transition-all ${
          layout === 'inline'
            ? 'h-8 min-w-[148px] max-w-[200px] py-1 max-lg:w-full max-lg:min-w-0 max-lg:max-w-none'
            : 'min-w-[168px] max-w-[220px] rounded-lg py-1.5'
        } ${
          active || open
            ? 'border-[#1a5c38] bg-[#ccebd6]'
            : layout === 'inline'
              ? 'border-[#8ec9a4] bg-[#f4fbf7] hover:border-[#2d8a4e] hover:bg-[#e8f6ed]'
              : 'border-[#c5e0ce] bg-white hover:border-[#2d8a4e]/60'
        }`}
      >
        <Search className="mr-1 h-3 w-3 shrink-0 text-[#2d8a4e]" />
        <input
          ref={inputRef}
          value={displayValue}
          placeholder={placeholder ?? label}
          onFocus={() => {
            setQuery(value)
            updateMenuPosition()
            setOpen(true)
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            updateMenuPosition()
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const first = filtered[0]
              if (query.trim() && first) onChange(first.value)
              else onChange(query.trim())
              setOpen(false)
              inputRef.current?.blur()
            }
            if (e.key === 'Escape') setOpen(false)
          }}
          className={`w-full bg-transparent text-xs outline-none placeholder:text-[#6b9e7a] ${
            active ? 'font-semibold text-[#1a5c38]' : 'text-slate-700'
          }`}
        />
        {value ? (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              onChange('')
              setQuery('')
              setOpen(false)
            }}
            className="ml-1 text-[#4a7c59] hover:text-[#1a5c38]"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <ChevronDown className="ml-1 h-3 w-3 shrink-0 text-[#6b9e7a]" />
        )}
      </div>
      {open &&
        (menuStyle.top != null || menuStyle.bottom != null) &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="overflow-y-auto rounded-lg border border-[#c5e0ce] bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="block w-full px-2.5 py-1.5 text-left text-xs text-slate-500 hover:bg-[#f4fbf6]"
            >
              All
            </button>
            {filtered.length === 0 ? (
              <p className="px-2.5 py-1.5 text-xs text-slate-400">No matches</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`block w-full truncate px-2.5 py-1.5 text-left text-xs hover:bg-[#edf7f0] ${
                    o.value === value ? 'bg-[#edf7f0] font-semibold text-[#1a5c38]' : 'text-slate-700'
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
