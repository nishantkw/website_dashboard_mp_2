import { useMemo } from 'react'
import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import ModuleFilterBar from '../../components/layout/ModuleFilterBar'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useModuleFilters } from '../../hooks/useModuleFilters'
import { getModuleFilters } from '../../data/moduleFilterConfig'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchPatients } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { KPI, TableColumn } from '../../types'

const SPECIALTY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#94a3b8']
const TYPE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#94a3b8']

const preferredColumns: TableColumn[] = [
  { key: 'registration_id', label: 'Reg ID' },
  { key: 'name', label: 'Name' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'district_code', label: 'District Code' },
  { key: 'gender', label: 'Gender' },
  { key: 'registration_date', label: 'Registration Date' },
  { key: 'ip_op', label: 'IP/OP' },
  { key: 'status_id', label: 'Status' },
]

const treatmentPreferred: TableColumn[] = [
  { key: 'registration_id', label: 'Reg ID' },
  { key: 'caseid', label: 'Case ID' },
  { key: 'item_id', label: 'Item ID' },
  { key: 'type', label: 'Type' },
  { key: 'type_desc', label: 'Specialty' },
  { key: 'date_on_which', label: 'Date' },
  { key: 'procedure_name', label: 'Procedure' },
  { key: 'procedure_code', label: 'Procedure Code' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'approved_amount', label: 'Approved Amount', align: 'right' },
  { key: 'status', label: 'Status' },
]

const morthPreferred: TableColumn[] = [
  { key: 'patient_registration_id', label: 'Reg ID' },
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'town', label: 'Town' },
  { key: 'accident_severity', label: 'Severity' },
  { key: 'date_of_accident', label: 'Accident Date' },
  { key: 'care_plan', label: 'Care Plan' },
  { key: 'patient_con_uncon', label: 'Conscious' },
  { key: 'govt_id_type', label: 'ID Type' },
  { key: 'collision_type', label: 'Collision' },
  { key: 'cause_of_accident', label: 'Cause' },
]

function filterRowsForMorthKpi<T extends Record<string, string | number>>(rows: T[], label: string): T[] | null {
  if (!/^morth\s+/i.test(label)) return null
  const key = label.replace(/^morth\s+/i, '').trim().toLowerCase()
  if (key === 'patients' || key === 'records') return rows
  if (key === 'male') return rows.filter((row) => /^(m|male)$/i.test(String(row.gender ?? '').trim()))
  if (key === 'female') return rows.filter((row) => /^(f|female)$/i.test(String(row.gender ?? '').trim()))
  if (key === 'unconscious') {
    return rows.filter((row) => /unconscious|^(y|yes|1)$/i.test(String(row.patient_con_uncon ?? '').trim()))
  }
  if (key === 'grievous') return rows.filter((row) => /grievous/i.test(String(row.accident_severity ?? '')))
  if (key === 'with govt id') return rows.filter((row) => Boolean(String(row.govt_id ?? '').trim()))
  return rows
}

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  treatmentTable: [] as Record<string, string | number>[],
  morthTable: [] as Record<string, string | number>[],
  columns: [] as string[],
  treatmentColumns: [] as string[],
  morthColumns: [] as string[],
  morthKpis: [] as KPI[],
}

