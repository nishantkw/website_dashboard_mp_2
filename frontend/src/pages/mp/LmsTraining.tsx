import { useMemo } from 'react'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import ModuleFilterBar from '../../components/layout/ModuleFilterBar'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useModuleFilters } from '../../hooks/useModuleFilters'
import { getModuleFilters } from '../../data/moduleFilterConfig'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchLms } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { KPI, TableColumn } from '../../types'

const preferredColumns: TableColumn[] = [
  { key: 'userid', label: 'User ID' },
  { key: 'username', label: 'Username' },
  { key: 'firstname', label: 'First Name' },
  { key: 'lastname', label: 'Last Name' },
  { key: 'role', label: 'Role' },
  { key: 'parententity', label: 'Parent Entity' },
  { key: 'entitytype', label: 'Entity Type' },
  { key: 'selfentity', label: 'Entity' },
  { key: 'ab_pmjay_status', label: 'AB-PMJAY Status' },
  { key: 'abdm_status', label: 'ABDM Status' },
  { key: 'ab_pmjay_completed_at_utc', label: 'PMJAY Completed' },
  { key: 'abdm_completed_at_utc', label: 'ABDM Completed' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  columns: [] as string[],
}

export default function LmsTraining() {
  const filterFields = useMemo(() => getModuleFilters('mp_lms'), [])
  const moduleFilters = useModuleFilters('mp_lms', filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchLms(moduleFilters.queryString),
    EMPTY,
    [moduleFilters.queryString]
  )
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const tableRows = (data.table ?? []) as Record<string, string | number>[]
  const filtered = live ? tableRows : moduleFilters.filterRows(tableRows)
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

  const { openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    tableRows: filtered,
    columns,
    datasetTitle: 'LMS Training Records',
  })

  return (
    <div>
      <Modal />
      <PageHeader
        title="LMS Training"
        description={
          live
            ? `${data.schema ?? 'dmart_mp.lms_user_course_completion_status'} — schema fields`
            : 'Connect the backend to load LMS records'
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

      {kpis.length > 0 && (
        <KPIGrid kpis={kpis} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      )}

      <DataTable
        columns={columns}
        data={filtered}
        title={`Training Records (${filtered.length}${columns.length ? ` · ${columns.length} schema cols` : ''})`}
        onRowClick={(row) =>
          openDetail({
            title: String(row.userid || row.username || 'LMS User'),
            subtitle: 'Schema record',
            data: row,
          })
        }
      />
    </div>
  )
}
