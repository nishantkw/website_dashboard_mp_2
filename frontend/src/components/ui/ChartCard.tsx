import type { ReactNode } from 'react'
import ExportDropdown from './ExportDropdown'
import StackedHeading from './StackedHeading'

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
    <div className={`flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-5 flex shrink-0 items-start justify-between gap-3">
        <StackedHeading
          size="section"
          title={title}
          subtitle={subtitle}
          titleClassName="text-base text-gray-900"
          subtitleClassName="text-sm text-gray-500"
          className="min-w-0 flex-1"
        />

        <ExportDropdown
          title={title}
          subtitle={subtitle}
          filename={`${title.toLowerCase().replace(/\s+/g, '_')}_export`}
          data={dataToExport}
          buttonSize="sm"
          variant="outline"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center">{children}</div>
    </div>
  )
}
