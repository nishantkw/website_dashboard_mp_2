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

export function districtsForDivision(divisionName) {
  if (!divisionName) return []
  const div = MP_DIVISIONS.find((d) => d.division.toLowerCase() === String(divisionName).toLowerCase())
  return div?.districts ?? []
}

export function divisionForDistrict(districtName) {
  if (!districtName) return 'Unknown'
  return DISTRICT_TO_DIVISION[String(districtName).toLowerCase()] || 'Unknown'
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
