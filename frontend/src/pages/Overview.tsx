import ChartCard from '../components/ui/ChartCard'
import { PageHeader, KPIGrid } from '../components/ui/PageHeader'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../components/charts/InteractiveCharts'
import { useDrillDown } from '../hooks/useDrillDown'
import type { KPI } from '../types'
import {
  overviewKPIs,
  claimsTrendData,
  stateComparisonData,
  cardPrintingFunnel,
  claimStatusDistribution,
} from '../data/mockData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Overview() {
  const { openFromChart, openFromKpi, Modal } = useDrillDown()

  const handleKpiClick = (kpi: KPI) => {
    openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0, period: 'vs last month' })
  }

  return (
    <div>
      <Modal />
      <PageHeader title="Overview Dashboard" description="Aggregated KPIs across all departments — BIS, Maharashtra, Madhya Pradesh, and UMP" />
      <KPIGrid kpis={overviewKPIs} onKpiClick={handleKpiClick} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Claims Trend" subtitle="Monthly claims volume and amount (₹ Cr)">
          <InteractiveLineChart data={claimsTrendData} chartTitle="Claims Trend" dualAxis onItemClick={openFromChart}
            lines={[{ dataKey: 'claims', stroke: '#3b82f6', name: 'Claims', yAxisId: 'left' }, { dataKey: 'amount', stroke: '#10b981', name: 'Amount (₹ Cr)', yAxisId: 'right' }]} />
        </ChartCard>
        <ChartCard title="State Comparison" subtitle="Claims and beneficiaries by state">
          <InteractiveBarChart data={stateComparisonData} chartTitle="State Comparison" showLegend onItemClick={openFromChart}
            bars={[{ dataKey: 'claims', fill: '#3b82f6', name: 'Claims' }, { dataKey: 'beneficiaries', fill: '#10b981', name: 'Beneficiaries' }]} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Card Printing Funnel" subtitle="Beneficiary card lifecycle">
          <InteractiveBarChart data={cardPrintingFunnel} chartTitle="Card Printing Funnel" layout="vertical" onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#8b5cf6', name: 'Count' }]} />
        </ChartCard>
        <ChartCard title="Claim Status Distribution" subtitle="Current claim status">
          <InteractivePieChart data={claimStatusDistribution} colors={COLORS} innerRadius={60} chartTitle="Claim Status" onItemClick={openFromChart} />
        </ChartCard>
      </div>
    </div>
  )
}
