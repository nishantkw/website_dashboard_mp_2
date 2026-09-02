/** BIS beneficiary codes in t_bis_beneficiary_dtls: A/N, 1/0, M/F, V, REL0x. */

import { labelRuralUrban } from './ruralUrban.js'

const RELATION = {
  '01': 'Self',
  '02': 'Spouse',
  '03': 'Son',
  '04': 'Daughter',
  '05': 'Father',
  '06': 'Mother',
  '07': 'Brother',
  '08': 'Sister',
  '09': 'Other',
  '10': 'Grandchild',
}

export function labelGender(val) {
  const s = String(val ?? '').trim()
  if (/^(m|male)$/i.test(s)) return 'Male'
  if (/^(f|female)$/i.test(s)) return 'Female'
  if (/^(t|tg|trans)/i.test(s)) return 'Transgender'
  if (/^(o|other)$/i.test(s)) return 'Other'
  return s || 'Unknown'
}

export function labelActiveStatus(val) {
  const s = String(val ?? '').trim()
  if (/^(1|y|yes|true|active)$/i.test(s)) return 'Active'
  if (/^(0|n|no|false|inactive)$/i.test(s)) return 'Inactive'
  return s || 'Unknown'
}

export function labelEnrlStatus(val) {
  const s = String(val ?? '').trim()
  if (/^(a|approved|active)$/i.test(s)) return 'Approved'
  if (/^(n|new)$/i.test(s)) return 'New'
  if (/^(p|pending)/i.test(s)) return 'Pending'
  if (/^(r|rejected)$/i.test(s)) return 'Rejected'
  if (/^(d|disabled|deleted)$/i.test(s)) return 'Disabled'
  if (/^(i|inactive)$/i.test(s)) return 'Inactive'
  return s || 'Unknown'
}

export function labelCardStatus(val) {
  const s = String(val ?? '').trim()
  if (/marked for download/i.test(s)) return 'Marked for Download'
  if (/download/i.test(s)) return 'Downloaded'
  if (/^(a|approved|active)$/i.test(s) || /^approved$/i.test(s)) return 'Approved'
  if (/^(p|pending)$/i.test(s) || /^pending$/i.test(s)) return 'Pending'
  if (/^(g|generated)$/i.test(s) || /^generated$/i.test(s)) return 'Generated'
  if (/^(i|issued)$/i.test(s)) return 'Issued'
  if (/^(d|disabled|deleted)$/i.test(s)) return 'Disabled'
  if (/^(r|rejected)$/i.test(s)) return 'Rejected'
  if (/printed/i.test(s)) return 'Printed'
  if (/deliver/i.test(s)) return 'Delivered'
  if (/distribut/i.test(s)) return 'Distributed'
  return s || 'Unknown'
}

export function hasFilledDate(row, field) {
  return Boolean(String(row?.[field] ?? '').trim())
}

export function labelAadhaarStatus(val) {
  const s = String(val ?? '').trim()
  if (/^(v|verified|yes)$/i.test(s)) return 'Verified'
  if (/^(n|not.?verif|no)$/i.test(s)) return 'Not Verified'
  if (/^(p|pending)$/i.test(s)) return 'Pending'
  return s || 'Unknown'
}

export function labelRelation(val) {
  const s = String(val ?? '').trim()
  if (!s) return 'Unknown'
  const m = s.match(/^rel[-_]?0*(\d+)$/i) || s.match(/^0*(\d+)$/)
  if (m) {
    const code = String(m[1]).padStart(2, '0')
    if (RELATION[code]) return RELATION[code]
  }
  return s
}

export function labelSourceType(val) {
  const s = String(val ?? '').trim()
  if (!s) return 'Unknown'
  if (/^(g|gov)/i.test(s)) return 'Government'
  if (/^bo$/i.test(s)) return 'Back Office'
  if (/^s$/i.test(s)) return 'SECC'
  if (/^vvs$/i.test(s)) return 'VVS'
  if (/^asha$/i.test(s)) return 'ASHA'
  return s
}

/** Card printing source_type: GV/AWW/PVTG/G — do not treat GV as Government. */
export function labelCardSourceType(val) {
  const s = String(val ?? '').trim()
  if (!s) return 'Unknown'
  if (/^gv$/i.test(s)) return 'GV'
  if (/^aww$/i.test(s)) return 'AWW'
  if (/^pvtg$/i.test(s)) return 'PVTG'
  if (/^g$/i.test(s)) return 'Government'
  return labelSourceType(s)
}

export function labelNewMember(val) {
  const s = String(val ?? '').trim()
  if (/^(y|yes|1|true)$/i.test(s)) return 'Yes'
  if (/^(n|no|0|false)$/i.test(s)) return 'No'
  return s || 'Unknown'
}

export function isActiveRecord(row) {
  return labelActiveStatus(row?.active_status) === 'Active'
}

export function isApprovedEnrl(row) {
  return labelEnrlStatus(row?.enrl_status) === 'Approved'
}

export function isNewOrPendingEnrl(row) {
  const s = labelEnrlStatus(row?.enrl_status)
  return s === 'New' || s === 'Pending' || s === 'Unknown'
}

export function hasAbha(row) {
  return Boolean(String(row?.abha_id ?? '').trim())
}

export function hasCardNo(row) {
  return Boolean(String(row?.card_no ?? '').trim())
}

export function hasEkyc(row) {
  const s = String(row?.ekyc ?? row?.ekyc_status ?? row?.json_obj_ben_ekyc_dtl ?? '').trim()
  if (!s) return false
  if (/pending|no|false|0/i.test(s) && !/\.json/i.test(s)) return false
  return true
}

