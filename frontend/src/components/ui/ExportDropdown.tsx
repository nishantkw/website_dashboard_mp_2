import { useState, useRef, useEffect } from 'react'
import { Download, FileText, FileSpreadsheet, FileCode, ChevronDown } from 'lucide-react'
import { exportToCSV, exportToExcel, exportToPDF, exportFullPagePDF, type ColumnDef } from '../../utils/exportUtils'

interface ExportDropdownProps {
  title: string
  subtitle?: string
  filename: string
  data: Record<string, any>[]
  columns?: ColumnDef[]
  buttonSize?: 'sm' | 'md'
  variant?: 'outline' | 'primary' | 'ghost'
  isFullPageExport?: boolean
}

export default function ExportDropdown({
  title,
  subtitle = 'Analytics Portal Report',
  filename,
  data,
  columns,
  buttonSize = 'sm',
  variant = 'outline',
  isFullPageExport = false,
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportCSV = () => {
    exportToCSV(filename, data, columns)
    setOpen(false)
  }

  const handleExportExcel = () => {
    exportToExcel(filename, data, columns)
    setOpen(false)
  }

  const handleExportPDF = () => {
    if (isFullPageExport) {
      exportFullPagePDF(title, subtitle)
    } else {
      exportToPDF(title, subtitle, filename, data, columns)
    }
    setOpen(false)
  }

  const sizeClasses =
    buttonSize === 'sm'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-3.5 py-1.5 text-sm gap-2'

  const variantClasses =
    variant === 'primary'
      ? 'bg-[#2d8a4e] hover:bg-[#247a42] text-white shadow-sm font-semibold'
      : variant === 'ghost'
      ? 'text-slate-600 hover:bg-slate-100 font-medium'
      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium shadow-xs'

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center rounded-lg transition-colors cursor-pointer ${sizeClasses} ${variantClasses}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white shadow-xl border border-slate-200 z-[110] py-1.5 animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Download Format
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-green-50 hover:text-[#2d8a4e] transition-colors text-left"
          >
            <FileCode className="w-4 h-4 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold leading-none">CSV Document</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Comma Separated (.csv)</p>
            </div>
          </button>

          <button
            onClick={handleExportExcel}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold leading-none">Excel Spreadsheet</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Microsoft Excel (.xlsx)</p>
            </div>
          </button>

          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <p className="font-semibold leading-none">PDF Document</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Print & Save PDF (.pdf)</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
