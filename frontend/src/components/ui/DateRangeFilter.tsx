import { useEffect, useRef, useState } from 'react'

export type DatePreset = '' | 'today' | 'yesterday' | 'last_7' | 'last_30' | 'custom'

export function formatLocalDate(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function calcDateRange(preset: Exclude<DatePreset, '' | 'custom'>) {
  const end = new Date()
  end.setHours(0, 0, 0, 0)

  if (preset === 'today') return { from: end, to: end }

  if (preset === 'yesterday') {
    const y = new Date(end)
    y.setDate(y.getDate() - 1)
    return { from: y, to: y }
  }

  if (preset === 'last_7') {
    const from = new Date(end)
    from.setDate(from.getDate() - 6)
    return { from, to: end }
  }

  const from = new Date(end)
  from.setDate(from.getDate() - 29)
  return { from, to: end }
}

interface DateRangeFilterProps {
  dateFrom: string
  dateTo: string
  onChange: (from: string, to: string) => void
  /** compact = toolbar style (no big label); labeled = form style with DATE RANGE label */
  variant?: 'compact' | 'labeled'
  className?: string
  /** Fill available row width instead of a fixed shrink-0 size — for filter bars with few fields, so the card doesn't look sparse. */
  grow?: boolean
}

export default function DateRangeFilter({
  dateFrom,
  dateTo,
  onChange,
  variant = 'compact',
  className = '',
  grow = false,
}: DateRangeFilterProps) {
  const [preset, setPreset] = useState<DatePreset>(() => (dateFrom || dateTo ? 'custom' : ''))
  // Tracks the last (dateFrom, dateTo) this component pushed via onChange, so the effect
  // below can tell "parent echoed our own change back" apart from "a click elsewhere in the
  // app (e.g. a chart drill-down) set these props externally" — only the latter should
  // force the preset to sync.
  const lastPushed = useRef({ from: dateFrom, to: dateTo })

  useEffect(() => {
    if (dateFrom === lastPushed.current.from && dateTo === lastPushed.current.to) return
    lastPushed.current = { from: dateFrom, to: dateTo }
    setPreset(dateFrom || dateTo ? 'custom' : '')
  }, [dateFrom, dateTo])

  const selectClass =
    variant === 'compact'
      ? 'text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:border-[#2d8a4e] min-w-[140px]'
      : `${grow ? 'w-full' : 'min-w-[170px] max-w-[200px]'} cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs outline-none transition-all focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/15 ${
          preset
            ? 'border-[#2d8a4e] bg-[#edf7f0] font-semibold text-[#1a5c38] shadow-sm'
            : 'border-[#c5e0ce] bg-white text-slate-700 hover:border-[#2d8a4e]/60'
        }`

  const dateInputClass =
    variant === 'compact'
      ? 'text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none focus:border-[#2d8a4e] w-[118px]'
      : `${grow ? 'flex-1' : 'w-[110px]'} rounded-lg border border-[#c5e0ce] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/15`

  return (
    <div className={`flex flex-col items-center ${grow ? 'min-w-[160px] flex-1' : 'shrink-0'} ${className}`}>
      {variant === 'labeled' && (
        <label className="mb-1 block w-full text-center text-[9px] font-bold uppercase tracking-wider text-[#1a5c38]">
          Date Range
        </label>
      )}

      <select
        value={preset}
        onChange={(e) => {
          const next = e.target.value as DatePreset
          setPreset(next)
          if (next === '') {
            lastPushed.current = { from: '', to: '' }
            onChange('', '')
            return
          }
          if (next === 'custom') return
          const range = calcDateRange(next)
          const from = formatLocalDate(range.from)
          const to = formatLocalDate(range.to)
          lastPushed.current = { from, to }
          onChange(from, to)
        }}
        className={selectClass}
        title="Date Range"
      >
        <option value="">Any time</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last_7">Last 7 days</option>
        <option value="last_30">Last 30 days</option>
        <option value="custom">Custom</option>
      </select>

      {preset === 'custom' && (
        <div className={`flex items-center gap-1.5 ${grow ? 'w-full' : ''} ${variant === 'labeled' ? 'mt-2' : 'mt-1.5'}`}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setPreset('custom')
              lastPushed.current = { from: e.target.value, to: dateTo }
              onChange(e.target.value, dateTo)
            }}
            className={dateInputClass}
            aria-label="From date"
          />
          <span className="text-[10px] text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setPreset('custom')
              lastPushed.current = { from: dateFrom, to: e.target.value }
              onChange(dateFrom, e.target.value)
            }}
            className={dateInputClass}
            aria-label="To date"
          />
        </div>
      )}
    </div>
  )
}

const DOB_KEYS = /^(patient_dob|dob|date_of_birth|year_of_birth|card_yob|age)$/i

/** Event dates only — same order as claims amount/volume trend charts. Never use DOB. */
export function getRowDateValue(row: Record<string, string | number>): string | null {
  const dateKeys = [
    'claim_init_date',
    'preauth_init_date',
    'claim_date',
    'empaneled_date',
    'hosp_empaneled_date',
    'empanelled_date',
    'transaction_dt',
    'payment_paid_dt',
    'admission_dt',
    'discharge_dt',
    'enroll_date',
    'enrol_date',
    'disabled_date',
    'issue_date',
    'settlement_date',
    'dispatched_date',
    'created_dt',
    'created',
    'last_login',
    'date',
    'submission_date',
  ]
  for (const key of dateKeys) {
    const val = row[key]
    if (val == null || val === '' || val === '-') continue
    const str = String(val).slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str
  }
  for (const [key, val] of Object.entries(row)) {
    if (DOB_KEYS.test(key) || /dob|birth|yob/i.test(key)) continue
    const str = String(val ?? '').slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str
  }
  return null
}

export function rowMatchesDateRange(
  row: Record<string, string | number>,
  dateFrom: string,
  dateTo: string
): boolean {
  if (!dateFrom && !dateTo) return true
  const rowDate = getRowDateValue(row)
  if (!rowDate) return true
  if (dateFrom && rowDate < dateFrom) return false
  if (dateTo && rowDate > dateTo) return false
  return true
}
