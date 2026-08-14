import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { mpBeneficiaryKPIs, mpBeneficiaryGender, mpBeneficiaryUrbanRural, mpBeneficiaryTableData } from '../../data/mockData'

const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6']
const columns = [
  { key: 'ben_id', label: 'Beneficiary ID' }, { key: 'name', label: 'Name' }, { key: 'district', label: 'District' },
  { key: 'ekyc', label: 'eKYC Status' }, { key: 'gender', label: 'Gender' }, { key: 'age', label: 'Age', align: 'center' as const },
]

export default function Beneficiaries() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpBeneficiaryTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Beneficiaries" description="Beneficiary enrollment, eKYC and demographic data" schema="dmart_mp" />
      <KPIGrid kpis={mpBeneficiaryKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Gender Distribution"><InteractivePieChart data={mpBeneficiaryGender} colors={COLORS} innerRadius={55} chartTitle="Gender" onItemClick={openFromChart} /></ChartCard>
        <ChartCard title="Urban vs Rural"><InteractiveBarChart data={mpBeneficiaryUrbanRural} chartTitle="Urban/Rural" height={240} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#10b981', name: 'Count' }]} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`Beneficiary Records (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.ben_id), subtitle: 'Beneficiary', data: row })} />
    </div>
  )
}
