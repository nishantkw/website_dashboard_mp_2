/** MP division ↔ district mapping (mirrors frontend filterOptions). */
export const MP_DIVISIONS = [
  { division: 'Bhopal', districts: ['Bhopal'] },
  { division: 'Narmadapuram', districts: ['Betul', 'Harda', 'Hoshangabad', 'Raisen', 'Rajgarh', 'Sehore', 'Vidisha'] },
  { division: 'Gwalior', districts: ['Gwalior', 'Ashoknagar', 'Bhind', 'Datia', 'Guna', 'Morena', 'Sheopur', 'Shivpuri'] },
  { division: 'Indore', districts: ['Indore', 'Alirajpur', 'Barwani', 'Burhanpur', 'Dhar', 'Jhabua', 'Khandwa', 'Khargone'] },
  { division: 'Jabalpur', districts: ['Jabalpur', 'Balaghat', 'Chhindwara', 'Dindori', 'Katni', 'Mandla', 'Narsinghpur', 'Seoni', 'Pandhurna'] },
  { division: 'Rewa', districts: ['Rewa', 'Anuppur', 'Satna', 'Shahdol', 'Sidhi', 'Singrauli', 'Umaria', 'Maihar', 'Mauganj'] },
  { division: 'Sagar', districts: ['Sagar', 'Chhatarpur', 'Damoh', 'Panna', 'Tikamgarh', 'Niwari'] },
  { division: 'Ujjain', districts: ['Ujjain', 'Agarmalwa', 'Dewas', 'Mandsaur', 'Neemuch', 'Ratlam', 'Shajapur'] },
]

const DISTRICT_TO_DIVISION = Object.fromEntries(
  MP_DIVISIONS.flatMap((d) => d.districts.map((dist) => [dist.toLowerCase(), d.division]))
)

/** SQL: match any of these columns to a selected district (case-insensitive). */
export function pushDistrictSql(parts, params, columns, districtName) {
  if (!districtName || !columns?.length) return
  const ors = columns.map((col) => {
    params.push(`%${String(districtName).trim()}%`)
    return `${col}::text ILIKE $${params.length}`
  })
  parts.push(`(${ors.join(' OR ')})`)
}

/** SQL: division filter = row district is one of that division’s districts (loose / case-insensitive). */
export function pushDivisionSql(parts, params, columns, divisionName) {
  const districts = districtsForDivision(divisionName)
  if (!districts.length || !columns?.length) return
  const ors = []
  for (const col of columns) {
    for (const name of districts) {
      params.push(`%${name}%`)
      ors.push(`${col}::text ILIKE $${params.length}`)
    }
  }
  parts.push(`(${ors.join(' OR ')})`)
}

export function pushGeoSql(parts, params, q, columns) {
  if (q.district) pushDistrictSql(parts, params, columns, q.district)
  else if (q.division) pushDivisionSql(parts, params, columns, q.division)
}

export function normalizeDistrictName(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\bdistrict\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function districtsMatch(rowDistrict, filterDistrict) {
  const a = normalizeDistrictName(rowDistrict)
  const b = normalizeDistrictName(filterDistrict)
  if (!b) return true
  if (!a) return false
  return a === b || a.includes(b) || (b.length >= 4 && b.includes(a))
}

export function rowGeoDistrict(row = {}, columns = []) {
  const keys = columns.length
    ? columns
    : [
        'district_name',
        'dist_name',
        'district',
        'patient_district_name',
        'hosp_district_name',
        'sub_district_name',
        'district_cd',
      ]
  for (const key of keys) {
    const val = String(row[key] ?? '').trim()
    if (val) return val
  }
  return ''
}

export function matchesDistrictFilter(rowDistrict, filterDistrict) {
  if (!filterDistrict) return true
  return districtsMatch(rowDistrict, filterDistrict)
}

export function matchesDivisionFilter(rowDistrict, divisionName) {
  if (!divisionName) return true
  const allowed = districtsForDivision(divisionName)
  if (!allowed.length) return false
  if (allowed.some((d) => districtsMatch(rowDistrict, d))) return true
  return divisionForDistrict(rowDistrict) === divisionName
}

export function districtsForDivision(divisionName) {
  if (!divisionName) return []
  const div = MP_DIVISIONS.find((d) => d.division.toLowerCase() === String(divisionName).toLowerCase())
  return div?.districts ?? []
}

export function divisionForDistrict(districtName) {
  if (!districtName) return 'Unknown'
  const exact = DISTRICT_TO_DIVISION[String(districtName).toLowerCase().trim()]
  if (exact) return exact
  const key = Object.keys(DISTRICT_TO_DIVISION).find((d) => districtsMatch(districtName, d))
  return key ? DISTRICT_TO_DIVISION[key] : 'Unknown'
}

export function allMpDistricts() {
  return MP_DIVISIONS.flatMap((d) => d.districts)
}

/** True when the name matches a district in the MP Division / District filter lists. */
export function isMpDistrict(districtName) {
  const raw = String(districtName ?? '').trim().toLowerCase()
  if (!raw) return false
  if (DISTRICT_TO_DIVISION[raw]) return true
  for (const d of Object.keys(DISTRICT_TO_DIVISION)) {
    if (raw.includes(d)) return true
    if (d.length >= 4 && d.includes(raw)) return true
  }
  return false
}

export function isMpDivisionName(divisionName) {
  const raw = String(divisionName ?? '').trim().toLowerCase()
  if (!raw) return false
  return MP_DIVISIONS.some((d) => d.division.toLowerCase() === raw)
}

/**
 * MP = district/division is in the SHA filter lists.
 * Portability = not in those lists (other state / unknown geography).
 */
export function deriveGeoStateType(row = {}) {
  const district =
    row.district_name ||
    row.dist_name ||
    row.hosp_district_name ||
    row.patient_district_name ||
    ''
  if (isMpDistrict(district)) return 'MP'
  const division = row.division_name || row.division || ''
  if (isMpDivisionName(division)) return 'MP'
  return 'Portability'
}

export function matchesStateTypeFilter(row, stateType) {
  if (!stateType || stateType === 'Both') return true
  return deriveGeoStateType(row) === stateType
}

/** SQL predicate: column is (or is not) an MP filter-list district. */
export function sqlMpDistrictPredicate(columnExpr, { portability = false } = {}) {
  const list = allMpDistricts()
    .map((d) => `'${String(d).replace(/'/g, "''").toLowerCase()}'`)
    .join(', ')
  const expr = `lower(btrim(COALESCE(${columnExpr}::text, ''))) IN (${list})`
  return portability ? `NOT (${expr})` : expr
}
