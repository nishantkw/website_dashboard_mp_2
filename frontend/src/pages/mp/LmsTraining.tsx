import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { mpLmsKPIs, mpLmsCourseData, mpLmsTableData } from '../../data/mockData'

const columns = [
  { key: 'user', label: 'User' }, { key: 'course', label: 'Course' }, { key: 'progress', label: 'Progress', align: 'center' as const },
  { key: 'status', label: 'Status' }, { key: 'completed_on', label: 'Completed On' },
]

export default function LmsTraining() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpLmsTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="LMS Training" description="User course enrollment and completion tracking" schema="dmart_mp" />
      <KPIGrid kpis={mpLmsKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="mb-4">
        <ChartCard title="Course Enrollment vs Completion"><InteractiveBarChart data={mpLmsCourseData} chartTitle="Courses" height={260} showLegend onItemClick={openFromChart} bars={[{ dataKey: 'enrolled', fill: '#3b82f6', name: 'Enrolled' }, { dataKey: 'completed', fill: '#10b981', name: 'Completed' }]} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`Training Records (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.user), subtitle: 'Training', data: row })} />
    </div>
  )
}
