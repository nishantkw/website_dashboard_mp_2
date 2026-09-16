import { useMemo } from 'react'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
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
      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={(kpi) => openFromKpi(kpi.label, kpi.value)} />}

      <div className="mb-4 mt-2 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
        <p className="text-sm font-semibold text-[#1a5c38]">
          29-Jun batch — {data.batchASchema || 'dmart_mp.already_printed_card_no_290626'}
        </p>
      </div>
      <DataTable
        columns={batchACols}
        data={data.batchATable ?? []}
        title={`Already Printed (29-Jun) (${(data.batchATable ?? []).length})`}
        onRowClick={(row) =>
          openDetail({
            title: String(row.card_no || 'Card'),
            subtitle: data.batchASchema || 'already_printed',
            data: row,
            columns: batchACols,
          })
        }
      />

      <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
        <p className="text-sm font-semibold text-[#1a5c38]">
          09-Aug batch — {data.batchBSchema || 'dmart_mp.already_printed_card_no_34321992_8672488_09082026'}
        </p>
      </div>
      <DataTable
        columns={batchBCols}
        data={data.batchBTable ?? []}
        title={`Already Printed (09-Aug) (${(data.batchBTable ?? []).length})`}
        onRowClick={(row) =>
          openDetail({
            title: String(row.card_no || 'Card'),
            subtitle: data.batchBSchema || 'already_printed',
            data: row,
            columns: batchBCols,
          })
        }
      />
    </div>
  )
}
