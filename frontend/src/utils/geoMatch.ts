import { getDivisionForDistrict, resolveDivisionForDistrict, MP_DIVISIONS } from '../data/filterOptions'

/** Page-specific district columns — same filter name, different source fields. */
export const CARD_PRINTING_DISTRICT_COLUMNS = [
  'district_name',
  'district',
  'sub_district_name',
  'district_cd',
  'subdistrict_town',
]
export const BENEFICIARY_DISTRICT_COLUMNS = ['dist_name', 'district', 'district_name']
export const MODULE_DISTRICT_COLUMNS = [
  'district_name',
  'dist_name',
  'patient_district_name',
  'hosp_district_name',
  'district',
]

const DISTRICT_FALLBACKS: Record<string, string[]> = {
  district_name: ['district', 'district_cd', 'sub_district_name', 'subdistrict_town'],
  dist_name: ['district', 'district_name'],
  patient_district_name: [
    'hosp_district_name',
    'district_name',
    '_patient_district',
    '_district',
    'district',
  ],
  district: ['district_name', 'dist_name', 'patient_district_name'],
}

/** Prefer this page's District column, then only related fallbacks for that source. */
export function districtColumnsForField(field?: { column?: string; key?: string } | null) {
  const primary = field?.column || 'district_name'
  const fallbacks = DISTRICT_FALLBACKS[primary] ?? MODULE_DISTRICT_COLUMNS
  return [...new Set([primary, ...fallbacks])]
}

export function normalizeDistrictName(name: string) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\bdistrict\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function districtsMatch(rowDistrict: string, filterDistrict: string) {
  const a = normalizeDistrictName(rowDistrict)
  const b = normalizeDistrictName(filterDistrict)
  if (!b) return true
  if (!a) return false
  return a === b || a.includes(b) || (b.length >= 4 && b.includes(a))
}

export function rowDistrictValue(row: Record<string, string | number>, columns: string[]) {
  for (const col of columns) {
    const val = String(row[col] ?? '').trim()
    if (val) return val
  }
  return ''
}

export function rowMatchesDistrict(rowDistrict: string, filterDistrict: string) {
  if (!filterDistrict) return true
  return districtsMatch(rowDistrict, filterDistrict)
}

export function rowMatchesDivision(rowDistrict: string, divisionName: string) {
  if (!divisionName) return true
  if (/^unknown$/i.test(divisionName)) {
    return resolveDivisionForDistrict(rowDistrict) === 'Unknown'
  }
  const mapped = getDivisionForDistrict(rowDistrict)
  if (mapped && mapped.toLowerCase() === divisionName.toLowerCase()) return true
  const allowed = MP_DIVISIONS.find((d) => d.division.toLowerCase() === divisionName.toLowerCase())?.districts ?? []
  return allowed.some((d) => districtsMatch(rowDistrict, d))
}
