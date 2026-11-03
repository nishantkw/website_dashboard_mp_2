import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuPos(null)
      return
    }

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = 224
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
      const top = Math.min(rect.bottom + 6, window.innerHeight - 8)
      setMenuPos({ top, left, width })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const resolveSheets = async (): Promise<ExportSheet[] | null> => {
    if (fetchExportSheets) return fetchExportSheets()
    if (sheets?.length) return sheets
    return null
  }

  const resolveRows = async () => {
    if (fetchExportData) return fetchExportData()
    return data
  }

  const runExport = async (fn: (rows: Record<string, any>[]) => void | Promise<void>) => {
    if (busy) return
    setBusy(true)
    try {
      const rows = await resolveRows()
      if (!rows?.length) {
        window.alert('No rows to export.')
        return
      }
      await fn(rows)
    } catch (err) {
      console.error(err)
      window.alert('Export failed. Please try again.')
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
      if (busy) return
      setBusy(true)
      void exportFullPagePDF(title, subtitle)
        .catch((err) => {
          console.error(err)
          window.alert('PDF export failed. Please try again.')
        })
        .finally(() => {
          setBusy(false)
          setOpen(false)
        })
      return
    }
    void runExport(async (rows) => {
      await exportToPDF(title, subtitle, filename, rows, columns)
    })
  }

  const sizeClasses =
    buttonSize === 'sm'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-3.5 py-1.5 text-sm gap-2'

  const variantClasses =
    variant === 'primary'
      ? 'bg-[#2d8a4e] hover:bg-[#1a5c38] text-white shadow-sm font-semibold'
      : variant === 'ghost'
      ? 'text-slate-600 hover:bg-slate-100 font-medium'
      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium shadow-xs'

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          >
            <div className="border-b border-slate-100 px-3 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-green-50 hover:text-[#2d8a4e] disabled:opacity-50"
            >
              <FileCode className="h-4 w-4 shrink-0 text-green-600" />
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold leading-snug">CSV Document</p>
                <p className="text-[10px] leading-relaxed text-slate-400">
                  {sheets?.length || fetchExportSheets
                    ? 'Numbers only — charts cannot go in CSV'
                    : fetchExportData
                      ? 'All matching rows (.csv)'
                      : 'All rows in this table (.csv)'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={busy}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold leading-snug">Excel Spreadsheet</p>
                <p className="text-[10px] leading-relaxed text-slate-400">
                  {includeVisuals
                    ? 'Graphs as pictures + numbers (.xlsx)'
                    : sheets?.length || fetchExportSheets
                      ? 'One sheet per card / graph (.xlsx)'
                      : fetchExportData
                        ? 'All matching rows (.xlsx)'
                        : 'All rows in this table (.xlsx)'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={busy}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              <FileText className="h-4 w-4 shrink-0 text-red-600" />
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold leading-snug">PDF Document</p>
                <p className="text-[10px] leading-relaxed text-slate-400">
                  {fetchExportData
                    ? 'Downloads all matching rows (.pdf)'
                    : 'Downloads all rows in this table (.pdf)'}
                </p>
              </div>
            </button>
          </div>,
          document.body
        )
      : null

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        disabled={busy}
        className={`inline-flex cursor-pointer items-center rounded-lg transition-colors ${sizeClasses} ${variantClasses} disabled:cursor-wait disabled:opacity-70`}
      >
        <Download className="h-3.5 w-3.5" />
        <span>{busy ? 'Preparing…' : 'Export'}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {menu}
    </div>
  )
}
