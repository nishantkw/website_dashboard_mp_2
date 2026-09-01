import { useState, useRef, useEffect, useMemo, type ChangeEvent } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  Database,
  AlertTriangle,
  ChevronDown,
  Loader2,
  Trash2,
  CheckCircle2,
  Search,
} from 'lucide-react'
import {
  fetchImportTables,
  fetchImportUploads,
  fetchImportUpload,
  fetchImportUploadRows,
  fetchImportUploadRowFilters,
  uploadImportFile,
  updateImportUpload,
  commitImportUpload,
  deleteImportUpload,
  type ImportTableDef,
  type ImportUploadSummary,
  type ImportUploadDetail,
  type DuplicateRowReport,
} from '../../api/endpoints'
import { applyMapping, labelizeColumn } from '../../utils/importCsv'
import SearchableSelect from '../../components/ui/SearchableSelect'
import TablePagination from '../../components/ui/TablePagination'

const EXTRACT_PAGE_SIZE = 50

function formatBytes(n: number) {
  if (!n) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function statusLabel(status: string) {
  if (status === 'imported') return { text: 'In database', cls: 'bg-green-100 text-green-800' }
  if (status === 'imported_with_errors') return { text: 'Imported with errors', cls: 'bg-amber-100 text-amber-800' }
  return { text: 'Extracted', cls: 'bg-emerald-100 text-emerald-800' }
}

function fileLabel(file: { displayName?: string; fileName: string }) {
  return file.displayName || file.fileName.replace(/\.[^.]+$/, '') || file.fileName
}

function displayTitle(file: {
  displayName?: string
  fileName: string
  tableId?: string | null
  status: string
  source?: string
  filesPurged?: boolean
}) {
  if (isDbEntry(file) && file.tableId) return file.tableId
  return fileLabel(file)
}

function isDbEntry(file: { status: string; source?: string; filesPurged?: boolean }) {
  return file.source === 'database' || file.filesPurged || file.status === 'imported' || file.status === 'imported_with_errors'
}

function DuplicateRowsPanel({
  title,
  subtitle,
  headers,
  items,
}: {
  title: string
  subtitle: string
  headers: string[]
  items: DuplicateRowReport[]
}) {
  if (!items.length) return null
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      <div className="border-b border-amber-100 bg-amber-50 px-5 py-3">
        <h4 className="text-sm font-bold text-amber-950">{title}</h4>
        <p className="mt-1 text-xs text-amber-800">{subtitle}</p>
      </div>
      <div className="scrollbar-visible overflow-x-auto p-4">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-slate-600">
            <tr>
              <th className="px-2 py-2">File row</th>
              <th className="px-3 py-2">Every field?</th>
              <th className="px-3 py-2">Same as row</th>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={`${item.fileRow}-${idx}`} className="hover:bg-slate-50">
                <td className="px-2 py-2 text-slate-500">{item.fileRow}</td>
                <td className="px-3 py-2">
                  {item.everyFieldDuplicate ? (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-800">
                      Yes — identical
                    </span>
                  ) : (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                      No — {item.differingFields.join(', ') || 'fields differ'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-500">#{item.keptFileRow}</td>
                {headers.map((h) => (
                  <td
                    key={h}
                    className={`max-w-[220px] truncate whitespace-nowrap px-3 py-2 font-medium ${
                      item.differingFields.includes(h) ? 'bg-amber-50 text-amber-900' : 'text-slate-800'
                    }`}
                  >
                    {String(item.row[h] ?? '—')}
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

export default function ImportBulkData() {
  const [tables, setTables] = useState<ImportTableDef[]>([])
  const [byModule, setByModule] = useState<{ module: string; moduleLabel: string; tables: ImportTableDef[] }[]>([])
  const [tablesLoading, setTablesLoading] = useState(true)
  const [tablesError, setTablesError] = useState('')
  const [uploads, setUploads] = useState<ImportUploadSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ImportUploadDetail | null>(null)
  const [extractRows, setExtractRows] = useState<Record<string, string>[]>([])
  const [extractHeaders, setExtractHeaders] = useState<string[]>([])
  const [extractTotal, setExtractTotal] = useState(0)
  const [extractFileTotal, setExtractFileTotal] = useState(0)
  const [extractPage, setExtractPage] = useState(1)
  const [extractSearchInput, setExtractSearchInput] = useState('')
  const [extractSearch, setExtractSearch] = useState('')
  const [extractHospId, setExtractHospId] = useState('')
  const [extractFacilityId, setExtractFacilityId] = useState('')
  const [hospIdOptions, setHospIdOptions] = useState<{ value: string; label: string }[]>([])
  const [facilityIdOptions, setFacilityIdOptions] = useState<{ value: string; label: string }[]>([])
  const [extractLoading, setExtractLoading] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState('')
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [pageError, setPageError] = useState('')
  const [importResult, setImportResult] = useState<{
    ok: boolean
    inserted: number
    skipped: number
    skippedFile?: number
    skippedExisting?: number
    updated?: number
    uniqueKey?: string[]
    total: number
    columnsUsed?: string[]
    errors: { row: number; message: string }[]
    message?: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) ?? null,
    [tables, selectedTableId]
  )

  const mappedRows = useMemo(() => applyMapping(extractRows, mapping), [extractRows, mapping])
  const tableColumns = useMemo(
    () => (extractHeaders.length ? extractHeaders : detail?.headers || []),
    [extractHeaders, detail]
  )
  const mappedColumnKeys = useMemo(
    () => [...new Set(Object.values(mapping).filter(Boolean))],
    [mapping]
  )
  const unmappedHeaders = useMemo(() => {
    if (!detail) return []
    return (detail.headers || []).filter((h) => !mapping[h])
  }, [detail, mapping])

  const extractTotalPages = Math.max(1, Math.ceil(extractTotal / EXTRACT_PAGE_SIZE))
  const extractStartIndex = (Math.min(extractPage, extractTotalPages) - 1) * EXTRACT_PAGE_SIZE

  const loadTables = async () => {
    setTablesLoading(true)
    const res = await fetchImportTables()
    if (!res.ok) {
      setTablesError(res.error)
      setTablesLoading(false)
      return
    }
    setTables(res.data.tables)
    setByModule(res.data.byModule ?? [])
    if (res.data.tables.length && !selectedTableId) setSelectedTableId(res.data.tables[0].id)
    setTablesLoading(false)
  }

  const loadUploads = async (preferId?: string) => {
    const res = await fetchImportUploads()
    if (!res.ok) {
      setPageError(res.error)
      return
    }
    setUploads(res.data.uploads)
    const nextId = preferId || selectedId
    if (nextId && res.data.uploads.some((u) => u.id === nextId)) {
      setSelectedId(nextId)
    } else if (!selectedId && res.data.uploads[0]) {
      setSelectedId(res.data.uploads[0].id)
    }
  }

  useEffect(() => {
    loadTables()
    loadUploads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setExtractRows([])
      setExtractHeaders([])
      setExtractTotal(0)
      setExtractFileTotal(0)
      setHospIdOptions([])
      setFacilityIdOptions([])
      return
    }
    let cancelled = false
    setExtractPage(1)
    setExtractSearchInput('')
    setExtractSearch('')
    setExtractHospId('')
    setExtractFacilityId('')
    ;(async () => {
      setIsLoadingDetail(true)
      setImportResult(null)
      setPageError('')
      const [meta, filters] = await Promise.all([
        fetchImportUpload(selectedId),
        fetchImportUploadRowFilters(selectedId),
      ])
      if (cancelled) return
      if (!meta.ok) {
        setPageError(meta.error)
        setIsLoadingDetail(false)
        return
      }
      setDetail(meta.data.upload)
      setMapping(meta.data.upload.mapping || {})
      setExtractHeaders(meta.data.upload.headers || [])
      // Do not overwrite the next-upload target when opening a table already in the database.
      if (meta.data.upload.tableId && !isDbEntry(meta.data.upload)) {
        setSelectedTableId(meta.data.upload.tableId)
      }
      if (filters.ok) {
        setHospIdOptions((filters.data.hospIds || []).map((id) => ({ value: id, label: id })))
        setFacilityIdOptions((filters.data.facilityIds || []).map((id) => ({ value: id, label: id })))
      } else {
        setHospIdOptions([])
        setFacilityIdOptions([])
      }
      setIsLoadingDetail(false)
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  useEffect(() => {
    const t = window.setTimeout(() => setExtractSearch(extractSearchInput.trim()), 300)
    return () => window.clearTimeout(t)
  }, [extractSearchInput])

  useEffect(() => {
    setExtractPage(1)
  }, [extractSearch, extractHospId, extractFacilityId])

  useEffect(() => {
    if (!selectedId || !detail || detail.id !== selectedId) return
    let cancelled = false
    ;(async () => {
      setExtractLoading(true)
      const rows = await fetchImportUploadRows(selectedId, (extractPage - 1) * EXTRACT_PAGE_SIZE, EXTRACT_PAGE_SIZE, {
        search: extractSearch,
        hospId: extractHospId,
        facilityId: extractFacilityId,
      })
      if (cancelled) return
      if (rows.ok) {
        setExtractRows(rows.data.rows)
        setExtractTotal(rows.data.total)
        setExtractFileTotal(rows.data.fileTotal ?? rows.data.total)
        if (rows.data.headers?.length) setExtractHeaders(rows.data.headers)
      }
      setExtractLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId, detail, extractPage, extractSearch, extractHospId, extractFacilityId])

  const handleTableChange = async (tableId: string) => {
    setSelectedTableId(tableId)
    if (!detail || isDbEntry(detail)) return
    const res = await updateImportUpload(detail.id, { tableId })
    if (res.ok) {
      setMapping(res.data.upload.mapping || {})
      setDetail(res.data.upload)
    }
  }

  const processUpload = async (file: File) => {
    setIsUploading(true)
    setPageError('')
    setImportResult(null)
    const res = await uploadImportFile(file, selectedTableId || undefined)
    setIsUploading(false)
    if (!res.ok) {
      setPageError(res.error)
      return
    }
    await loadUploads(res.data.upload.id)
    setSelectedId(res.data.upload.id)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) processUpload(file)
  }

  const handleImport = async () => {
    if (!detail || !selectedTableId || mappedColumnKeys.length === 0) return
    setIsImporting(true)
    setImportResult(null)
    const res = await commitImportUpload(detail.id, {
      tableId: selectedTableId,
      mapping,
    })
    setIsImporting(false)
    if (!res.ok) {
      setImportResult({
        ok: false,
        inserted: 0,
        skipped: 0,
        total: extractTotal,
        errors: [],
        message: res.error,
      })
      return
    }
    setImportResult({
      ok: res.data.ok,
      inserted: res.data.inserted,
      skipped: res.data.skipped,
      skippedFile: res.data.skippedFile,
      skippedExisting: res.data.skippedExisting,
      updated: res.data.updated,
      uniqueKey: res.data.uniqueKey,
      total: res.data.total,
      columnsUsed: res.data.columnsUsed,
      errors: res.data.errors,
      message: res.data.ok
        ? `Imported ${res.data.inserted} new row(s) into ${res.data.tableId}. File removed; list now shows table “${res.data.displayName || displayTitle(detail)}”.`
        : 'Import completed with errors',
    })
    await loadUploads(detail.id)
    const meta = await fetchImportUpload(detail.id)
    if (meta.ok) {
      setDetail(meta.data.upload)
      if (meta.data.upload.tableId) setSelectedTableId(meta.data.upload.tableId)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteImportUpload(id)
    if (!res.ok) {
      setPageError(res.error)
      return
    }
    if (selectedId === id) {
      setSelectedId(null)
      setDetail(null)
    }
    await loadUploads()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-[#2d8a4e]/10 p-2 text-[#2d8a4e]">
              <Database className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800">Import Bulk Data</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Upload CSV or Excel, review the extracted rows, then import into the matching database table.
            After import the file is removed from disk and this list keeps the table (named after the file).
          </p>
        </div>
      </div>

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>
      )}

      <div className="rounded-2xl border border-[#b8dcc4] bg-white p-5 shadow-sm">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#1a5c38]">
          Target table for next upload
        </label>
        {tablesLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading tables…
          </div>
        ) : tablesError ? (
          <p className="text-sm text-red-600">{tablesError}</p>
        ) : (
          <div className="relative">
            <select
              value={selectedTableId}
              onChange={(e) => handleTableChange(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3 pr-10 text-sm font-semibold text-[#1a5c38] outline-none focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/15"
            >
              {(byModule.length ? byModule : [{ module: 'all', moduleLabel: 'All Tables', tables }]).map((group) => (
                <optgroup key={group.module} label={group.moduleLabel}>
                  {group.tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} — {t.label} ({t.columnCount} cols)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2d8a4e]" />
          </div>
        )}
        {selectedTable && (
          <p className="mt-2 text-xs text-slate-500">
            New files go into this table. Opening an already-imported item does not change this selection.
            Extra file columns are skipped. Duplicate rows are not inserted.
            {selectedTable.primaryKey && (
              <>
                {' '}
                · PK: <code className="font-mono text-[#1a5c38]">{selectedTable.primaryKey}</code>
              </>
            )}
          </p>
        )}
        {detail && isDbEntry(detail) && (
          <p className="mt-1 text-xs text-[#1a5c38]">
            Selected list item is already stored as{' '}
            <code className="font-mono font-semibold">{detail.tableId}</code>
            {detail.fileName ? ` (from ${fileLabel(detail)})` : ''}.
          </p>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.txt,.xlsx,.xls,.xlsm"
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-3xl border-2 border-dashed border-[#2d8a4e]/40 bg-gradient-to-b from-[#f8faf8] to-[#edf7f0] p-10 text-center transition-all hover:border-[#2d8a4e]"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#a8d5b5] bg-white shadow">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#2d8a4e]" />
          ) : (
            <UploadCloud className="h-8 w-8 text-[#2d8a4e]" />
          )}
        </div>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Drop CSV / Excel file here</h2>
        <p className="text-sm text-slate-600">The file is stored only until import. After that it is replaced by the database table, named after the file.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-800">Files & tables</h3>
            <p className="text-[11px] text-slate-500">{uploads.length} item(s)</p>
          </div>
          <div className="max-h-[640px] divide-y divide-slate-100 overflow-y-auto">
            {uploads.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">Nothing imported yet</p>
            ) : (
              uploads.map((file) => {
                const st = statusLabel(file.status)
                const active = file.id === selectedId
                const dbItem = isDbEntry(file)
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedId(file.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                      active ? 'bg-[#edf7f0]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {dbItem ? (
                        <Database className="mt-0.5 h-4 w-4 shrink-0 text-[#2d8a4e]" />
                      ) : (
                        <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-[#2d8a4e]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">{displayTitle(file)}</p>
                        <p className="text-[11px] text-slate-500">
                          {file.rowCount.toLocaleString()} rows
                          {dbItem ? ' · DB table' : ` · ${formatBytes(file.fileSize)}`}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {dbItem ? `from ${fileLabel(file)}` : file.tableId || 'table not set'}
                        </p>
                        <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${st.cls}`}>
                          {st.text}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          {!selectedId && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Select a file or table to inspect its rows.
            </div>
          )}

          {selectedId && isLoadingDetail && (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading extracted rows…
            </div>
          )}

          {selectedId && !isLoadingDetail && detail && (
            <>
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
                <div>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${statusLabel(detail.status).cls}`}>
                    {statusLabel(detail.status).text}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {isDbEntry(detail)
                      ? `${detail.tableId || displayTitle(detail)} — ${extractTotal.toLocaleString()} rows in database`
                      : `${detail.fileName} — ${detail.rowCount} unique extracted rows`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isDbEntry(detail)
                      ? `Imported from ${fileLabel(detail)} · file removed after import`
                      : `${formatBytes(detail.fileSize)} · Target: ${selectedTableId || '—'}`}
                    {(() => {
                      const report = detail.duplicateReport
                      const exact = report?.exactCopyCount ?? detail.fileDuplicates ?? 0
                      const keyOnly = report?.keyOnlyDiffCount ?? 0
                      const keyLabel = (report?.keyCols || []).join(', ') || 'id'
                      if (isDbEntry(detail) || (exact === 0 && keyOnly === 0)) return null
                      return (
                        <>
                          {exact > 0 && <> · {exact} row(s) removed — every field identical</>}
                          {keyOnly > 0 && (
                            <>
                              {' '}
                              · {keyOnly} row(s) share {keyLabel} but other fields differ (kept)
                            </>
                          )}
                        </>
                      )
                    })()}
                    {detail.suggestedTableId && detail.suggestedTableId !== selectedTableId && !isDbEntry(detail) && (
                      <> · Suggested: {detail.suggestedTableId}</>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
                  >
                    <RefreshCw className="h-4 w-4" /> Upload another
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(detail.id)}
                    className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-700"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>

              {detail.suggestions && detail.suggestions.length > 0 && !isDbEntry(detail) && (
                <div className="rounded-2xl border border-[#dceee3] bg-[#f4fbf6] px-4 py-3 text-xs text-[#1a5c38]">
                  Best header matches:{' '}
                  {detail.suggestions.slice(0, 3).map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleTableChange(s.id)}
                      className="mr-2 font-semibold underline decoration-[#2d8a4e]/40 hover:text-[#2d8a4e]"
                    >
                      {i + 1}. {s.id} ({s.mapped} cols)
                    </button>
                  ))}
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h4 className="text-sm font-bold text-slate-800">
                    {isDbEntry(detail) ? `Rows in ${detail.tableId || displayTitle(detail)}` : 'Extracted data from file'}
                    {extractLoading ? ' — loading…' : ` — ${extractTotal.toLocaleString()} matching rows`}
                    {extractFileTotal > 0 && extractFileTotal !== extractTotal
                      ? ` of ${extractFileTotal.toLocaleString()} ${isDbEntry(detail) ? 'in table' : 'in file'}`
                      : ''}
                  </h4>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="flex min-w-[200px] flex-1 flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#1a5c38]">Search</span>
                      <span className="flex items-center rounded-lg border border-[#c5e0ce] bg-white px-2 py-1.5">
                        <Search className="mr-1 h-3.5 w-3.5 text-[#2d8a4e]" />
                        <input
                          value={extractSearchInput}
                          onChange={(e) => setExtractSearchInput(e.target.value)}
                          placeholder="Search name, id, state…"
                          className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-[#6b9e7a]"
                        />
                      </span>
                    </label>
                    {hospIdOptions.length > 0 && (
                      <SearchableSelect
                        label="Hospital ID"
                        value={extractHospId}
                        options={hospIdOptions}
                        placeholder="All hospital IDs"
                        onChange={setExtractHospId}
                      />
                    )}
                    {facilityIdOptions.length > 0 && (
                      <SearchableSelect
                        label="Facility ID"
                        value={extractFacilityId}
                        options={facilityIdOptions}
                        placeholder="All facility IDs"
                        onChange={setExtractFacilityId}
                      />
                    )}
                  </div>
                </div>
                <div className="scrollbar-visible overflow-x-auto p-4">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-slate-600">
                      <tr>
                        <th className="px-2 py-2">#</th>
                        {(tableColumns).map((h) => (
                            <th key={h} className="whitespace-nowrap px-3 py-2">
                              {h}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extractRows.map((row, idx) => (
                        <tr key={`${extractStartIndex}-${idx}`} className="hover:bg-slate-50">
                          <td className="px-2 py-2 text-slate-400">{extractStartIndex + idx + 1}</td>
                          {(tableColumns).map((h) => (
                            <td key={h} className="max-w-[220px] truncate whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                              {String(row[h] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {extractRows.length === 0 && (
                        <tr>
                          <td colSpan={Math.max(tableColumns.length, 1) + 1} className="px-3 py-8 text-center text-slate-400">
                            {isDbEntry(detail)
                              ? `No rows in ${detail.tableId || 'this table'}. ${
                                  detail.inserted
                                    ? `Import recorded ${detail.inserted} inserted row(s); the table may have been reset. Re-upload the file to import again.`
                                    : 'Nothing was inserted into this table.'
                                }`
                              : 'No matching rows.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {extractTotal > 0 && (
                  <TablePagination
                    page={Math.min(extractPage, extractTotalPages)}
                    totalPages={extractTotalPages}
                    totalRows={extractTotal}
                    startIndex={extractStartIndex}
                    endIndex={Math.min(extractStartIndex + extractRows.length, extractTotal)}
                    onPageChange={setExtractPage}
                    pageSize={EXTRACT_PAGE_SIZE}
                  />
                )}
              </div>

              {!isDbEntry(detail) && detail.duplicateReport && (
                <>
                  <DuplicateRowsPanel
                    title={`Removed — every field identical (${detail.duplicateReport.exactCopyCount})`}
                    subtitle="These rows match another row on every column, so they were dropped from the extract."
                    headers={detail.headers || []}
                    items={detail.duplicateReport.exactCopies || []}
                  />
                  <DuplicateRowsPanel
                    title={`Same ${(detail.duplicateReport.keyCols || []).join(', ') || 'id'} but other fields differ (${detail.duplicateReport.keyOnlyDiffCount})`}
                    subtitle="Not removed. Highlighted cells are the fields that differ from the first matching row."
                    headers={detail.headers || []}
                    items={detail.duplicateReport.keyOnlyDiffs || []}
                  />
                </>
              )}

              {!isDbEntry(detail) && selectedTable && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="mb-3 text-sm font-bold text-slate-800">Column mapping → {selectedTable.id}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2">File column</th>
                          <th className="px-3 py-2">→ Database column</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(detail.headers || []).map((header) => (
                          <tr key={header}>
                            <td className="px-3 py-2 font-mono font-semibold text-slate-800">{header}</td>
                            <td className="px-3 py-2">
                              <select
                                value={mapping[header] ?? ''}
                                onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value }))}
                                className="w-full max-w-xs rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                              >
                                <option value="">— Skip —</option>
                                {selectedTable.columns.map((col) => (
                                  <option key={col.name} value={col.name}>
                                    {col.name} ({col.type})
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {unmappedHeaders.length > 0 && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {unmappedHeaders.length} file column(s) not mapped (will be ignored)
                    </p>
                  )}
                </div>
              )}

              {!isDbEntry(detail) && (
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#b8dcc4] bg-[#f4fbf6] p-5">
                <div>
                  <span className="text-xs font-bold uppercase text-[#1a5c38]">Duplicates</span>
                  <p className="mt-1 max-w-md text-xs font-medium text-[#4a7c59]">
                    Skipped automatically — copies in this file and rows already in the database are not imported again.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isImporting || mappedColumnKeys.length === 0}
                  onClick={handleImport}
                  className="ml-auto flex items-center gap-2 rounded-xl bg-[#1a5c38] px-6 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50"
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  Import {extractTotal} rows into DB
                </button>
              </div>
              )}

              {importResult && (
                <div
                  className={`rounded-2xl border p-5 ${
                    importResult.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <p className={`flex items-center gap-2 text-sm font-bold ${importResult.ok ? 'text-green-800' : 'text-red-800'}`}>
                    {importResult.ok && <CheckCircle2 className="h-4 w-4" />}
                    {importResult.message}
                  </p>
                  {importResult.ok && (
                    <p className="mt-1 text-xs text-green-700">
                      Inserted: {importResult.inserted}
                      {importResult.updated ? ` · Updated: ${importResult.updated}` : ''}
                      {' '}· Skipped duplicates: {importResult.skippedExisting ?? importResult.skipped}
                      {importResult.skippedFile ? ` · File copies (every field identical): ${importResult.skippedFile}` : ''}
                      {' '}· Total: {importResult.total}
                      {importResult.uniqueKey?.length ? ` · Match on: ${importResult.uniqueKey.join(', ')}` : ''}
                      {importResult.columnsUsed?.length ? ` · Columns: ${importResult.columnsUsed.join(', ')}` : ''}
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-red-700">
                      {importResult.errors.map((e) => (
                        <li key={`${e.row}-${e.message}`}>
                          Row {e.row}: {e.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!isDbEntry(detail) && mappedColumnKeys.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                    <h4 className="text-sm font-bold text-slate-800">Mapped preview (as it will land in the table)</h4>
                  </div>
                  <div className="scrollbar-visible overflow-x-auto p-4">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-slate-600">
                        <tr>
                          <th className="px-2 py-2">#</th>
                          {mappedColumnKeys.map((key) => (
                            <th key={key} className="whitespace-nowrap px-3 py-2">
                              {labelizeColumn(key)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mappedRows.slice(0, 25).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-2 py-2 text-slate-400">{idx + 1}</td>
                            {mappedColumnKeys.map((key) => (
                              <td key={key} className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                                {String(row[key] ?? '—')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
