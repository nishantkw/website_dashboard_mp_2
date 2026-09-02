import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useMemo } from 'react'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchFraud } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import StackedHeading from '../../components/ui/StackedHeading'
import { schemaTableColumns } from '../../utils/schemaColumns'
import { SAFU_VIEW_CONFIG, type SafuView } from '../../data/safuConfig'
import {
  FRAUD_VIEW_TABLES,
  FRAUD_SCHEMA_TABLES,
  schemaColumns,
  FRAUD_CASE_COLUMNS,
  FRAUD_TRIGGER_COLUMNS,
  HOSPITAL_MASTER_COLUMNS,
  WORKFLOW_USERS_COLUMNS,
  WORKFLOW_AUDIT_COLUMNS,
} from '../../data/fraudSchema'
import { filterRowsForFraudKpi } from '../../utils/fraudAggregations'
import type { KPI } from '../../types'

const FRAUD_TYPE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#dc2626', '#b91c1c']
const ENTITY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981']
const TRIGGER_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#3b82f6', '#06b6d4']
const APP_COLORS = ['#dc2626', '#2563eb', '#059669', '#7c3aed']
const STATUS_COLORS = ['#f59e0b', '#ef4444', '#dc2626', '#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#94a3b8']

const COLUMN_FALLBACK = {
  case: FRAUD_CASE_COLUMNS,
  trigger: FRAUD_TRIGGER_COLUMNS,
  hospital: HOSPITAL_MASTER_COLUMNS,
  workflowUsers: WORKFLOW_USERS_COLUMNS,
  workflowAudit: WORKFLOW_AUDIT_COLUMNS,
} as const

const DATA_FIELD: Record<string, string> = {
  case: 'table',
  trigger: 'triggerTable',
  hospital: 'hospitalTable',
  workflowUsers: 'workflowUsers',
  workflowAudit: 'workflowAudit',
}

const COLUMN_FIELD: Record<string, string> = {
  case: 'columns',
  trigger: 'triggerColumns',
  hospital: 'hospitalColumns',
  workflowUsers: 'workflowUsersColumns',
  workflowAudit: 'workflowAuditColumns',
}

const EMPTY = {
  view: 'overall' as const,
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  triggerTable: [] as Record<string, string | number>[],
  hospitalTable: [] as Record<string, string | number>[],
  workflowUsers: [] as Record<string, string | number>[],
  workflowAudit: [] as Record<string, string | number>[],
  columns: [] as string[],
  triggerColumns: [] as string[],
  hospitalColumns: [] as string[],
  workflowUsersColumns: [] as string[],
  workflowAuditColumns: [] as string[],
}

interface SafuMisDashboardProps {
  view: SafuView
  hideHeader?: boolean
  filterRows?: <T extends Record<string, string | number>>(rows: T[], tableColumns?: string[]) => T[]
  queryString?: string
}

