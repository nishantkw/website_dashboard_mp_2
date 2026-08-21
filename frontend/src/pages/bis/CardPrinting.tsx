import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart, InteractiveLineChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import {
  bisKPIs, bisStatusData, bisDistrictData, bisUrbanRuralBar,
  bisSourceTypeData, bisMonthlyTrendData, cardPrintingFunnel, bisTableData,
} from '../../data/mockData'

const STATUS_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444']
const SOURCE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6']

const columns = [
  { key: 'card_no', label: 'Card No.' },
  { key: 'ben_id', label: 'Ben ID' },
  { key: 'family_id', label: 'Family ID' },
  { key: 'district', label: 'District' },
  { key: 'block', label: 'Block' },
  { key: 'enroll_date', label: 'Enroll Date' },
  { key: 'approve_date', label: 'Approved' },
  { key: 'card_gen_date', label: 'Generated' },
  { key: 'card_print_date', label: 'Printed' },
  { key: 'distribute_date', label: 'Distributed' },
  { key: 'deliver_date', label: 'Delivered' },
  { key: 'status', label: 'Status' },
  { key: 'source_type', label: 'Source' },
]

export default function CardPrinting() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(bisTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Card Printing Status" description="t_card_printing_status — ABHA card lifecycle: Enroll → Approve → Generate → Print → Distribute → Deliver" />
      <KPIGrid kpis={bisKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      {/* Row 1: Lifecycle Funnel + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Card Lifecycle Funnel" subtitle="Enrolled → Approved → Generated → Printed → Distributed → Delivered" exportData={cardPrintingFunnel}>
          <InteractiveBarChart
            data={cardPrintingFunnel}
            chartTitle="Card Lifecycle"
            layout="vertical"
            height={270}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#8b5cf6', name: 'Count' }]}
          />
        </ChartCard>
        <ChartCard title="Card Status Distribution" subtitle="Current card_print_status breakdown" exportData={bisStatusData}>
          <InteractivePieChart data={bisStatusData} colors={STATUS_COLORS} innerRadius={55} chartTitle="Card Status" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 2: District-wise + Urban/Rural */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="District-wise Card Printing" subtitle="Printed vs Pending vs Delivered by district" exportData={bisDistrictData}>
          <InteractiveBarChart
            data={bisDistrictData}
            chartTitle="District Printing"
            height={270}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'printed', fill: '#3b82f6', name: 'Printed' },
              { dataKey: 'delivered', fill: '#10b981', name: 'Delivered' },
              { dataKey: 'pending', fill: '#f59e0b', name: 'Pending' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Urban vs Rural Card Status" subtitle="rural_urban_flag breakdown by delivery status" exportData={bisUrbanRuralBar}>
          <InteractiveBarChart
            data={bisUrbanRuralBar}
            chartTitle="Urban/Rural Cards"
            height={270}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'delivered', fill: '#10b981', name: 'Delivered' },
              { dataKey: 'printed', fill: '#3b82f6', name: 'Printed' },
              { dataKey: 'pending', fill: '#f59e0b', name: 'Pending' },
            ]}
          />
        </ChartCard>
      </div>

      {/* Row 3: Source Type + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Source Type Breakdown" subtitle="source_type — SECC / State List / Contractor / Walk-in" exportData={bisSourceTypeData}>
          <InteractivePieChart data={bisSourceTypeData} colors={SOURCE_COLORS} chartTitle="Source Type" onItemClick={openFromChart} />
        </ChartCard>
        <ChartCard title="Monthly Printing Trend" subtitle="Printed vs Delivered per month (Jan–Aug 2025)" exportData={bisMonthlyTrendData}>
          <InteractiveLineChart
            data={bisMonthlyTrendData}
            chartTitle="Monthly Printing"
            height={270}
            showLegend
            onItemClick={openFromChart}
            lines={[
              { dataKey: 'printed', stroke: '#3b82f6', name: 'Printed' },
              { dataKey: 'delivered', stroke: '#10b981', name: 'Delivered' },
            ]}
          />
        </ChartCard>
      </div>

      {/* Full Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        title={`Card Records — t_card_printing_status (${filtered.length} records)`}
        onRowClick={(row) => openDetail({ title: String(row.card_no), subtitle: 'Card Printing Record', data: row })}
      />
    </div>
  )
}
