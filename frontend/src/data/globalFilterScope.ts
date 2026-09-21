/**
 * Which global filter keys apply on a given dashboard route.
 * Status filters must not appear (or apply) on unrelated pages.
 */

const GEO_KEYS = ['state_type', 'division', 'district'] as const
const DATE_KEYS = ['date_from', 'date_to'] as const

export type GlobalFilterKey = string

function normalizePath(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/'
}

/** Keys shown in the global filter bar and applied by useGlobalFilterData. */
export function getApplicableGlobalFilterKeys(pathname: string): GlobalFilterKey[] {
  const p = normalizePath(pathname)

  if (p === '/dashboard') {
    return [...GEO_KEYS, ...DATE_KEYS]
  }

  if (p.includes('/ump/')) {
    return ['division', 'role', 'user_status', ...DATE_KEYS]
  }

  if (p.includes('/bis/')) {
    return [...GEO_KEYS, 'card_status', 'urban_rural', ...DATE_KEYS]
  }

  if (p.includes('/mp/reports/')) {
    if (p.includes('hospital')) {
      return [...GEO_KEYS, 'hospital_type', 'hospital_status', 'nabh', ...DATE_KEYS]
    }
    if (p.includes('patient')) {
      return [...GEO_KEYS, 'patient_status', ...DATE_KEYS]
    }
    if (p.includes('lms') || p.includes('training')) {
      return ['role', 'training_status', ...DATE_KEYS]
    }
    if (p.includes('workflow') || p.includes('user')) {
      return [...GEO_KEYS, 'role', 'user_status', ...DATE_KEYS]
    }
    // Claims / fraud / beneficiaries reports use their own filter bars (global bar hidden).
    return [...GEO_KEYS, ...DATE_KEYS]
  }

  // Default: geography + dates only — never dump every status everywhere.
  return [...GEO_KEYS, ...DATE_KEYS]
}

export function isGlobalFilterKeyApplicable(pathname: string, key: string): boolean {
  return getApplicableGlobalFilterKeys(pathname).includes(key)
}
