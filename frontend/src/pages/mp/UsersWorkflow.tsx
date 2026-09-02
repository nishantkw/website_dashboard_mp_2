import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useMemo } from 'react'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useModuleFilters } from '../../hooks/useModuleFilters'
import { getModuleFilters } from '../../data/moduleFilterConfig'
import ModuleFilterBar from '../../components/layout/ModuleFilterBar'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchWorkflow } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { KPI, TableColumn } from '../../types'

const ROLE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316']
const STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
const PROCESS_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
const SCHEME_COLORS = ['#1a5c38', '#f59e0b', '#94a3b8', '#3b82f6']

const preferredColumns: TableColumn[] = [
  { key: 'workflow_user', label: 'User' },
  { key: 'user_id', label: 'User ID' },
  { key: 'workflow_role', label: 'Role' },
  { key: 'workflow_process_code', label: 'Process' },
  { key: 'status_descrption', label: 'Status / Remarks' },
  { key: 'created_dt', label: 'Created' },
  { key: 'registration_id', label: 'Reg ID' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'patient_district_name', label: 'District' },
]

const auditPreferredColumns: TableColumn[] = [
  { key: 'acted_workflow_user', label: 'User' },
  { key: 'previous_workflow_role', label: 'Role' },
  { key: 'workflow_process_code', label: 'Process' },
  { key: 'scheme_code', label: 'Scheme' },
  { key: 'remarks', label: 'Remarks' },
  { key: 'created_dt', label: 'Created' },
]

