import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart, InteractiveLineChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import {
  mpHospitalKPIs, mpHospitalTypeData, mpHospitalDistrictData, mpAccreditationData,
  mpEmpanelmentTrend, mpSchemeHospitals, mpDeempanelReasons, mpHospitalSpecData,
  mpHospitalTableData,
} from '../../data/mockData'

const TYPE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
const ACCRED_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#94a3b8']
const DEEMPANEL_COLORS = ['#ef4444', '#f59e0b', '#f97316', '#6366f1', '#94a3b8']
const SPEC_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4']

const columns = [
  { key: 'code', label: 'Hospital Code' },
  { key: 'facility_id', label: 'Facility ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'district', label: 'District' },
  { key: 'spec_type', label: 'Specialty' },
  { key: 'nabh', label: 'NABH' },
  { key: 'enrl_status', label: 'Enroll Status' },
  { key: 'active_status', label: 'Active' },
  { key: 'accreditation', label: 'Accreditation' },
  { key: 'empaneled_date', label: 'Empaneled On' },
  { key: 'deempanel_status', label: 'De-Empanel Reason' },
  { key: 'pgdnb_status', label: 'PGDNB' },
]

export default function Hospitals() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpHospitalTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Hospitals & Empanelment" description="hospital_master_with_quality_certification_final (36 cols) + t_hem_hospital (53 cols) + t_deempanelment_details" schema="dmart_mp" />
      <KPIGrid kpis={mpHospitalKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      {/* Row 1: Type Distribution + District-wise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Hospital Type Distribution" subtitle="hospital_type — Govt / Private / Trust / Corporate" exportData={mpHospitalTypeData}>
          <InteractivePieChart data={mpHospitalTypeData} colors={TYPE_COLORS} innerRadius={55} chartTitle="Hospital Types" onItemClick={openFromChart} />
        </ChartCard>
        <ChartCard title="District-wise Hospitals & NABH" subtitle="Total hospitals vs NABH certified per district" exportData={mpHospitalDistrictData}>
          <InteractiveBarChart
            data={mpHospitalDistrictData}
            chartTitle="District Hospitals"
            height={270}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'hospitals', fill: '#3b82f6', name: 'Total' },
              { dataKey: 'certified', fill: '#10b981', name: 'NABH Certified' },
            ]}
          />
        </ChartCard>
      </div>

      {/* Row 2: Accreditation Status + Empanelment Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Accreditation Status" subtitle="accreditation_status — NABH Full / Entry / NABL / ISO / None" exportData={mpAccreditationData}>
          <InteractivePieChart data={mpAccreditationData} colors={ACCRED_COLORS} chartTitle="Accreditation" onItemClick={openFromChart} />
        </ChartCard>
        <ChartCard title="Empanelment vs De-empanelment Trend" subtitle="Monthly new empanelments vs de-empanelments (Jan–Aug 2025)" exportData={mpEmpanelmentTrend}>
          <InteractiveLineChart
            data={mpEmpanelmentTrend}
            chartTitle="Empanelment Trend"
            height={270}
            showLegend
            onItemClick={openFromChart}
            lines={[
              { dataKey: 'empanelled', stroke: '#10b981', name: 'Empanelled' },
              { dataKey: 'deempanelled', stroke: '#ef4444', name: 'De-empanelled' },
            ]}
          />
        </ChartCard>
      </div>

      {/* Row 3: Scheme-wise Hospitals + Spec Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Scheme-wise Hospital Coverage" subtitle="t_hem_sch_mapping — PM-JAY vs State Scheme per district" exportData={mpSchemeHospitals}>
          <InteractiveBarChart
            data={mpSchemeHospitals}
            chartTitle="Scheme Coverage"
            height={270}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'pmjay', fill: '#3b82f6', name: 'PM-JAY' },
              { dataKey: 'state_scheme', fill: '#8b5cf6', name: 'State Scheme' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Hospital Specialty Type" subtitle="hosp_spec_type — Multi-Specialty / Single / General / Dental" exportData={mpHospitalSpecData}>
          <InteractivePieChart data={mpHospitalSpecData} colors={SPEC_COLORS} innerRadius={55} chartTitle="Specialty Type" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 4: De-empanelment Reasons */}
      <div className="mb-4">
        <ChartCard title="De-empanelment Reasons" subtitle="t_deempanelment_details — Reason breakdown for removed hospitals" exportData={mpDeempanelReasons}>
          <InteractiveBarChart
            data={mpDeempanelReasons}
            chartTitle="De-empanelment Reasons"
            layout="vertical"
            height={220}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#ef4444', name: 'Count' }]}
            cellColors={DEEMPANEL_COLORS}
          />
        </ChartCard>
      </div>

      {/* Full Hospital Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        title={`Hospital Records — hospital_master_with_quality_certification_final (${filtered.length} records)`}
        onRowClick={(row) => openDetail({ title: String(row.name), subtitle: 'Hospital Record', data: row })}
      />
    </div>
  )
}
