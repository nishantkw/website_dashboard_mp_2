import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveLineChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { mpFraudKPIs, mpFraudTrend, mpFraudTableData } from '../../data/mockData'

const columns = [
  { key: 'case_id', label: 'Case ID' }, { key: 'hospital', label: 'Hospital' }, { key: 'type', label: 'Fraud Type' },
  { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount', align: 'right' as const },
]

export default function FraudAudit() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpFraudTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Fraud & Audit" description="Suspicious case monitoring, investigation and recovery tracking" schema="dmart_mp" />
      <KPIGrid kpis={mpFraudKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="mb-4">
        <ChartCard title="Fraud Cases Trend"><InteractiveLineChart data={mpFraudTrend} chartTitle="Fraud Trend" height={260} onItemClick={openFromChart} lines={[{ dataKey: 'suspicious', stroke: '#f59e0b', name: 'Suspicious' }, { dataKey: 'confirmed', stroke: '#ef4444', name: 'Confirmed' }]} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`Suspicious Cases (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.case_id), subtitle: 'Fraud Case', data: row })} />
    </div>
  )
}
