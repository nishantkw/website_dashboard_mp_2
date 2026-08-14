import { useNavigate } from 'react-router-dom'
import type { KPI } from '../../types'
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  red: 'bg-red-50 text-red-600 border-red-100',
}

interface KPICardProps {
  kpi: KPI
  onClick?: (kpi: KPI) => void
}

export default function KPICard({ kpi, onClick }: KPICardProps) {
  const navigate = useNavigate()
  const isPositive = (kpi.change ?? 0) >= 0
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
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-lg hover:border-[#2d8a4e]/40 hover:scale-[1.02] active:scale-[0.99] transition-all text-left w-full cursor-pointer group relative"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-[#2d8a4e] transition-colors">
          {kpi.label}
        </p>
        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#2d8a4e] opacity-0 group-hover:opacity-100 transition-all shrink-0" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
      {kpi.change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={clsx('text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
            {isPositive ? '+' : ''}{kpi.change}%
          </span>
          {kpi.changeLabel && (
            <span className="text-xs text-gray-400 ml-1">{kpi.changeLabel}</span>
          )}
        </div>
      )}
      <div className={clsx('w-10 h-10 rounded-lg mt-3 flex items-center justify-center border', colorClass)}>
        <div className="w-3 h-3 rounded-full bg-current opacity-60" />
      </div>
    </button>
  )
}
