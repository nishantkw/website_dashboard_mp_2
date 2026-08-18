import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart, InteractiveLineChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import {
  mpPatientKPIs, mpTreatmentData, mpTreatmentCostData, mpAdmissionTrend,
  mpAdmissionTypeData, mpTopIcdData, mpPatientDistrictData, mpDischargeTypeData,
  mpPatientTableData,
} from '../../data/mockData'

const TREATMENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#94a3b8']
const ADMISSION_COLORS = ['#10b981', '#ef4444', '#f59e0b']
const DISCHARGE_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444']

const columns = [
  { key: 'patient_id', label: 'Patient ID' },
  { key: 'name', label: 'Name' },
  { key: 'registration_id', label: 'Reg ID' },
  { key: 'case_id', label: 'Case ID' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'district', label: 'District' },
  { key: 'treatment', label: 'Treatment' },
  { key: 'icd_code', label: 'ICD Code' },
  { key: 'admission_dt', label: 'Admission' },
  { key: 'discharge_dt', label: 'Discharge' },
  { key: 'admission_type', label: 'Admit Type' },
  { key: 'discharge_type', label: 'Discharge Type' },
  { key: 'cost', label: 'Cost', align: 'right' as const },
  { key: 'status', label: 'Status' },
]

export default function Patients() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpPatientTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Patients & Treatment" description="t_patient_dtls + treatment_dtls + icd_data_doctor_details — Patient records, treatment details and ICD diagnosis codes" schema="dmart_mp" />
      <KPIGrid kpis={mpPatientKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      {/* Row 1: Treatment Specialty + Cost by Specialty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Treatment Specialty Distribution" subtitle="treatment_dtls — Patient count by specialty" exportData={mpTreatmentData}>
          <InteractivePieChart data={mpTreatmentData} colors={TREATMENT_COLORS} innerRadius={55} chartTitle="Treatment Specialty" onItemClick={openFromChart} />
        </ChartCard>
        <ChartCard title="Avg Cost by Specialty (₹)" subtitle="claim_paid_t.paid_amount — Average treatment cost per specialty" exportData={mpTreatmentCostData}>
          <InteractiveBarChart
            data={mpTreatmentCostData}
            chartTitle="Specialty Cost"
            layout="vertical"
            height={270}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'avg_cost', fill: '#f59e0b', name: 'Avg Cost (₹)' }]}
          />
        </ChartCard>
      </div>

      {/* Row 2: Monthly Admission Trend + Admission Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Monthly Admission & Discharge Trend" subtitle="admission_dt / discharge_dt from t_patient_dtls" exportData={mpAdmissionTrend}>
          <InteractiveLineChart
            data={mpAdmissionTrend}
            chartTitle="Admission Trend"
            height={270}
            showLegend
            onItemClick={openFromChart}
            lines={[
              { dataKey: 'admissions', stroke: '#3b82f6', name: 'Admissions' },
              { dataKey: 'discharges', stroke: '#10b981', name: 'Discharges' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Admission Type Breakdown" subtitle="admission_type — Planned / Emergency / MORTH" exportData={mpAdmissionTypeData}>
          <InteractivePieChart data={mpAdmissionTypeData} colors={ADMISSION_COLORS} innerRadius={55} chartTitle="Admission Type" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 3: Top ICD Codes + District Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Top ICD Diagnosis Codes" subtitle="icd_data_doctor_details — Most common diagnosis codes" exportData={mpTopIcdData}>
          <InteractiveBarChart
            data={mpTopIcdData}
            chartTitle="ICD Codes"
            layout="vertical"
            height={270}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#8b5cf6', name: 'Patients' }]}
          />
        </ChartCard>
        <ChartCard title="District-wise Patient Volume" subtitle="t_patient_dtls — Patient count by top districts" exportData={mpPatientDistrictData}>
          <InteractiveBarChart
            data={mpPatientDistrictData}
            chartTitle="District Patients"
            height={270}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'patients', fill: '#3b82f6', name: 'Patients' }]}
          />
        </ChartCard>
      </div>

      {/* Row 4: Discharge Type */}
      <div className="mb-4">
        <ChartCard title="Discharge Type Distribution" subtitle="discharge_type — Recovered / Referred / LAMA / Death" exportData={mpDischargeTypeData}>
          <InteractivePieChart data={mpDischargeTypeData} colors={DISCHARGE_COLORS} innerRadius={55} chartTitle="Discharge Types" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Full Patient Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        title={`Patient Records — t_patient_dtls (${filtered.length} records)`}
        onRowClick={(row) => openDetail({ title: String(row.patient_id), subtitle: 'Patient Record', data: row })}
      />
    </div>
  )
}
