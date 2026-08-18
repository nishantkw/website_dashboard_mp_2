import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import {
  mpUsersKPIs, mpWorkflowStatus, mpRoleDistribution, mpRoleTransactionData,
  mpDailyTransactionTrend, mpProcessingTimeByRole, mpUsersTableData,
} from '../../data/mockData'

const STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
const ROLE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316']

const columns = [
  { key: 'user_id', label: 'User ID' },
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'department', label: 'Department' },
  { key: 'district', label: 'District' },
  { key: 'transactions', label: 'Transactions', align: 'right' as const },
  { key: 'avg_time', label: 'Avg Time' },
  { key: 'status', label: 'Status' },
  { key: 'last_login', label: 'Last Login' },
  { key: 'pending', label: 'Pending Actions', align: 'right' as const },
]

export default function UsersWorkflow() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpUsersTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Users & Workflow" description="workflow_users_t + pro_workflow_users_t + t_workflow_transaction_audit — User management, transaction audit trail and processing metrics" schema="dmart_mp" />
      <KPIGrid kpis={mpUsersKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      {/* Row 1: Workflow Status + Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Workflow Transaction Status" subtitle="t_workflow_transaction_audit — Completed / In Progress / Pending / Rejected" exportData={mpWorkflowStatus}>
          <InteractivePieChart data={mpWorkflowStatus} colors={STATUS_COLORS} innerRadius={55} chartTitle="Workflow Status" onItemClick={openFromChart} />
        </ChartCard>
        <ChartCard title="User Role Distribution" subtitle="workflow_users_t — Users by role classification" exportData={mpRoleDistribution}>
          <InteractivePieChart data={mpRoleDistribution} colors={ROLE_COLORS} chartTitle="Role Distribution" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 2: Role Transactions + Daily Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Transactions by Role" subtitle="t_workflow_transaction_audit — Volume per role" exportData={mpRoleTransactionData}>
          <InteractiveBarChart
            data={mpRoleTransactionData}
            chartTitle="Role Transactions"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'transactions', fill: '#3b82f6', name: 'Transactions' }]}
          />
        </ChartCard>
        <ChartCard title="Daily Transaction Volume" subtitle="Weekly transaction pattern (Mon–Sun)" exportData={mpDailyTransactionTrend}>
          <InteractiveBarChart
            data={mpDailyTransactionTrend}
            chartTitle="Daily Transactions"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'transactions', fill: '#8b5cf6', name: 'Transactions' }]}
          />
        </ChartCard>
      </div>

      {/* Row 3: Processing Time by Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Avg Processing Time by Role (hrs)" subtitle="Time from claim receipt to action — shorter is better" exportData={mpProcessingTimeByRole}>
          <InteractiveBarChart
            data={mpProcessingTimeByRole}
            chartTitle="Processing Time"
            layout="vertical"
            height={250}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'avg_hrs', fill: '#f59e0b', name: 'Avg Hours' }]}
          />
        </ChartCard>
        <ChartCard title="Avg Processing Time vs Transaction Volume" subtitle="Role-level efficiency — time vs throughput" exportData={mpRoleTransactionData}>
          <InteractiveBarChart
            data={mpRoleTransactionData}
            chartTitle="Efficiency Matrix"
            height={250}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'transactions', fill: '#3b82f6', name: 'Transactions' },
              { dataKey: 'avg_time', fill: '#f59e0b', name: 'Avg Time (hrs)' },
            ]}
          />
        </ChartCard>
      </div>

      {/* Full Users Table */}
      <DataTable
        columns={columns}
        data={filtered}
        title={`Workflow Users — workflow_users_t (${filtered.length} records)`}
        onRowClick={(row) => openDetail({ title: String(row.name), subtitle: 'Workflow User Record', data: row })}
      />
    </div>
  )
}
