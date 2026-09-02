import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import CardPrintingFilterBar from '../../components/layout/CardPrintingFilterBar'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useMemo } from 'react'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useCardPrintingFilters } from '../../hooks/useCardPrintingFilters'
import { getCardPrintingFiltersForPage } from '../../data/cardPrintingFilterConfig'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchBisCardPrinting } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import { filterRowsForCardPrintingKpi } from '../../utils/beneficiaryCodes'
import { filterRowsForRuralUrbanLabel } from '../../utils/ruralUrban'
import type { KPI, TableColumn } from '../../types'

const STATUS_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444']
const URBAN_RURAL_COLORS = ['#f59e0b', '#10b981']
const DISTRICT_COLORS = ['#3b82f6', '#0ea5e9', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

const preferredColumns: TableColumn[] = [
  { key: 'card_no', label: 'Card No.' },
  { key: 'ben_id', label: 'Ben ID' },
  { key: 'family_id', label: 'Family ID' },
  { key: 'card_name', label: 'Name' },
  { key: 'district_name', label: 'District' },
  { key: 'sub_district_name', label: 'Sub-District' },
  { key: 'urban_or_rural', label: 'Urban / Rural' },
  { key: 'card_gender', label: 'Gender' },
  { key: 'abha_no', label: 'ABHA' },
  { key: 'enroll_date', label: 'Enroll Date' },
  { key: 'approve_date', label: 'Approved' },
  { key: 'card_gen_date', label: 'Generated' },
  { key: 'card_print_date', label: 'Printed' },
  { key: 'card_distribute_date', label: 'Distributed' },
  { key: 'card_deliver_date', label: 'Delivered' },
  { key: 'card_print_status', label: 'Status' },
  { key: 'source_type', label: 'Source' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  columns: [] as string[],
}

export default function CardPrinting() {
  const filterFields = useMemo(() => getCardPrintingFiltersForPage(), [])
  const cardFilters = useCardPrintingFilters(filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchBisCardPrinting(cardFilters.queryString),
    EMPTY,
    [cardFilters.queryString]
  )
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const statusData = data.charts?.status ?? []
  const districtData = data.charts?.district ?? []
  const urbanRuralData = data.charts?.urbanRural ?? []
  const table = (data.table ?? []) as Record<string, string | number>[]
  const filtered = live ? table : cardFilters.filterRows(table)
  const tableColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.columns,
        rows: table,
        preferredFirst: preferredColumns.map((c) => c.key),
        demoColumns: preferredColumns,
      }),
    [source, data.columns, table]
  )
  const districtHeight = Math.max(280, Math.min(districtData.length, 14) * 36)

  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    tableRows: filtered,
    columns: tableColumns,
    datasetTitle: 'Card Printing Records',
  })

  const handleKpi = (kpi: KPI) => {
    const codedRows = filterRowsForCardPrintingKpi(filtered, kpi.label)
    if (codedRows) {
      openDetail({
        title: kpi.label,
        subtitle: `${codedRows.length} record${codedRows.length === 1 ? '' : 's'}`,
        records: codedRows,
        columns: tableColumns,
        datasetTitle: 'Card Printing Records',
        source: live ? 'api' : 'demo',
      })
      return
    }
    const ruralUrbanRows = filterRowsForRuralUrbanLabel(filtered, kpi.label)
    if (ruralUrbanRows) {
      openDetail({
        title: kpi.label,
        subtitle: `${ruralUrbanRows.length} record${ruralUrbanRows.length === 1 ? '' : 's'}`,
        records: ruralUrbanRows,
        columns: tableColumns,
        datasetTitle: 'Card Printing Records',
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
        title="Card Printing Status"
        description={
          live
            ? `${data.schema ?? 'dmart_mp.t_card_printing_status'} — schema fields`
            : 'Connect the backend to load card printing records'
        }
        badge={<DataSourceBadge source={source} db={db} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      <CardPrintingFilterBar
        fields={cardFilters.resolvedFields}
        values={cardFilters.filters}
        onChange={cardFilters.setFilter}
        search={cardFilters.search}
        onSearchChange={cardFilters.setSearch}
        onClear={cardFilters.clearFilters}
        activeCount={cardFilters.activeCount}
      />

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={handleKpi} />}

      {(statusData.length > 0 || urbanRuralData.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {statusData.length > 0 && (
            <ChartCard title="Card Print Status" exportData={statusData}>
              <InteractivePieChart
                data={statusData}
                colors={STATUS_COLORS}
                innerRadius={55}
                chartTitle="Card Status"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
          {urbanRuralData.length > 0 && (
            <ChartCard title="Urban vs Rural" exportData={urbanRuralData}>
              <InteractivePieChart
                data={urbanRuralData}
                colors={URBAN_RURAL_COLORS}
                innerRadius={55}
                chartTitle="Urban/Rural"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
        </div>
      )}

      {districtData.length > 0 && (
        <div className="mb-4">
          <ChartCard title="Cards by District" exportData={districtData}>
            <InteractiveBarChart
              data={districtData}
              chartTitle="Cards by District"
              layout="vertical"
              height={districtHeight}
              integerAxis
              onItemClick={openFromChart}
              bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Cards' }]}
              cellColors={DISTRICT_COLORS}
            />
          </ChartCard>
        </div>
      )}

      <DataTable
        columns={tableColumns}
        data={filtered}
        title={`Card Records (${filtered.length}${tableColumns.length ? ` · ${tableColumns.length} schema cols` : ''})`}
        onRowClick={(row) =>
          openDetail({
            title: String(row.card_no || row.ben_id || 'Card'),
            subtitle: 'Schema record',
            data: row,
          })
        }
      />
    </div>
  )
}
