/** Mirrors backend `claimStatusMapping.js` so KPI/card clicks can filter claim rows. */

export const CLAIM_KPI_KEYS = [
  'preauth_initiated',
  'claims_initiated',
  'claim_rejected_closed',
  'claims_paid',
  'claims_ready_for_payment',
  'under_process_hospital',
  'under_process_isa',
  'under_process_crc',
  'under_process_mac',
  'under_process_safu_afo',
] as const

export type ClaimKpiKey = (typeof CLAIM_KPI_KEYS)[number]

export const CLAIM_KPI_LABELS: Record<ClaimKpiKey, string> = {
  preauth_initiated: 'Pre-auth Initiated',
  claims_initiated: 'Claims Initiated',
  claim_rejected_closed: 'Claim Rejected/Closed',
  claims_paid: 'Claims Paid',
  claims_ready_for_payment: 'Claims Ready for Payment',
  under_process_hospital: 'Claim Under Process at Hospital',
  under_process_isa: 'Claim Under Process at ISA',
  under_process_crc: 'Claims Under Process at CRC',
  under_process_mac: 'Claims Under Process at MAC',
  under_process_safu_afo: 'Claims Under Process at SAFU & AFO',
}

const LABEL_ALIASES: Record<string, ClaimKpiKey> = {
  'under process at hospital': 'under_process_hospital',
  'under process at isa': 'under_process_isa',
  'under process at crc': 'under_process_crc',
  'under process at mac': 'under_process_mac',
  'under process at safu & afo': 'under_process_safu_afo',
  'under process at safu and afo': 'under_process_safu_afo',
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

const LABEL_TO_KEY: Record<string, ClaimKpiKey> = { ...LABEL_ALIASES }

for (const key of CLAIM_KPI_KEYS) {
  LABEL_TO_KEY[normalize(key)] = key
  LABEL_TO_KEY[normalize(CLAIM_KPI_LABELS[key])] = key
}

export function resolveClaimKpiKey(label: string, key?: string): ClaimKpiKey | null {
  if (key && (CLAIM_KPI_KEYS as readonly string[]).includes(key)) return key as ClaimKpiKey
  const mapped = LABEL_TO_KEY[normalize(label)]
  return mapped ?? null
}

export function classifyClaimKpi(caseStatus: string): ClaimKpiKey {
  const s = String(caseStatus || '').toLowerCase()

  if (
    /payment accomplished|payment initiated|onetms claim paid/.test(s) ||
    (/\bclaim paid\b/.test(s) && !/rejected/.test(s))
  ) {
    return 'claims_paid'
  }
  if (/\bpaid\b/.test(s) && !/unpaid|not paid|rejected/.test(s)) return 'claims_paid'

  if (
    /send to mac|assigned by mac|submitted for medical audit|medical audit/.test(s) ||
    (/\bmac\b/.test(s) && !/approved by/.test(s))
  ) {
    return 'under_process_mac'
  }
  if ((/\bcrc\b/.test(s) && !/approved by/.test(s)) || /reprocess submitted under crc|crc submitted/.test(s)) {
    return 'under_process_crc'
  }
  if (/safu|\bafo\b|marked disagree|marked agree not fraud/.test(s)) return 'under_process_safu_afo'
  if (
    (/\bisa\b|cex|cpd-trust|submitted for trust|forwarded by cex|assigned by cpd/.test(s) || /\baae\b/.test(s)) &&
    !/approved by/.test(s)
  ) {
    return 'under_process_isa'
  }
  if (/queried by/.test(s)) return 'under_process_hospital'

  if (/ready for payment|approved by (aae|aco|cpd|sha|mac|crc)|approve by crc/.test(s)) {
    return 'claims_ready_for_payment'
  }

  if (
    /rejected|closed|marked fraud|marked as fraud|payment rejected|payment stopped|erroneous rejected|reprocess rejected|cancel/.test(
      s
    )
  ) {
    return 'claim_rejected_closed'
  }

  if (/claim initiated|claims initiated|claim submitted/.test(s)) return 'claims_initiated'
  if (/preauth|pre-auth|preauthorization/.test(s)) return 'preauth_initiated'
  if (/pending|process|under|review|query|queried|approv/.test(s)) return 'claims_initiated'

  return 'claims_initiated'
}

export function isClaimInitiated(row: Record<string, string | number>, bucket?: ClaimKpiKey): boolean {
  const b = bucket || classifyClaimKpi(String(row.case_status ?? row.status ?? ''))
  if (Number(row.amount_claim_initiated) > 0) return true
  const s = String(row.case_status ?? row.status ?? '').toLowerCase()
  if (/preauth|pre-auth|preauthorization/.test(s) && !/\bclaim\b/.test(s)) return false
  if (b === 'preauth_initiated') return false
  if (/\bclaim\b|payment accomplished|payment initiated/.test(s)) return true
  return b !== 'preauth_initiated'
}

function rowKpiBucket(row: Record<string, string | number>): ClaimKpiKey {
  const tagged = String(row._kpi_bucket ?? '').trim()
  if ((CLAIM_KPI_KEYS as readonly string[]).includes(tagged)) return tagged as ClaimKpiKey
  return classifyClaimKpi(String(row.case_status ?? row.status ?? ''))
}

/**
 * Filter claim rows to the clicked lifecycle KPI.
 * Returns null when the label is not a claim-status KPI (leave caller to use all rows).
 *
 * Pre-auth Initiated counts every case. Claims Initiated counts cases that reached claim stage.
 * Other heads are the current workflow bucket.
 */
export function filterRowsForClaimKpi(
  rows: Record<string, string | number>[],
  label: string,
  kpiKey?: string
): Record<string, string | number>[] | null {
  const key = resolveClaimKpiKey(label, kpiKey)
  if (!key) return null
  if (key === 'preauth_initiated') return rows
  if (key === 'claims_initiated') return rows.filter((row) => isClaimInitiated(row, rowKpiBucket(row)))
  return rows.filter((row) => rowKpiBucket(row) === key)
}
