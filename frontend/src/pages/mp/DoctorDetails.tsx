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
import { fetchDoctors } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { pageHeaderDescription } from '../../utils/displayLabels'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { ChartDataPoint, KPI, TableColumn } from '../../types'

/** Columns/labels for doctor_details_with_registartionandcaseid only — not shared with ICD page. */
const preferredColumns: TableColumn[] = [
  { key: 'docregnum', label: 'Doctor Reg. No.' },
  { key: 'docname', label: 'Doctor Name' },
  { key: 'docqualification', label: 'Qualification' },
  { key: 'doccontactnumber', label: 'Contact Number' },
  { key: 'registration_id', label: 'Doctor Page Registration ID' },
  { key: 'case_id', label: 'Doctor Page Case ID' },
  { key: 'patient_state_code', label: 'Doctor Page State Code' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: { qualification: [] as ChartDataPoint[] },
  table: [] as Record<string, string | number>[],
  columns: [] as string[],
}

export default function DoctorDetails() {
  const filterFields = useMemo(() => getModuleFilters('mp_doctors'), [])
  const moduleFilters = useModuleFilters('mp_doctors', filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchDoctors(moduleFilters.queryString),
    EMPTY,
    [moduleFilters.queryString]
  )
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const tableRows = (data.table ?? []) as Record<string, string | number>[]
  const filtered = moduleFilters.filterRows(tableRows)
  const qualification = data.charts?.qualification ?? []
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
    datasetTitle: 'Doctor Details',
    pageFilters: moduleFilters.filters,
  })

  return (
    <div>
      <Modal />
      <PageHeader
        title="Doctor Details"
        description={
          live
            ? pageHeaderDescription(
                data.schema ?? 'dmart_mp.doctor_details_with_registartionandcaseid',
                'Doctor name, reg. no., qualification & contact — separate from ICD Doctor Details'
              )
            : 'Connect the backend to load doctor details'
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
        reportPath="/dashboard/mp/reports/doctors"
        buttonLabel="Open Doctor Details Report →"
      />

      {kpis.length > 0 && (
        <KPIGrid
          kpis={kpis}
          onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })}
        />
      )}

      {qualification.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4">
          <ChartCard title="Doctors by Qualification" exportData={qualification}>
            <InteractiveBarChart
              data={qualification}
              chartTitle="Doctor Qualification"
              layout="vertical"
              height={320}
              onItemClick={openFromChart}
              bars={[{ dataKey: 'value', fill: '#0d9488', name: 'Doctors' }]}
            />
          </ChartCard>
        </div>
      )}
    </div>
  )
}
