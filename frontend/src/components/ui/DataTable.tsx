import type { TableColumn } from '../../types'
import ExportDropdown from './ExportDropdown'

interface DataTableProps {
  columns: TableColumn[]
  data: Record<string, string | number>[]
  title?: string
  onRowClick?: (row: Record<string, string | number>, index: number) => void
}

export default function DataTable({ columns, data, title, onRowClick }: DataTableProps) {
  const exportCols = columns.map((c) => ({ key: c.key, label: c.label }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {title && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <ExportDropdown
            title={title}
            filename={`${title.toLowerCase().replace(/\s+/g, '_')}_export`}
            data={data}
            columns={exportCols}
            buttonSize="sm"
            variant="outline"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold text-gray-600 text-${col.align ?? 'left'}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row, i)}
                className={`border-b border-gray-50 transition-colors ${
                  onRowClick
                    ? 'hover:bg-[#e8f5ec] cursor-pointer active:bg-[#d4edda]'
                    : 'hover:bg-gray-50'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-gray-700 text-${col.align ?? 'left'}`}
                  >
                    {col.key === 'status' ? (
                      <StatusBadge status={String(row[col.key])} />
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  )
}
