import { MP_DIVISIONS, getDivisionForDistrict, canonicalMpDistrict } from '../data/filterOptions'
import { monthLabelToRange } from './chartDrillDown'

export interface DrillDownAppliedFilters {
  division?: string
  district?: string
  patient_state?: string
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  /** Fields inherited from page/global filters — show in modal but not editable. */
  locked?: {
    division?: boolean
    district?: boolean
    dateFrom?: boolean
    dateTo?: boolean
    status?: boolean
  }
}

function pickFirst(...vals: Array<string | undefined | null>): string | undefined {
  for (const v of vals) {
    const s = String(v ?? '').trim()
    if (s && s.toUpperCase() !== 'ALL') return s
  }
  return undefined
}

/**
 * Chart-click filters win when set; otherwise inherit page / global division & district
 * so the drill-down modal matches filters already chosen outside the modal.
 * Outside-selected geo/date fields are marked locked (display-only in the modal).
 */
export function mergeDrillDownFilters(
  fromClick: DrillDownAppliedFilters = {},
  pageFilters?: Record<string, string | undefined> | null,
  globalFilters?: Record<string, string | undefined> | null
): DrillDownAppliedFilters {
  const page = pageFilters || {}
  const global = globalFilters || {}

  const outsideDivision = pickFirst(page.division, global.division)
  const outsideDistrictRaw = pickFirst(page.district, global.district)
  const outsideDistrict = outsideDistrictRaw
    ? canonicalMpDistrict(outsideDistrictRaw) || outsideDistrictRaw
    : undefined
  const outsideDateFrom = pickFirst(page.date_from, global.date_from)
  const outsideDateTo = pickFirst(page.date_to, global.date_to)
  const outsideStatus = pickFirst(
    page.card_status,
    page.hospital_status,
    page.patient_status,
    page.investigation_status,
    page.user_status,
    global.card_status,
    global.hospital_status,
    global.patient_status,
    global.user_status
  )

  const districtRaw = pickFirst(fromClick.district, outsideDistrict)
  const district = districtRaw ? canonicalMpDistrict(districtRaw) || districtRaw : undefined
  const divisionFromDistrict = district ? getDivisionForDistrict(district) : undefined
  const division = pickFirst(fromClick.division, outsideDivision, divisionFromDistrict)

  return {
    division,
    district,
    patient_state: pickFirst(fromClick.patient_state, page.patient_state),
    status: pickFirst(fromClick.status, outsideStatus),
    search: fromClick.search,
    dateFrom: pickFirst(fromClick.dateFrom, outsideDateFrom),
    dateTo: pickFirst(fromClick.dateTo, outsideDateTo),
    locked: {
      division: Boolean(outsideDivision) || Boolean(outsideDistrict && divisionFromDistrict),
      district: Boolean(outsideDistrict),
      dateFrom: Boolean(outsideDateFrom),
      dateTo: Boolean(outsideDateTo),
      status: Boolean(outsideStatus),
    },
  }
}

function canonicalizeDistrict(name: string): string | undefined {
  return canonicalMpDistrict(name) || undefined
}

function canonicalizeDivision(name: string): string | undefined {
  const hit = MP_DIVISIONS.find((d) => d.division.toLowerCase() === name.toLowerCase())
  return hit?.division
}

/**
 * Infer modal filter values from a chart/KPI click label and chart title.
 *
 * NEVER set `search` or `status` from chart slice labels.
 * Row filtering for those slices is done in filterRowsForChartClick (with code↔label
 * mapping). Putting "Female"/"Approved"/"Paid"/"SON" into modal search empties the
 * table when rows store F / A / 1 / REL03.
 *
 * Only geography (district/division charts) and trend date ranges are applied here.
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
    }
    return filters
  }

  const looksLikeDistrictChart = /district/i.test(title) && !/division/i.test(title)
  const looksLikePatientStateChart = /patient state/i.test(title)
  const looksLikeDivisionChart = /division/i.test(title) && !/district/i.test(title)

  if (looksLikePatientStateChart) {
    filters.patient_state = name
    filters.division = canonicalizeDivision(name) || name
    return filters
  }

  if (looksLikeDistrictChart) {
    if (!/^others$/i.test(name)) {
      const district = canonicalizeDistrict(name) || name
      filters.district = district
      const div = getDivisionForDistrict(district)
      if (div) filters.division = div
    }
    return filters
  }

  if (looksLikeDivisionChart) {
    if (!/^others$/i.test(name)) {
      filters.division = canonicalizeDivision(name) || name
    }
    return filters
  }

  // All other charts (gender, status, payment, relation, hospital type, …):
  // do not push click labels into modal search/status — chartDrillDown already filtered rows.
  return filters
}
