import ChartCard from '../components/ui/ChartCard'
import DataTable from '../components/ui/DataTable'
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
  claimsWorkflowFunnel,
  mpDistrictClaimsData,
} from '../data/mockData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#7c3aed', '#5b21b6', '#4c1d95']

const districtCols = [
  { key: 'name', label: 'District' },
  { key: 'claims', label: 'Claims', align: 'right' as const },
  { key: 'amount', label: 'Amount (₹ Cr)', align: 'right' as const },
]

export default function Overview() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()

  const handleKpiClick = (kpi: KPI) => {
    openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0, period: 'vs last month' })
  }

  return (
    <div>
      <Modal />
      <PageHeader title="Overview Dashboard" description="Executive summary — Beneficiaries, Claims, Hospitals, Cards & Fraud Analytics" />
      <KPIGrid kpis={overviewKPIs} onKpiClick={handleKpiClick} />

      {/* Row 1: Claims Trend + District Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Monthly Claims Trend" subtitle="Claims, pre-auth volume and paid amount (Jan–Aug 2025)" exportData={claimsTrendData}>
          <InteractiveLineChart data={claimsTrendData} chartTitle="Claims Trend" height={280} dualAxis onItemClick={openFromChart}
            lines={[
              { dataKey: 'claims', stroke: '#2563eb', name: 'Total Claims', yAxisId: 'left' },
              { dataKey: 'preauth', stroke: '#059669', name: 'Preauth', yAxisId: 'left' },
              { dataKey: 'amount', stroke: '#d97706', name: 'Amount (₹ Cr)', yAxisId: 'right' },
            ]} />
        </ChartCard>
        <ChartCard title="District Performance" subtitle="Claims & Beneficiaries by top districts" exportData={stateComparisonData}>
          <InteractiveBarChart data={stateComparisonData} chartTitle="District Performance" height={250} showLegend onItemClick={openFromChart}
            bars={[
              { dataKey: 'claims', fill: '#3b82f6', name: 'Claims' },
              { dataKey: 'hospitals', fill: '#10b981', name: 'Hospitals' },
            ]} />
        </ChartCard>
      </div>

      {/* Row 2: Card Printing Funnel + Claim Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Card Printing Lifecycle Funnel" subtitle="Enrolled → Delivered" exportData={cardPrintingFunnel}>
          <InteractiveBarChart data={cardPrintingFunnel} chartTitle="Card Printing Funnel" layout="vertical" height={280} onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#8b5cf6', name: 'Count' }]}
            cellColors={FUNNEL_COLORS} />
        </ChartCard>
        <ChartCard title="Claim Status Distribution" subtitle="Current status breakdown" exportData={claimStatusDistribution}>
          <InteractivePieChart data={claimStatusDistribution} colors={COLORS} innerRadius={60} chartTitle="Claim Status" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 3: Claims Workflow Funnel + District Claims Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Claims Processing Workflow" subtitle="Preauth → Surgery → Claim → Payment pipeline" exportData={claimsWorkflowFunnel}>
          <InteractiveBarChart data={claimsWorkflowFunnel} chartTitle="Workflow Funnel" layout="vertical" height={260} onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#0ea5e9', name: 'Volume' }]} />
        </ChartCard>
        <ChartCard title="Top Districts by Claims Amount" subtitle="Amount paid per district (₹ Cr)" exportData={mpDistrictClaimsData}>
          <InteractiveBarChart data={mpDistrictClaimsData} chartTitle="District Claims" layout="vertical" height={260} onItemClick={openFromChart}
            bars={[{ dataKey: 'amount', fill: '#f59e0b', name: '₹ Cr' }]} />
        </ChartCard>
      </div>

      {/* District Claims Detail Table */}
      <div className="mt-4">
        <DataTable
          columns={districtCols}
          data={mpDistrictClaimsData as any}
          title="District-wise Claims Summary"
          onRowClick={(row) => openDetail({ title: String(row.name), subtitle: 'District Analytics', data: row })}
        />
      </div>
    </div>
  )
}
