import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart, InteractiveLineChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import {
  mpClaimsKPIs, mpClaimsMonthly, mpClaimsAmountMonthly, mpPaymentData,
  mpCaseTypeData, mpDistrictClaimsData, claimsWorkflowFunnel,
  mpHospitalTypeClaimsData, mpAvgProcessingDays, mpClaimsTableData,
} from '../../data/mockData'

const PAYMENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']
const CASE_TYPE_COLORS = ['#10b981', '#ef4444', '#8b5cf6', '#f59e0b']
const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#7c3aed', '#5b21b6', '#4c1d95']

const columns = [
  { key: 'case_id', label: 'Case ID' },
  { key: 'patient', label: 'Patient' },
  { key: 'hospital_code', label: 'Hosp Code' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'district', label: 'District' },
  { key: 'case_type', label: 'Case Type' },
  { key: 'procedure', label: 'Procedure' },
  { key: 'status', label: 'Status' },
  { key: 'preauth_date', label: 'Preauth Date' },
  { key: 'surgery_dt', label: 'Surgery Date' },
  { key: 'discharge_dt', label: 'Discharge' },
  { key: 'claim_date', label: 'Claim Init' },
  { key: 'payment_dt', label: 'Payment Date' },
  { key: 'amount', label: 'Amount', align: 'right' as const },
]

export default function ClaimsPayments() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpClaimsTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Claims & Payments" description="claim_paid_t — The most important table. Tracks the full journey: Preauth → Surgery → Discharge → Claim → Payment" schema="dmart_mp" />
      <KPIGrid kpis={mpClaimsKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      {/* Row 1: Monthly Claims Trend + Amount Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Monthly Claims Volume" subtitle="Paid / Pending / Rejected per month (Jan–Aug 2025)" exportData={mpClaimsMonthly}>
          <InteractiveLineChart
            data={mpClaimsMonthly}
            chartTitle="Monthly Claims"
            height={260}
            showLegend
            onItemClick={openFromChart}
            lines={[
              { dataKey: 'paid', stroke: '#10b981', name: 'Paid' },
              { dataKey: 'pending', stroke: '#f59e0b', name: 'Pending' },
              { dataKey: 'rejected', stroke: '#ef4444', name: 'Rejected' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Monthly Amount Paid (₹ Cr)" subtitle="t_payment_dtls — Hospital payments per month" exportData={mpClaimsAmountMonthly}>
          <InteractiveBarChart
            data={mpClaimsAmountMonthly}
            chartTitle="Monthly Amount"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'amount', fill: '#10b981', name: '₹ Cr' }]}
          />
        </ChartCard>
      </div>

      {/* Row 2: Payment Breakdown + Case Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Payment Breakdown by Type" subtitle="t_payment_dtls — Hospital / Refund / TMS / Portability / State Top-up" exportData={mpPaymentData}>
          <InteractivePieChart data={mpPaymentData} colors={PAYMENT_COLORS} innerRadius={55} chartTitle="Payment Breakdown" onItemClick={openFromChart} />
        </ChartCard>
        <ChartCard title="Case Type Distribution" subtitle="claim_paid_t.case_type — Planned / Emergency / Portability / MORTH" exportData={mpCaseTypeData}>
          <InteractivePieChart data={mpCaseTypeData} colors={CASE_TYPE_COLORS} chartTitle="Case Types" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 3: Claim Processing Workflow + District Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Claims Processing Workflow Funnel" subtitle="Preauth → Preauth Approved → Surgery → Claim Init → Approved → Paid" exportData={claimsWorkflowFunnel}>
          <InteractiveBarChart
            data={claimsWorkflowFunnel}
            chartTitle="Workflow Funnel"
            layout="vertical"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#6366f1', name: 'Volume' }]}
            cellColors={FUNNEL_COLORS}
          />
        </ChartCard>
        <ChartCard title="District-wise Claims" subtitle="Top districts by claim volume and amount paid" exportData={mpDistrictClaimsData}>
          <InteractiveBarChart
            data={mpDistrictClaimsData}
            chartTitle="District Claims"
            height={260}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'claims', fill: '#3b82f6', name: 'Claims Count' },
              { dataKey: 'amount', fill: '#f59e0b', name: 'Amount (₹ Cr)' },
            ]}
          />
        </ChartCard>
      </div>

      {/* Row 4: Hospital Type Claims + Avg Processing Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Hospital Type vs Claims" subtitle="claim_paid_t joined hospital_master — Govt vs Private claim share" exportData={mpHospitalTypeClaimsData}>
          <InteractiveBarChart
            data={mpHospitalTypeClaimsData}
            chartTitle="Hospital Type Claims"
            height={260}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'claims', fill: '#3b82f6', name: 'Claims Count' },
              { dataKey: 'amount', fill: '#10b981', name: 'Amount (₹ Cr)' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Avg Processing Days by District" subtitle="claim_paid_t — Days from preauth_init_date to payment_paid_dt" exportData={mpAvgProcessingDays}>
          <InteractiveBarChart
            data={mpAvgProcessingDays}
            chartTitle="Processing Days"
            layout="vertical"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'avg_days', fill: '#f59e0b', name: 'Avg Days' }]}
          />
        </ChartCard>
      </div>

      {/* Full Claims Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        title={`Claims Records — claim_paid_t (${filtered.length} records)`}
        onRowClick={(row) => openDetail({ title: String(row.case_id), subtitle: 'Claim Record — Full Timeline', data: row })}
      />
    </div>
  )
}
