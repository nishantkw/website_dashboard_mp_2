import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Search,
  UploadCloud,
  UserCog,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import { flattenNavigation, navigation } from '../../data/navigation'
import { canAccessNavItem } from '../../auth/permissions'
import { useAuth } from '../../auth/auth-context'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  CreditCard,
  Building2,
  Users,
  UserCog,
  UploadCloud,
}

export default function DashboardSearch() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(() => {
    if (!user) return []
    return flattenNavigation(navigation.filter((item) => canAccessNavItem(user.role, item.id)))
  }, [user])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      const hay = `${item.label} ${item.group ?? ''} ${item.id}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const goTo = (path: string) => {
    navigate(path)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <div
        className={clsx(
          'flex items-center gap-2 rounded-lg border bg-white/10 px-3 py-1.5 transition-colors',
          open ? 'border-white/50 bg-white/15' : 'border-white/20'
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-white/80" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="dashboard-search-list"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              setQuery('')
              inputRef.current?.blur()
              return
            }
            if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
              setOpen(true)
              return
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
              return
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIndex((i) => Math.max(i - 1, 0))
              return
            }
            if (e.key === 'Enter' && filtered[activeIndex]) {
              e.preventDefault()
              goTo(filtered[activeIndex].path)
            }
          }}
          placeholder="Search dashboards..."
          className="w-36 bg-transparent text-sm text-white outline-none placeholder:text-white/50 lg:w-52"
        />
      </div>

      {open && (
        <div
          id="dashboard-search-list"
          role="listbox"
          ref={listRef}
          className="absolute left-0 top-full z-50 mt-1.5 w-80 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">No dashboards match “{query.trim()}”</p>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon && iconMap[item.icon] ? iconMap[item.icon] : LayoutDashboard
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  data-index={index}
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goTo(item.path)}
                  className={clsx(
                    'flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors',
                    index === activeIndex ? 'bg-[#e8f6ed]' : 'hover:bg-slate-50'
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1a5c38]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800">{item.label}</span>
                    {item.group && (
                      <span className="mt-0.5 block text-[11px] text-slate-500">{item.group}</span>
                    )}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
