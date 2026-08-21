import { useMemo, useState } from 'react'
import type { TableColumn } from '../../types'
import ExportDropdown from './ExportDropdown'
import ColumnSelector from './ColumnSelector'
import TablePagination from './TablePagination'
import DateRangeFilter, { rowMatchesDateRange } from './DateRangeFilter'
import { useTableControls } from '../../hooks/useTableControls'
import { Filter } from 'lucide-react'

interface DataTableProps {
  columns: TableColumn[]
  data: Record<string, string | number>[]
  title?: string
  onRowClick?: (row: Record<string, string | number>, index: number) => void
  maxHeight?: string
}

function alignClass(align?: TableColumn['align']) {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

export default function DataTable({ columns, data, title, onRowClick, maxHeight = 'min(70vh, 720px)' }: DataTableProps) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filteredData = useMemo(
    () => data.filter((row) => rowMatchesDateRange(row, dateFrom, dateTo)),
    [data, dateFrom, dateTo]
  )

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
  } = useTableControls(columns, filteredData.length)

  const pageData = paginate(filteredData)
  const exportCols = visibleColumns.map((c) => ({ key: c.key, label: c.label }))

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            <ColumnSelector
              columns={columns}
              visibleKeys={visibleKeys}
              onToggle={toggleColumn}
              onShowAll={showAllColumns}
            />
            <ExportDropdown
              title={title}
              filename={`${title.toLowerCase().replace(/\s+/g, '_')}_export`}
              data={filteredData}
              columns={exportCols}
              buttonSize="sm"
              variant="outline"
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

      {/* Per-table filters */}
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

      <div className="scrollbar-visible overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
        <table className="w-max min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 shadow-sm">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 ${alignClass(col.align)}`}
                >
                  {col.label}
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
                  <td key={col.key} className={`whitespace-nowrap px-4 py-3 text-gray-700 ${alignClass(col.align)}`}>
                    {col.key === 'status' ? (
                      <StatusBadge status={String(row[col.key])} />
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-10 text-center text-slate-400">
                  No records to display.
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
          totalRows={filteredData.length}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setPage}
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
