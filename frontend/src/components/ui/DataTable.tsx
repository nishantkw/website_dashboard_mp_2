import { useMemo, useState } from 'react'
import type { TableColumn } from '../../types'
import ExportDropdown from './ExportDropdown'
import ColumnSelector from './ColumnSelector'
import TablePagination from './TablePagination'
import DateRangeFilter, { rowMatchesDateRange } from './DateRangeFilter'
import { TABLE_PAGE_SIZE, useTableControls } from '../../hooks/useTableControls'
import { Filter } from 'lucide-react'
import { formatCodedField, isCodedColumn } from '../../utils/beneficiaryCodes'

export interface ServerPagination {
  totalRows: number
  page: number
  pageSize?: number
  onPageChange: (page: number) => void
}

interface DataTableProps {
  columns: TableColumn[]
  data: Record<string, string | number>[]
  title?: string
  onRowClick?: (row: Record<string, string | number>, index: number) => void
  maxHeight?: string
  serverPagination?: ServerPagination
  fetchExportData?: () => Promise<Record<string, any>[]>
}

function alignClass(align?: TableColumn['align']) {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

function isSpecialtyColumn(key: string) {
  return key === 'specialty' || key === 'speciality_code'
}

function displayCellValue(key: string, value: unknown): string {
  if (isCodedColumn(key)) return formatCodedField(key, value)
  return value == null ? '' : String(value)
}

function rowForDisplay(row: Record<string, string | number>): Record<string, string | number> {
  const next = { ...row }
  for (const key of Object.keys(next)) {
    if (isCodedColumn(key)) next[key] = formatCodedField(key, next[key])
  }
  return next
}

function rowHasSpecialtyChoice(row: Record<string, string | number>) {
  return (
    row.specialty_code != null ||
    row.specialty_data != null ||
    row.speciality_code != null ||
    row._specialty_code != null ||
    row._specialty_data != null ||
    row.category_details != null ||
    row.procedure_details != null
  )
}

function specialtyValue(row: Record<string, string | number>, view: 'code' | 'data') {
  if (view === 'code') {
    return String(
      row.specialty_code ?? row._specialty_code ?? row.speciality_code ?? row.specialty ?? ''
    )
  }
  return String(
    row.specialty_data ??
      row._specialty_data ??
      row.category_details ??
      row.CATEGORY_DETAILS ??
      row.category ??
      row.procedure_details ??
      row.specialty ??
      ''
  )
}

export default function DataTable({
  columns,
  data,
  title,
  onRowClick,
  maxHeight = 'min(70vh, 720px)',
  serverPagination,
  fetchExportData,
}: DataTableProps) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [specialtyView, setSpecialtyView] = useState<'code' | 'data'>('code')
  const hasSpecialtyCol = columns.some((c) => isSpecialtyColumn(c.key))
  const canChooseSpecialty = hasSpecialtyCol && data.some(rowHasSpecialtyChoice)
  const pageSize = serverPagination?.pageSize ?? TABLE_PAGE_SIZE

  const filteredData = useMemo(
    () => (serverPagination ? data : data.filter((row) => rowMatchesDateRange(row, dateFrom, dateTo))),
    [data, dateFrom, dateTo, serverPagination]
  )

  const {
    visibleColumns,
    visibleKeys,
    toggleColumn,
    showAllColumns,
    page: clientPage,
    setPage: setClientPage,
    totalPages: clientTotalPages,
    startIndex: clientStart,
    endIndex: clientEnd,
    paginate,
    showPagination: clientShow,
  } = useTableControls(columns, serverPagination ? serverPagination.totalRows : filteredData.length, pageSize)

  const totalRows = serverPagination ? serverPagination.totalRows : filteredData.length
  const page = serverPagination ? serverPagination.page : clientPage
  const totalPages = serverPagination ? Math.max(1, Math.ceil(totalRows / pageSize)) : clientTotalPages
  const startIndex = serverPagination ? (page - 1) * pageSize : clientStart
  const endIndex = serverPagination ? Math.min(startIndex + pageSize, totalRows) : clientEnd
  const pageData = serverPagination ? filteredData : paginate(filteredData)
  const showPagination = serverPagination ? totalRows > pageSize : clientShow
  const onPageChange = serverPagination?.onPageChange ?? setClientPage
  const exportCols = visibleColumns.map((c) => ({ key: c.key, label: c.label }))
  const exportData = useMemo(() => {
    const mapped = canChooseSpecialty
      ? filteredData.map((row) => {
          const shown = specialtyValue(row, specialtyView)
          return rowForDisplay({ ...row, specialty: shown, speciality_code: shown })
        })
      : filteredData.map(rowForDisplay)
    return mapped
  }, [filteredData, canChooseSpecialty, specialtyView])

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {title && (
        <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="min-w-0 break-words text-base font-semibold text-gray-900">{title}</h3>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
            <ColumnSelector
              columns={columns}
              visibleKeys={visibleKeys}
              onToggle={toggleColumn}
              onShowAll={showAllColumns}
            />
            <ExportDropdown
              title={title}
              filename={`${title.toLowerCase().replace(/\s+/g, '_')}_export`}
              data={exportData}
              columns={exportCols}
              buttonSize="sm"
              variant="outline"
              fetchExportData={fetchExportData}
            />
          </div>
        </div>
      )}

      {!title && (
        <div className="flex justify-end border-b border-gray-100 px-4 py-2">
          <ColumnSelector
            columns={columns}
            visibleKeys={visibleKeys}
            onToggle={toggleColumn}
            onShowAll={showAllColumns}
          />
        </div>
      )}

      {!serverPagination && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-slate-50/80 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Filter className="h-3.5 w-3.5 text-[#2d8a4e]" />
            Filters:
          </div>
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
      )}

      <div className="scrollbar-visible overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
        <table className="w-max min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 shadow-sm">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 ${alignClass(col.align)}`}
                >
                  {isSpecialtyColumn(col.key) && canChooseSpecialty ? (
                    <div className="flex flex-col items-start gap-1.5 normal-case">
                      <span className="uppercase tracking-wide">Specialty</span>
                      <label className="flex items-center gap-1.5 font-medium normal-case tracking-normal text-[#1a5c38]">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Choose
                        </span>
                        <select
                          value={specialtyView}
                          onChange={(e) => setSpecialtyView(e.target.value as 'code' | 'data')}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Choose specialty code or specialty data"
                          className="cursor-pointer rounded-md border border-[#c5e0ce] bg-white px-2 py-1 text-[11px] font-semibold normal-case tracking-normal text-[#1a5c38] outline-none focus:border-[#2d8a4e]"
                        >
                          <option value="code">Specialty code</option>
                          <option value="data">Specialty data</option>
                        </select>
                      </label>
                    </div>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr
                key={startIndex + i}
                onClick={() => onRowClick?.(row, startIndex + i)}
                className={`border-b border-gray-50 transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[#e8f5ec] active:bg-[#d4edda]'
                    : 'hover:bg-gray-50'
                }`}
              >
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-gray-700 ${alignClass(col.align)} ${
                      isSpecialtyColumn(col.key) && specialtyView === 'data'
                        ? 'max-w-md whitespace-normal'
                        : 'whitespace-nowrap'
                    }`}
                  >
                    {col.key === 'status' ? (
                      <StatusBadge status={String(row[col.key])} />
                    ) : isSpecialtyColumn(col.key) && canChooseSpecialty ? (
                      specialtyValue(row, specialtyView)
                    ) : (
                      displayCellValue(col.key, row[col.key])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(visibleColumns.length, 1)}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  {visibleColumns.length === 0
                    ? 'No columns available.'
                    : 'No records to display.'}
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
          totalRows={totalRows}
          startIndex={startIndex}
          endIndex={endIndex}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase()
  let color = 'bg-gray-100 text-gray-700'
  if (['paid', 'completed', 'delivered', 'active', 'cleared'].some((s) => lower.includes(s)))
    color = 'bg-green-100 text-green-700'
  else if (['pending', 'in progress', 'under review', 'under investigation', 'under treatment', 'admitted'].some((s) => lower.includes(s)))
    color = 'bg-yellow-100 text-yellow-700'
  else if (['approved', 'printed', 'generated'].some((s) => lower.includes(s)))
    color = 'bg-blue-100 text-blue-700'
  else if (['rejected', 'confirmed', 'de-empanelled', 'inactive', 'confirmed fraud'].some((s) => lower.includes(s)))
    color = 'bg-red-100 text-red-700'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  )
}
