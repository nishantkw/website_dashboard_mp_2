import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PublicRoute, ProtectedRoute, RoleGuard } from './components/auth/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import CardPrinting from './pages/bis/CardPrinting'
import CardPrintData from './pages/bis/CardPrintData'
import PrintDedup from './pages/bis/PrintDedup'
import ClaimsPayments from './pages/mp/ClaimsPayments'
import ClaimMasterReport from './pages/mp/ClaimMasterReport'
import Beneficiaries from './pages/mp/Beneficiaries'
import Hospitals from './pages/mp/Hospitals'
import HemManpower from './pages/mp/HemManpower'
import Patients from './pages/mp/Patients'
import FraudAudit from './pages/mp/FraudAudit'
import SafuMisRoute from './pages/mp/SafuMisRoute'
import UsersWorkflow from './pages/mp/UsersWorkflow'
import LmsTraining from './pages/mp/LmsTraining'
import Reports from './pages/mp/Reports'
import ReportDetail from './pages/mp/ReportDetail'
import UserMaster from './pages/ump/UserMaster'
import UserManagement from './pages/admin/UserManagement'
import ImportBulkData from './pages/admin/ImportBulkData'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<RoleGuard />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="admin/user-management" element={<UserManagement />} />
                <Route path="admin/import-bulk-data" element={<ImportBulkData />} />
                <Route path="bis/card-printing" element={<CardPrinting />} />
                <Route path="bis/card-print-data" element={<CardPrintData />} />
                <Route path="bis/print-dedup" element={<PrintDedup />} />
                <Route path="mp/claims-payments" element={<ClaimsPayments />} />
                <Route path="mp/claims-payments/master-report" element={<ClaimMasterReport />} />
                <Route path="mp/beneficiaries" element={<Beneficiaries />} />
                <Route path="mp/hospitals" element={<Hospitals section="master" />} />
                <Route path="mp/hospitals/master" element={<Navigate to="/dashboard/mp/hospitals" replace />} />
                <Route path="mp/hospitals/deempanel" element={<Hospitals section="deempanel" />} />
                <Route path="mp/hospitals/hem" element={<Hospitals section="hem" />} />
                <Route path="mp/hospitals/manpower" element={<HemManpower />} />
                <Route path="mp/hospitals/lookup" element={<Hospitals section="lookup" />} />
                <Route path="mp/patients" element={<Patients />} />
                <Route path="mp/fraud-audit" element={<FraudAudit />} />
                <Route path="mp/safu/:view" element={<SafuMisRoute />} />
                <Route path="mp/users-workflow" element={<UsersWorkflow />} />
                <Route path="mp/lms-training" element={<LmsTraining />} />
                <Route path="mp/reports" element={<Reports />} />
                <Route path="mp/reports/:reportId" element={<ReportDetail />} />
                <Route path="ump/users" element={<UserMaster />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    </BrowserRouter>
  )
}
