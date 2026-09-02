import { assertSafeIdent } from './schemaRegistry.js'

/** Preferred unique-key column sets per physical table (first full match wins). */
const TABLE_KEYS = {
  claim_paid_excel_t: [['case_id'], ['registration_id', 'hospital_code']],
  claim_paid_t_portability: [['case_id']],
  hospital_master_with_quality_certification_final: [['hosp_id'], ['facility_id']],
  hospital_master_with_quality_certification: [['hosp_id']],
  hospital_master: [['hospital_code'], ['facility_id']],
  t_hem_hospital: [['hosp_id']],
  t_bis_beneficiary_dtls: [['member_id'], ['ben_id'], ['bis_member_id']],
  t_card_printing_status: [['card_no'], ['ben_id']],
  t_patient_dtls: [['case_id'], ['registration_id']],
  t_patient_dtl: [['registration_id']],
  t_morth_patient_details: [['id_pk'], ['patient_registration_id']],
  t_suspicious_api_case_data: [['reference_number'], ['suspicion_id']],
  t_suspicious_api_case_dtls: [['reference_number']],
  lms_user_course_completion_status: [['userid']],
  user_master_ump: [['user_id']],
  ump_user_dtl: [['user_id']],
  payment_dtls: [['case_id', 'payment_unique_id'], ['case_id']],
  t_payment_dtls: [['case_id', 'payment_unique_id'], ['case_id']],
  workflow_users_t: [['registration_id', 'workflow_role'], ['id_pk']],
  t_workflow_transaction_audit: [['id_pk']],
  tms_recovery: [['case_id', 'hosp_disp_code', 'created_dt'], ['case_id']],
  icd_data_doctor_details: [['case_id', 'code']],
  treatment_dtls: [['caseid', 'procedure_code'], ['registration_id', 'procedure_code']],
}

const GENERIC_KEYS = [
  ['case_id'],
  ['hosp_id'],
  ['facility_id'],
  ['member_id'],
  ['ben_id'],
  ['card_no'],
  ['reference_number'],
  ['userid'],
  ['user_id'],
  ['id_pk'],
]

function normalizeHeader(h) {
  return String(h || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export function rowIdentity(row, keyCols) {
  if (!keyCols?.length) return JSON.stringify(row)
  const parts = keyCols.map((c) => String(row[c] ?? '').trim())
  if (parts.every((p) => p === '')) return JSON.stringify(row)
  return parts.join('\0')
}

export function pickKeyColumns(tableName, availableCols) {
  const available = availableCols instanceof Set ? availableCols : new Set(availableCols)
  const candidates = [...(TABLE_KEYS[tableName] || []), ...GENERIC_KEYS]
  return candidates.find((cols) => cols.every((c) => available.has(c))) || null
}

export function pickRawKeyHeaders(headers) {
  const map = new Map(headers.map((h) => [normalizeHeader(h), h]))
  const preferred = [
    'case_id',
    'hosp_id',
    'facility_id',
    'member_id',
    'ben_id',
    'card_no',
    'reference_number',
    'userid',
    'user_id',
    'registration_id',
  ]
  const found = preferred.map((p) => map.get(p)).filter(Boolean)
  return found.length ? [found[0]] : null
}

function cellText(v) {
  return String(v ?? '').trim()
}

export function canonicalRowKey(row, cols) {
  const keys = (cols && cols.length ? cols : Object.keys(row || {})).slice().sort()
  return keys.map((k) => `${k}=${cellText(row?.[k])}`).join('\0')
}

export function diffRowFields(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])
  return [...keys].filter((k) => cellText(a?.[k]) !== cellText(b?.[k])).sort()
}

function summarizeDupe(row, kept, fileRow, keptFileRow, everyFieldDuplicate, keyCols) {
  return {
    fileRow,
    keptFileRow,
    everyFieldDuplicate,
    keyCols: keyCols || [],
    differingFields: everyFieldDuplicate ? [] : diffRowFields(row, kept),
    row,
    kept,
  }
}

/**
 * File extract: drop only rows that match on every field.
 * Same business key with different other fields are kept, but reported.
 */
export function splitFileDuplicates(rows, keyCols = null) {
  const seenFull = new Map()
  const firstByKey = new Map()
  const unique = []
  const exactCopies = []
  const keyOnlyDiffs = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const fileRow = i + 2
    const fullKey = canonicalRowKey(row)
    const prevExact = seenFull.get(fullKey)
    if (prevExact) {
      exactCopies.push(summarizeDupe(row, prevExact.row, fileRow, prevExact.fileRow, true, keyCols))
      continue
    }
    seenFull.set(fullKey, { row, fileRow })

    if (keyCols?.length) {
      const bizKey = rowIdentity(row, keyCols)
      const prevKey = firstByKey.get(bizKey)
      if (prevKey) {
        const diffs = diffRowFields(row, prevKey.row)
        if (diffs.length) {
          keyOnlyDiffs.push(summarizeDupe(row, prevKey.row, fileRow, prevKey.fileRow, false, keyCols))
        }
      } else {
        firstByKey.set(bizKey, { row, fileRow })
      }
    }

    unique.push(row)
  }

  return {
    rows: unique,
    duplicates: exactCopies.length,
    exactCopies,
    keyOnlyDiffs,
    keyCols,
  }
}

/**
 * Keep the first occurrence of each unique row. Exact copies (or same business key) are dropped.
 */
export function dedupeRows(rows, keyCols = null) {
  const seen = new Set()
  const unique = []
  let duplicates = 0
  for (const row of rows) {
    const key = rowIdentity(row, keyCols)
    if (seen.has(key)) {
      duplicates++
      continue
    }
    seen.add(key)
    unique.push(row)
  }
  return { rows: unique, duplicates, keyCols }
}

export { assertSafeIdent }
