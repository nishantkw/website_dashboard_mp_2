import { useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { KPI } from '../../types'
import KPICard from './KPICard'
import ExportDropdown from './ExportDropdown'
import type { ExportSheet } from '../../utils/exportUtils'

export const PAGE_HEADER_SLOT_ID = 'dashboard-page-header'

interface PageHeaderProps {
  title: string
  description?: string
  badge?: ReactNode
  /** KPI cards + graph series for CSV/Excel (PDF still prints the page). */
  exportSheets?: ExportSheet[]
}

function isInternalDescription(text?: string) {
  if (!text) return true
  return /\b(dmart_mp|ump_raw)\./i.test(text) || /schema fields/i.test(text)
}

export function PageHeader({ title, description, badge, exportSheets }: PageHeaderProps) {
  const publicDescription = isInternalDescription(description) ? undefined : description
  const exportData = [
    { Page: title, Description: publicDescription || title, ExportDate: new Date().toLocaleDateString() },
  ]
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    setSlot(document.getElementById(PAGE_HEADER_SLOT_ID))
    setReady(true)
  }, [])

  const header = (
    <div className="mb-3 flex items-center justify-between gap-3 pt-4 lg:mb-4 lg:pt-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold leading-tight text-gray-900">{title}</h1>
          {badge}
        </div>
        {publicDescription ? (
          <p className="mt-0.5 truncate text-xs text-gray-500">{publicDescription}</p>
        ) : null}
      </div>

      <div className="shrink-0">
        <ExportDropdown
          title={title}
          subtitle={publicDescription || title}
          filename={`${title.toLowerCase().replace(/\s+/g, '_')}_report`}
          data={exportData}
          buttonSize="sm"
          variant="primary"
          isFullPageExport={true}
          sheets={exportSheets}
          includeVisuals
        />
      </div>
    </div>
  )

  if (!ready) return null
  if (slot) return createPortal(header, slot)
  return header
}

interface KPIGridProps {
  kpis: KPI[]
  onKpiClick?: (kpi: KPI) => void
  selectedKey?: string | null
  /** Label used when capturing this grid as a picture for Excel. */
  exportLabel?: string
}

const KPI_DOT_PALETTE = ['blue', 'green', 'emerald', 'orange', 'cyan', 'purple', 'indigo', 'violet', 'red'] as const

function withDistinctDotColor(kpi: KPI, index: number, kpis: KPI[]): KPI {
  const colors = kpis.map((item) => item.color || '')
  const unique = new Set(colors.filter(Boolean))
  if (kpi.color && unique.size > 1) return kpi
  return { ...kpi, color: KPI_DOT_PALETTE[index % KPI_DOT_PALETTE.length] }
}

export function KPIGrid({ kpis, onKpiClick, selectedKey, exportLabel = 'KPI Cards' }: KPIGridProps) {
  return (
    <div data-export-visual={exportLabel} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <KPICard
          key={kpi.key || kpi.label}
          kpi={withDistinctDotColor(kpi, index, kpis)}
          onClick={onKpiClick}
          selected={Boolean(selectedKey) && selectedKey === (kpi.key || kpi.label)}
        />
      ))}
    </div>
  )
}
