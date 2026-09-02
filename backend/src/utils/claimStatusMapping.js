/**
 * Maps claim_paid_excel_t.case_status to TMS 2.0 Master Report KPI buckets (FRS §6).
 * Uses keyword rules until exact status lists are validated against production data.
 */

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
]

export const CLAIM_KPI_LABELS = {
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

/** @returns {string} */
export function classifyClaimKpi(caseStatus) {
  const s = String(caseStatus || '').toLowerCase()

  if (
    /payment accomplished|payment initiated|onetms claim paid/.test(s) ||
    (/\bclaim paid\b/.test(s) && !/rejected/.test(s))
  ) {
    return 'claims_paid'
  }
  if (/\bpaid\b/.test(s) && !/unpaid|not paid|rejected/.test(s)) return 'claims_paid'

  // Stage checks before generic "rejected" — e.g. "Rejected By CPD and Send to MAC"
  if (/send to mac|assigned by mac|submitted for medical audit|medical audit/.test(s) || (/\bmac\b/.test(s) && !/approved by/.test(s))) {
    return 'under_process_mac'
  }
  if ((/\bcrc\b/.test(s) && !/approved by/.test(s)) || /reprocess submitted under crc|crc submitted/.test(s)) {
    return 'under_process_crc'
  }
  if (/safu|\bafo\b|marked disagree|marked agree not fraud/.test(s)) return 'under_process_safu_afo'
  if (
    (/\bisa\b|cex|cpd-trust|submitted for trust|forwarded by cex|assigned by cpd/.test(s) ||
      /\baae\b/.test(s)) &&
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

/** True when the case has moved from pre-auth into a claim. */
export function isClaimInitiated(row, bucket) {
  const b = bucket || classifyClaimKpi(row.case_status)
  if (Number(row.amount_claim_initiated) > 0) return true
  const s = String(row.case_status || '').toLowerCase()
  if (/preauth|pre-auth|preauthorization/.test(s) && !/\bclaim\b/.test(s)) return false
  if (b === 'preauth_initiated') return false
  if (/\bclaim\b|payment accomplished|payment initiated/.test(s)) return true
  return b !== 'preauth_initiated'
}

export function deriveStateType(row, mappedDivision) {
  const src = String(row.case_type || row.service_request_type || row.policy_code || '').toLowerCase()
  if (/portability|portable|out of state|oos/.test(src)) return 'Portability'

  const state = String(row.patient_state_name || '').trim().toLowerCase()
  if (state && !/madhya pradesh|^mp$|m\.p\.?$/.test(state)) return 'Portability'

  if (mappedDivision === 'Unknown') return 'Portability'

  return 'MP'
}

export function deriveHospitalType(row) {
  const ht = String(row.hospital_type || '').toLowerCase()
  if (/gov|public|government/.test(ht)) return 'Public'
  if (/priv/.test(ht)) return 'Private'
  const raw = String(row.hospital_type || '').trim()
  return raw || 'Unknown'
}

export function deriveSpecialtyCode(row) {
  return String(row.speciality_code || row.specialty_code || 'Unknown').trim() || 'Unknown'
}

/** Specialty data is CATEGORY_DETAILS (e.g. General Surgery), not procedure text. */
export function deriveSpecialtyData(row) {
  return String(row.category_details || row.CATEGORY_DETAILS || row.category || 'Unknown').trim() || 'Unknown'
}

/** Default specialty display is the imported specialty code. */
export function deriveSpecialty(row) {
  return deriveSpecialtyCode(row)
}

export function derivePatientState(row) {
  return String(row.patient_state_name || 'Unknown').trim() || 'Unknown'
}

/** Patient district — TMS geography is patient location, not hospital district. */
export function deriveDistrict(row) {
  return String(row.patient_district_name || 'Unknown').trim() || 'Unknown'
}

export function preauthAmount(row) {
  return Number(row.amount_preauth_initiated || row.amount_claim_initiated || 0)
}

export function initiatedAmount(row) {
  return Number(row.amount_claim_initiated || row.amount_preauth_initiated || 0)
}

export function approvedAmount(row) {
  return Number(row.amount_claim_approved || row.amount_claim_paid || 0)
}

export function toCrores(amount) {
  return Math.round((amount / 1e7) * 100) / 100
}
