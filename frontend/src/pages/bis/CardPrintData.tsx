import { useMemo } from 'react'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import DashboardReportsBanner from '../../components/ui/DashboardReportsBanner'
import ChartCard from '../../components/ui/ChartCard'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchBisCardPrintData } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { KPI, TableColumn } from '../../types'

const STATUS_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444']
const DISTRICT_COLORS = ['#3b82f6', '#0ea5e9', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

const preferred: TableColumn[] = [
  { key: 'card_no', label: 'Card No.' },
  { key: 'source_name', label: 'Source Name' },
  { key: 'kyc_name', label: 'KYC Name' },
  { key: 'family_id', label: 'Family ID' },
  { key: 'member_id', label: 'Member ID' },
  { key: 'dist_name', label: 'District' },
  { key: 'village_name', label: 'Village' },
  { key: 'rural_urban_flag', label: 'Rural / Urban' },
  { key: 'card_status', label: 'Card Status' },
  { key: 'abha_id', label: 'ABHA' },
  { key: 'approve_date', label: 'Approved' },
  { key: 'ben_mobile_no', label: 'Mobile' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  columns: [] as string[],
  augTable: [] as Record<string, string | number>[],
  vvsTable: [] as Record<string, string | number>[],
  tempTable: [] as Record<string, string | number>[],
  leftoverTable: [] as Record<string, string | number>[],
}

export default function CardPrintData() {
  const { data, source, db, loading, error } = useApiResource(() => fetchBisCardPrintData(), EMPTY, [])
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const charts = data.charts ?? {}
  const statusData = charts.status ?? []
  const districtData = charts.district ?? []
  const urbanRuralData = charts.urbanRural ?? []

  const makeCols = (keys?: string[], rows?: Record<string, string | number>[]) =>
    schemaTableColumns({
      source,
      schemaKeys: keys,
      rows: rows ?? [],
      preferredFirst: preferred.map((c) => c.key),
      demoColumns: preferred,
    })

  const augCols = useMemo(() => makeCols(data.augColumns, data.augTable), [source, data.augColumns, data.augTable])
  const vvsCols = useMemo(() => makeCols(data.vvsColumns, data.vvsTable), [source, data.vvsColumns, data.vvsTable])
  const tempCols = useMemo(() => makeCols(data.tempColumns, data.tempTable), [source, data.tempColumns, data.tempTable])
  const leftoverCols = useMemo(
    () => makeCols(data.leftoverColumns, data.leftoverTable),
    [source, data.leftoverColumns, data.leftoverTable]
  )

  const allRows = [
    ...(data.augTable ?? []),
    ...(data.vvsTable ?? []),
    ...(data.tempTable ?? []),
    ...(data.leftoverTable ?? []),
  ]
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    tableRows: allRows,
    columns: augCols,
    datasetTitle: 'Card Print Data',
  })

  return (
    <div>
      <Modal />
      <PageHeader
        title="Card Print Batches"
        description={
          live
            ? 'Card print extracts from PMJAY dmart_mp schema reference (Aug 2025, VVS, temp e-KYC, leftover)'
            : 'Connect the backend to load card print batch tables'
        }
        badge={<DataSourceBadge source={source} db={db} loading={loading} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      <DashboardReportsBanner
        reportPath="/dashboard/mp/reports/card-print-data"
        buttonLabel="Open Card Print Batches Report →"
      />

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={(kpi) => openFromKpi(kpi.label, kpi.value)} />}

      {(statusData.length > 0 || urbanRuralData.length > 0 || districtData.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {statusData.length > 0 && (
            <ChartCard title="Card Status" exportData={statusData}>
              <InteractivePieChart
                data={statusData}
                colors={STATUS_COLORS}
                innerRadius={55}
                chartTitle="Card Status"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
          {urbanRuralData.length > 0 && (
            <ChartCard title="Urban vs Rural" exportData={urbanRuralData}>
              <InteractivePieChart
                data={urbanRuralData}
                colors={['#f59e0b', '#10b981']}
                innerRadius={55}
                chartTitle="Urban/Rural"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
          {districtData.length > 0 && (
            <ChartCard title="By District" exportData={districtData}>
              <InteractiveBarChart
                data={districtData.slice(0, 14)}
                chartTitle="By District"
                layout="vertical"
                height={Math.max(280, Math.min(14, districtData.length) * 36)}
                integerAxis
                onItemClick={openFromChart}
                bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Cards' }]}
                cellColors={DISTRICT_COLORS}
              />
            </ChartCard>
          )}
        </div>
      )}
    </div>
  )
}