export function isAadhaarVerified(row) {
  return labelAadhaarStatus(row?.aadhar_status ?? row?.aadhaar_status) === 'Verified'
}

function labelsMatch(have, want) {
  return String(have).toLowerCase() === String(want).toLowerCase()
}

export function matchesGenderFilter(rowVal, filterVal) {
  if (!filterVal) return true
  const want = labelGender(filterVal)
  const have = labelGender(rowVal)
  if (want !== 'Unknown' && have !== 'Unknown') return labelsMatch(have, want)
  return String(rowVal ?? '').toLowerCase().includes(String(filterVal).trim().toLowerCase())
}

export function matchesEnrlFilter(rowVal, filterVal) {
  if (!filterVal) return true
  const want = labelEnrlStatus(filterVal)
  const have = labelEnrlStatus(rowVal)
  if (want !== 'Unknown' && have !== 'Unknown') return labelsMatch(have, want)
  return String(rowVal ?? '').toLowerCase().includes(String(filterVal).trim().toLowerCase())
}

export function matchesCardFilter(rowVal, filterVal) {
  if (!filterVal) return true
  const want = labelCardStatus(filterVal)
  const have = labelCardStatus(rowVal)
  if (want !== 'Unknown' && have !== 'Unknown') return labelsMatch(have, want)
  return String(rowVal ?? '').toLowerCase().includes(String(filterVal).trim().toLowerCase())
}

export function matchesEkycFilter(row, filterVal) {
  if (!filterVal) return true
  const done = hasEkyc(row)
  if (/completed|yes|done/i.test(filterVal)) return done
  if (/pending|no/i.test(filterVal)) return !done
  const raw = String(row?.ekyc ?? row?.ekyc_status ?? row?.json_obj_ben_ekyc_dtl ?? '')
  return raw.toLowerCase().includes(String(filterVal).trim().toLowerCase())
}

export function labelledSqlMatch(column, labelled, kind) {
  const patterns = {
    gender: { Male: '^(m|male)$', Female: '^(f|female)$', Transgender: '^(t|tg|trans)', Other: '^(o|other)$' },
    enrl: {
      Approved: '^(a|approved|active)$',
      New: '^(n|new)$',
      Pending: '^(p|pending)',
      Rejected: '^(r|rejected)$',
      Disabled: '^(d|disabled|deleted)$',
      Inactive: '^(i|inactive)$',
    },
    card: {
      Approved: 'approved',
      Pending: 'pending',
      Generated: 'generated',
      Issued: '^(i|issued)$',
      Disabled: '^(d|disabled|deleted)$',
      Rejected: 'rejected',
      Distributed: 'distribut',
      Downloaded: '^downloaded$',
      'Marked for Download': 'marked for download',
      Printed: 'print',
      Delivered: 'deliver',
    },
  }
  const pattern = patterns[kind]?.[labelled]
  if (!pattern) return null
  return `(TRIM(COALESCE(${column}::text, '')) ~* '${pattern}')`
}

export function ekycSqlMatch(filterVal) {
  const s = String(filterVal ?? '').trim()
  if (/completed|yes|done/i.test(s)) {
    return `NULLIF(TRIM(COALESCE(json_obj_ben_ekyc_dtl::text, '')), '') IS NOT NULL`
  }
  if (/pending|no/i.test(s)) {
    return `NULLIF(TRIM(COALESCE(json_obj_ben_ekyc_dtl::text, '')), '') IS NULL`
  }
  return null
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function enrollTrend(rows) {
  const byMonth = {}
  for (const row of rows) {
    const raw = String(row.enrol_date || row.enroll_date || row.created_dt || '').trim()
    const iso = raw.match(/^(\d{4})-(\d{2})/)
    if (!iso) continue
    const key = `${iso[1]}-${iso[2]}`
    byMonth[key] = (byMonth[key] || 0) + 1
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, value]) => {
      const m = ym.match(/^(\d{4})-(\d{2})$/)
      const month = m ? MONTH_SHORT[Number(m[2]) - 1] : ''
      return { name: month ? `${month} ${m[1]}` : ym, value }
    })
}

export function formatCodedField(key, val) {
  const s = String(val ?? '').trim()
  if (!s) return ''
  switch (String(key || '').toLowerCase()) {
    case 'rural_urban_flag':
    case 'rural_urban':
    case 'urban_rural':
    case 'urban_or_rural':
      return labelRuralUrban(s)
    case 'gender':
    case 'card_gender':
      return labelGender(s)
    case 'active_status':
      return labelActiveStatus(s)
    case 'enrl_status':
    case 'enrollment_status':
      return labelEnrlStatus(s)
    case 'card_status':
    case 'card_print_status':
      return labelCardStatus(s)
    case 'aadhar_status':
    case 'aadhaar_status':
      return labelAadhaarStatus(s)
    case 'relation':
    case 'card_relation':
      return labelRelation(s)
    case 'source_type':
    case 'src_flag':
      return labelCardSourceType(s)
    case 'new_member_flag':
      return labelNewMember(s)
    default:
      return s
  }
}

export function isCodedColumn(key) {
  return /^(rural_urban_flag|rural_urban|urban_rural|urban_or_rural|gender|card_gender|active_status|enrl_status|enrollment_status|card_status|card_print_status|aadhar_status|aadhaar_status|relation|card_relation|source_type|src_flag|new_member_flag)$/i.test(
    key
  )
}
