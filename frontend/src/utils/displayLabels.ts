/** Human-readable labels for database schema.table references shown in the UI. */

export interface TableDisplayMeta {
  title: string
  description?: string
}

const TABLE_LABELS: Record<string, TableDisplayMeta> = {
  'dmart_mp.claim_paid_excel_t': {
    title: 'Claim Status Records',
    description: 'FRS claim lifecycle KPIs by state type and hospital type',
  },
  'dmart_mp.payment_dtls': {
    title: 'Payment Details',
    description:
      'Bank transaction records linked to claims (paid / rejected flags, amount, payer). Full row-level export: Master Reports → Report 11 — Payment Details.',
  },
  'dmart_mp.json_data': {
    title: 'Claim Line Items',
    description: 'Package and procedure line amounts (claimed vs approved, TDS/RF, net payable)',
  },
  'dmart_mp.tms_recovery': {
    title: 'TMS Recovery',
    description: 'Recovery cases with amount, reason, status, and dates',
  },
  'dmart_mp.t_bis_beneficiary_dtls': {
    title: 'Beneficiary Records',
    description: 'Enrollment, card status, eKYC, ABHA, and district-wise beneficiary details',
  },
  'dmart_mp.t_bis_beneficiary_dtl_hist': {
    title: 'Beneficiary History',
    description: 'Historical enrollment and card status changes for beneficiaries',
  },
  'dmart_mp.m_source_data': {
    title: 'Source Family Data',
    description: 'Source family records used for beneficiary enrollment and card issuance',
  },
  'dmart_mp.t_bis_beneficiary_disabled': {
    title: 'Disabled Beneficiaries',
    description: 'Beneficiaries marked inactive with disable reason and acted-by details',
  },
  'dmart_mp.t_beneficiary_ekyc_dtls_17july2025_old': {
    title: 'Beneficiary e-KYC',
    description: 'Aadhaar and ABHA verification status for enrolled beneficiaries',
  },
  'dmart_mp.pvtg_by_district_7march_v3': {
    title: 'PVTG by District',
    description: 'Particularly Vulnerable Tribal Group beneficiaries by district',
  },
  'dmart_mp.t_bis_beneficiary_disabled_19aug2025': {
    title: 'Disabled Beneficiaries Snapshot',
    description: 'Point-in-time snapshot of disabled beneficiary records',
  },
  'bis_raw.t_bis_beneficiary_dtls': {
    title: 'BIS Raw Beneficiaries',
    description: 'Raw BIS beneficiary extract before datamart enrichment',
  },
  'dmart_mp.hospital_master_with_quality_certification_final': {
    title: 'Hospital Master',
    description: 'Empaneled hospitals with NABH certification and quality indicators',
  },
  'dmart_mp.t_hem_hospital': {
    title: 'HEM Hospital Registry',
    description: 'Hospital empanelment registry with facility IDs and nodal officer details',
  },
  'dmart_mp.t_deempanelment_details': {
    title: 'De-empanelment Details',
    description: 'Hospital de-empanelment actions, stop-payment flags, and scheme remarks',
  },
  'dmart_mp.m_lookup': {
    title: 'Hospital Lookup Codes',
    description: 'Reference codes and lookup values for hospital master fields',
  },
  'dmart_mp.t_hem_manpower': {
    title: 'HEM Manpower',
    description: 'Hospital doctors and staff registry with specialization and registration details',
  },
  'dmart_mp.t_patient_dtls': {
    title: 'Patient Records',
    description: 'Registered patients with hospital, district, and admission details',
  },
  'dmart_mp.treatment_dtls': {
    title: 'Treatment Details',
    description: 'Procedure and treatment line items linked to patient registrations',
  },
  'dmart_mp.t_morth_patient_details': {
    title: 'MORTH Patients',
    description: 'Ministry of Road Transport and Highways accident-care patient records',
  },
  'dmart_mp.treatment_stratification_details': {
    title: 'Treatment Stratification',
    description: 'Procedure stratification tiers and approved amounts by registration',
  },
  'dmart_mp.workflow_users_t': {
    title: 'Workflow Users',
    description: 'Unique users and roles from imported workflow data',
  },
  'dmart_mp.pro_workflow_users_t': {
    title: 'Pro Workflow Users',
    description: 'Professional workflow users with process codes, roles, and claim amounts',
  },
  'dmart_mp.t_workflow_transaction_audit': {
    title: 'Workflow Audit',
    description: 'Workflow transaction audit trail with acted-by user and process codes',
  },
  'dmart_mp.m_status_bis': {
    title: 'BIS Status Master',
    description: 'BIS status codes, names, and descriptions',
  },
  'dmart_mp.m_status_tms': {
    title: 'TMS Status Master',
    description: 'TMS status codes, names, and descriptions',
  },
  'dmart_mp.t_suspicious_api_case_data': {
    title: 'Fraud Case Records',
    description: 'Suspicious case master data with investigation status and risk amounts',
  },
  'dmart_mp.t_suspicious_api_case_dtls': {
    title: 'Fraud Trigger Details',
    description: 'Trigger events and vendor details linked to suspicious cases',
  },
  'dmart_mp.lms_user_course_completion_status': {
    title: 'LMS Training Records',
    description: 'AB-PMJAY and ABDM course completion by role and entity',
  },
  'dmart_mp.t_card_printing_status': {
    title: 'Card Printing Status',
    description: 'Beneficiary card print status, district, and enrollment details',
  },
  'ump_raw.user_master_ump': {
    title: 'UMP User Master',
    description: 'User master records from the UMP module',
  },
}

