import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  MapPin,
  Building2,
  Users,
  UserCog,
  UploadCloud,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { navigation } from '../../data/navigation'
import { canAccessNavItem } from '../../auth/permissions'
import { useAuth } from '../../auth/auth-context'
import type { NavItem } from '../../types'

const SIDEBAR_COLLAPSED_KEY = 'sha.sidebarCollapsed'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  CreditCard,
  MapPin,
  Building2,
  Users,
  UserCog,
  UploadCloud,
}

function NavIcon({ name, className = 'h-4 w-4 shrink-0' }: { name?: string; className?: string }) {
  const Icon = name ? iconMap[name] : LayoutDashboard
  return <Icon className={className} />
}

function isNavPathActive(navPath: string, pathname: string, exact = false) {
  if (exact) return pathname === navPath
  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? '1' : '0')
  } catch {
    /* ignore quota / private mode */
  }
}

function useHoverFlyout() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const closeTimer = useRef<number>()

  const show = () => {
    window.clearTimeout(closeTimer.current)
    const el = wrapRef.current
    if (!el) return
    setRect(el.getBoundingClientRect())
    setOpen(true)
  }

  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 140)
  }

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  return { wrapRef, open, rect, show, hide }
}

function Flyout({
  rect,
  title,
  children,
  onMouseEnter,
  onMouseLeave,
}: {
  rect: DOMRect
  title: string
  children?: React.ReactNode
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const top = Math.max(8, Math.min(rect.top, window.innerHeight - 280))
  return createPortal(
    <div
      className={clsx(
        'fixed z-[80] rounded-lg border border-slate-700 bg-slate-800 shadow-2xl',
        children ? 'min-w-[12.5rem] py-1' : 'px-2.5 py-1.5'
      )}
      style={{ top, left: rect.right + 10 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children ? (
        <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      ) : (
        <p className="whitespace-nowrap text-sm font-medium text-white">{title}</p>
      )}
      {children}
    </div>,
    document.body
  )
}

function CompactNavItem({ item }: { item: NavItem }) {
  const location = useLocation()
  const { wrapRef, open, rect, show, hide } = useHoverFlyout()
  const hasChildren = Boolean(item.children?.length)
  const isChildActive =
    hasChildren &&
    item.children!.some((c) => c.path && isNavPathActive(c.path, location.pathname, c.end))

  const iconBtnClass = (active: boolean) =>
    clsx(
      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
      active ? 'bg-[#2d8a4e] text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    )

  if (!hasChildren && item.path) {
    return (
      <div ref={wrapRef} className="flex justify-center" onMouseEnter={show} onMouseLeave={hide}>
        <NavLink to={item.path} end title={item.label} className={({ isActive }) => iconBtnClass(isActive)}>
          <NavIcon name={item.icon} className="h-5 w-5" />
        </NavLink>
        {open && rect && (
          <Flyout rect={rect} title={item.label} onMouseEnter={show} onMouseLeave={hide} />
        )}
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="flex justify-center" onMouseEnter={show} onMouseLeave={hide}>
      <button type="button" title={item.label} className={iconBtnClass(Boolean(isChildActive))}>
        <NavIcon name={item.icon} className="h-5 w-5" />
      </button>
      {open && rect && (
        <Flyout rect={rect} title={item.label} onMouseEnter={show} onMouseLeave={hide}>
          {item.children?.map((child) => (
            <NavLink
              key={child.id}
              to={child.path!}
              end={child.end}
              className={({ isActive }) =>
                clsx(
                  'mx-1 block rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-[#2d8a4e] font-medium text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )
              }
            >
              {child.label}
            </NavLink>
          ))}
        </Flyout>
      )}
    </div>
  )
}

function NavGroup({ item }: { item: NavItem }) {
  const location = useLocation()
  const hasChildren = item.children && item.children.length > 0
  const isChildActive =
    hasChildren &&
    item.children!.some((c) => c.path && isNavPathActive(c.path, location.pathname, c.end))
  const [open, setOpen] = useState(isChildActive || item.id === 'overview')

  if (!hasChildren && item.path) {
    return (
      <NavLink
        to={item.path}
        end
        className={({ isActive }) =>
          clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-[#2d8a4e] text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          )
        }
      >
        <NavIcon name={item.icon} />
        {item.label}
      </NavLink>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isChildActive
            ? 'text-white bg-slate-700'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        )}
      >
        <span className="flex items-center gap-3">
          <NavIcon name={item.icon} />
          <span className="text-left leading-snug">{item.label}</span>
        </span>
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
      </button>
      {open && item.children && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-600 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.path!}
              end={child.end}
              className={({ isActive }) =>
                clsx(
                  'block px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-[#2d8a4e] text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                )
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const filteredNav = navigation.filter(
    (item) => user && canAccessNavItem(user.role, item.id)
  )
  const compact = collapsed && !mobileOpen

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      writeCollapsed(next)
      return next
    })
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col bg-slate-900 transition-[width,transform] duration-300',
          'lg:translate-x-0 lg:z-auto',
          compact ? 'w-72 lg:w-[72px]' : 'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-1 shrink-0 bg-gradient-to-r from-[#1a5c38] via-[#2d8a4e] to-[#1a5c38]" />

        <div className={clsx('shrink-0 border-b border-slate-700', compact ? 'px-2 py-3' : 'px-4 py-3')}>
          {compact ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src="/images/ayushman-mp-logo.png"
                alt="Ayushman Madhya Pradesh"
                className="h-10 w-10 rounded-full object-contain bg-white"
              />
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Expand sidebar"
                className="hidden rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white lg:inline-flex"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                <img
                  src="/images/ayushman-mp-logo.png"
                  alt="Ayushman Madhya Pradesh"
                  className="h-11 w-11 shrink-0 rounded-full object-contain bg-white"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-snug text-white">
                    Ayushman Bharat PM-JAY
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold leading-snug text-amber-400">
                    &ldquo;Niramayam&rdquo;
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-400">
                    SHA, Madhya Pradesh
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <img
                  src="/images/mp-government-emblem.png"
                  alt="Government of Madhya Pradesh"
                  className="h-8 w-8 object-contain"
                  title="Government of Madhya Pradesh"
                />
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-400 bg-gradient-to-b from-white to-amber-50"
                  title="PM-JAY"
                >
                  <span className="text-center text-[7px] font-extrabold leading-tight tracking-tight text-[#1a3a6b]">
                    PM
                    <br />
                    JAY
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  title="Collapse sidebar"
                  className="hidden rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white lg:inline-flex"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={onClose} className="ml-0.5 text-slate-400 hover:text-white lg:hidden">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <nav
          className={clsx('flex-1 overflow-y-auto py-3', compact ? 'space-y-1.5 px-2' : 'space-y-1 px-3')}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) onClose()
          }}
        >
          {filteredNav.map((item) =>
            compact ? <CompactNavItem key={item.id} item={item} /> : <NavGroup key={item.id} item={item} />
          )}
        </nav>

        <div className="hidden shrink-0 border-t border-slate-700 p-2 lg:block">
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={clsx(
              'flex w-full items-center rounded-lg py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white',
              compact ? 'justify-center px-0' : 'gap-3 px-3'
            )}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!compact && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-2 text-white hover:bg-white/15 lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
