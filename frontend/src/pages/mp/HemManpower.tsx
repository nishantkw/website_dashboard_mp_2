import { useMemo } from 'react'
import DashboardReportsBanner from '../../components/ui/DashboardReportsBanner'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import ChartCard from '../../components/ui/ChartCard'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchHospitalsSection } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { pageHeaderDescription } from '../../utils/displayLabels'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { KPI, TableColumn } from '../../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#94a3b8']

const preferred: TableColumn[] = [
  { key: 'manpower_id_pk', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'manpower_type', label: 'Type' },
  { key: 'specialization', label: 'Specialization' },
  { key: 'highest_qualification', label: 'Qualification' },
  { key: 'reg_number', label: 'Reg. No.' },
  { key: 'hprid', label: 'HPR ID' },
  { key: 'hosp_id_pk', label: 'Hospital ID' },
  { key: 'employment_type', label: 'Employment' },
  { key: 'active_status', label: 'Active' },
  { key: 'mobile_num', label: 'Mobile' },
  { key: 'emailid', label: 'Email' },
]

const EMPTY = {
  kpis: [] as KPI[],
  manpowerKpis: [] as KPI[],
  charts: {} as Record<string, never>,
  manpowerTable: [] as Record<string, string | number>[],
  table: [] as Record<string, string | number>[],
  manpowerColumns: [] as string[],
  columns: [] as string[],
  manpowerSchema: '',
}

export default function HemManpower() {
  const { data, source, db, loading, error } = useApiResource(
    () => fetchHospitalsSection('manpower'),
    EMPTY,
    []
  )
  const live = source === 'api'
  const rows = (data.manpowerTable ?? data.table ?? []) as Record<string, string | number>[]
  const kpis = [...(data.kpis ?? []), ...(data.manpowerKpis ?? [])]
  const charts = data.charts ?? {}
  const typeData = charts.manpowerType ?? []
  const specData = charts.manpowerSpecialization ?? []
  const activeData = charts.manpowerActive ?? []

  const columns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.manpowerColumns ?? data.columns,
        rows,
        preferredFirst: preferred.map((c) => c.key),
        demoColumns: preferred,
      }),
    [source, data.manpowerColumns, data.columns, rows]
  )

  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    tableRows: rows,
    columns,
    datasetTitle: 'HEM Manpower',
  })

  return (
    <div>
      <Modal />
      <PageHeader
        title="HEM Manpower"
        description={
          live
            ? pageHeaderDescription(
                data.manpowerSchema ?? 'dmart_mp.t_hem_manpower',
                'Hospital doctors and staff registry with specialization and registration details'
              )
            : 'Connect the backend to load HEM manpower'
        }
        badge={<DataSourceBadge source={source} db={db} loading={loading} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      <DashboardReportsBanner
        reportPath="/dashboard/mp/reports/hospitals"
        buttonLabel="Open HEM Manpower in Hospitals Report →"
      />

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={(kpi) => openFromKpi(kpi.label, kpi.value)} />}

      {(typeData.length > 0 || activeData.length > 0 || specData.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {typeData.length > 0 && (
            <ChartCard title="Manpower Type" exportData={typeData}>
              <InteractivePieChart
                data={typeData}
                colors={COLORS}
                innerRadius={55}
                chartTitle="Manpower Type"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
          {activeData.length > 0 && (
            <ChartCard title="Active Status" exportData={activeData}>
              <InteractivePieChart
                data={activeData}
                colors={COLORS}
                innerRadius={55}
                chartTitle="Manpower Active Status"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
          {specData.length > 0 && (
            <ChartCard title="Specialization" exportData={specData}>
              <InteractiveBarChart
                data={specData}
                chartTitle="Manpower Specialization"
                layout="vertical"
                height={Math.min(420, Math.max(240, specData.length * 32 + 72))}
                integerAxis
                onItemClick={openFromChart}
                bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Staff' }]}
                cellColors={COLORS}
              />
            </ChartCard>
          )}
        </div>
      )}

    </div>
  )
}
