import { useMemo } from 'react'
import DashboardReportsBanner from '../../components/ui/DashboardReportsBanner'
import ChartCard from '../../components/ui/ChartCard'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import ModuleFilterBar from '../../components/layout/ModuleFilterBar'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useModuleFilters } from '../../hooks/useModuleFilters'
import { getModuleFilters } from '../../data/moduleFilterConfig'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchNafuSafuSource } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { pageHeaderDescription } from '../../utils/displayLabels'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { ChartDataPoint, KPI, TableColumn } from '../../types'

const COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#0891b2']

const preferredColumns: TableColumn[] = [
  { key: 'suspicious_id', label: 'Suspicious ID' },
  { key: 'pmrssm_id', label: 'PMRSSM ID' },
  { key: 'status', label: 'Status' },
  { key: 'trigger_type', label: 'Trigger Type' },
  { key: 'trigger_reason', label: 'Trigger Reason' },
  { key: 'suspicious_entity', label: 'Entity' },
  { key: 'risk_score', label: 'Risk Score', align: 'right' },
  { key: 'fraud_not_fraud', label: 'Fraud / Not Fraud' },
  { key: 'safu_action', label: 'SAFU Action' },
  { key: 'trigger_timestamp', label: 'Trigger Time' },
  { key: 'state_code', label: 'State Code' },
  { key: 'file_name', label: 'File Name' },
  { key: 'updated_by', label: 'Updated By' },
  { key: 'updated_dt', label: 'Updated At' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: {
    byStatus: [] as ChartDataPoint[],
    byTriggerType: [] as ChartDataPoint[],
    byFraudFlag: [] as ChartDataPoint[],
    bySafuAction: [] as ChartDataPoint[],
  },
  table: [] as Record<string, string | number>[],
  columns: [] as string[],
}

export default function NafuSafuSource() {
  const filterFields = useMemo(() => getModuleFilters('mp_nafu_safu_source'), [])
  const moduleFilters = useModuleFilters('mp_nafu_safu_source', filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchNafuSafuSource(moduleFilters.queryString),
    EMPTY,
    [moduleFilters.queryString]
  )
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const tableRows = (data.table ?? []) as Record<string, string | number>[]
  const filtered = moduleFilters.filterRows(tableRows)
  const byStatus = data.charts?.byStatus ?? []
  const byTriggerType = data.charts?.byTriggerType ?? []
  const byFraudFlag = data.charts?.byFraudFlag ?? []
  const bySafuAction = data.charts?.bySafuAction ?? []

  const columns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.columns,
        rows: tableRows,
        preferredFirst: preferredColumns.map((c) => c.key),
        demoColumns: preferredColumns,
      }),
    [source, data.columns, tableRows]
  )

  const { openFromKpi, openFromChart, Modal } = useDrillDown({
    live,
    tableRows: filtered,
    columns,
    datasetTitle: 'NAFU / SAFU Source',
    pageFilters: moduleFilters.filters,
  })

  return (
    <div>
      <Modal />
      <PageHeader
        title="NAFU / SAFU Source"
        description={
          live
            ? pageHeaderDescription(
                data.schema ?? 'dmart_mp.m_nafu_safu_source',
                'Source feed of suspicious triggers, risk scores, and SAFU actions'
              )
            : 'Connect the backend to load NAFU / SAFU source records'
        }
        badge={<DataSourceBadge source={source} db={db} loading={loading} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      <ModuleFilterBar
        title={moduleFilters.meta.title}
        subtitle={moduleFilters.meta.subtitle}
        searchPlaceholder={moduleFilters.meta.searchPlaceholder}
        fields={moduleFilters.resolvedFields}
        values={moduleFilters.filters}
        onChange={moduleFilters.setFilter}
        search={moduleFilters.search}
        onSearchChange={moduleFilters.setSearch}
        onClear={moduleFilters.clearFilters}
        activeCount={moduleFilters.activeCount}
      />

      <DashboardReportsBanner
        reportPath="/dashboard/mp/reports/nafu-safu-source"
        buttonLabel="Open NAFU / SAFU Source Report →"
      />

      {kpis.length > 0 && (
        <KPIGrid
          kpis={kpis}
          onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })}
        />
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {byStatus.length > 0 && (
          <ChartCard title="By Status" exportData={byStatus}>
            <InteractivePieChart
              data={byStatus}
              colors={COLORS}
              innerRadius={50}
              chartTitle="NAFU Status"
              onItemClick={openFromChart}
            />
          </ChartCard>
        )}
        {byFraudFlag.length > 0 && (
          <ChartCard title="Fraud / Not Fraud" exportData={byFraudFlag}>
            <InteractivePieChart
              data={byFraudFlag}
              colors={COLORS}
              innerRadius={50}
              chartTitle="Fraud Flag"
              onItemClick={openFromChart}
            />
          </ChartCard>
        )}
        {byTriggerType.length > 0 && (
          <ChartCard title="By Trigger Type" exportData={byTriggerType}>
            <InteractiveBarChart
              data={byTriggerType}
              chartTitle="Trigger Type"
              layout="vertical"
              height={280}
              onItemClick={openFromChart}
              bars={[{ dataKey: 'value', fill: '#ea580c', name: 'Records' }]}
            />
          </ChartCard>
        )}
        {bySafuAction.length > 0 && (
          <ChartCard title="By SAFU Action" exportData={bySafuAction}>
            <InteractiveBarChart
              data={bySafuAction}
              chartTitle="SAFU Action"
              layout="vertical"
              height={280}
              onItemClick={openFromChart}
              bars={[{ dataKey: 'value', fill: '#7c3aed', name: 'Records' }]}
            />
          </ChartCard>
        )}
      </div>
    </div>
  )
}
