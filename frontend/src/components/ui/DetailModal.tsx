import { useState, useMemo } from 'react'
import { X, Search, RotateCcw, Table as TableIcon, Filter, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { getConnectedDataset, type ConnectedDataset } from '../../data/connectedDemoData'
import { useGlobalFilters } from '../../context/FilterContext'
import { DIVISION_OPTIONS, getDistrictsForDivision, getDivisionForDistrict } from '../../data/filterOptions'
import ExportDropdown from './ExportDropdown'
import ColumnSelector from './ColumnSelector'
import TablePagination from './TablePagination'
import DateRangeFilter, { rowMatchesDateRange } from './DateRangeFilter'
import { useTableControls } from '../../hooks/useTableControls'

export interface DrillDownDetail {
  title: string
  subtitle?: string
  data?: Record<string, string | number | undefined>
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

  const dataset: ConnectedDataset | null = useMemo(() => {
    if (!detail) return null
    return getConnectedDataset(detail.title, detail.subtitle)
  }, [detail])

  const dynamicDistricts = useMemo(() => {
    return getDistrictsForDivision(divisionFilter === 'ALL' ? '' : divisionFilter)
  }, [divisionFilter])

  const handleDivisionChange = (divVal: string) => {
    setDivisionFilter(divVal)
    if (divVal !== 'ALL' && districtFilter !== 'ALL') {
      const allowed = getDistrictsForDivision(divVal).map((d) => d.value)
      if (!allowed.includes(districtFilter)) {
        setDistrictFilter('ALL')
      }
    }
  }

  const handleDistrictChange = (distVal: string) => {
    setDistrictFilter(distVal)
    if (distVal !== 'ALL' && divisionFilter === 'ALL') {
      const parentDiv = getDivisionForDistrict(distVal)
      if (parentDiv) {
        setDivisionFilter(parentDiv)
      }
    }
  }

  const filteredRecords = useMemo(() => {
    if (!dataset) return []
    return dataset.records.filter((rec) => {
      const matchSearch = Object.values(rec).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase().trim())
      )

      const recStatus = String(rec.status || rec.ekyc || rec.print_status || '').toLowerCase()
      const matchStatus =
        statusFilter === 'ALL' || recStatus.includes(statusFilter.toLowerCase())

      const recDistrict = String(rec.district || '')
      const recDivision = String(rec.division || getDivisionForDistrict(recDistrict) || '')

      const matchDivision =
        divisionFilter === 'ALL' || recDivision.toLowerCase() === divisionFilter.toLowerCase()

      const matchDistrict =
        districtFilter === 'ALL' || recDistrict.toLowerCase() === districtFilter.toLowerCase()

      const matchDate = rowMatchesDateRange(rec, dateFrom, dateTo)

      return matchSearch && matchStatus && matchDivision && matchDistrict && matchDate
    })
  }, [dataset, searchTerm, statusFilter, divisionFilter, districtFilter, dateFrom, dateTo])

  const {
    visibleColumns,
    visibleKeys,
    toggleColumn,
    showAllColumns,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    paginate,
    showPagination,
  } = useTableControls(dataset?.columns ?? [], filteredRecords.length)

  const pageRecords = paginate(filteredRecords)

  if (!detail || !dataset) return null

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
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
                  {filteredRecords.length} Connected Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {detail.title} — {dataset.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <ColumnSelector
              columns={dataset.columns}
              visibleKeys={visibleKeys}
              onToggle={toggleColumn}
              onShowAll={showAllColumns}
            />
            <ExportDropdown
              title={dataset.title}
              subtitle={dataset.subtitle}
              filename={`${dataset.title.toLowerCase().replace(/\s+/g, '_')}_export`}
              data={filteredRecords}
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

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-[#2d8a4e]" />
              Filters:
            </div>
            <select
              value={divisionFilter}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:border-[#2d8a4e]"
            >
              <option value="ALL">All Divisions</option>
              {DIVISION_OPTIONS.filter((d) => d.value).map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            <select
              value={districtFilter}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:border-[#2d8a4e]"
            >
              {dynamicDistricts.map((d) => (
                <option key={d.value} value={d.value || 'ALL'}>
                  {d.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:border-[#2d8a4e]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Paid">Paid / Settled</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
            </select>

            <DateRangeFilter
              variant="compact"
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChange={(from, to) => {
                setDateFrom(from)
                setDateTo(to)
              }}
            />
          </div>
        </div>

        {/* Tabular View Content Area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th key={col.key} className="px-5 py-3.5">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal text-slate-700">
                  {pageRecords.map((row, idx) => (
                    <tr key={startIndex + idx} className="transition-colors hover:bg-slate-50/80">
                      {visibleColumns.map((col) => {
                      const val = row[col.key]
                      const textVal = String(val ?? '—')

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
                          <td key={col.key} className="px-5 py-3.5">
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
                          <td key={col.key} className="px-5 py-3.5 font-mono text-xs font-bold text-[#1a5c38]">
                            {textVal}
                          </td>
                        )
                      }

                      return (
                        <td key={col.key} className="px-5 py-3.5">
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
            of <span className="font-bold text-slate-800">{filteredRecords.length}</span> connected SQL records
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
