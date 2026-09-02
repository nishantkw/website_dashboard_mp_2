import { districtsForDivision, matchesStateTypeFilter } from '../data/mpDivisions.js'

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

  if (q.district) pushIlike(['district_name'], q.district)
  else if (q.division) {
    const districts = districtsForDivision(q.division)
    if (districts.length) {
      const placeholders = districts.map((d) => {
        params.push(d)
        return `$${params.length}`
      })
      parts.push(`district_name IN (${placeholders.join(', ')})`)
    }
  }

  if (q.hospital_type) pushIlike(['hospital_type'], q.hospital_type)
  if (includeNabh && q.nabh) {
    pushIlike(['quality_certification', 'nabh_certified', 'accreditation_status'], q.nabh)
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

/** In-memory filters so both hospital master tables (with/without district_name) work. */
export function filterHospitalRows(rows, q = {}, options = {}) {
  const { includeNabh = true, includeHospitalStatus = true } = options
  if (!q || Object.keys(q).length === 0) return rows

  const districtAllow =
    !q.district && q.division
      ? new Set(districtsForDivision(q.division).map((d) => String(d).toLowerCase()))
      : null

  return rows.filter((row) => {
    const district = String(row.district_name || row.dist_name || '')
    if (q.state_type && q.state_type !== 'Both' && !matchesStateTypeFilter(row, q.state_type)) return false
    const applyMpGeo = q.state_type !== 'Portability'
    if (applyMpGeo && q.district && !includesLoose(district, q.district)) return false
    if (applyMpGeo && districtAllow?.size && !districtAllow.has(district.toLowerCase())) return false
    if (q.hospital_type && !includesLoose(row.hospital_type, q.hospital_type)) return false
    if (includeNabh && q.nabh) {
      const nabh = `${row.quality_certification || ''} ${row.nabh_certified || ''} ${row.accreditation_status || ''}`
      if (!includesLoose(nabh, q.nabh)) return false
    }
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
