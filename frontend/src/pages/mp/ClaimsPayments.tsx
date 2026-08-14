import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveLineChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { mpClaimsKPIs, mpClaimsMonthly, mpPaymentData, mpClaimsTableData } from '../../data/mockData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
const columns = [
  { key: 'case_id', label: 'Case ID' }, { key: 'patient', label: 'Patient' }, { key: 'hospital', label: 'Hospital' },
  { key: 'procedure', label: 'Procedure' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount', align: 'right' as const },
]

export default function ClaimsPayments() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpClaimsTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Claims & Payments" description="Claims processing, preauth, portability and payment tracking" schema="dmart_mp" />
      <KPIGrid kpis={mpClaimsKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Monthly Claims Trend"><InteractiveLineChart data={mpClaimsMonthly} chartTitle="Monthly Claims" height={240} onItemClick={openFromChart} lines={[{ dataKey: 'paid', stroke: '#10b981', name: 'Paid' }, { dataKey: 'pending', stroke: '#f59e0b', name: 'Pending' }]} /></ChartCard>
        <ChartCard title="Payment Breakdown"><InteractivePieChart data={mpPaymentData} colors={COLORS} chartTitle="Payments" onItemClick={openFromChart} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`Recent Claims (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.case_id), subtitle: 'Claim Record', data: row })} />
    </div>
  )
}
