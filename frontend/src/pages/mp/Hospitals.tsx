import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { mpHospitalKPIs, mpHospitalTypeData, mpHospitalDistrictData, mpHospitalTableData } from '../../data/mockData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
const columns = [
  { key: 'code', label: 'Hospital Code' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' },
  { key: 'district', label: 'District' }, { key: 'nabH', label: 'NABH' }, { key: 'status', label: 'Status' },
]

export default function Hospitals() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpHospitalTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Hospitals & Empanelment" description="Hospital master, quality certification and de-empanelment tracking" schema="dmart_mp" />
      <KPIGrid kpis={mpHospitalKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Hospital Type Distribution"><InteractivePieChart data={mpHospitalTypeData} colors={COLORS} chartTitle="Hospital Types" onItemClick={openFromChart} /></ChartCard>
        <ChartCard title="District-wise Hospitals"><InteractiveBarChart data={mpHospitalDistrictData} chartTitle="District Hospitals" height={240} showLegend onItemClick={openFromChart} bars={[{ dataKey: 'hospitals', fill: '#3b82f6', name: 'Total' }, { dataKey: 'certified', fill: '#10b981', name: 'NABH' }]} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`Hospital Records (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.name), subtitle: 'Hospital', data: row })} />
    </div>
  )
}
