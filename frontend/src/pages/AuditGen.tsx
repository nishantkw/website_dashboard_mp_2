import { useMemo, useRef, useState, type DragEvent } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  Shuffle,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import { PageHeader } from '../components/ui/PageHeader'
import {
  AUDITGEN_PERCENTS,
  buildDemoCsvFile,
  exportSampleCsv,
  formatBytes,
  formatNumber,
  parseCsvFile,
  resolveTargetN,
  sampleRows,
  validateCsvFile,
  type AuditGenMeta,
  type AuditGenSample,
} from '../utils/auditgenCsv'

type Step = 'upload' | 'uploaded' | 'select'

const glassPanel =
  'rounded-2xl border border-[#c5e0ce]/80 bg-white/80 shadow-[0_8px_30px_rgba(26,92,56,0.08)] backdrop-blur-xl'
const glassBtn =
  'inline-flex h-9 items-center justify-center rounded-lg border border-[#c5e0ce] bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-[#f4fbf6]'
const primaryBtn =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#2d8a4e] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1a5c38] disabled:opacity-60'
const controlField =
  'h-9 rounded-lg border border-[#c5e0ce] bg-white px-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/15'

const FLOW_STEPS = [
  { n: 1, label: 'Upload CSV' },
  { n: 2, label: 'Pick percent' },
  { n: 3, label: 'Download sample' },
] as const

