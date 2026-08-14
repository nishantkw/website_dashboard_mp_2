import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import GovernmentHeader from './GovernmentHeader'
import Sidebar, { MobileMenuButton } from './Sidebar'
import GlobalFilterBar from './GlobalFilterBar'
import { Search, User, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { ROLE_LABELS } from '../../auth/types'

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isUserManagementPage =
    location.pathname.includes('/user-management') || location.pathname.includes('/ump')

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col h-screen bg-[#eef6f0] overflow-hidden">
      <GovernmentHeader />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="bg-gradient-to-r from-[#d4edda] via-[#e2f3e8] to-[#d4edda] border-b border-[#a8d5b5] px-4 lg:px-6 py-2 shrink-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MobileMenuButton onClick={() => setMobileOpen(true)} />
                <span className="hidden md:inline text-xs font-semibold text-[#1a5c38] uppercase tracking-wider">
                  Analytics Portal
                </span>
                <div className="hidden sm:block w-px h-5 bg-[#a8d5b5]" />
                <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-[#a8d5b5] rounded-md px-3 py-1.5 shadow-sm">
                  <Search className="w-4 h-4 text-[#2d8a4e]" />
                  <input
                    type="text"
                    placeholder="Search dashboards..."
                    className="bg-transparent text-sm outline-none w-32 lg:w-44 text-gray-700 placeholder-[#6b9e7a]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 pl-2 sm:pl-3">
                  <div className="w-8 h-8 bg-[#2d8a4e] rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-[#1a3a2e] leading-tight">{user?.name}</p>
                    <p className="text-[11px] text-[#4a7c59]">{user ? ROLE_LABELS[user.role] : ''}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-md text-[#1a5c38] hover:bg-white/60 hover:text-red-600 transition-all"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {!isUserManagementPage && <GlobalFilterBar />}
          </div>

          <main id="dashboard-page-content" className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#f0f7f2]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
