import { useState, useMemo, useEffect } from 'react'
import { X, Search, RotateCcw, Table as TableIcon, Filter, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import type { ConnectedDataset } from '../../data/connectedDemoData'
import { useGlobalFilters } from '../../context/FilterContext'
import { DIVISION_OPTIONS, getDistrictsForDivision, getDivisionForDistrict, resolveDivisionForDistrict, canonicalMpDistrict } from '../../data/filterOptions'
import { districtsMatch, rowMatchesDivision } from '../../utils/geoMatch'
import ExportDropdown from './ExportDropdown'
import ColumnSelector from './ColumnSelector'
import TablePagination from './TablePagination'
import DateRangeFilter, { rowMatchesDateRange } from './DateRangeFilter'
import { useTableControls } from '../../hooks/useTableControls'
import type { TableColumn } from '../../types'
import { preferPatientGeoOrder } from '../../utils/schemaColumns'
import { formatCodedField, isCodedColumn, labelCardStatus, labelEnrlStatus, labelGender, labelAadhaarStatus, labelRelation, labelSourceType } from '../../utils/beneficiaryCodes'
import { labelRuralUrban } from '../../utils/ruralUrban'
import { HospitalColumnHeader, HospitalStatusCell, isHospitalStatusColumn } from './HospitalStatusCells'
import MoneyColumnHeader from './MoneyColumnHeader'
import { formatMoneyValue, formatRowMoney, isAmountColumn, type MoneyNotation } from '../../utils/moneyFormat'

export interface DrillDownDetail {
  title: string
  subtitle?: string
  data?: Record<string, string | number | undefined>
  records?: Record<string, string | number>[]
  columns?: TableColumn[]
  datasetTitle?: string
  source?: 'api' | 'demo'
  loading?: boolean
  /** Pre-select modal filters from chart/KPI click / page filters. */
  appliedFilters?: {
    division?: string
    district?: string
    patient_state?: string
    status?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    locked?: {
      division?: boolean
      district?: boolean
      dateFrom?: boolean
      dateTo?: boolean
      status?: boolean
    }
  }
}

const DIVISION_FIELDS = ['division', '_division']
const PATIENT_STATE_FIELDS = ['patient_state_name', '_patient_state']
const PATIENT_DISTRICT_FIELDS = ['patient_district_name', '_patient_district']

const DISTRICT_FIELDS = [
  'patient_district_name',
  '_patient_district',
  '_district',
  'district',
  'district_name',
  'dist_name',
  'hosp_district_name',
  'sub_district_name',
  'district_cd',
  'subdistrict_town',
]

const STATUS_FIELDS = [
  'status',
  'case_status',
  'enrl_status',
  'card_print_status',
  'card_status',
  'print_status',
  'ekyc',
  'active_status',
  'ab_pmjay_status',
  'abdm_status',
  'investigation_status',
  'hosp_status_desc',
  'user_status',
  'patient_status',
  'deempanel_status',
  'status_descrption',
  'accreditation_status',
]

function columnLabel(key: string): string {
  if (key === 'division' || key === '_division') return 'Division'
  if (key === 'patient_district_name') return 'District'
  if (key === 'hosp_status_desc') return 'Empanelment Status'
  if (key === 'active_status') return 'Currently Serving'
  if (key === 'empaneled_date' || key === 'hosp_empaneled_date') return 'Empaneled On'
  if (key === 'deempanel_date' || key === 'deempaneled_date') return 'De-empanelment Date'
  if (key === 'deempanel_status') return 'De-empanelment Status'
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function rowField(row: Record<string, string | number>, fields: string[]): string {
  for (const key of fields) {
    const val = row[key]
    if (val != null && String(val).trim() !== '') return String(val)
  }
  return ''
}

interface DetailModalProps {
  detail: DrillDownDetail | null
  onClose: () => void
}

export default function DetailModal({ detail, onClose }: DetailModalProps) {
  const { clearGlobalFilters } = useGlobalFilters()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [divisionFilter, setDivisionFilter] = useState('ALL')
  const [districtFilter, setDistrictFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [moneyNotation, setMoneyNotation] = useState<MoneyNotation>('indian')

  useEffect(() => {
    if (!detail || detail.loading) return

    const applied = detail.appliedFilters
    const rawDistrict = applied?.district?.trim() || ''
    const district = (rawDistrict && (canonicalMpDistrict(rawDistrict) || rawDistrict)) || ''
    // Prefer explicit division from filters; fall back to parent of district.
    // patient_state is only used when no division/district parent is available (TMS geo).
    const division =
      applied?.division?.trim() ||
      (district ? getDivisionForDistrict(district) : '') ||
      applied?.patient_state?.trim() ||
      ''

    setSearchTerm(applied?.search ?? '')
    setStatusFilter(applied?.status ?? 'ALL')
    setDivisionFilter(division || 'ALL')
    setDistrictFilter(district || 'ALL')
    setDateFrom(applied?.dateFrom ?? '')
    setDateTo(applied?.dateTo ?? '')
  }, [detail?.title, detail?.subtitle, detail?.records, detail?.loading, detail?.appliedFilters])

  const lockedFilters = detail?.appliedFilters?.locked ?? {}
  const divisionLocked = Boolean(lockedFilters.division)
  const districtLocked = Boolean(lockedFilters.district)
  const statusLocked = Boolean(lockedFilters.status)
  const datesLocked = Boolean(lockedFilters.dateFrom || lockedFilters.dateTo)

  const dataset: ConnectedDataset | null = useMemo(() => {
    if (!detail || detail.loading) return null
    if (Array.isArray(detail.records)) {
      const records = detail.records
      const fromDetail = (detail.columns ?? [])
        .filter((c) => c?.key)
        .map((c) => ({ key: c.key, label: c.label || columnLabel(c.key) }))
      const columns = fromDetail.length
        ? fromDetail
        : records[0]
          ? preferPatientGeoOrder(Object.keys(records[0])).map((key) => ({
              key,
              label: columnLabel(key),
            }))
          : []
      return {
        title: detail.datasetTitle ?? detail.subtitle ?? 'Filtered Records',
        subtitle: detail.subtitle
          ? `${detail.title} · ${detail.subtitle}`
          : detail.title,
        columns,
        records,
      }
    }
    // Single-row payload from live click — never fall back to hardcoded demo datasets
    if (detail.data && Object.keys(detail.data).length > 0) {
      const row = detail.data as Record<string, string | number>
      const keys = Object.keys(row)
      return {
        title: detail.datasetTitle ?? detail.title,
        subtitle: detail.subtitle ?? 'Record detail',
        columns: preferPatientGeoOrder(keys).map((key) => ({
          key,
          label: columnLabel(key),
        })),
        records: [row],
      }
    }
    return {
      title: detail.title,
      subtitle: detail.subtitle ?? 'No backend records for this selection',
      columns: [],
      records: [],
    }
  }, [detail])

  const usesPatientGeo = useMemo(() => {
    if (!dataset) return false
    return (
      dataset.columns.some((c) => c.key === 'patient_state_name' || c.key === 'patient_district_name') ||
      dataset.records.some((r) => r.patient_state_name != null || r.patient_district_name != null)
    )
  }, [dataset])

  /** Only show Division / District when the opened dataset actually has those fields (or district → division). */
  const showDivisionFilter = useMemo(() => {
    if (!dataset) return false
    const keys = new Set(dataset.columns.map((c) => c.key))
    if (DIVISION_FIELDS.some((k) => keys.has(k)) || PATIENT_STATE_FIELDS.some((k) => keys.has(k))) {
      return true
    }
    // Hospital master has district_name but no division column — still allow division filter.
    if (DISTRICT_FIELDS.some((k) => keys.has(k)) || PATIENT_DISTRICT_FIELDS.some((k) => keys.has(k))) {
      return true
    }
    return dataset.records.some((r) =>
      Boolean(rowField(r, [...DIVISION_FIELDS, ...PATIENT_STATE_FIELDS, ...DISTRICT_FIELDS, ...PATIENT_DISTRICT_FIELDS]))
    )
  }, [dataset])

  const showDistrictFilter = useMemo(() => {
    if (!dataset) return false
    const keys = new Set(dataset.columns.map((c) => c.key))
    if (DISTRICT_FIELDS.some((k) => keys.has(k)) || PATIENT_DISTRICT_FIELDS.some((k) => keys.has(k))) {
      return true
    }
    return dataset.records.some((r) => Boolean(rowField(r, [...PATIENT_DISTRICT_FIELDS, ...DISTRICT_FIELDS])))
  }, [dataset])

  // Drop geo filters when the dataset has no division/district columns (e.g. payment_dtls).
  useEffect(() => {
    if (!dataset || detail?.loading) return
    if (!showDivisionFilter && divisionFilter !== 'ALL') setDivisionFilter('ALL')
    if (!showDistrictFilter && districtFilter !== 'ALL') setDistrictFilter('ALL')
  }, [dataset, detail?.loading, showDivisionFilter, showDistrictFilter, divisionFilter, districtFilter])

  const statusOptions = useMemo(() => {
    if (!dataset?.records.length) return []
    const names = new Set<string>()
    const hasStatusColumn = dataset.columns.some((c) => STATUS_FIELDS.includes(c.key))
    for (const rec of dataset.records) {
      const status = rowField(rec, STATUS_FIELDS)
      if (status) names.add(status)
    }
    if (!names.size && !hasStatusColumn) return []
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [dataset])

  const showStatusFilter = statusOptions.length > 0

  const patientStateOptions = useMemo(() => {
    if (!dataset) return []
    const names = new Set<string>()
    for (const rec of dataset.records) {
      const mapped =
        rowField(rec, DIVISION_FIELDS) || getDivisionForDistrict(rowField(rec, PATIENT_DISTRICT_FIELDS) || rowField(rec, DISTRICT_FIELDS))
      if (mapped) names.add(mapped)
    }
    if (divisionFilter !== 'ALL') names.add(divisionFilter)
    if (names.size) return [...names].sort((a, b) => a.localeCompare(b))
    return []
  }, [dataset, divisionFilter])

  const dynamicDistricts = useMemo(() => {
    const canon = (name: string) => canonicalMpDistrict(name) || name
    let options: { value: string; label: string }[]

    if (usesPatientGeo && dataset) {
      const names = new Set<string>()
      for (const rec of dataset.records) {
        if (divisionFilter !== 'ALL') {
          const mapped =
            rowField(rec, DIVISION_FIELDS) ||
            getDivisionForDistrict(rowField(rec, PATIENT_DISTRICT_FIELDS) || rowField(rec, DISTRICT_FIELDS))
          if ((mapped || '').toLowerCase() !== divisionFilter.toLowerCase()) continue
        }
        const name = rowField(rec, PATIENT_DISTRICT_FIELDS) || rowField(rec, DISTRICT_FIELDS)
        if (name) names.add(canon(name))
      }
      options = [
        { value: 'ALL', label: 'All Districts' },
        ...[...names].sort((a, b) => a.localeCompare(b)).map((d) => ({ value: d, label: d })),
      ]
    } else {
      options = getDistrictsForDivision(divisionFilter === 'ALL' ? '' : divisionFilter).map((d) => ({
        value: d.value || 'ALL',
        label: d.label,
      }))
    }

    // Keep the applied district visible even if casing/source list differs
    if (
      districtFilter !== 'ALL' &&
      !options.some((o) => o.value.toLowerCase() === districtFilter.toLowerCase())
    ) {
      options = [...options, { value: districtFilter, label: districtFilter }]
    }

    return options
  }, [dataset, usesPatientGeo, divisionFilter, districtFilter])

  const districtSelectValue = useMemo(() => {
    if (districtFilter === 'ALL') return 'ALL'
    const hit = dynamicDistricts.find(
      (o) => o.value.toLowerCase() === districtFilter.toLowerCase()
    )
    return hit?.value ?? districtFilter
  }, [districtFilter, dynamicDistricts])

  const divisionSelectValue = useMemo(() => {
    if (divisionFilter === 'ALL') return 'ALL'
    const opts = usesPatientGeo
      ? patientStateOptions
      : DIVISION_OPTIONS.filter((d) => d.value).map((d) => d.value)
    const hit = opts.find((v) => v.toLowerCase() === divisionFilter.toLowerCase())
    return hit ?? divisionFilter
  }, [divisionFilter, usesPatientGeo, patientStateOptions])

  const handleDivisionChange = (divVal: string) => {
    setDivisionFilter(divVal)
    if (divVal === 'ALL') return
    if (districtFilter !== 'ALL') {
      const allowed = getDistrictsForDivision(divVal).map((d) => d.value)
      const stillValid = allowed.some((d) => d.toLowerCase() === districtFilter.toLowerCase())
      if (!stillValid) setDistrictFilter('ALL')
    }
  }

  const handleDistrictChange = (distVal: string) => {
    if (distVal === 'ALL' || !distVal) {
      setDistrictFilter('ALL')
      return
    }
    const canonical = canonicalMpDistrict(distVal) || distVal
    setDistrictFilter(canonical)
    const parentDiv = getDivisionForDistrict(canonical)
    if (parentDiv) setDivisionFilter(parentDiv)
  }

  const filteredRecords = useMemo(() => {
    if (!dataset) return []
    return dataset.records.filter((rec) => {
      const q = searchTerm.toLowerCase().trim()
      const matchSearch =
        !q ||
        Object.entries(rec).some(([key, val]) => {
          const raw = String(val ?? '').toLowerCase()
          if (raw.includes(q)) return true
          // Also match against display labels so "Female" finds F, "Approved" finds A, etc.
          const labelled = [
            labelGender(val),
            labelEnrlStatus(val),
            labelCardStatus(val),
            labelAadhaarStatus(val),
            labelRelation(val),
            labelSourceType(val),
            labelRuralUrban(val),
            isCodedColumn(key) ? formatCodedField(key, val) : '',
          ]
            .join(' ')
            .toLowerCase()
          return labelled.includes(q)
        })

      const rawStatus = rowField(rec, STATUS_FIELDS)
      const wantStatus = statusFilter.toLowerCase()
      const statusCandidates = [
        rawStatus,
        labelEnrlStatus(rec.enrl_status ?? rawStatus),
        labelCardStatus(rec.card_status ?? rec.card_print_status ?? rawStatus),
        labelAadhaarStatus(rec.aadhar_status ?? rec.aadhaar_status ?? rawStatus),
        String(rec.case_status ?? ''),
        String(rec.investigation_status ?? ''),
        String(rec.status_descrption ?? rec.status_description ?? ''),
      ]
        .map((s) => String(s ?? '').trim().toLowerCase())
        .filter(Boolean)
      const matchStatus =
        !showStatusFilter ||
        statusFilter === 'ALL' ||
        statusCandidates.some((s) => s === wantStatus || s.includes(wantStatus) || wantStatus.includes(s))

      const recDistrict = usesPatientGeo
        ? rowField(rec, PATIENT_DISTRICT_FIELDS) || rowField(rec, DISTRICT_FIELDS)
        : rowField(rec, DISTRICT_FIELDS)
      const recDivision =
        rowField(rec, DIVISION_FIELDS) ||
        resolveDivisionForDistrict(recDistrict) ||
        (usesPatientGeo ? rowField(rec, PATIENT_STATE_FIELDS) : '')

      const matchDivision =
        !showDivisionFilter ||
        divisionFilter === 'ALL' ||
        (/^unknown$/i.test(divisionFilter)
          ? resolveDivisionForDistrict(recDistrict) === 'Unknown'
          : rowMatchesDivision(recDistrict, divisionFilter) ||
            (!!recDivision && recDivision.toLowerCase() === divisionFilter.toLowerCase()))

      const matchDistrict =
        !showDistrictFilter ||
        districtFilter === 'ALL' ||
        (/^unknown$/i.test(districtFilter)
          ? !String(recDistrict ?? '').trim() || /^unknown$/i.test(String(recDistrict))
          : !recDistrict || districtsMatch(recDistrict, districtFilter))

      const matchDate = rowMatchesDateRange(rec, dateFrom, dateTo)

      return matchSearch && matchStatus && matchDivision && matchDistrict && matchDate
    })
  }, [
    dataset,
    searchTerm,
    statusFilter,
    divisionFilter,
    districtFilter,
    dateFrom,
    dateTo,
    usesPatientGeo,
    showStatusFilter,
    showDivisionFilter,
    showDistrictFilter,
  ])

  const {
    visibleColumns,
    visibleKeys,
    toggleColumn,
    selectColumns,
    deselectColumns,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    paginate,
    showPagination,
  } = useTableControls(dataset?.columns ?? [], filteredRecords.length)

  const pageRecords = paginate(filteredRecords)
  const hasAmountCol = (dataset?.columns ?? []).some((c) => isAmountColumn(c.key, c.label))
  const exportRecords = useMemo(
    () =>
      filteredRecords.map((row) => formatRowMoney(row, moneyNotation, dataset?.columns)),
    [filteredRecords, moneyNotation, dataset?.columns]
  )

  if (!detail) return null

  if (detail.loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-10 py-8 shadow-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-[#2d8a4e]" />
          <p className="text-sm font-medium text-slate-600">Loading records from backend…</p>
        </div>
      </div>
    )
  }

  if (!dataset) return null

  const isLive = detail.source === 'api'

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setDivisionFilter('ALL')
    setDistrictFilter('ALL')
    setDateFrom('')
    setDateTo('')
    clearGlobalFilters()
  }

  const handleClearAndClose = () => {
    handleClearFilters()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#eaf5ed] via-white to-white gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2d8a4e]/10 flex items-center justify-center text-[#2d8a4e] shrink-0">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{dataset.title}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#2d8a4e]/10 text-[#2d8a4e] border border-[#2d8a4e]/20">
                  {filteredRecords.length} {isLive ? 'Live Records' : 'Connected Records'}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {dataset.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <ColumnSelector
              columns={dataset.columns}
              visibleKeys={visibleKeys}
              onToggle={toggleColumn}
              onSelectKeys={selectColumns}
              onDeselectKeys={deselectColumns}
            />
            <ExportDropdown
              title={dataset.title}
              subtitle={dataset.subtitle}
              filename={`${dataset.title.toLowerCase().replace(/\s+/g, '_')}_export`}
              data={exportRecords}
              columns={visibleColumns}
              buttonSize="sm"
              variant="primary"
            />
            <button
              onClick={handleClearFilters}
              title="Reset all filters & selections"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#2d8a4e]" />
              Clear Filters
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters Bar inside Modal */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, hospital..."
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e] bg-white text-slate-800"
            />
          </div>

          <div className="scrollbar-visible flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-[#2d8a4e]" />
              Filters:
            </div>
            {showDivisionFilter && (
              <select
                value={divisionSelectValue}
                onChange={(e) => handleDivisionChange(e.target.value)}
                disabled={divisionLocked}
                title={divisionLocked ? 'Set from page filters' : undefined}
                className={
                  divisionLocked
                    ? 'cursor-not-allowed text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-100 text-slate-600 outline-none'
                    : 'text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:border-[#2d8a4e]'
                }
              >
                <option value="ALL">All Divisions</option>
                {(usesPatientGeo ? patientStateOptions.map((name) => ({ value: name, label: name })) : DIVISION_OPTIONS.filter((d) => d.value)).map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            )}

            {showDistrictFilter && (
              <select
                value={districtSelectValue}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={districtLocked}
                title={districtLocked ? 'Set from page filters' : undefined}
                className={
                  districtLocked
                    ? 'cursor-not-allowed text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-100 text-slate-600 outline-none'
                    : 'text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:border-[#2d8a4e]'
                }
              >
                {dynamicDistricts.map((d) => (
                  <option key={d.value || 'ALL'} value={d.value || 'ALL'}>
                    {d.label}
                  </option>
                ))}
              </select>
            )}

            {showStatusFilter && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={statusLocked}
                title={statusLocked ? 'Set from page filters' : undefined}
                className={
                  statusLocked
                    ? 'cursor-not-allowed text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-100 text-slate-600 outline-none'
                    : 'text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:border-[#2d8a4e]'
                }
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            )}

            <DateRangeFilter
              variant="compact"
              dateFrom={dateFrom}
              dateTo={dateTo}
              disabled={datesLocked}
              onChange={(from, to) => {
                if (datesLocked) return
                setDateFrom(from)
                setDateTo(to)
              }}
            />
          </div>
        </div>

        {/* Tabular View Content Area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="scrollbar-visible min-h-0 flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th key={col.key} className="whitespace-nowrap px-3 py-2.5">
                        {hasAmountCol && isAmountColumn(col.key, col.label) ? (
                          <MoneyColumnHeader
                            label={col.label}
                            notation={moneyNotation}
                            onChange={setMoneyNotation}
                          />
                        ) : (
                          <HospitalColumnHeader columnKey={col.key} label={col.label} />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal text-slate-700">
                  {pageRecords.map((row, idx) => (
                    <tr key={startIndex + idx} className="transition-colors hover:bg-slate-50/80">
                      {visibleColumns.map((col) => {
                      const val = row[col.key]
                      const textVal = isAmountColumn(col.key, col.label)
                        ? formatMoneyValue(val, moneyNotation) || '—'
                        : isCodedColumn(col.key)
                        ? formatCodedField(col.key, val) || '—'
                        : String(val ?? '—')

                      if (isHospitalStatusColumn(col.key)) {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-3 py-2.5">
                            <HospitalStatusCell columnKey={col.key} value={val} row={row} />
                          </td>
                        )
                      }

                      if (isAmountColumn(col.key, col.label)) {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                            {formatMoneyValue(val, moneyNotation) || '—'}
                          </td>
                        )
                      }

                      // Badge formatting for status-like fields
                      if (col.key === 'status' || col.key === 'ekyc' || col.key === 'print_status') {
                        const isGood =
                          textVal.includes('Active') ||
                          textVal.includes('Paid') ||
                          textVal.includes('Completed') ||
                          textVal.includes('Settled') ||
                          textVal.includes('Printed')
                        const isWarn =
                          textVal.includes('Pending') ||
                          textVal.includes('Approved') ||
                          textVal.includes('Review')
                        return (
                          <td key={col.key} className="whitespace-nowrap px-3 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isGood
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : isWarn
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {isGood && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                              {isWarn && <AlertCircle className="w-3 h-3 text-amber-600" />}
                              {!isGood && !isWarn && <XCircle className="w-3 h-3 text-red-600" />}
                              {textVal}
                            </span>
                          </td>
                        )
                      }

                      // Primary Key / ID formatting
                      if (col.key.endsWith('_id') || col.key === 'code' || col.key === 'txn_id' || col.key === 'batch_id') {
                        return (
                          <td key={col.key} className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-bold text-[#1a5c38]">
                            {textVal}
                          </td>
                        )
                      }

                      return (
                        <td key={col.key} className="max-w-[22rem] px-3 py-2.5 break-words">
                          {textVal}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={visibleColumns.length} className="py-10 text-center text-slate-400">
                      No connected records match your search and filter criteria.
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>

            {showPagination && (
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalRows={filteredRecords.length}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
              />
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-xs font-medium text-slate-500">
            Showing{' '}
            <span className="font-bold text-slate-800">
              {filteredRecords.length === 0 ? 0 : startIndex + 1}–{endIndex}
            </span>{' '}
            of <span className="font-bold text-slate-800">{filteredRecords.length}</span>{' '}
            {isLive ? 'backend records' : 'connected SQL records'}
            {showPagination && <span className="text-slate-400"> · 200 per page</span>}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAndClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#2d8a4e] hover:bg-[#247a42] text-white transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Selection & Reset
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 transition-colors border border-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
