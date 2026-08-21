import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart, InteractiveLineChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import {
  mpLmsKPIs, mpLmsCourseData, mpLmsCompletionTrend, mpLmsRoleStatusData,
  mpLmsEntityTypeData, mpLmsStateWiseData, mpLmsTableData,
} from '../../data/mockData'

const ENTITY_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']

const columns = [
  { key: 'userid', label: 'User ID' },
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'entity', label: 'Entity' },
  { key: 'parententity', label: 'Parent Entity' },
  { key: 'entitytype', label: 'Entity Type' },
  { key: 'ab_pmjay_status', label: 'AB-PMJAY Status' },
  { key: 'abdm_status', label: 'ABDM Status' },
  { key: 'ab_pmjay_completed', label: 'PMJAY Completed' },
  { key: 'abdm_completed', label: 'ABDM Completed' },
]

export default function LmsTraining() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpLmsTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="LMS Training" />
      <KPIGrid kpis={mpLmsKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Course Enrollment vs Completion" exportData={mpLmsCourseData}>
          <InteractiveBarChart
            data={mpLmsCourseData}
            chartTitle="Courses"
            height={260}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'pmjay_enrolled', fill: '#3b82f6', name: 'PMJAY Enrolled' },
              { dataKey: 'pmjay_completed', fill: '#10b981', name: 'PMJAY Completed' },
              { dataKey: 'abdm_enrolled', fill: '#8b5cf6', name: 'ABDM Enrolled' },
              { dataKey: 'abdm_completed', fill: '#06b6d4', name: 'ABDM Completed' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Monthly Completion Trend" exportData={mpLmsCompletionTrend}>
          <InteractiveLineChart
            data={mpLmsCompletionTrend}
            chartTitle="Completion Trend"
            height={260}
            showLegend
            onItemClick={openFromChart}
            lines={[
              { dataKey: 'pmjay', stroke: '#3b82f6', name: 'AB-PMJAY' },
              { dataKey: 'abdm', stroke: '#8b5cf6', name: 'ABDM' },
            ]}
          />
        </ChartCard>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Role-wise Completion Status" exportData={mpLmsRoleStatusData}>
          <InteractiveBarChart
            data={mpLmsRoleStatusData}
            chartTitle="Role Status"
            height={260}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'completed', fill: '#10b981', name: 'Completed' },
              { dataKey: 'in_progress', fill: '#f59e0b', name: 'In Progress' },
              { dataKey: 'not_started', fill: '#ef4444', name: 'Not Started' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Entity Type Distribution" exportData={mpLmsEntityTypeData}>
          <InteractivePieChart data={mpLmsEntityTypeData} colors={ENTITY_COLORS} innerRadius={55} chartTitle="Entity Types" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      <div className="mb-4">
        <ChartCard title="District-wise Training Completion Rate (%)" exportData={mpLmsStateWiseData}>
          <InteractiveBarChart
            data={mpLmsStateWiseData}
            chartTitle="District Completion"
            height={240}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'completion_rate', fill: '#10b981', name: 'Completion %' }]}
          />
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        title={`Training Records (${filtered.length})`}
        onRowClick={(row) => openDetail({ title: String(row.name), subtitle: 'LMS Training Record', data: row })}
      />
    </div>
  )
}
