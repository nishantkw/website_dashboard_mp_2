import { useMemo } from 'react'
import DashboardReportsBanner from '../../components/ui/DashboardReportsBanner'
import ChartCard from '../../components/ui/ChartCard'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart } from '../../components/charts/InteractiveCharts'
import ModuleFilterBar from '../../components/layout/ModuleFilterBar'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useModuleFilters } from '../../hooks/useModuleFilters'
import { getModuleFilters } from '../../data/moduleFilterConfig'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchIcdDoctors } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { pageHeaderDescription } from '../../utils/displayLabels'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { ChartDataPoint, KPI, TableColumn } from '../../types'

/** Columns/labels for icd_data_doctor_details only — not shared with Doctor Details page. */
const preferredColumns: TableColumn[] = [
  { key: 'code', label: 'ICD Code' },
  { key: 'display', label: 'ICD Display' },
  { key: 'type', label: 'ICD Type' },
  { key: 'typedescription', label: 'Type Description' },
  { key: 'id', label: 'ICD Row ID' },
  { key: 'idpk', label: 'ICD PK' },
  { key: 'registration_id', label: 'ICD Registration ID' },
  { key: 'case_id', label: 'ICD Case ID' },
  { key: 'patient_state_code', label: 'ICD State Code' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: { byType: [] as ChartDataPoint[], byCode: [] as ChartDataPoint[] },
  table: [] as Record<string, string | number>[],
  columns: [] as string[],
}

export default function IcdDoctorDetails() {
  const filterFields = useMemo(() => getModuleFilters('mp_icd_doctors'), [])
  const moduleFilters = useModuleFilters('mp_icd_doctors', filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchIcdDoctors(moduleFilters.queryString),
    EMPTY,
    [moduleFilters.queryString]
  )
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const tableRows = (data.table ?? []) as Record<string, string | number>[]
  const filtered = moduleFilters.filterRows(tableRows)
  const byType = data.charts?.byType ?? []
  const byCode = data.charts?.byCode ?? []
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
    datasetTitle: 'ICD Doctor Details',
    pageFilters: moduleFilters.filters,
  })

  return (
    <div>
      <Modal />
      <PageHeader
        title="ICD Doctor Details"
        description={
          live
            ? pageHeaderDescription(
                data.schema ?? 'dmart_mp.icd_data_doctor_details',
                'ICD codes and display text by case — separate from Doctor Details (name / reg. no.)'
              )
            : 'Connect the backend to load ICD doctor details'
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
        reportPath="/dashboard/mp/reports/icd-doctors"
        buttonLabel="Open ICD Doctor Details Report →"
      />

      {kpis.length > 0 && (
        <KPIGrid
          kpis={kpis}
          onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })}
        />
      )}

      {(byType.length > 0 || byCode.length > 0) && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {byType.length > 0 && (
            <ChartCard title="ICD Records by Type" exportData={byType}>
              <InteractiveBarChart
                data={byType}
                chartTitle="ICD Type"
                layout="vertical"
                height={300}
                onItemClick={openFromChart}
                bars={[{ dataKey: 'value', fill: '#6366f1', name: 'Records' }]}
              />
            </ChartCard>
          )}
          {byCode.length > 0 && (
            <ChartCard title="Top ICD Codes" exportData={byCode}>
              <InteractiveBarChart
                data={byCode}
                chartTitle="ICD Code"
                layout="vertical"
                height={300}
                onItemClick={openFromChart}
                bars={[{ dataKey: 'value', fill: '#8b5cf6', name: 'Records' }]}
              />
            </ChartCard>
          )}
        </div>
      )}
    </div>
  )
}