export default function SafuMisDashboard({
  view,
  hideHeader = false,
  filterRows: applyFilters = (rows) => rows,
  queryString = '',
}: SafuMisDashboardProps) {
  const config = SAFU_VIEW_CONFIG[view]
  const { data, source, db, loading, error } = useApiResource(
    () => fetchFraud(view, queryString),
    EMPTY,
    [view, queryString]
  )

  const live = source === 'api'
  const kpis: KPI[] = data.kpis ?? []
  const charts = data.charts ?? {}
  const fraudType = charts.fraudType ?? []
  const triggerType = charts.triggerType ?? []
  const district = charts.district ?? []
  const entityType = charts.entityType ?? []
  const applicationType = charts.applicationType ?? []
  const amountRecovered = charts.amountRecovered ?? []
  const byDoctor = charts.byDoctor ?? []
  const byOfficer = charts.byOfficer ?? []
  const statusBreakdown = charts.statusBreakdown ?? []
  const amountByDoctor = charts.amountByDoctor ?? []
  const workloadByStatus = charts.workloadByStatus ?? []
  const triggerCode = charts.triggerCode ?? []
  const triggerTrend = charts.triggerTrend ?? []
  const hospitalTypeOutcomes = charts.hospitalTypeOutcomes ?? []

  const viewTables = FRAUD_VIEW_TABLES[view] ?? []

  const tableBlocks = useMemo(() => {
    return viewTables.map((spec) => {
      const dataField = DATA_FIELD[spec.tableKey]
      const colField = COLUMN_FIELD[spec.tableKey]
      const rows = ((data as Record<string, unknown>)[dataField] ?? []) as Record<string, string | number>[]
      const schemaKeys = ((data as Record<string, unknown>)[colField] ?? spec.columnKeys) as string[] | readonly string[]
      const cols = schemaTableColumns({
        source,
        schemaKeys: Array.isArray(schemaKeys) ? schemaKeys : [...spec.columnKeys],
        rows,
        preferredFirst:
          spec.tableKey === 'hospital' ? [...spec.columnKeys] : [...spec.columnKeys].slice(0, 6),
        demoColumns: COLUMN_FALLBACK[spec.tableKey as keyof typeof COLUMN_FALLBACK],
      })
      const allowedKeys = new Set(cols.map((c) => c.key))
      const schemaRows = applyFilters(
        rows.map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => allowedKeys.has(k)))),
        [...spec.columnKeys]
      )
      return { spec, rows: schemaRows, cols }
    })
  }, [viewTables, data, source, applyFilters])

  const schemaLabel = Object.values(FRAUD_SCHEMA_TABLES).join(' · ')
  const hasCharts =
    fraudType.length > 0 ||
    triggerType.length > 0 ||
    district.length > 0 ||
    entityType.length > 0 ||
    applicationType.length > 0 ||
    byDoctor.length > 0 ||
    byOfficer.length > 0 ||
    statusBreakdown.length > 0 ||
    triggerCode.length > 0 ||
    triggerTrend.length > 0

  const barHeight = (count: number, min = 240, max = 420) =>
    Math.min(max, Math.max(min, count * 36 + 72))

  const caseBlock = tableBlocks.find((b) => b.spec.tableKey === 'case')
  const triggerBlock = tableBlocks.find((b) => b.spec.tableKey === 'trigger')
  const workflowBlock = tableBlocks.find((b) => b.spec.tableKey === 'workflowUsers')

  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    resolveContext: (chartTitle) => {
      const t = chartTitle.toLowerCase()
      if (t.includes('trigger type') || t.includes('trigger code') || t.includes('trigger trend') || t.includes('trigger types')) {
        return triggerBlock
          ? { rows: triggerBlock.rows, columns: triggerBlock.cols, datasetTitle: triggerBlock.spec.title }
          : null
      }
      if (t.includes('sha-afo') || t.includes('officer') || t.includes('workload')) {
        return workflowBlock
          ? { rows: workflowBlock.rows, columns: workflowBlock.cols, datasetTitle: workflowBlock.spec.title }
          : caseBlock
            ? { rows: caseBlock.rows, columns: caseBlock.cols, datasetTitle: caseBlock.spec.title }
            : null
      }
      if (t.includes('doctor') || t.includes('investigator')) {
        return caseBlock
          ? { rows: caseBlock.rows, columns: caseBlock.cols, datasetTitle: caseBlock.spec.title }
          : null
      }
      return caseBlock
        ? { rows: caseBlock.rows, columns: caseBlock.cols, datasetTitle: caseBlock.spec.title }
        : null
    },
    tableRows: caseBlock?.rows,
    columns: caseBlock?.cols,
    datasetTitle: 'Fraud & Audit Records',
  })

  const handleKpi = (kpi: KPI) => {
    const matched = filterRowsForFraudKpi(kpi.label, caseBlock?.rows ?? [], triggerBlock?.rows ?? [])
    if (matched) {
      const block = matched.source === 'trigger' ? triggerBlock : caseBlock
      openDetail({
        title: kpi.label,
        subtitle: `${matched.rows.length} record${matched.rows.length === 1 ? '' : 's'}`,
        records: matched.rows,
        columns: block?.cols,
        datasetTitle: block?.spec.title ?? 'Fraud & Audit Records',
        source: live ? 'api' : 'demo',
      })
      return
    }
    openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })
  }

  return (
    <div>
      <Modal />
      {!hideHeader && (
        <PageHeader
          title={config.title}
          description={
            live
              ? `${config.frSection} — ${schemaLabel}`
              : 'Connect the backend to load fraud & audit records'
          }
          badge={<DataSourceBadge source={source} db={db} />}
        />
      )}
      {hideHeader && (
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <StackedHeading
            size="page"
            titleAs="h2"
            title={config.title}
            subtitle={`${config.frSection} — columns from Data dictionary / schema tables only`}
            className="min-w-0 flex-1"
          />
          <div className="shrink-0">
            <DataSourceBadge source={source} db={db} />
          </div>
        </div>
      )}
      <BackendOfflineNotice error={error} loading={loading} />

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={handleKpi} />}

      {hasCharts && view === 'doctor-wise' && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {byDoctor.length > 0 && (
              <ChartCard title="Cases by SAFU Doctor" subtitle="Grouped by investigator" exportData={byDoctor}>
                <InteractiveBarChart
                  data={byDoctor}
                  chartTitle="SAFU Doctor Cases"
                  layout="vertical"
                  height={barHeight(byDoctor.length)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'cases', fill: '#dc2626', name: 'Cases' }]}
                />
              </ChartCard>
            )}
            {statusBreakdown.length > 0 && (
              <ChartCard title="Investigation Status Breakdown" exportData={statusBreakdown}>
                <InteractivePieChart data={statusBreakdown} colors={STATUS_COLORS} innerRadius={55} chartTitle="Case Status" onItemClick={openFromChart} />
              </ChartCard>
            )}
          </div>
          {(amountByDoctor.length > 0 || fraudType.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {amountByDoctor.length > 0 && (
                <ChartCard title="Amount at Risk by Doctor" subtitle="Sum of amount_risk per investigator" exportData={amountByDoctor}>
                  <InteractiveBarChart
                    data={amountByDoctor}
                    chartTitle="Amount at Risk by Doctor"
                    layout="vertical"
                    height={barHeight(amountByDoctor.length)}
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#f97316', name: 'Amount at Risk (₹)' }]}
                  />
                </ChartCard>
              )}
              {fraudType.length > 0 && (
                <ChartCard title="Fraud Type Distribution" exportData={fraudType}>
                  <InteractivePieChart data={fraudType} colors={FRAUD_TYPE_COLORS} innerRadius={55} chartTitle="Fraud Types" onItemClick={openFromChart} />
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      {hasCharts && view === 'sha-afo-wise' && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {byOfficer.length > 0 && (
              <ChartCard title="Cases by SHA-AFO Officer" subtitle="Grouped by workflow_user" exportData={byOfficer}>
                <InteractiveBarChart
                  data={byOfficer}
                  chartTitle="SHA-AFO Officer Cases"
                  layout="vertical"
                  height={barHeight(byOfficer.length)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'cases', fill: '#2563eb', name: 'Cases' }]}
                />
              </ChartCard>
            )}
            {statusBreakdown.length > 0 && (
              <ChartCard title="Case Status Breakdown" exportData={statusBreakdown}>
                <InteractivePieChart data={statusBreakdown} colors={STATUS_COLORS} innerRadius={55} chartTitle="Case Status" onItemClick={openFromChart} />
              </ChartCard>
            )}
          </div>
          {(workloadByStatus.length > 0 || district.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {workloadByStatus.length > 0 && (
                <ChartCard title="Workload by Status" subtitle="Officer workload distribution" exportData={workloadByStatus}>
                  <InteractiveBarChart
                    data={workloadByStatus}
                    chartTitle="Workload by Status"
                    layout="vertical"
                    height={barHeight(workloadByStatus.length)}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'cases', fill: '#8b5cf6', name: 'Records' }]}
                  />
                </ChartCard>
              )}
              {district.length > 0 && (
                <ChartCard title="Cases by District" exportData={district}>
                  <InteractiveBarChart
                    data={district}
                    chartTitle="District Cases"
                    layout="vertical"
                    height={barHeight(district.length)}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#ef4444', name: 'Cases' }]}
                  />
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      {hasCharts && view === 'trigger-analytics' && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {triggerType.length > 0 && (
              <ChartCard title="Trigger Type Distribution" exportData={triggerType}>
                <InteractiveBarChart data={triggerType} chartTitle="Trigger Types" height={260} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#dc2626', name: 'Triggers' }]} cellColors={TRIGGER_COLORS} />
              </ChartCard>
            )}
            {triggerCode.length > 0 && (
              <ChartCard title="Top Trigger Codes" exportData={triggerCode}>
                <InteractiveBarChart
                  data={triggerCode}
                  chartTitle="Trigger Codes"
                  layout="vertical"
                  height={barHeight(triggerCode.length)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#7c3aed', name: 'Triggers' }]}
                />
              </ChartCard>
            )}
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {triggerTrend.length > 0 && (
              <ChartCard title="Trigger Volume Trend" subtitle="Triggers by month" exportData={triggerTrend}>
                <InteractiveLineChart
                  data={triggerTrend}
                  chartTitle="Trigger Volume Trend"
                  height={260}
                  integerAxis
                  onItemClick={openFromChart}
                  lines={[{ dataKey: 'value', stroke: '#dc2626', name: 'Triggers' }]}
                />
              </ChartCard>
            )}
            {applicationType.length > 0 && (
              <ChartCard title="Application Type" exportData={applicationType}>
                <InteractivePieChart data={applicationType} colors={APP_COLORS} innerRadius={55} chartTitle="Application Types" onItemClick={openFromChart} />
              </ChartCard>
            )}
          </div>
          {(hospitalTypeOutcomes.length > 0 || statusBreakdown.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {hospitalTypeOutcomes.length > 0 && (
                <ChartCard title="Outcomes by Hospital Type" subtitle="Fraud vs Non-Fraud in Public / Private" exportData={hospitalTypeOutcomes}>
                  <InteractiveBarChart
                    data={hospitalTypeOutcomes}
                    chartTitle="Hospital Type Outcomes"
                    height={260}
                    showLegend
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[
                      { dataKey: 'fraud', fill: '#dc2626', name: 'Fraud' },
                      { dataKey: 'nonFraud', fill: '#10b981', name: 'Non-Fraud' },
                      { dataKey: 'other', fill: '#94a3b8', name: 'Other' },
                    ]}
                  />
                </ChartCard>
              )}
              {statusBreakdown.length > 0 && (
                <ChartCard title="Case Outcome Breakdown" exportData={statusBreakdown}>
                  <InteractivePieChart data={statusBreakdown} colors={STATUS_COLORS} innerRadius={55} chartTitle="Case Outcomes" onItemClick={openFromChart} />
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      {hasCharts && view === 'overall' && (
        <>
          {(entityType.length > 0 || applicationType.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {entityType.length > 0 && (
                <ChartCard title="Entity Type (entity_type)" subtitle="G = Government, P = Private" exportData={entityType}>
                  <InteractivePieChart data={entityType} colors={ENTITY_COLORS} innerRadius={55} chartTitle="Entity Type" onItemClick={openFromChart} />
                </ChartCard>
              )}
              {applicationType.length > 0 && (
                <ChartCard title="Application Type (application_type)" exportData={applicationType}>
                  <InteractivePieChart data={applicationType} colors={APP_COLORS} innerRadius={55} chartTitle="Application Type" onItemClick={openFromChart} />
                </ChartCard>
              )}
            </div>
          )}
          {(fraudType.length > 0 || district.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {fraudType.length > 0 && (
                <ChartCard title="Fraud Type (fraud_type)" exportData={fraudType}>
                  <InteractivePieChart data={fraudType} colors={FRAUD_TYPE_COLORS} innerRadius={55} chartTitle="Fraud Types" onItemClick={openFromChart} />
                </ChartCard>
              )}
              {district.length > 0 && (
                <ChartCard title="Cases by District (district_name)" exportData={district}>
                  <InteractiveBarChart data={district} chartTitle="District Cases" layout="vertical" height={260} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#ef4444', name: 'Suspicious Cases' }]} />
                </ChartCard>
              )}
            </div>
          )}
          {(triggerType.length > 0 || triggerCode.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {triggerType.length > 0 && (
                <ChartCard title="Trigger Type (trigger_type)" exportData={triggerType}>
                  <InteractiveBarChart data={triggerType} chartTitle="Trigger Types" height={260} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#dc2626', name: 'Triggers' }]} cellColors={TRIGGER_COLORS} />
                </ChartCard>
              )}
              {triggerCode.length > 0 && (
                <ChartCard title="Trigger Code (trigger_code)" exportData={triggerCode}>
                  <InteractiveBarChart data={triggerCode} chartTitle="Trigger Codes" height={260} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#f97316', name: 'Triggers' }]} />
                </ChartCard>
              )}
            </div>
          )}
          {amountRecovered.length > 0 && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Amount Recovered (amount_recovered by crt_date)" exportData={amountRecovered}>
                <InteractiveBarChart data={amountRecovered} chartTitle="Recovery by Month" height={260} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#10b981', name: 'Recovered (₹)' }]} />
              </ChartCard>
            </div>
          )}
        </>
      )}

      {tableBlocks.map(({ spec, rows, cols }) => (
        <div key={spec.title} className="mb-4">
          <DataTable
            columns={cols.length ? cols : schemaColumns(spec.columnKeys)}
            data={rows}
            title={`${spec.title} (${rows.length})`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.reference_number ?? row.id_pk ?? row.hospital_name ?? row.workflow_user ?? 'Record'),
                subtitle: spec.title,
                data: row,
              })
            }
          />
        </div>
      ))}
    </div>
  )
}
