import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  MapPin,
  Building2,
  Users,
  UserCog,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { navigation } from '../../data/navigation'
import { canAccessNavItem } from '../../auth/permissions'
import { useAuth } from '../../auth/AuthContext'
import type { NavItem } from '../../types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  CreditCard,
  MapPin,
  Building2,
  Users,
  UserCog,
}

function NavIcon({ name }: { name?: string }) {
  const Icon = name ? iconMap[name] : LayoutDashboard
  return <Icon className="w-4 h-4 shrink-0" />
}

function NavGroup({ item }: { item: NavItem }) {
  const location = useLocation()
  const hasChildren = item.children && item.children.length > 0
  const isChildActive = hasChildren && item.children!.some((c) => c.path === location.pathname)
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
          <span className="text-left leading-tight">{item.label}</span>
        </span>
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
      </button>
      {open && item.children && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-600 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.path!}
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
  const filteredNav = navigation.filter(
    (item) => user && canAccessNavItem(user.role, item.id)
  )

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={clsx(
          'fixed lg:static top-0 left-0 h-full lg:h-auto w-72 bg-slate-900 z-50 flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:z-auto lg:shrink-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img
              src="/images/ayushman-mp-logo.png"
              alt="Ayushman MP"
              className="w-9 h-9 object-contain rounded-full"
            />
            <div>
              <p className="text-white font-bold text-sm leading-tight">Analytics Dashboard</p>
              <p className="text-slate-400 text-xs">MP / MH Data Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNav.map((item) => (
            <NavGroup key={item.id} item={item} />
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-slate-400 text-xs">Demo Mode — Mock Data</span>
          </div>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-[#1a5c38] hover:bg-white/60"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
