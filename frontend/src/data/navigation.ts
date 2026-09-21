import type { NavItem } from '../types'

export interface DashboardSearchItem {
  id: string
  label: string
  path: string
  group?: string
  icon?: string
}

/** Flatten sidebar nav into searchable destinations (leaves + top-level pages). */
export function flattenNavigation(items: NavItem[], parentLabel?: string): DashboardSearchItem[] {
  const out: DashboardSearchItem[] = []
  for (const item of items) {
    if (item.path) {
      out.push({
        id: item.id,
        label: item.label,
        path: item.path,
        group: parentLabel,
        icon: item.icon,
      })
    }
    if (item.children?.length) {
      out.push(...flattenNavigation(item.children, item.label))
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
      { id: 'bis-card-batches', label: 'Card Print Batches', path: '/dashboard/bis/card-print-data' },
      { id: 'bis-print-dedup', label: 'Already Printed Cards', path: '/dashboard/bis/print-dedup' },
    ],
  },

  {
    id: 'mp',
    label: 'Madhya Pradesh (dmart_mp)',
    icon: 'Building2',
    children: [
      { id: 'mp-claims', label: 'Claim Status Dashboard', path: '/dashboard/mp/claims-payments', end: true },
      { id: 'mp-claim-payments', label: 'Claim Payment Details', path: '/dashboard/mp/claim-payment-details' },
      { id: 'mp-claims-master', label: 'Master Report TMS', path: '/dashboard/mp/claims-payments/master-report' },
      { id: 'mp-beneficiaries', label: 'Beneficiaries', path: '/dashboard/mp/beneficiaries' },
      {
        id: 'mp-hospitals-patients',
        label: 'Hospitals & Patients',
        children: [
          { id: 'mp-hospitals', label: 'Hospital Master', path: '/dashboard/mp/hospitals', end: true },
          { id: 'mp-hospitals-deempanel', label: 'De-empanelment', path: '/dashboard/mp/hospitals/deempanel' },
          { id: 'mp-hospitals-hem', label: 'HEM Hospitals', path: '/dashboard/mp/hospitals/hem' },
          { id: 'mp-hospitals-manpower', label: 'HEM Manpower', path: '/dashboard/mp/hospitals/manpower' },
          { id: 'mp-hospitals-lookup', label: 'Hospital Lookup', path: '/dashboard/mp/hospitals/lookup' },
          { id: 'mp-patients', label: 'Patients & Treatment', path: '/dashboard/mp/patients' },
        ],
      },
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
