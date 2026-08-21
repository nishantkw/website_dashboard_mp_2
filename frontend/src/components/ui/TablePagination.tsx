import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TablePaginationProps {
  page: number
  totalPages: number
  totalRows: number
  startIndex: number
  endIndex: number
  onPageChange: (page: number) => void
}

export default function TablePagination({
  page,
  totalPages,
  totalRows,
  startIndex,
  endIndex,
  onPageChange,
}: TablePaginationProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-600">
        Showing{' '}
        <span className="font-semibold text-slate-800">
          {startIndex + 1}–{endIndex}
        </span>{' '}
        of <span className="font-semibold text-slate-800">{totalRows}</span> rows
        <span className="ml-1 text-slate-400">(200 per page)</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        <span className="min-w-[88px] text-center text-xs font-medium text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
