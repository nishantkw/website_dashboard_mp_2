import { MP_DIVISIONS, getDivisionForDistrict } from '../data/filterOptions'
import { monthLabelToRange } from './chartDrillDown'

export interface DrillDownAppliedFilters {
  division?: string
  district?: string
  patient_state?: string
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

const ALL_DISTRICTS = MP_DIVISIONS.flatMap((d) => d.districts)

function canonicalizeDistrict(name: string): string | undefined {
  const hit = ALL_DISTRICTS.find((d) => d.toLowerCase() === name.toLowerCase())
  return hit
}

function canonicalizeDivision(name: string): string | undefined {
  const hit = MP_DIVISIONS.find((d) => d.division.toLowerCase() === name.toLowerCase())
  return hit?.division
}

const STATUS_VALUES = [
  'Active',
  'Paid',
  'Approved',
  'Pending',
  'Rejected',
  'Under Review',
  'Printed',
  'Delivered',
  'Completed',
  'Settled',
]

/**
 * Infer modal filter values from a chart/KPI click label and chart title.
 * TMS charts use patient state / patient district, not hospital division.
 */
export function resolveDrillDownFilters(
  clickedName: string,
  chartTitle = ''
): DrillDownAppliedFilters {
  const name = String(clickedName || '').trim()
  if (!name) return {}

  const title = String(chartTitle || '').toLowerCase()
  const filters: DrillDownAppliedFilters = {}

  if (/trend/i.test(title)) {
    const range = monthLabelToRange(name)
    if (range) {
      filters.dateFrom = range.from
      filters.dateTo = range.to
      return filters
    }
  }

  const looksLikeDistrictChart = /district/i.test(title)
  const looksLikePatientStateChart = /patient state/i.test(title)
  const looksLikeDivisionChart = /division/i.test(title)

  if (looksLikePatientStateChart) {
    filters.patient_state = name
    filters.division = name
  } else if (looksLikeDistrictChart) {
    if (!/^others$/i.test(name)) {
      filters.district = canonicalizeDistrict(name) || name
    }
  } else if (looksLikeDivisionChart) {
    if (!/^others$/i.test(name)) {
      filters.division = canonicalizeDivision(name) || name
    }
  } else {
    const district = canonicalizeDistrict(name)
    const division = canonicalizeDivision(name)
    if (district && !division) {
      filters.district = district
      filters.division = getDivisionForDistrict(district)
    } else if (division) {
      filters.division = division
    }
  }

  if (/hospital type/i.test(title)) {
    return filters
  }

  const statusHit = STATUS_VALUES.find((s) => s.toLowerCase() === name.toLowerCase())
  if (statusHit && (/status|enroll|card|print|case type/i.test(title) || !filters.district)) {
    if (/status|enroll|card|print/i.test(title) || statusHit) {
      filters.status = statusHit
    }
  }

  if (!filters.district && !filters.division && !filters.patient_state && !filters.status) {
    const skipSearch =
      /^others$/i.test(name) ||
      name.length <= 2 ||
      /^(claims|hospitals|enrolled|active|count|value|amount)$/i.test(name) ||
      /hospital type|case type|claim status|lifecycle status/i.test(title)
    if (!skipSearch) filters.search = name
  }

  return filters
}
