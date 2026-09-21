import { matchesStateTypeFilter, pushGeoSql, matchesDivisionFilter } from '../data/mpDivisions.js'

/**
 * WHERE clause for dmart_mp.hospital_master_with_quality_certification_final
 * (Redshift schema: hosp_id, hosp_name, district_name — no id_pk / division_name).
 */
export function buildHospitalWhere(q, options = {}) {
  const { includeNabh = false, includeHospitalStatus = false } = options
  const parts = []
  const params = []

  const pushIlike = (columns, val) => {
    const ors = columns.map((col) => {
      params.push(`%${val}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    parts.push(`(${ors.join(' OR ')})`)
  }

  if (q.district || q.division) pushGeoSql(parts, params, q, ['district_name'])

  if (q.hospital_type) {
    if (/^unknown$/i.test(String(q.hospital_type))) {
      parts.push(`(hospital_type IS NULL OR btrim(hospital_type::text) = '' OR hospital_type::text ILIKE 'unknown')`)
    } else {
      const key = normalizeHospitalTypeKey(q.hospital_type)
      if (key === 'government') {
        parts.push(
          `(upper(btrim(hospital_type::text)) IN ('G','GOVERNMENT','GOV','GOVT','PUBLIC') OR hospital_type::text ILIKE '%gov%')`
        )
      } else if (key === 'private') {
        parts.push(
          `((upper(btrim(hospital_type::text)) IN ('P','PRIVATE') OR hospital_type::text ILIKE '%priv%') AND upper(btrim(hospital_type::text)) <> 'PP')`
        )
      } else {
        params.push(String(q.hospital_type).trim())
        parts.push(`btrim(hospital_type::text) ILIKE $${params.length}`)
      }
    }
  }
  if (includeNabh && q.nabh) {
    const intent = nabhFilterIntent(q.nabh)
    if (intent === 'yes') {
      parts.push(`quality_certification::text ILIKE '%NABH%'`)
    } else if (intent === 'no') {
      parts.push(`(quality_certification IS NULL OR quality_certification::text NOT ILIKE '%NABH%')`)
    } else {
      pushIlike(['quality_certification'], q.nabh)
    }
  }
  if (includeHospitalStatus && q.hospital_status) {
    pushIlike(['enrl_status', 'active_status', 'hosp_status_desc'], q.hospital_status)
  }

  if (q.search) {
    pushIlike(
      ['hosp_id', 'facility_id', 'hosp_name', 'district_name', 'hospital_type', 'state_name'],
      q.search
    )
  }

  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  return { clause, params }
}

function includesLoose(haystack, needle) {
  return String(haystack ?? '').toLowerCase().includes(String(needle ?? '').toLowerCase())
}

/**
 * Normalize ownership labels so chart slices (Private/Government) match DB codes (P/G)
 * and claim-derived Public. "PP" must stay distinct from Private.
 */
export function normalizeHospitalTypeKey(val) {
  const t = String(val ?? '').trim()
  if (!t) return 'unknown'
  if (/^unknown$/i.test(t)) return 'unknown'
  if (/^pp$/i.test(t)) return 'pp'
  if (/^public$/i.test(t) || /^g$/i.test(t) || /gov/i.test(t)) return 'government'
  if (/^p$/i.test(t) || /priv/i.test(t)) return 'private'
  return t.toLowerCase()
}

/** Chart slices use COALESCE(hospital_type, 'Unknown'). "P" must not also match "PP". */
export function hospitalTypeEquals(rowType, filterType) {
  const a = String(rowType ?? '').trim()
  const b = String(filterType ?? '').trim()
  if (!b) return true
  if (/^unknown$/i.test(b)) return !a || /^unknown$/i.test(a)
  return normalizeHospitalTypeKey(a) === normalizeHospitalTypeKey(b)
}

/** Actual DB values: "Entry level NABH - 110", "NABH Full - 115" — not Yes/No. */
export function isNabhCertifiedHospital(row) {
  const text = `${row.quality_certification ?? ''} ${row.nabh_certified ?? ''}`
  return /nabh/i.test(text)
}

function nabhFilterIntent(val) {
  const s = String(val ?? '').trim()
  if (!s) return 'all'
  if (/^(no|false|0|not[- ]?certified)$/i.test(s)) return 'no'
  if (/^(yes|true|1|certified)$/i.test(s)) return 'yes'
  return 'text'
}

export function matchesNabhFilter(row, nabhVal) {
  const intent = nabhFilterIntent(nabhVal)
  if (intent === 'all') return true
  const certified = isNabhCertifiedHospital(row)
  if (intent === 'yes') return certified
  if (intent === 'no') return !certified
  const text = `${row.quality_certification ?? ''} ${row.nabh_certified ?? ''}`
  return includesLoose(text, nabhVal)
}

/** In-memory filters so both hospital master tables (with/without district_name) work. */
export function filterHospitalRows(rows, q = {}, options = {}) {
  const { includeNabh = true, includeHospitalStatus = true } = options
  if (!q || Object.keys(q).length === 0) return rows

  return rows.filter((row) => {
    const district = String(row.district_name || row.dist_name || '')
    if (q.state_type && q.state_type !== 'Both' && !matchesStateTypeFilter(row, q.state_type)) return false
    const applyMpGeo = q.state_type !== 'Portability'
    if (applyMpGeo && q.district && !includesLoose(district, q.district)) return false
    if (applyMpGeo && q.division && !matchesDivisionFilter(district, q.division)) return false
    if (q.hospital_type && !hospitalTypeEquals(row.hospital_type, q.hospital_type)) return false
    if (includeNabh && q.nabh && !matchesNabhFilter(row, q.nabh)) return false
    if (includeHospitalStatus && q.hospital_status) {
      const status = `${row.enrl_status || ''} ${row.active_status || ''} ${row.hosp_status_desc || ''}`
      if (!includesLoose(status, q.hospital_status)) return false
    }
    if (q.search) {
      const hay = [
        row.hosp_id,
        row.facility_id,
        row.hosp_name,
        row.hospital_name,
        row.district_name,
        row.hospital_type,
        row.state_name,
      ].join(' ')
      if (!includesLoose(hay, q.search)) return false
    }
    return true
  })
}