const SCHEMA_REF = /\b(?:dmart_mp|ump_raw|bis_raw)\.\S+/i

export function isSchemaReference(text?: string | null): boolean {
  if (!text) return false
  return SCHEMA_REF.test(text) || /schema fields/i.test(text)
}

function normalizeTableRef(ref: string): string {
  const match = ref.match(SCHEMA_REF)
  return match ? match[0].toLowerCase() : ref.trim().toLowerCase()
}

/** Strip a schema.table suffix from strings like "Payment Details (dmart_mp.payment_dtls)". */
function extractSchemaFromWrapped(text: string): string | null {
  const paren = text.match(/\(([^)]+\.[^)]+)\)\s*$/)
  if (paren && SCHEMA_REF.test(paren[1])) return normalizeTableRef(paren[1])
  const dash = text.match(/[—–-]\s*(\S+\.\S+)\s*$/)
  if (dash && SCHEMA_REF.test(dash[1])) return normalizeTableRef(dash[1])
  return null
}

export function tableDisplayMeta(ref?: string | null): TableDisplayMeta | undefined {
  if (!ref) return undefined
  const trimmed = ref.trim()
  if (TABLE_LABELS[trimmed.toLowerCase()]) return TABLE_LABELS[trimmed.toLowerCase()]

  const embedded = extractSchemaFromWrapped(trimmed)
  if (embedded && TABLE_LABELS[embedded]) return TABLE_LABELS[embedded]

  const normalized = normalizeTableRef(trimmed)
  if (TABLE_LABELS[normalized]) return TABLE_LABELS[normalized]

  return undefined
}

/** Resolve a schema ref or mixed string to a professional UI title. */
export function tableDisplayTitle(ref?: string | null, fallback = 'Records'): string {
  if (!ref?.trim()) return fallback
  const meta = tableDisplayMeta(ref)
  if (meta) return meta.title

  const trimmed = ref.trim()
  if (!isSchemaReference(trimmed)) {
    const withoutParen = trimmed.replace(/\s*\([^)]+\.\S+[^)]*\)\s*$/, '').trim()
    if (withoutParen && !isSchemaReference(withoutParen)) return withoutParen
  }

  const tableOnly = trimmed.split('.').pop()?.replace(/_/g, ' ') ?? trimmed
  return tableOnly.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function tableDisplayDescription(ref?: string | null, fallback?: string): string | undefined {
  const meta = tableDisplayMeta(ref)
  return meta?.description ?? fallback
}

/** PageHeader-safe description: never exposes raw schema names. */
export function pageHeaderDescription(ref?: string | null, fallback?: string): string | undefined {
  const desc = tableDisplayDescription(ref, fallback)
  if (!desc || isSchemaReference(desc)) return fallback && !isSchemaReference(fallback) ? fallback : undefined
  return desc
}
