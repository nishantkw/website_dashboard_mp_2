import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { KPI } from '../../types'
import clsx from 'clsx'

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
}

interface KPICardProps {
  kpi: KPI
  onClick?: (kpi: KPI) => void
  selected?: boolean
  /** Flat cell inside a unified KPI panel (no separate card chrome). */
  embedded?: boolean
}

export default function KPICard({ kpi, onClick, selected = false, embedded = false }: KPICardProps) {
  const navigate = useNavigate()
  const change = kpi.change
  const hasChange = typeof change === 'number' && !Number.isNaN(change)
  const isPositive = (change ?? 0) >= 0
  const changeLabel = kpi.changeLabel || 'vs last month'
  const colorClass = colorMap[kpi.color ?? 'blue'] ?? colorMap.blue

  const handleClick = () => {
    if (kpi.link) {
      navigate(kpi.link)
    } else {
      onClick?.(kpi)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      className={clsx(
        'w-full cursor-pointer p-5 text-left group relative transition-colors',
        embedded
          ? selected
            ? 'bg-[#f4fbf6] ring-inset ring-2 ring-[#2d8a4e]/30'
            : 'bg-white hover:bg-slate-50'
          : selected
            ? 'scale-[1.01] rounded-xl border border-[#2d8a4e] bg-white shadow-lg ring-2 ring-[#2d8a4e]/25'
            : 'rounded-xl border border-gray-100 bg-white shadow-sm hover:scale-[1.02] hover:border-[#2d8a4e]/40 hover:shadow-lg active:scale-[0.99]'
      )}
    >
      <div className="flex items-start justify-between">
        <p
          className={clsx(
            'mb-1 text-sm font-medium transition-colors',
            selected ? 'text-[#2d8a4e]' : 'text-gray-500 group-hover:text-[#2d8a4e]'
          )}
        >
          {kpi.label}
        </p>
        <ExternalLink
          className={clsx(
            'h-3.5 w-3.5 shrink-0 transition-all',
            selected
              ? 'text-[#2d8a4e] opacity-100'
              : 'text-gray-300 opacity-0 group-hover:text-[#2d8a4e] group-hover:opacity-100'
          )}
        />
      </div>
      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
      {kpi.subValue && <p className="mt-0.5 text-xs text-slate-500">{kpi.subValue}</p>}
      {hasChange && (
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 shrink-0 text-red-500" />
          )}
          <span className={clsx('text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
            {isPositive && change !== 0 ? '+' : ''}
            {change}%
          </span>
          <span className="text-xs text-gray-400">{changeLabel}</span>
        </div>
      )}
      <div className={clsx('mt-3 flex h-10 w-10 items-center justify-center rounded-lg border', colorClass)}>
        <div className="h-3 w-3 rounded-full bg-current opacity-60" />
      </div>
    </button>
  )
}
