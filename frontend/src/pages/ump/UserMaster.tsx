import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useMemo } from 'react'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchUmpUsers } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { KPI, TableColumn } from '../../types'

const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8']
const GENDER_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6']
const APP_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']

const preferredColumns: TableColumn[] = [
  { key: 'user_id', label: 'User ID' },
  { key: 'email_id', label: 'Email' },
  { key: 'role_name', label: 'Role' },
  { key: 'entity_name', label: 'Entity' },
  { key: 'active_status', label: 'Status' },
  { key: 'app_name', label: 'App' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  columns: [] as string[],
}

export default function UserMaster() {
  const { filterData } = useGlobalFilterData()
  const { data, source, db, loading, error } = useApiResource(() => fetchUmpUsers(), EMPTY)
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const charts = data.charts ?? {}
  const statusData = charts.status ?? []
  const genderData = charts.gender ?? []
  const stateData = charts.state ?? []
  const appData = charts.app ?? []
  const entityData = charts.entity ?? []
  const tableRows = (data.table ?? []) as Record<string, string | number>[]
  const filtered = filterData(tableRows)
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

  const { openFromChart, openDetail, Modal } = useDrillDown({
    live,
    tableRows: filtered,
    columns,
    datasetTitle: 'UMP User Records',
  })

  const barHeight = (count: number, min = 240, max = 420) =>
    Math.min(max, Math.max(min, count * 36 + 72))

  const hasCharts =
    statusData.length > 0 ||
    genderData.length > 0 ||
    stateData.length > 0 ||
    appData.length > 1 ||
    entityData.length > 1

  const handleKpi = (kpi: KPI) => {
    const label = kpi.label
    let records = filtered
    if (label === 'Active Users') {
      records = filtered.filter((r) => /^active$/i.test(String(r.active_status || '').trim()))
    } else if (label === 'Inactive Users') {
      records = filtered.filter((r) => /de-?active|inactive/i.test(String(r.active_status || '').trim()))
    } else if (label === 'Female Users') {
      records = filtered.filter((r) => /^f(emale)?$/i.test(String(r.user_gender || '').trim()))
    }
    openDetail({
      title: label,
      subtitle: `${records.length} record${records.length === 1 ? '' : 's'}`,
      records,
      columns,
      datasetTitle: 'UMP User Records',
      source: live ? 'api' : 'demo',
    })
  }

  return (
    <div>
      <Modal />
      <PageHeader
        title="User Master (UMP)"
        description={
          live
            ? `${data.schema ?? 'ump_raw.user_master_ump'} — schema fields`
            : 'Connect the backend to load UMP user records'
        }
        badge={<DataSourceBadge source={source} db={db} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={handleKpi} />}

      {hasCharts && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {statusData.length > 0 && (
              <ChartCard title="User Status" subtitle="active_status from user_master_ump" exportData={statusData}>
                <InteractivePieChart
                  data={statusData}
                  colors={STATUS_COLORS}
                  innerRadius={55}
                  chartTitle="User Status"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
            {genderData.length > 0 && (
              <ChartCard title="User Gender" subtitle="user_gender" exportData={genderData}>
                <InteractivePieChart
                  data={genderData}
                  colors={GENDER_COLORS}
                  innerRadius={55}
                  chartTitle="User Gender"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
          </div>

          {(appData.length > 1 || entityData.length > 1) && (
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {appData.length > 1 && (
              <ChartCard title="App" exportData={appData}>
                <InteractivePieChart
                  data={appData}
                  colors={APP_COLORS}
                  innerRadius={55}
                  chartTitle="App"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
            {entityData.length > 1 && (
              <ChartCard title="Entity" exportData={entityData}>
                <InteractiveBarChart
                  data={entityData}
                  chartTitle="Entity"
                  layout="vertical"
                  height={barHeight(entityData.length)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#8b5cf6', name: 'Users' }]}
                />
              </ChartCard>
            )}
          </div>
          )}

          {stateData.length > 0 && (
            <div className="mb-4">
              <ChartCard title="Users by State" subtitle="user_state_code" exportData={stateData}>
                <InteractiveBarChart
                  data={stateData}
                  chartTitle="Users by State"
                  layout="vertical"
                  height={barHeight(stateData.length)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Users' }]}
                />
              </ChartCard>
            </div>
          )}
        </>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        title={`User Records (${filtered.length}${columns.length ? ` · ${columns.length} schema cols` : ''})`}
        onRowClick={(row) =>
          openDetail({
            title: String(row.user_id || row.email_id || 'User'),
            subtitle: 'Schema record',
            data: row,
          })
        }
      />
    </div>
  )
}
