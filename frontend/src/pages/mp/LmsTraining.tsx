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
      <PageHeader title="LMS Training" description="lms_user_course_completion_status (16 cols) — AB PM-JAY & ABDM course completion tracking per staff role and entity" schema="dmart_mp" />
      <KPIGrid kpis={mpLmsKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      {/* Row 1: Course Enrollment vs Completion + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Course Enrollment vs Completion" subtitle="AB-PMJAY and ABDM course completion rates per course" exportData={mpLmsCourseData}>
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
        <ChartCard title="Monthly Completion Trend" subtitle="AB-PMJAY vs ABDM completions per month (Jan–Aug 2025)" exportData={mpLmsCompletionTrend}>
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

      {/* Row 2: Role-wise Status + Entity Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Role-wise Completion Status" subtitle="Completed / In Progress / Not Started per user role" exportData={mpLmsRoleStatusData}>
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
        <ChartCard title="Entity Type Distribution" subtitle="entitytype — Hospital Staff / District / State admin mix" exportData={mpLmsEntityTypeData}>
          <InteractivePieChart data={mpLmsEntityTypeData} colors={ENTITY_COLORS} innerRadius={55} chartTitle="Entity Types" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 3: State-wise Completion Rate */}
      <div className="mb-4">
        <ChartCard title="District-wise Training Completion Rate (%)" subtitle="AB-PMJAY overall completion rate per district — target: 100%" exportData={mpLmsStateWiseData}>
          <InteractiveBarChart
            data={mpLmsStateWiseData}
            chartTitle="District Completion"
            height={240}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'completion_rate', fill: '#10b981', name: 'Completion %' }]}
          />
        </ChartCard>
      </div>

      {/* Full LMS Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        title={`Training Records — lms_user_course_completion_status (${filtered.length} records)`}
        onRowClick={(row) => openDetail({ title: String(row.name), subtitle: 'LMS Training Record', data: row })}
      />
    </div>
  )
}
