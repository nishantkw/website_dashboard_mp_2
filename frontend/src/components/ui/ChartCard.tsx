import type { ReactNode } from 'react'
import ExportDropdown from './ExportDropdown'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  exportData?: Record<string, any>[]
}

export default function ChartCard({ title, subtitle, children, className = '', exportData }: ChartCardProps) {
  const dataToExport = exportData || [
    { Chart: title, Subtitle: subtitle || '', Status: 'Generated', Date: new Date().toLocaleDateString() },
  ]

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        <ExportDropdown
          title={title}
          subtitle={subtitle}
          filename={`${title.toLowerCase().replace(/\s+/g, '_')}_export`}
          data={dataToExport}
          buttonSize="sm"
          variant="outline"
        />
      </div>
      {children}
    </div>
  )
}
