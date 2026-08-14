import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { bisKPIs, bisStatusData, bisDistrictData, bisTableData } from '../../data/mockData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
const columns = [
  { key: 'card_no', label: 'Card No.' }, { key: 'state', label: 'State' }, { key: 'district', label: 'District' },
  { key: 'status', label: 'Status' }, { key: 'enroll_date', label: 'Enroll Date' }, { key: 'print_date', label: 'Print Date' },
]

export default function CardPrinting() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(bisTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Card Printing Status" description="ABHA card printing, distribution and delivery tracking" schema="bis_raw" />
      <KPIGrid kpis={bisKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Card Status Distribution"><InteractivePieChart data={bisStatusData} colors={COLORS} chartTitle="Card Status" onItemClick={openFromChart} /></ChartCard>
        <ChartCard title="District-wise Printing"><InteractiveBarChart data={bisDistrictData} chartTitle="District Printing" height={240} onItemClick={openFromChart} bars={[{ dataKey: 'printed', fill: '#3b82f6', name: 'Printed' }, { dataKey: 'pending', fill: '#f59e0b', name: 'Pending' }]} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`Recent Card Records (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.card_no), subtitle: 'Card Record', data: row })} />
    </div>
  )
}
