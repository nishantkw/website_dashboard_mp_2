import type { KPI } from '../../types'
import KPICard from '../ui/KPICard'
import ExportDropdown from './ExportDropdown'

interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const exportData = [
    { Page: title, Description: description || title, ExportDate: new Date().toLocaleDateString() },
  ]

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>

      <ExportDropdown
        title={title}
        subtitle={description || title}
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