const proPreferredColumns: TableColumn[] = [
  { key: 'id_pk', label: 'ID' },
  { key: 'registration_id', label: 'Reg ID' },
  { key: 'workflow_user', label: 'User' },
  { key: 'user_name', label: 'User Name' },
  { key: 'workflow_role', label: 'Role' },
  { key: 'workflow_process_code', label: 'Process' },
  { key: 'status_descrption', label: 'Status' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'patient_district_name', label: 'District' },
  { key: 'initiated_amount', label: 'Initiated', align: 'right' },
  { key: 'approved_amount', label: 'Approved', align: 'right' },
  { key: 'service_request_type', label: 'Service Request' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  audit: [] as Record<string, string | number>[],
  proTable: [] as Record<string, string | number>[],
  columns: [] as string[],
  auditColumns: [] as string[],
  proColumns: [] as string[],
  proKpis: [] as KPI[],
}

export default function UsersWorkflow() {
  const filterFields = useMemo(() => getModuleFilters('mp_workflow'), [])
  const moduleFilters = useModuleFilters('mp_workflow', filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchWorkflow(moduleFilters.queryString),
    EMPTY,
    [moduleFilters.queryString]
  )
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const charts = data.charts ?? {}
  const roleData = charts.roleDistribution ?? []
  const statusData = charts.workflowStatus ?? []
  const processData = charts.process ?? []
  const districtData = charts.district ?? []
  const hospitalData = charts.hospital ?? []
  const auditRoleData = charts.auditRole ?? []
  const auditProcessData = charts.auditProcess ?? []
  const schemeData = charts.scheme ?? []
  const auditTrend = charts.auditTrend ?? []
  const proProcess = charts.proProcess ?? []
  const proRole = charts.proRole ?? []
  const proService = charts.proService ?? []
  const proHospitalType = charts.proHospitalType ?? []
  const proStatus = charts.proStatus ?? []
  const proKpis = data.proKpis ?? []
  const tableRows = (data.table ?? []) as Record<string, string | number>[]
  const auditRows = (data.audit ?? []) as Record<string, string | number>[]
  const proRows = (data.proTable ?? []) as Record<string, string | number>[]
  const filtered = live ? tableRows : moduleFilters.filterRows(tableRows)
  const tableColumns = useMemo(
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
  const auditColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.auditColumns,
        rows: auditRows,
        preferredFirst: auditPreferredColumns.map((c) => c.key),
        demoColumns: auditPreferredColumns,
      }),
    [source, data.auditColumns, auditRows]
  )
  const proColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.proColumns,
        rows: proRows,
        preferredFirst: proPreferredColumns.map((c) => c.key),
      }),
    [source, data.proColumns, proRows]
  )

  const { openFromChart, openDetail, Modal } = useDrillDown({
    live,
    tableRows: filtered,
    columns: tableColumns,
    datasetTitle: 'Workflow User Records',
    resolveContext: (chartTitle) => {
      if (/pro workflow/i.test(chartTitle)) {
        return { rows: proRows, columns: proColumns, datasetTitle: 'Pro Workflow Users' }
      }
      if (/audit/i.test(chartTitle) || /scheme/i.test(chartTitle)) {
        return { rows: auditRows, columns: auditColumns, datasetTitle: 'Audit Events' }
      }
      return { rows: filtered, columns: tableColumns, datasetTitle: 'Workflow User Records' }
    },
  })

  const barHeight = (count: number, min = 220, max = 400) =>
    Math.min(max, Math.max(min, count * 36 + 72))

  const hasCharts =
    roleData.length > 0 ||
    statusData.length > 0 ||
    processData.length > 0 ||
    districtData.length > 0 ||
    hospitalData.length > 0 ||
    auditRoleData.length > 0 ||
    auditProcessData.length > 0 ||
    schemeData.length > 0 ||
    auditTrend.length > 0

  const handleKpi = (kpi: KPI) => {
    const label = kpi.label
    let records = filtered
    let cols = tableColumns
    let dataset = 'Workflow User Records'
    if (label === 'Audit Events') {
      records = auditRows
      cols = auditColumns
      dataset = 'Audit Events'
    } else if (/^pro /i.test(label)) {
      records = proRows
      cols = proColumns
      dataset = 'Pro Workflow Users'
    } else if (label === 'Claim Process') {
      records = filtered.filter((r) => /^CLM/i.test(String(r.workflow_process_code || '').trim()))
    } else if (label === 'Hospitals') {
      records = filtered.filter((r) => String(r.hospital_name || '').trim())
    } else if (label === 'Districts') {
      records = filtered.filter((r) => String(r.patient_district_name || r.hosp_district_name || '').trim())
    }
    openDetail({
      title: label,
      subtitle: `${records.length} record${records.length === 1 ? '' : 's'}`,
      records,
      columns: cols,
      datasetTitle: dataset,
      source: live ? 'api' : 'demo',
    })
  }

  return (
    <div>
      <Modal />
      <PageHeader
        title="Users & Workflow"
        description={
          live
            ? `${data.schema ?? 'dmart_mp.workflow_users_t'} — unique users and roles from imported workflow data`
            : 'Connect the backend to load workflow records'
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
            {roleData.length > 0 && (
              <ChartCard title="Role Distribution" exportData={roleData}>
                <InteractivePieChart
                  data={roleData}
                  colors={ROLE_COLORS}
                  innerRadius={55}
                  chartTitle="Role Distribution"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
            {processData.length > 0 && (
              <ChartCard title="Workflow Process" subtitle="CLM_T / PRE_T from workflow_users_t" exportData={processData}>
                <InteractivePieChart
                  data={processData}
                  colors={PROCESS_COLORS}
                  innerRadius={55}
                  chartTitle="Workflow Process"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
          </div>

          {statusData.length > 0 && (
            <div className="mb-4">
              <ChartCard title="Workflow Status" subtitle="status_descrption" exportData={statusData}>
                <InteractiveBarChart
                  data={statusData}
                  chartTitle="Workflow Status"
                  layout="vertical"
                  height={Math.max(280, statusData.length * 52)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#10b981', name: 'Users' }]}
                  cellColors={STATUS_COLORS}
                />
              </ChartCard>
            </div>
          )}

          {districtData.length > 0 && (
            <div className="mb-4">
              <ChartCard title="Workflow Districts" exportData={districtData}>
                <InteractiveBarChart
                  data={districtData}
                  chartTitle="Workflow Districts"
                  layout="vertical"
                  height={Math.max(240, districtData.length * 48)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Users' }]}
                />
              </ChartCard>
            </div>
          )}

          {hospitalData.length > 0 && (
            <div className="mb-4">
              <ChartCard
                title="Workflow Hospitals"
                subtitle="Hover a bar for the full hospital name"
                exportData={hospitalData}
              >
                <InteractiveBarChart
                  data={hospitalData}
                  chartTitle="Workflow Hospitals"
                  layout="vertical"
                  height={Math.max(280, hospitalData.length * 58)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#8b5cf6', name: 'Users' }]}
                />
              </ChartCard>
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {auditRoleData.length > 0 && (
              <ChartCard title="Audit Roles" subtitle="previous_workflow_role" exportData={auditRoleData}>
                <InteractivePieChart
                  data={auditRoleData}
                  colors={ROLE_COLORS}
                  innerRadius={55}
                  chartTitle="Audit Role"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
            {auditProcessData.length > 0 && (
              <ChartCard title="Audit Process" subtitle="workflow_process_code on audit" exportData={auditProcessData}>
                <InteractiveBarChart
                  data={auditProcessData}
                  chartTitle="Audit Process"
                  layout="vertical"
                  height={barHeight(auditProcessData.length)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#06b6d4', name: 'Events' }]}
                />
              </ChartCard>
            )}
            {schemeData.length > 0 && (
              <ChartCard title="Scheme" subtitle="scheme_code on audit" exportData={schemeData}>
                <InteractivePieChart
                  data={schemeData}
                  colors={SCHEME_COLORS}
                  innerRadius={55}
                  chartTitle="Scheme"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
            {auditTrend.length > 0 && (
              <ChartCard title="Audit Trend" subtitle="Events by month (created_dt)" exportData={auditTrend}>
                <InteractiveLineChart
                  data={auditTrend}
                  chartTitle="Audit Trend"
                  height={260}
                  integerAxis
                  onItemClick={openFromChart}
                  lines={[{ dataKey: 'value', stroke: '#2563eb', name: 'Events' }]}
                />
              </ChartCard>
            )}
          </div>
        </>
      )}

      <DataTable
        columns={tableColumns}
        data={filtered}
        title={`Workflow Users (${filtered.length}${tableColumns.length ? ` · ${tableColumns.length} schema cols` : ''})`}
        onRowClick={(row) =>
          openDetail({
            title: String(row.workflow_user || row.registration_id || 'User'),
            subtitle: 'Unique workflow user',
            data: row,
          })
        }
      />

      {auditRows.length > 0 && (
        <div className="mt-4">
          <DataTable
            columns={auditColumns}
            data={auditRows}
            title={`Audit Events (${auditRows.length}${auditColumns.length ? ` · ${auditColumns.length} schema cols` : ''})`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.acted_workflow_user || row.work_id_pk || row.id_pk || 'Audit'),
                subtitle: String(row.previous_workflow_role || row.workflow_process_code || 'Audit event'),
                data: row,
                columns: auditColumns,
              })
            }
          />
        </div>
      )}

      {proRows.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">Pro workflow users — dmart_mp.pro_workflow_users_t</p>
            <p className="text-xs text-slate-500">
              Processed workflow assignments with initiated/approved amounts, TAT and service request type
            </p>
          </div>
          {proKpis.length > 0 && <KPIGrid kpis={proKpis} onKpiClick={handleKpi} />}
          {(proProcess.length > 0 || proRole.length > 0 || proService.length > 0 || proHospitalType.length > 0 || proStatus.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {proProcess.length > 0 && (
                <ChartCard title="Pro Workflow Process" subtitle="workflow_process_code" exportData={proProcess}>
                  <InteractivePieChart
                    data={proProcess}
                    colors={PROCESS_COLORS}
                    innerRadius={55}
                    chartTitle="Pro Workflow Process"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {proRole.length > 0 && (
                <ChartCard title="Pro Workflow Role" subtitle="workflow_role" exportData={proRole}>
                  <InteractivePieChart
                    data={proRole}
                    colors={ROLE_COLORS}
                    innerRadius={55}
                    chartTitle="Pro Workflow Role"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {proService.length > 0 && (
                <ChartCard title="Pro Workflow Service" subtitle="service_request_type" exportData={proService}>
                  <InteractiveBarChart
                    data={proService}
                    chartTitle="Pro Workflow Service"
                    layout="vertical"
                    height={barHeight(proService.length)}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#2563eb', name: 'Records' }]}
                  />
                </ChartCard>
              )}
              {proHospitalType.length > 0 && (
                <ChartCard title="Pro Workflow Hospital Type" subtitle="hospital_type" exportData={proHospitalType}>
                  <InteractiveBarChart
                    data={proHospitalType}
                    chartTitle="Pro Workflow Hospital Type"
                    height={240}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#10b981', name: 'Records' }]}
                    cellColors={['#10b981', '#6366f1', '#94a3b8']}
                  />
                </ChartCard>
              )}
              {proStatus.length > 0 && (
                <ChartCard title="Pro Workflow Status" subtitle="status_descrption" exportData={proStatus}>
                  <InteractiveBarChart
                    data={proStatus}
                    chartTitle="Pro Workflow Status"
                    layout="vertical"
                    height={barHeight(proStatus.length, 240, 420)}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#f59e0b', name: 'Records' }]}
                    cellColors={STATUS_COLORS}
                  />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={proColumns}
            data={proRows}
            title={`Pro Workflow Users — dmart_mp.pro_workflow_users_t (${proRows.length}${
              proColumns.length ? ` · ${proColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.workflow_user || row.user_name || row.registration_id || 'Pro user'),
                subtitle: 'dmart_mp.pro_workflow_users_t',
                data: row,
                columns: proColumns,
              })
            }
          />
        </>
      )}
    </div>
  )
}
