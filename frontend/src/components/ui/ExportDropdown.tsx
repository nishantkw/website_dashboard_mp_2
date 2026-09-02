import { useState, useRef, useEffect } from 'react'
import { Download, FileText, FileSpreadsheet, FileCode, ChevronDown } from 'lucide-react'
import { exportToCSV, exportToExcel, exportToPDF, exportFullPagePDF, exportSheetsToCSV, exportSheetsToExcel, exportSheetsToExcelWithVisuals, type ColumnDef, type ExportSheet } from '../../utils/exportUtils'
import { captureExportVisuals } from '../../utils/chartCapture'

interface ExportDropdownProps {
  title: string
  subtitle?: string
  filename: string
  data: Record<string, any>[]
  columns?: ColumnDef[]
  buttonSize?: 'sm' | 'md'
  variant?: 'outline' | 'primary' | 'ghost'
  isFullPageExport?: boolean
  /** When set, CSV/Excel/PDF fetch this full dataset instead of the current page. */
  fetchExportData?: () => Promise<Record<string, any>[]>
  /** KPI cards + graph series (CSV sections / Excel worksheets). */
  sheets?: ExportSheet[]
  fetchExportSheets?: () => Promise<ExportSheet[]>
  /** Capture on-screen graphs as pictures inside Excel (CSV stays numbers only). */
  includeVisuals?: boolean
  /** Only capture the chart whose data-export-visual matches this title. */
  visualTitle?: string
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
  fetchExportData,
  sheets,
  fetchExportSheets,
  includeVisuals = false,
  visualTitle,
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
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

  const resolveSheets = async (): Promise<ExportSheet[] | null> => {
    if (fetchExportSheets) return fetchExportSheets()
    if (sheets?.length) return sheets
    return null
  }

  const resolveRows = async () => {
    if (fetchExportData) return fetchExportData()
    return data
  }

  const runExport = async (fn: (rows: Record<string, any>[]) => void) => {
    if (busy) return
    setBusy(true)
    try {
      const rows = await resolveRows()
      if (!rows?.length) return
      fn(rows)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  const runSheetExport = async (kind: 'csv' | 'excel') => {
    if (busy) return
    setBusy(true)
    try {
      const nextSheets = await resolveSheets()
      if (nextSheets?.some((s) => s.rows?.length)) {
        if (kind === 'csv') {
          exportSheetsToCSV(filename, nextSheets)
          return
        }
        if (includeVisuals) {
          const visuals = await captureExportVisuals(visualTitle)
          if (visuals.length) {
            await exportSheetsToExcelWithVisuals(filename, title, nextSheets, visuals)
            return
          }
        }
        await exportSheetsToExcel(filename, nextSheets)
        return
      }
      const rows = await resolveRows()
      if (!rows?.length) return
      if (kind === 'csv') {
        exportToCSV(filename, rows, columns)
        return
      }
      if (includeVisuals) {
        const visuals = await captureExportVisuals(visualTitle)
        if (visuals.length) {
          await exportSheetsToExcelWithVisuals(filename, title, [{ name: visualTitle || title, rows, columns }], visuals)
          return
        }
      }
      await exportToExcel(filename, rows, columns)
    } catch (err) {
      console.error(err)
      window.alert(
        kind === 'excel'
          ? 'Excel export failed. Try CSV, or refresh the page and export again.'
          : 'Export failed. Please try again.'
      )
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  const handleExportCSV = () => {
    void runSheetExport('csv')
  }

  const handleExportExcel = () => {
    void runSheetExport('excel')
  }

  const handleExportPDF = () => {
    if (isFullPageExport) {
      exportFullPagePDF(title, subtitle)
      setOpen(false)
      return
    }
    void runExport((rows) => exportToPDF(title, subtitle, filename, rows, columns))
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
        disabled={busy}
        className={`inline-flex items-center rounded-lg transition-colors cursor-pointer ${sizeClasses} ${variantClasses} disabled:cursor-wait disabled:opacity-70`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{busy ? 'Preparing…' : 'Export'}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white shadow-xl border border-slate-200 z-[110] py-1.5 animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {sheets?.length || fetchExportSheets
                ? 'Cards + graphs'
                : fetchExportData
                  ? 'Full dataset'
                  : 'Download Format'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={busy}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-green-50 hover:text-[#2d8a4e] transition-colors text-left disabled:opacity-50"
          >
            <FileCode className="w-4 h-4 text-green-600 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold leading-snug">CSV Document</p>
              <p className="text-[10px] leading-relaxed text-slate-400">
                {sheets?.length || fetchExportSheets
                  ? 'Numbers only — charts cannot go in CSV'
                  : fetchExportData
                    ? 'All matching rows (.csv)'
                    : 'Comma Separated (.csv)'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={busy}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold leading-snug">Excel Spreadsheet</p>
              <p className="text-[10px] leading-relaxed text-slate-400">
                {includeVisuals
                  ? 'Graphs as pictures + numbers (.xlsx)'
                  : sheets?.length || fetchExportSheets
                    ? 'One sheet per card / graph (.xlsx)'
                    : 'Microsoft Excel (.xlsx)'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={busy}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors text-left disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-red-600 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold leading-snug">PDF Document</p>
              <p className="text-[10px] leading-relaxed text-slate-400">Print & Save PDF (.pdf)</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
