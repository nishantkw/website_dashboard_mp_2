import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { mhKPIs, mhClaimsByStatus, mhClaimsByDistrict, mhTableData } from '../../data/mockData'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
const columns = [
  { key: 'case_id', label: 'Case ID' }, { key: 'patient', label: 'Patient' }, { key: 'hospital', label: 'Hospital' },
  { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount', align: 'right' as const }, { key: 'admission', label: 'Admission Date' },
]

export default function MHClaims() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mhTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Maharashtra Claims Dashboard" description="Claims processing, payments and status tracking for Maharashtra" schema="dmart_mh" />
      <KPIGrid kpis={mhKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Claims by Status"><InteractivePieChart data={mhClaimsByStatus} colors={COLORS} innerRadius={55} chartTitle="Claims Status" onItemClick={openFromChart} /></ChartCard>
        <ChartCard title="District-wise Claims"><InteractiveBarChart data={mhClaimsByDistrict} chartTitle="District Claims" height={240} onItemClick={openFromChart} bars={[{ dataKey: 'claims', fill: '#3b82f6', name: 'Claims' }]} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`Recent Claims (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.case_id), subtitle: 'Claim Record', data: row })} />
    </div>
  )
}