export default function AuditGen() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [meta, setMeta] = useState<AuditGenMeta | null>(null)
  const [parsing, setParsing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hot, setHot] = useState(false)
  const [error, setError] = useState('')
  const [percent, setPercent] = useState(10)
  const [result, setResult] = useState<AuditGenSample | null>(null)

  const targetN = useMemo(
    () => resolveTargetN(meta?.totalRows || 0, percent),
    [meta, percent]
  )

  const activeFlow = step === 'select' ? 2 : step === 'uploaded' ? 2 : 1

  function resetAll() {
    setMeta(null)
    setError('')
    setResult(null)
    setParsing(false)
    setBusy(false)
    setStep('upload')
    setPercent(10)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function onFile(file: File | null) {
    if (!file) return
    const validation = validateCsvFile(file)
    if (validation) {
      setError(validation)
      return
    }
    setError('')
    setResult(null)
    setStep('upload')
    setParsing(true)
    try {
      const next = await parseCsvFile(file)
      setMeta(next)
      setStep('uploaded')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this CSV.')
      setMeta(null)
    } finally {
      setParsing(false)
    }
  }

  function runSample() {
    if (!meta) return
    setBusy(true)
    setError('')
    try {
      setResult(sampleRows(meta, percent))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sampling failed.')
    } finally {
      setBusy(false)
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setHot(false)
    const file = e.dataTransfer.files?.[0] || null
    void onFile(file)
  }

  return (
    <div>
      {step !== 'select' && (
        <PageHeader
          title="AuditGen"
          description="Pick a random percent of rows from any CSV for audit sampling"
        />
      )}

      {/* Progress strip */}
      <div
        className={clsx(
          glassPanel,
          'mb-4 px-4 py-3',
          step === 'select' && 'mt-4 lg:mt-6'
        )}
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {FLOW_STEPS.map((s, i) => {
            const current = s.n === activeFlow || (step === 'select' && s.n === 2)
            const complete =
              (s.n === 1 && (step === 'uploaded' || step === 'select')) ||
              (s.n === 2 && step === 'select' && Boolean(result)) ||
              (s.n === 3 && Boolean(result))
            return (
              <div key={s.n} className="flex items-center gap-2 sm:gap-3">
                {i > 0 && (
                  <div
                    className={clsx(
                      'hidden h-px w-6 sm:block md:w-10',
                      complete || current ? 'bg-[#2d8a4e]/50' : 'bg-slate-200'
                    )}
                  />
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                      complete
                        ? 'bg-[#2d8a4e] text-white'
                        : current
                          ? 'bg-[#2d8a4e]/15 text-[#1a5c38] ring-2 ring-[#2d8a4e]/35'
                          : 'bg-slate-100 text-slate-400'
                    )}
                  >
                    {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
                  </span>
                  <span
                    className={clsx(
                      'text-xs font-semibold sm:text-sm',
                      current || complete ? 'text-slate-800' : 'text-slate-400'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {step !== 'select' ? (
        <div className={clsx(glassPanel, 'overflow-hidden')}>
          {step === 'uploaded' && meta ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="border-b border-[#c5e0ce]/60 p-6 lg:border-b-0 lg:border-r">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eaf5ed] text-[#2d8a4e]">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#2d8a4e]">
                      Ready to sample
                    </p>
                    <h2 className="mt-1 truncate text-xl font-bold text-slate-900">{meta.fileName}</h2>
                    <p className="mt-1 text-sm text-slate-500">CSV parsed successfully — choose how many rows to take.</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Rows', value: formatNumber(meta.totalRows) },
                    { label: 'Columns', value: formatNumber(meta.headers.length) },
                    { label: 'Size', value: formatBytes(meta.sizeBytes) },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-[#c5e0ce]/70 bg-[#f4fbf6] px-3 py-3 text-center"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#1a5c38]">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 bg-gradient-to-br from-[#eaf5ed]/80 to-white/40 p-6">
                <button type="button" onClick={() => setStep('select')} className={primaryBtn}>
                  <Shuffle className="h-4 w-4" />
                  Extract random rows
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className={clsx(glassBtn, 'inline-flex items-center justify-center gap-2')}
                >
                  <RotateCcw className="h-4 w-4" />
                  Upload a different file
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,138,78,0.1),transparent_55%)]"
              />

              <div className="relative px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
                <div className="mx-auto max-w-2xl text-center">
                  <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#c5e0ce] bg-[#eaf5ed] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1a5c38]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Random audit sampling
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
                    Drop your claims CSV to begin
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                    We’ll count the rows, you pick a percent, then download a random sample without
                    replacement.
                  </p>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setHot(true)
                  }}
                  onDragLeave={() => setHot(false)}
                  onDrop={onDrop}
                  className={clsx(
                    'mx-auto mt-6 flex min-h-[240px] max-w-2xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-200',
                    hot
                      ? 'scale-[1.01] border-[#2d8a4e] bg-[#2d8a4e]/12 shadow-[0_0_0_4px_rgba(45,138,78,0.12)]'
                      : 'border-[#9ecfb0] bg-gradient-to-b from-[#f4fbf6] to-white hover:border-[#2d8a4e] hover:shadow-[0_12px_40px_rgba(45,138,78,0.12)]'
                  )}
                  onClick={() => inputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
                  }}
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-[#2d8a4e]" />
                      <p className="mt-4 text-base font-semibold text-slate-800">Reading CSV…</p>
                      <p className="mt-1 text-sm text-slate-500">Hang on while we parse your file</p>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <div className="absolute -inset-3 rounded-3xl bg-[#2d8a4e]/10 blur-md" />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2d8a4e] text-white shadow-lg shadow-[#2d8a4e]/30">
                          <UploadCloud className="h-8 w-8" />
                        </div>
                      </div>
                      <p className="mt-5 text-base font-semibold text-slate-800">
                        Drop CSV here or click to browse
                      </p>
                      <p className="mt-1.5 text-sm text-slate-500">
                        Header row required · Max 80 MB · .csv only
                      </p>
                      <span className="mt-5 inline-flex items-center rounded-xl bg-[#2d8a4e] px-4 py-2 text-sm font-semibold text-white shadow-sm">
                        Choose file
                      </span>
                    </>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => void onFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="mx-auto mt-5 flex max-w-2xl flex-col items-center justify-between gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void onFile(buildDemoCsvFile())}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#2d8a4e] transition hover:text-[#1a5c38]"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Try with demo claims CSV
                  </button>
                  <p className="text-xs text-slate-400">Sampling stays in your browser — nothing is uploaded</p>
                </div>

                {error && step === 'upload' && (
                  <div className="mx-auto mt-4 flex max-w-2xl items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className={clsx(glassPanel, 'px-4 py-3')}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900">Choose percent of rows</h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{meta?.fileName}</span>
                  {' · '}
                  {formatNumber(meta?.totalRows || 0)} total rows
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  Percent
                  <select
                    value={percent}
                    onChange={(e) => {
                      setPercent(Number(e.target.value))
                      setResult(null)
                    }}
                    className={clsx(controlField, 'w-[4.75rem]')}
                  >
                    {AUDITGEN_PERCENTS.map((p) => (
                      <option key={p} value={p}>
                        {p}%
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex h-9 items-center gap-1.5 rounded-lg border border-[#c5e0ce] bg-[#eaf5ed] px-2.5 text-xs">
                  <span className="font-semibold text-[#1a5c38]">Rows</span>
                  <span className="font-bold text-slate-900">{formatNumber(targetN)}</span>
                </div>

                <div className="hidden h-5 w-px bg-[#c5e0ce] sm:block" />

                <button type="button" disabled={busy} onClick={runSample} className={primaryBtn}>
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shuffle className="h-3.5 w-3.5" />}
                  {busy ? 'Sampling…' : 'Randomize'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('uploaded')
                    setResult(null)
                  }}
                  className={glassBtn}
                >
                  Back
                </button>
                <button type="button" onClick={resetAll} className={glassBtn}>
                  Reset
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {result && (
            <div className={clsx(glassPanel, 'overflow-hidden')}>
              <div className="flex flex-col gap-3 border-b border-[#c5e0ce]/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Sample preview</h3>
                  <p className="text-sm text-slate-500">
                    {formatNumber(result.sampled)} of {formatNumber(result.totalRows)} rows (
                    {result.percent}%)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={runSample}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5e0ce] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#f4fbf6]"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Sample again
                  </button>
                  <button
                    type="button"
                    onClick={() => exportSampleCsv(result)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d8a4e] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1a5c38]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download CSV
                  </button>
                </div>
              </div>
              <div className="scrollbar-visible max-h-[420px] overflow-auto">
                <table className="w-max min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white text-xs font-semibold uppercase text-slate-600">
                    <tr>
                      {result.headers.map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-2.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {result.rows.slice(0, 100).map((row, i) => (
                      <tr key={i} className="hover:bg-[#f4fbf6]">
                        {result.headers.map((h) => (
                          <td key={h} className="max-w-[16rem] truncate px-4 py-2">
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.rows.length > 100 && (
                <p className="border-t border-[#c5e0ce]/60 px-5 py-2 text-xs text-slate-500">
                  Showing first 100 of {formatNumber(result.sampled)} sampled rows — download for the
                  full sample.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
