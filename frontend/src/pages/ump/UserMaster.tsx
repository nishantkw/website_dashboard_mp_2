import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { umpKPIs, umpRoleDistribution, umpUsersTableData } from '../../data/mockData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
const columns = [
  { key: 'user_id', label: 'User ID' }, { key: 'name', label: 'Name' }, { key: 'role', label: 'Role' },
  { key: 'state', label: 'State' }, { key: 'status', label: 'Status' }, { key: 'created', label: 'Created' },
]

export default function UserMaster() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(umpUsersTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="User Master" description="UMP user management — roles, states and access control" />
      <KPIGrid kpis={umpKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="mb-4">
        <ChartCard title="Users by Role"><InteractiveBarChart data={umpRoleDistribution} chartTitle="Users by Role" layout="vertical" height={280} cellColors={COLORS} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Users' }]} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`User Records (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.name), subtitle: 'User', data: row })} />
    </div>
  )
}