export default function Patients() {
  const filterFields = useMemo(() => getModuleFilters('mp_patients'), [])
  const moduleFilters = useModuleFilters('mp_patients', filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchPatients(moduleFilters.queryString),
    EMPTY,
    [moduleFilters.queryString]
  )
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const charts = data.charts ?? {}
  const specialtyData = charts.specialty ?? []
  const procedureTypeData = charts.procedureType ?? []
  const statusData = charts.status ?? []
  const trendData = charts.trend ?? []
  const amountData = charts.amount ?? []
  const morthSeverity = charts.morthSeverity ?? []
  const morthGender = charts.morthGender ?? []
  const morthKpis = data.morthKpis ?? []

  const tableRows = (data.table ?? []) as Record<string, string | number>[]
  const treatmentRows = (data.treatmentTable ?? []) as Record<string, string | number>[]
  const morthRows = (data.morthTable ?? []) as Record<string, string | number>[]
  const filtered = live ? tableRows : moduleFilters.filterRows(tableRows)
  const treatmentFiltered = live ? treatmentRows : moduleFilters.filterRows(treatmentRows)
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
  const treatmentColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.treatmentColumns,
        rows: treatmentRows,
        preferredFirst: treatmentPreferred.map((c) => c.key),
      }),
    [source, data.treatmentColumns, treatmentRows]
  )
  const morthColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.morthColumns,
        rows: morthRows,
        preferredFirst: morthPreferred.map((c) => c.key),
      }),
    [source, data.morthColumns, morthRows]
  )

  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    tableRows: filtered,
    columns,
    datasetTitle: 'Patient Records',
    resolveContext: (chartTitle) => {
      if (/morth/i.test(chartTitle)) {
        return { rows: morthRows, columns: morthColumns, datasetTitle: 'MORTH Patients' }
      }
      if (/treatment|procedure/i.test(chartTitle)) {
        return { rows: treatmentFiltered, columns: treatmentColumns, datasetTitle: 'Treatment Details' }
      }
      return { rows: filtered, columns, datasetTitle: 'Patient Records' }
    },
  })

  const barHeight = (count: number, min = 220, max = 380) =>
    Math.min(max, Math.max(min, count * 36 + 72))

  const hasCharts =
    specialtyData.length > 0 ||
    procedureTypeData.length > 0 ||
    statusData.length > 0 ||
    trendData.length > 0 ||
    amountData.length > 0

  const handleKpi = (kpi: KPI) => {
    const morthFiltered = filterRowsForMorthKpi(morthRows, kpi.label)
    if (morthFiltered) {
      openDetail({
        title: kpi.label,
        subtitle: `${morthFiltered.length} record${morthFiltered.length === 1 ? '' : 's'}`,
        records: morthFiltered,
        columns: morthColumns,
        datasetTitle: 'MORTH Patients',
        source: live ? 'api' : 'demo',
      })
      return
    }
    if (/treatment|specialt|procedure/i.test(kpi.label)) {
      openDetail({
        title: kpi.label,
        subtitle: `${treatmentFiltered.length} record${treatmentFiltered.length === 1 ? '' : 's'}`,
        records: treatmentFiltered,
        columns: treatmentColumns,
        datasetTitle: 'Treatment Details',
        source: live ? 'api' : 'demo',
      })
      return
    }
    openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })
  }

  return (
    <div>
      <Modal />
      <PageHeader
        title="Patients & Treatment"
        description={
          live
            ? `${data.schema ?? 'dmart_mp.t_patient_dtls'} · ${data.treatmentSchema ?? 'dmart_mp.treatment_dtls'}${
                data.morthSchema ? ` · ${data.morthSchema}` : ''
              }`
            : 'Connect the backend to load patient and treatment records'
        }
        badge={<DataSourceBadge source={source} db={db} />}
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

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={handleKpi} />}

      {hasCharts && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {specialtyData.length > 0 && (
              <ChartCard title="Treatment Specialty" subtitle="From type_desc · top 8 + Others" exportData={specialtyData}>
                <InteractivePieChart
                  data={specialtyData}
                  colors={SPECIALTY_COLORS}
                  innerRadius={55}
                  chartTitle="Treatment Specialty"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
            {procedureTypeData.length > 0 && (
              <ChartCard title="Procedure Type" subtitle="From type (SB, SU, …)" exportData={procedureTypeData}>
                <InteractivePieChart
                  data={procedureTypeData}
                  colors={TYPE_COLORS}
                  innerRadius={55}
                  chartTitle="Procedure Type"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {statusData.length > 0 && (
              <ChartCard title="Treatment Status" exportData={statusData}>
                <InteractivePieChart
                  data={statusData}
                  colors={STATUS_COLORS}
                  innerRadius={55}
                  chartTitle="Treatment Status"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
            {trendData.length > 0 && (
              <ChartCard title="Treatment Trend" subtitle="Records by month (date_on_which)" exportData={trendData}>
                <InteractiveLineChart
                  data={trendData}
                  chartTitle="Treatment Trend"
                  height={260}
                  integerAxis
                  onItemClick={openFromChart}
                  lines={[{ dataKey: 'value', stroke: '#2563eb', name: 'Treatments' }]}
                />
              </ChartCard>
            )}
            {amountData.length > 0 && (
              <ChartCard title="Amount by Specialty" subtitle="Approved / net / amount" exportData={amountData}>
                <InteractiveBarChart
                  data={amountData}
                  chartTitle="Treatment Amount"
                  layout="vertical"
                  height={barHeight(amountData.length)}
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#f59e0b', name: 'Amount' }]}
                />
              </ChartCard>
            )}
          </div>
        </>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        title={`Patient Records (${filtered.length}${columns.length ? ` · ${columns.length} schema cols` : ''})`}
        onRowClick={(row) =>
          openDetail({
            title: String(row.registration_id || row.name || 'Patient'),
            subtitle: 'Schema record',
            data: row,
          })
        }
      />

      {(morthRows.length > 0 || morthColumns.length > 0) && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">MORTH patients — dmart_mp.t_morth_patient_details</p>
            <p className="text-xs text-slate-500">
              Road-accident patient registry (eDAR / MORTH care plan, severity, hospital). Columns match Result 18.csv.
            </p>
          </div>
          {morthKpis.length > 0 && <KPIGrid kpis={morthKpis} onKpiClick={handleKpi} />}
          {(morthSeverity.length > 0 || morthGender.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {morthSeverity.length > 0 && (
                <ChartCard title="Accident Severity" subtitle="accident_severity" exportData={morthSeverity}>
                  <InteractivePieChart
                    data={morthSeverity}
                    colors={STATUS_COLORS}
                    innerRadius={55}
                    chartTitle="MORTH Accident Severity"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {morthGender.length > 0 && (
                <ChartCard title="MORTH Gender" subtitle="gender" exportData={morthGender}>
                  <InteractivePieChart
                    data={morthGender}
                    colors={['#3b82f6', '#ec4899', '#8b5cf6']}
                    innerRadius={55}
                    chartTitle="MORTH Gender"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={morthColumns}
            data={morthRows}
            title={`MORTH Patients — dmart_mp.t_morth_patient_details (${morthRows.length}${
              morthColumns.length ? ` · ${morthColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.name || row.patient_registration_id || row.id_pk || 'MORTH patient'),
                subtitle: String(row.hospital_name || 'dmart_mp.t_morth_patient_details'),
                data: row,
                columns: morthColumns,
              })
            }
          />
        </>
      )}

      <div className="mt-5">
        <DataTable
          columns={treatmentColumns}
          data={treatmentFiltered}
          title={`Treatment Details — dmart_mp.treatment_dtls (${treatmentFiltered.length}${
            treatmentColumns.length ? ` · ${treatmentColumns.length} schema cols` : ''
          })`}
          onRowClick={(row) =>
            openDetail({
              title: String(row.caseid || row.registration_id || 'Treatment'),
              subtitle: 'dmart_mp.treatment_dtls',
              data: row,
              columns: treatmentColumns,
            })
          }
        />
      </div>
    </div>
  )
}
