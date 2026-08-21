import { useState } from 'react'
import ExportDropdown from '../../components/ui/ExportDropdown'
import {
  Users,
  Shield,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  SlidersHorizontal,
} from 'lucide-react'
import clsx from 'clsx'

interface UserRecord {
  id: string
  username: string
  name: string
  role: string
  roleLabel: string
  department: string
  status: 'Active' | 'Inactive'
  createdAt: string
}

interface RoleRecord {
  id: string
  name: string
  label: string
  description: string
  userCount: number
  status: 'Active' | 'Inactive'
}

interface AuditLog {
  id: string
  username: string
  userRole: string
  action: string
  module: string
  ip: string
  status: 'Success' | 'Failed' | 'Denied'
  timestamp: string
}

const INITIAL_USERS: UserRecord[] = [
  {
    id: '1',
    username: 'superadmin',
    name: 'Super Administrator',
    role: 'super_admin',
    roleLabel: 'Super Administrator',
    department: 'State Health Agency (SHA)',
    status: 'Active',
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    username: 'admin',
    name: 'Admin User',
    role: 'state_admin',
    roleLabel: 'State Administrator',
    department: 'State Health Agency',
    status: 'Active',
    createdAt: '2025-01-15',
  },
  {
    id: '3',
    username: 'bis.user',
    name: 'Priya Sharma',
    role: 'bis_user',
    roleLabel: 'BIS Operator',
    department: 'BIS - Card Printing',
    status: 'Active',
    createdAt: '2025-02-01',
  },
  {
    id: '5',
    username: 'mp.user',
    name: 'Rajesh Kumar',
    role: 'mp_user',
    roleLabel: 'Madhya Pradesh Analyst',
    department: 'Madhya Pradesh Data Mart',
    status: 'Active',
    createdAt: '2025-02-10',
  },
  {
    id: '6',
    username: 'ump.user',
    name: 'Sunita Desai',
    role: 'ump_user',
    roleLabel: 'UMP Administrator',
    department: 'User Management Platform',
    status: 'Inactive',
    createdAt: '2025-02-12',
  },
]

const INITIAL_ROLES: RoleRecord[] = [
  {
    id: 'r1',
    name: 'super_admin',
    label: 'Super Administrator',
    description: 'Full unrestricted system access & user management',
    userCount: 1,
    status: 'Active',
  },
  {
    id: 'r2',
    name: 'state_admin',
    label: 'State Administrator',
    description: 'Statewide dashboard, analytics & reporting access',
    userCount: 1,
    status: 'Active',
  },
  {
    id: 'r3',
    name: 'bis_user',
    label: 'BIS Operator',
    description: 'BIS Card Printing status & analytics',
    userCount: 1,
    status: 'Active',
  },
  {
    id: 'r5',
    name: 'mp_user',
    label: 'Madhya Pradesh Analyst',
    description: 'MP claims, beneficiaries, hospital & fraud analytics',
    userCount: 1,
    status: 'Active',
  },
  {
    id: 'r6',
    name: 'ump_user',
    label: 'UMP Administrator',
    description: 'User Management Platform legacy data access',
    userCount: 1,
    status: 'Active',
  },
]

const MODULES_LIST = [
  { id: 'overview', name: 'Overview Dashboard' },
  { id: 'user_management', name: 'User Management Admin' },
  { id: 'bis', name: 'BIS Card Printing' },
  { id: 'mp_claims', name: 'MP Claims & Payments' },
  { id: 'mp_beneficiaries', name: 'MP Beneficiaries' },
  { id: 'mp_hospitals', name: 'MP Hospitals' },
  { id: 'mp_fraud', name: 'MP Fraud & Audit' },
  { id: 'mp_reports', name: 'MP Reports' },
  { id: 'ump', name: 'UMP Legacy User Master' },
]

