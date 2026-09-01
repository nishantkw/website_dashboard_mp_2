import type { KPI } from '../../types'
import KPICard from './KPICard'
import ExportDropdown from './ExportDropdown'
import type { ReactNode } from 'react'
import StackedHeading from './StackedHeading'

interface PageHeaderProps {
  title: string
  description?: string
  badge?: ReactNode
}

export function PageHeader({ title, description, badge }: PageHeaderProps) {
  const exportData = [
    { Page: title, Description: description || title, ExportDate: new Date().toLocaleDateString() },
  ]

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <StackedHeading
        size="page"
        titleAs="h1"
        title={title}
        subtitle={description}
        badge={badge}
        className="min-w-0 flex-1"
      />

      <div className="shrink-0">
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
    </div>
  )
}

interface KPIGridProps {
  kpis: KPI[]
  onKpiClick?: (kpi: KPI) => void
  selectedKey?: string | null
}

export function KPIGrid({ kpis, onKpiClick, selectedKey }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.key || kpi.label}
          kpi={kpi}
          onClick={onKpiClick}
          selected={Boolean(selectedKey) && selectedKey === (kpi.key || kpi.label)}
        />
      ))}
    </div>
  )
}
