import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Sidebar, { MobileMenuButton } from './Sidebar'
import DashboardSearch from './DashboardSearch'
import GlobalFilterBar from './GlobalFilterBar'
import { PAGE_HEADER_SLOT_ID } from '../ui/PageHeader'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/auth-context'
import { ROLE_LABELS } from '../../auth/types'

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isUserManagementPage = location.pathname.includes('/user-management')
  const isImportPage = location.pathname.includes('/import-bulk-data')
  const isFraudAuditPage = location.pathname.includes('/mp/fraud-audit')
  const isClaimsPage = location.pathname.includes('/mp/claims-payments')
  const isFraudReportPage = /\/mp\/reports\/(fraud-audit|fraud|safu-)/.test(location.pathname)
  const isClaimsReportPage = location.pathname.includes('/mp/reports/claims')
  const isBeneficiariesPage = location.pathname.includes('/mp/beneficiaries')
  const isBeneficiariesReportPage = location.pathname.includes('/mp/reports/beneficiaries')
  const isCardPrintingPage = location.pathname.includes('/bis/card-printing')
  const isReportsCatalogPage = /\/mp\/reports\/?$/.test(location.pathname.replace(/\/+$/, '') || '/')
  const isHospitalsPage = location.pathname.includes('/mp/hospitals')
  const isPatientsPage = location.pathname.includes('/mp/patients')
  const isLmsPage = location.pathname.includes('/mp/lms-training')
  const isWorkflowPage = location.pathname.includes('/mp/users-workflow')
  const hideFilters =
    isUserManagementPage ||
    isImportPage ||
    isFraudAuditPage ||
    isFraudReportPage ||
    isClaimsPage ||
    isClaimsReportPage ||
    isBeneficiariesPage ||
    isBeneficiariesReportPage ||
    isCardPrintingPage ||
    isReportsCatalogPage ||
    isHospitalsPage ||
    isPatientsPage ||
    isLmsPage ||
    isWorkflowPage

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef6f0]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 bg-gradient-to-r from-[#1a5c38] via-[#2d8a4e] to-[#1a5c38] px-4 shadow-md lg:px-6">
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <MobileMenuButton onClick={() => setMobileOpen(true)} />
              <div className="hidden h-5 w-px bg-white/25 sm:block" />
              <span className="hidden text-[11px] font-bold uppercase tracking-[0.2em] text-white/95 md:inline">
                Analytics Portal
              </span>
              <div className="hidden h-5 w-px bg-white/25 sm:block" />
              <DashboardSearch />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-white/10 px-2 py-1 sm:px-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#1a5c38] sm:h-8 sm:w-8">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                  <p className="text-sm font-semibold leading-snug text-white">{user?.name}</p>
                  <p className="text-[10px] leading-relaxed text-emerald-100/80">{user ? ROLE_LABELS[user.role] : ''}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="rounded-lg border border-white/15 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>

        <main id="dashboard-page-content" className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f0f7f2] px-4 pb-4 pt-0 lg:px-6 lg:pb-6">
          <div id={PAGE_HEADER_SLOT_ID} />
          {!hideFilters && (
            <div className="sticky top-0 z-40 min-w-0 -mx-4 mb-3 bg-[#f0f7f2] px-4 pb-2 lg:-mx-6 lg:mb-4 lg:px-6">
              <GlobalFilterBar />
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
