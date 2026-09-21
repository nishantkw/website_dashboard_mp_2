import { useMemo } from 'react'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import DashboardReportsBanner from '../../components/ui/DashboardReportsBanner'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchBisPrintDedup } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import type { KPI, TableColumn } from '../../types'

const preferred: TableColumn[] = [{ key: 'card_no', label: 'Card No.' }]

const EMPTY = {
  kpis: [] as KPI[],
  batchATable: [] as Record<string, string | number>[],
  batchBTable: [] as Record<string, string | number>[],
  batchAColumns: [] as string[],
  batchBColumns: [] as string[],
}

export default function PrintDedup() {
  const { data, source, db, loading, error } = useApiResource(() => fetchBisPrintDedup(), EMPTY, [])
  const live = source === 'api'
  const kpis = data.kpis ?? []

  const batchACols = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.batchAColumns,
        rows: data.batchATable ?? [],
        preferredFirst: preferred.map((c) => c.key),
        demoColumns: preferred,
      }),
    [source, data.batchAColumns, data.batchATable]
  )
  const batchBCols = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.batchBColumns,
        rows: data.batchBTable ?? [],
        preferredFirst: preferred.map((c) => c.key),
        demoColumns: preferred,
      }),
    [source, data.batchBColumns, data.batchBTable]
  )

  const { openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    tableRows: [...(data.batchATable ?? []), ...(data.batchBTable ?? [])],
    columns: batchACols,
    datasetTitle: 'Already Printed Cards',
  })

  return (
    <div>
      <Modal />
      <PageHeader
        title="Already Printed Cards"
        description={
          live
            ? 'De-duplication lists of Ayushman card numbers already printed (schema reference batches)'
            : 'Connect the backend to load already-printed card lists'
        }
        badge={<DataSourceBadge source={source} db={db} loading={loading} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      <DashboardReportsBanner
        reportPath="/dashboard/mp/reports/print-dedup"
        buttonLabel="Open Already Printed Cards Report →"
      />

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={(kpi) => openFromKpi(kpi.label, kpi.value)} />}
    </div>
  )
}
