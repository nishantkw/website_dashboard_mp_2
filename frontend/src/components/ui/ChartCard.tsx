import type { ReactNode } from 'react'
import ExportDropdown from './ExportDropdown'
import StackedHeading from './StackedHeading'
import type { ColumnDef } from '../../utils/exportUtils'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  exportData?: Record<string, any>[]
}

const CHART_EXPORT_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Category' },
  { key: 'value', label: 'Count' },
]

export default function ChartCard({ title, subtitle, children, className = '', exportData }: ChartCardProps) {
  const dataToExport = exportData || [
    { Chart: title, Subtitle: subtitle || '', Status: 'Generated', Date: new Date().toLocaleDateString() },
  ]
  const first = dataToExport[0] || {}
  const columns =
    'name' in first
      ? [
          { key: 'name', label: 'Category' },
          ...Object.keys(first)
            .filter((k) => k !== 'name')
            .map((k) => ({
              key: k,
              label: k === 'value' || k === 'claims' ? 'Count' : k === 'amount' ? 'Amount (₹ Cr)' : k.replace(/_/g, ' '),
            })),
        ]
      : CHART_EXPORT_COLUMNS

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

        <div data-no-export="true">
          <ExportDropdown
            title={title}
            subtitle={subtitle}
            filename={`${title.toLowerCase().replace(/\s+/g, '_')}_export`}
            data={dataToExport}
            columns={exportData?.length ? columns : undefined}
            buttonSize="sm"
            variant="outline"
            includeVisuals
            visualTitle={title}
          />
        </div>
      </div>
      <div data-export-visual={title} className="flex min-h-0 flex-1 flex-col justify-center">
        {children}
      </div>
    </div>
  )
}
