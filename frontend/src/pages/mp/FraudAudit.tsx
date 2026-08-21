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
  mpFraudTriggerTypeData, mpFraudAppTypeData, mpFraudTriggerTableData,
} from '../../data/mockData'

const FRAUD_TYPE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#dc2626', '#b91c1c']
const ENTITY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981']
const AUDIT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
const TRIGGER_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#3b82f6', '#06b6d4']
const APP_COLORS = ['#dc2626', '#2563eb', '#059669', '#7c3aed']

const caseColumns = [
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

const triggerColumns = [
  { key: 'id_pk', label: 'ID' },
  { key: 'reference_number', label: 'Reference No.' },
  { key: 'application_type', label: 'Application Type' },
  { key: 'vendor_id', label: 'Vendor ID' },
  { key: 'trigger_type', label: 'Trigger Type' },
  { key: 'trigger_code', label: 'Trigger Code' },
  { key: 'trigger_reason', label: 'Trigger Reason' },
  { key: 'trigger_time', label: 'Trigger Time' },
  { key: 'flag', label: 'Flag' },
  { key: 'crt_usr', label: 'Created By' },
  { key: 'district', label: 'District' },
]

export default function FraudAudit() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filteredCases = filterData(mpFraudTableData)
  const filteredTriggers = filterData(mpFraudTriggerTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Fraud & Audit" description="Suspicious case monitoring, rule-trigger details, investigation pipeline and amount recovery" />
      <KPIGrid kpis={mpFraudKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Fraud Case Trend" exportData={mpFraudTrend}>
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
        <ChartCard title="Fraud Type Distribution" exportData={mpFraudTypeData}>
          <InteractivePieChart data={mpFraudTypeData} colors={FRAUD_TYPE_COLORS} innerRadius={55} chartTitle="Fraud Types" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Amount Recovered (₹ L)" exportData={mpFraudRecoveredTrend}>
          <InteractiveBarChart
            data={mpFraudRecoveredTrend}
            chartTitle="Recovery Trend"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'recovered', fill: '#10b981', name: 'Recovered (₹ L)' }]}
          />
        </ChartCard>
        <ChartCard title="Entity Type Breakdown" exportData={mpFraudEntityData}>
          <InteractivePieChart data={mpFraudEntityData} colors={ENTITY_COLORS} innerRadius={55} chartTitle="Entity Type" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Suspicious Cases by District" exportData={mpFraudDistrictData}>
          <InteractiveBarChart
            data={mpFraudDistrictData}
            chartTitle="District Fraud"
            layout="vertical"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#ef4444', name: 'Suspicious Cases' }]}
          />
        </ChartCard>
        <ChartCard title="Audit Workflow Stage Distribution" exportData={mpAuditStageData}>
          <InteractivePieChart data={mpAuditStageData} colors={AUDIT_COLORS} chartTitle="Audit Stages" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* t_suspicious_api_case_dtls — trigger analytics */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Rule Trigger Type Distribution" exportData={mpFraudTriggerTypeData}>
          <InteractiveBarChart
            data={mpFraudTriggerTypeData}
            chartTitle="Trigger Types"
            height={260}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#dc2626', name: 'Triggers' }]}
            cellColors={TRIGGER_COLORS}
          />
        </ChartCard>
        <ChartCard title="Triggers by Application Type" exportData={mpFraudAppTypeData}>
          <InteractivePieChart data={mpFraudAppTypeData} colors={APP_COLORS} innerRadius={55} chartTitle="Application Types" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      <div className="mb-4">
        <DataTable
          columns={caseColumns}
          data={filteredCases}
          title={`Suspicious Cases (${filteredCases.length})`}
          onRowClick={(row) => openDetail({ title: String(row.case_id), subtitle: 'Fraud Investigation Record', data: row })}
        />
      </div>

      <DataTable
        columns={triggerColumns}
        data={filteredTriggers}
        title={`Rule Trigger Details (${filteredTriggers.length})`}
        onRowClick={(row) =>
          openDetail({
            title: String(row.reference_number),
            subtitle: 'Suspicious Case Trigger Detail',
            data: row,
          })
        }
      />
    </div>
  )
}
