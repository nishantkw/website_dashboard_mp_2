import type { KPI } from '../../types'
import KPICard from '../ui/KPICard'
import ExportDropdown from './ExportDropdown'

interface PageHeaderProps {
  title: string
  description: string
  schema?: string
}

export function PageHeader({ title, description, schema }: PageHeaderProps) {
  const exportData = [
    { Page: title, Description: description, Schema: schema || 'General', ExportDate: new Date().toLocaleDateString() },
  ]

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {schema && (
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded-md">
              {schema}
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>

      <ExportDropdown
        title={title}
        subtitle={description}
        filename={`${title.toLowerCase().replace(/\s+/g, '_')}_report`}
        data={exportData}
        buttonSize="md"
        variant="primary"
        isFullPageExport={true}
      />
    </div>
  )
}

interface KPIGridProps {
  kpis: KPI[]
  onKpiClick?: (kpi: KPI) => void
}

export function KPIGrid({ kpis, onKpiClick }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <KPICard key={kpi.label} kpi={kpi} onClick={onKpiClick} />
      ))}
    </div>
  )
}
