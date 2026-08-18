import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart, InteractiveLineChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import {
  mpFraudKPIs, mpFraudTrend, mpFraudTypeData, mpFraudRecoveredTrend,
  mpFraudEntityData, mpFraudDistrictData, mpAuditStageData, mpFraudTableData,
} from '../../data/mockData'

const FRAUD_TYPE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#dc2626', '#b91c1c']
const ENTITY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981']
const AUDIT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

const columns = [
  { key: 'case_id', label: 'Case ID' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'hospital', label: 'Hospital / Entity' },
  { key: 'district', label: 'District' },
  { key: 'type', label: 'Fraud Type' },
  { key: 'status', label: 'Status' },
  { key: 'amount_risk', label: 'Amount at Risk', align: 'right' as const },
  { key: 'amount_recovered', label: 'Recovered', align: 'right' as const },
  { key: 'start_date', label: 'Started On' },
  { key: 'investigator', label: 'Investigator' },
]

export default function FraudAudit() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpFraudTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Fraud & Audit" description="t_suspicious_api_case_data + t_workflow_transaction_audit — Suspicious case monitoring, investigation pipeline and amount recovery" schema="dmart_mp" />
      <KPIGrid kpis={mpFraudKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      {/* Row 1: Fraud Trend + Fraud Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Monthly Fraud Case Trend" subtitle="Suspicious vs Confirmed fraud cases (Jan–Aug 2025)" exportData={mpFraudTrend}>
          <InteractiveLineChart
            data={mpFraudTrend}
            chartTitle="Fraud Trend"
            height={260}
            showLegend
            onItemClick={openFromChart}
            lines={[
              { dataKey: 'suspicious', stroke: '#f59e0b', name: 'Suspicious' },
              { dataKey: 'confirmed', stroke: '#ef4444', name: 'Confirmed Fraud' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Fraud Type Distribution" subtitle="t_suspicious_api_case_data — Category of fraudulent activity" exportData={mpFraudTypeData}>
          <InteractivePieChart data={mpFraudTypeData} colors={FRAUD_TYPE_COLORS} innerRadius={55} chartTitle="Fraud Types" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 2: Recovery Trend + Entity Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Monthly Amount Recovered (₹ L)" subtitle="Cumulative fraud recovery trend (Jan–Aug 2025)" exportData={mpFraudRecoveredTrend}>
          <InteractiveBarChart
            data={mpFraudRecoveredTrend}
            chartTitle="Recovery Trend"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'recovered', fill: '#10b981', name: 'Recovered (₹ L)' }]}
          />
        </ChartCard>
        <ChartCard title="Entity Type Breakdown" subtitle="entity_type — Hospital / User / Beneficiary involvement" exportData={mpFraudEntityData}>
          <InteractivePieChart data={mpFraudEntityData} colors={ENTITY_COLORS} innerRadius={55} chartTitle="Entity Type" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 3: District Fraud + Audit Workflow Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Suspicious Cases by District" subtitle="Top districts by fraud case volume" exportData={mpFraudDistrictData}>
          <InteractiveBarChart
            data={mpFraudDistrictData}
            chartTitle="District Fraud"
            layout="vertical"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#ef4444', name: 'Suspicious Cases' }]}
          />
        </ChartCard>
        <ChartCard title="Audit Workflow Stage Distribution" subtitle="t_workflow_transaction_audit — SHA / ACO / CPD / Pending" exportData={mpAuditStageData}>
          <InteractivePieChart data={mpAuditStageData} colors={AUDIT_COLORS} chartTitle="Audit Stages" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Full Fraud Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        title={`Suspicious Cases — t_suspicious_api_case_data (${filtered.length} records)`}
        onRowClick={(row) => openDetail({ title: String(row.case_id), subtitle: 'Fraud Investigation Record', data: row })}
      />
    </div>
  )
}
