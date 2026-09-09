import type { NavItem } from '../types'

export interface DashboardSearchItem {
  id: string
  label: string
  path: string
  group?: string
  icon?: string
}

/** Flatten sidebar nav into searchable destinations (leaves + top-level pages). */
export function flattenNavigation(items: NavItem[]): DashboardSearchItem[] {
  const out: DashboardSearchItem[] = []
  for (const item of items) {
    if (item.path) {
      out.push({
        id: item.id,
        label: item.label,
        path: item.path,
        icon: item.icon,
      })
    }
    if (item.children) {
      for (const child of item.children) {
        if (!child.path) continue
        out.push({
          id: child.id,
          label: child.label,
          path: child.path,
          group: item.label,
          icon: item.icon,
        })
      }
    }
  }
  return out
}

export const navigation: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'bis',
    label: 'BIS - Card Printing',
    icon: 'CreditCard',
    children: [
      { id: 'bis-card', label: 'Card Printing Status', path: '/dashboard/bis/card-printing' },
    ],
  },

  {
    id: 'mp',
    label: 'Madhya Pradesh (dmart_mp)',
    icon: 'Building2',
    children: [
      { id: 'mp-claims', label: 'Claim Status Dashboard', path: '/dashboard/mp/claims-payments', end: true },
      { id: 'mp-claims-master', label: 'Master Report TMS', path: '/dashboard/mp/claims-payments/master-report' },
      { id: 'mp-beneficiaries', label: 'Beneficiaries', path: '/dashboard/mp/beneficiaries' },
      { id: 'mp-hospitals', label: 'Hospitals', path: '/dashboard/mp/hospitals' },
      { id: 'mp-patients', label: 'Patients & Treatment', path: '/dashboard/mp/patients' },
      { id: 'mp-fraud', label: 'Fraud and Audit', path: '/dashboard/mp/fraud-audit' },
      { id: 'mp-users', label: 'Users & Workflow', path: '/dashboard/mp/users-workflow' },
      { id: 'mp-lms', label: 'LMS Training', path: '/dashboard/mp/lms-training' },
      { id: 'mp-reports', label: 'Report', path: '/dashboard/mp/reports' },
    ],
  },
  {
    id: 'user_management',
    label: 'User Management',
    path: '/dashboard/admin/user-management',
    icon: 'UserCog',
  },
  {
    id: 'import_bulk_data',
    label: 'Import Bulk Data',
    path: '/dashboard/admin/import-bulk-data',
    icon: 'UploadCloud',
  },
  {
    id: 'ump',
    label: 'UMP - User Management',
    icon: 'Users',
    children: [
      { id: 'ump-users', label: 'User Master', path: '/dashboard/ump/users' },
    ],
  },
]
