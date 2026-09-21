import { useEffect, useRef, useState } from 'react'
import { compactFilterLabelClass, compactSelectClass } from '../layout/compactFilterStyles'

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
  /** When true, controls are shown but not editable (inherited from page filters). */
  disabled?: boolean
}

export default function DateRangeFilter({
  dateFrom,
  dateTo,
  onChange,
  variant = 'compact',
  className = '',
  grow = false,
  disabled = false,
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
      ? `text-xs border rounded-lg px-2.5 py-1.5 outline-none min-w-[140px] ${
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600'
            : 'border-slate-300 bg-white text-slate-700 focus:border-[#2d8a4e]'
        }`
      : compactSelectClass(Boolean(preset), false, grow ? 'w-full min-w-0' : 'min-w-[132px]')

  const dateInputClass =
    variant === 'compact'
      ? `text-xs border rounded-lg px-2 py-1.5 outline-none w-[118px] ${
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600'
            : 'border-slate-300 bg-white text-slate-700 focus:border-[#2d8a4e]'
        }`
      : compactSelectClass(true, false, grow ? 'flex-1' : 'w-[110px]')

  const showCustom = preset === 'custom' || (disabled && Boolean(dateFrom || dateTo))

  return (
    <div
      className={`flex shrink-0 flex-nowrap items-center gap-1.5 whitespace-nowrap max-lg:col-span-2 max-lg:min-w-0 max-lg:flex-wrap max-lg:whitespace-normal ${
        grow ? 'min-w-[140px] flex-1' : ''
      } ${className}`}
      title={disabled ? 'Set from page filters' : undefined}
    >
      <div className={`flex shrink-0 items-center gap-1.5 ${grow ? 'min-w-0 flex-1' : ''}`}>
        {variant === 'labeled' && (
          <label className={compactFilterLabelClass}>Date</label>
        )}

        <select
          value={showCustom && disabled ? 'custom' : preset}
          disabled={disabled}
          onChange={(e) => {
            if (disabled) return
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
          title={disabled ? 'Set from page filters' : 'Date Range'}
        >
          <option value="">Any time</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7">Last 7 days</option>
          <option value="last_30">Last 30 days</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {showCustom && (
        <div className="flex shrink-0 items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            disabled={disabled}
            onChange={(e) => {
              if (disabled) return
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
            disabled={disabled}
            onChange={(e) => {
              if (disabled) return
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
    // De-empanelment / action tables — prefer action dates over created_dt
    'start_date',
    'end_date',
    'due_date',
    'deempanel_date',
    'enrol_date',
    'enroll_date',
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

  const toIso = (value: unknown): string => {
    const s = String(value ?? '').trim()
    if (!s) return ''
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
    const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
    return ''
  }

  for (const key of dateKeys) {
    const str = toIso(row[key])
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  }
  for (const [key, val] of Object.entries(row)) {
    if (DOB_KEYS.test(key) || /dob|birth|yob/i.test(key)) continue
    const str = toIso(val)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
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