const INITIAL_PERMISSIONS: Record<string, Record<string, boolean>> = {
  super_admin: {
    overview: true,
    user_management: true,
    bis: true,
    mp_claims: true,
    mp_beneficiaries: true,
    mp_hospitals: true,
    mp_fraud: true,
    mp_reports: true,
    ump: true,
  },
  state_admin: {
    overview: true,
    user_management: true,
    bis: true,
    mp_claims: true,
    mp_beneficiaries: true,
    mp_hospitals: true,
    mp_fraud: true,
    mp_reports: true,
    ump: true,
  },
  bis_user: {
    overview: false,
    user_management: false,
    bis: true,
    mp_claims: false,
    mp_beneficiaries: false,
    mp_hospitals: false,
    mp_fraud: false,
    mp_reports: false,
    ump: false,
  },
  mp_user: {
    overview: false,
    user_management: false,
    bis: false,
    mp_claims: true,
    mp_beneficiaries: true,
    mp_hospitals: true,
    mp_fraud: true,
    mp_reports: true,
    ump: false,
  },
  ump_user: {
    overview: false,
    user_management: false,
    bis: false,
    mp_claims: false,
    mp_beneficiaries: false,
    mp_hospitals: false,
    mp_fraud: false,
    mp_reports: false,
    ump: true,
  },
}

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-101',
    username: 'superadmin',
    userRole: 'Super Administrator',
    action: 'CREATE_USER',
    module: 'User Management',
    ip: '192.168.1.45',
    status: 'Success',
    timestamp: '2026-08-14 11:20:15',
  },
  {
    id: 'log-102',
    username: 'admin',
    userRole: 'State Administrator',
    action: 'UPDATE_PERMISSIONS',
    module: 'Permissions',
    ip: '192.168.1.88',
    status: 'Success',
    timestamp: '2026-08-14 10:45:30',
  },
  {
    id: 'log-103',
    username: 'mp.user',
    userRole: 'Madhya Pradesh Analyst',
    action: 'LOGIN',
    module: 'Auth',
    ip: '10.0.4.12',
    status: 'Success',
    timestamp: '2026-08-14 09:12:00',
  },
  {
    id: 'log-104',
    username: 'bis.user',
    userRole: 'BIS Operator',
    action: 'EXPORT_DATA',
    module: 'BIS Card Printing',
    ip: '10.0.2.99',
    status: 'Success',
    timestamp: '2026-08-14 08:30:10',
  },
  {
    id: 'log-105',
    username: 'ump.user',
    userRole: 'UMP Administrator',
    action: 'LOGIN',
    module: 'Auth',
    ip: '192.168.2.14',
    status: 'Denied',
    timestamp: '2026-08-13 16:50:22',
  },
]

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'audit'>('users')
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS)
  const [roles, setRoles] = useState<RoleRecord[]>(INITIAL_ROLES)
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_LOGS)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL')

  // Modals state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    role: 'state_admin',
    department: '',
    password: '',
  })

  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [newRole, setNewRole] = useState({
    name: '',
    label: '',
    description: '',
  })

  const [resetPasswordUser, setResetPasswordUser] = useState<UserRecord | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordText, setShowPasswordText] = useState(false)

  // Helper actions
  const handleToggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active'
          addAuditLog(u.username, u.roleLabel, u.status === 'Active' ? 'DEACTIVATE_USER' : 'ACTIVATE_USER', `User ID #${id} status changed to ${nextStatus}`)
          return { ...u, status: nextStatus }
        }
        return u
      })
    )
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.username || !newUser.name) return

    const roleObj = roles.find((r) => r.name === newUser.role)
    const created: UserRecord = {
      id: String(Date.now()),
      username: newUser.username.trim(),
      name: newUser.name.trim(),
      role: newUser.role,
      roleLabel: roleObj?.label || newUser.role,
      department: newUser.department.trim() || 'State Health Agency',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    }

    setUsers([created, ...users])
    addAuditLog(created.username, created.roleLabel, 'CREATE_USER', `Created new user account: ${created.username}`)

    setNewUser({ username: '', name: '', role: 'state_admin', department: '', password: '' })
    setShowCreateUserModal(false)
  }

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRole.name || !newRole.label) return

    const roleKey = newRole.name.toLowerCase().replace(/\s+/g, '_')
    const created: RoleRecord = {
      id: `r-${Date.now()}`,
      name: roleKey,
      label: newRole.label.trim(),
      description: newRole.description.trim() || 'Custom system role',
      userCount: 0,
      status: 'Active',
    }

    setRoles([...roles, created])
    setPermissions((prev) => ({
      ...prev,
      [roleKey]: {
        overview: true,
        user_management: false,
        bis: false,
        mp_claims: false,
        mp_beneficiaries: false,
        mp_hospitals: false,
        mp_fraud: false,
        mp_reports: false,
        ump: false,
      },
    }))

    addAuditLog('superadmin', 'Super Administrator', 'CREATE_ROLE', `Created new role: ${created.label} (${roleKey})`)
    setNewRole({ name: '', label: '', description: '' })
    setShowCreateRoleModal(false)
  }

  const handleTogglePermission = (roleName: string, moduleId: string) => {
    if (roleName === 'super_admin' && moduleId === 'user_management') return // Protect super admin access

    setPermissions((prev) => {
      const currentRolePerms = prev[roleName] || {}
      return {
        ...prev,
        [roleName]: {
          ...currentRolePerms,
          [moduleId]: !currentRolePerms[moduleId],
        },
      }
    })
    addAuditLog('superadmin', 'Super Administrator', 'UPDATE_PERMISSIONS', `Updated permission for role ${roleName} on ${moduleId}`)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPasswordUser || !newPassword) return

    addAuditLog('superadmin', 'Super Administrator', 'RESET_PASSWORD', `Reset password for user: ${resetPasswordUser.username}`)
    setResetPasswordUser(null)
    setNewPassword('')
  }

  const addAuditLog = (username: string, userRole: string, action: string, details: string) => {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      username,
      userRole,
      action,
      module: details ? `User Management (${details})` : 'User Management',
      ip: '192.168.1.100',
      status: 'Success',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }
    setAuditLogs((prev) => [log, ...prev])
  }

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter
    const matchesStatus = selectedStatusFilter === 'ALL' || u.status === selectedStatusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 hidden sm:block">
            Manage administrative users, custom roles, module permissions & audit logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <ExportDropdown
            title={`User Management — ${activeTab.toUpperCase()}`}
            filename={`user_management_${activeTab}_export`}
            data={activeTab === 'users' ? filteredUsers : activeTab === 'audit' ? auditLogs : roles}
            buttonSize="md"
            variant="outline"
          />

          {activeTab === 'users' && (
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center gap-2 bg-[#2d8a4e] hover:bg-[#247a42] text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden xs:inline">Create User</span>
            </button>
          )}

          {activeTab === 'roles' && (
            <button
              onClick={() => setShowCreateRoleModal(true)}
              className="flex items-center gap-2 bg-[#2d8a4e] hover:bg-[#247a42] text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Create Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="overflow-x-auto scrollbar-hide">
          <nav className="-mb-px flex whitespace-nowrap px-2 sm:px-6 min-w-max">
            <button
              onClick={() => setActiveTab('users')}
              className={clsx(
                'py-4 px-3 sm:px-4 inline-flex items-center gap-1.5 border-b-2 font-semibold text-xs sm:text-sm transition-colors shrink-0',
                activeTab === 'users'
                  ? 'border-[#2d8a4e] text-[#2d8a4e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={clsx(
                'py-4 px-3 sm:px-4 inline-flex items-center gap-1.5 border-b-2 font-semibold text-xs sm:text-sm transition-colors shrink-0',
                activeTab === 'roles'
                  ? 'border-[#2d8a4e] text-[#2d8a4e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Role Management</span>
              <span className="sm:hidden">Roles</span>
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={clsx(
                'py-4 px-3 sm:px-4 inline-flex items-center gap-1.5 border-b-2 font-semibold text-xs sm:text-sm transition-colors shrink-0',
                activeTab === 'permissions'
                  ? 'border-[#2d8a4e] text-[#2d8a4e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              Permissions
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={clsx(
                'py-4 px-3 sm:px-4 inline-flex items-center gap-1.5 border-b-2 font-semibold text-xs sm:text-sm transition-colors shrink-0',
                activeTab === 'audit'
                  ? 'border-[#2d8a4e] text-[#2d8a4e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Audit Logs</span>
              <span className="sm:hidden">Audit</span>
            </button>
          </nav>
        </div>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search username, name, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 outline-none focus:border-[#2d8a4e]"
              >
                <option value="ALL">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 outline-none focus:border-[#2d8a4e]"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3.5">Username</th>
                    <th className="px-6 py-3.5">Full Name</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Department / Organization</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{u.username}</td>
                      <td className="px-6 py-4">{u.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {u.roleLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{u.department}</td>
                      <td className="px-6 py-4">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                            u.status === 'Active'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          )}
                        >
                          {u.status === 'Active' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          disabled={u.username === 'superadmin'}
                          className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                            u.status === 'Active'
                              ? 'border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                              : 'border-green-300 text-green-700 hover:bg-green-50'
                          )}
                        >
                          {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => setResetPasswordUser(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No users match the search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE MANAGEMENT */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-800">Defined System Roles ({roles.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3.5">Role Name (Key)</th>
                  <th className="px-6 py-3.5">Role Label</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Assigned Users</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {roles.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-[#1a5c38]">{r.name}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{r.label}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs">{r.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {r.userCount} User{r.userCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Module Permissions Matrix</h3>
            <p className="text-slate-500 text-sm">
              Configure module access controls per system role. Click checkboxes to toggle access.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-3.5 border-r border-slate-200 min-w-[200px]">Module / Feature</th>
                  {roles.map((r) => (
                    <th key={r.id} className="px-4 py-3.5 text-center min-w-[120px]">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {MODULES_LIST.map((mod) => (
                  <tr key={mod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800 border-r border-slate-200">
                      {mod.name}
                    </td>
                    {roles.map((r) => {
                      const isAllowed = permissions[r.name]?.[mod.id] ?? false
                      const isLocked = r.name === 'super_admin' && mod.id === 'user_management'
                      return (
                        <td key={r.id} className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            disabled={isLocked}
                            onChange={() => handleTogglePermission(r.name, mod.id)}
                            className="w-4 h-4 text-[#2d8a4e] rounded border-slate-300 focus:ring-[#2d8a4e] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">System Audit Trails</h3>
              <p className="text-slate-500 text-sm">Real-time log of administrative and user actions</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Module</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{log.timestamp}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{log.username}</td>
                    <td className="px-6 py-3.5 text-slate-600">{log.userRole}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{log.module}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{log.ip}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          log.status === 'Success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        )}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#2d8a4e]" />
              Create New User
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="e.g. john.doe"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-[#2d8a4e]"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department / Organization
                </label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="e.g. State Health Agency"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter initial password"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2d8a4e] hover:bg-[#247a42] text-white"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Role */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2d8a4e]" />
              Create New System Role
            </h3>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role Name Key</label>
                <input
                  type="text"
                  required
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g. auditor_user"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role Label</label>
                <input
                  type="text"
                  required
                  value={newRole.label}
                  onChange={(e) => setNewRole({ ...newRole, label: e.target.value })}
                  placeholder="e.g. Claims Auditor"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe role scope and permissions"
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2d8a4e] hover:bg-[#247a42] text-white"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Reset Password for {resetPasswordUser.username}
            </h3>
            <p className="text-slate-500 text-xs mb-4">
              Enter a new password for user account <span className="font-semibold">{resetPasswordUser.name}</span>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-3.5 py-2 pr-10 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
