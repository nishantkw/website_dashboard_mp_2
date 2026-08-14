import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { mpUsersKPIs, mpWorkflowStatus, mpUsersTableData } from '../../data/mockData'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
const columns = [
  { key: 'user_id', label: 'User ID' }, { key: 'name', label: 'Name' }, { key: 'role', label: 'Role' },
  { key: 'department', label: 'Department' }, { key: 'status', label: 'Status' }, { key: 'last_login', label: 'Last Login' },
]

export default function UsersWorkflow() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpUsersTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Users & Workflow" description="Workflow users, transaction audit and processing metrics" schema="dmart_mp" />
      <KPIGrid kpis={mpUsersKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="mb-4">
        <ChartCard title="Workflow Transaction Status"><InteractiveBarChart data={mpWorkflowStatus} chartTitle="Workflow Status" height={260} cellColors={COLORS} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#10b981', name: 'Count' }]} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`Workflow Users (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.name), subtitle: 'User', data: row })} />
    </div>
  )
}
