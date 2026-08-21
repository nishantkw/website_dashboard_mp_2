import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { FilterProvider } from './context/FilterContext'
import { PublicRoute, ProtectedRoute, RoleGuard } from './components/auth/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import CardPrinting from './pages/bis/CardPrinting'
import ClaimsPayments from './pages/mp/ClaimsPayments'
import Beneficiaries from './pages/mp/Beneficiaries'
import Hospitals from './pages/mp/Hospitals'
import Patients from './pages/mp/Patients'
import FraudAudit from './pages/mp/FraudAudit'
import UsersWorkflow from './pages/mp/UsersWorkflow'
import LmsTraining from './pages/mp/LmsTraining'
import Reports from './pages/mp/Reports'
import UserMaster from './pages/ump/UserMaster'
import UserManagement from './pages/admin/UserManagement'
import ImportBulkData from './pages/admin/ImportBulkData'

export default function App() {
  return (
    <AuthProvider>
      <FilterProvider>
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
                <Route path="mp/claims-payments" element={<ClaimsPayments />} />
                <Route path="mp/beneficiaries" element={<Beneficiaries />} />
                <Route path="mp/hospitals" element={<Hospitals />} />
                <Route path="mp/patients" element={<Patients />} />
                <Route path="mp/fraud-audit" element={<FraudAudit />} />
                <Route path="mp/users-workflow" element={<UsersWorkflow />} />
                <Route path="mp/lms-training" element={<LmsTraining />} />
                <Route path="mp/reports" element={<Reports />} />
                <Route path="ump/users" element={<UserMaster />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </BrowserRouter>
      </FilterProvider>
    </AuthProvider>
  )
}
