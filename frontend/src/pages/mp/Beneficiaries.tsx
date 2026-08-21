import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractivePieChart, InteractiveLineChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import {
  mpBeneficiaryKPIs, mpBeneficiaryGender, mpBeneficiaryUrbanRural,
  mpBeneficiaryDistrictData, mpBeneficiaryEnrollStatus, mpBeneficiaryCardStatus,
  mpBeneficiaryMonthlyEnroll, mpBeneficiaryEkycAbha, mpBeneficiaryTableData,
} from '../../data/mockData'

const GENDER_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6']
const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8']
const CARD_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b']

const columns = [
  { key: 'ben_id', label: 'Ben ID' },
  { key: 'name', label: 'Name' },
  { key: 'family_id', label: 'Family ID' },
  { key: 'member_id', label: 'Member' },
  { key: 'gender', label: 'Gender' },
  { key: 'dob', label: 'DOB' },
  { key: 'district', label: 'District' },
  { key: 'rural_urban', label: 'Rural/Urban' },
  { key: 'enrl_status', label: 'Enroll Status' },
  { key: 'card_status', label: 'Card Status' },
  { key: 'aadhar_status', label: 'Aadhaar' },
  { key: 'abha_id', label: 'ABHA ID' },
  { key: 'ekyc', label: 'eKYC' },
  { key: 'enrol_date', label: 'Enrol Date' },
]

export default function Beneficiaries() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpBeneficiaryTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Beneficiaries" description="Demographics, enrollment, eKYC, ABHA and card status" />
      <KPIGrid kpis={mpBeneficiaryKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />

      {/* Row 1: Gender + Urban/Rural */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Gender Distribution" subtitle="Share of male and female beneficiaries" exportData={mpBeneficiaryGender}>
          <InteractivePieChart data={mpBeneficiaryGender} colors={GENDER_COLORS} innerRadius={55} chartTitle="Gender" onItemClick={openFromChart} />
        </ChartCard>
        <ChartCard title="Urban vs Rural" subtitle="Beneficiary area classification" exportData={mpBeneficiaryUrbanRural}>
          <InteractiveBarChart
            data={mpBeneficiaryUrbanRural}
            chartTitle="Urban/Rural"
            height={270}
            onItemClick={openFromChart}
            bars={[{ dataKey: 'value', fill: '#10b981', name: 'Count' }]}
            cellColors={['#f59e0b', '#10b981']}
          />
        </ChartCard>
      </div>

      {/* Row 2: District Enrollment + Enrollment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="District-wise Enrollment" subtitle="Top 8 districts — enrolled vs active" exportData={mpBeneficiaryDistrictData}>
          <InteractiveBarChart
            data={mpBeneficiaryDistrictData}
            chartTitle="District Enrollment"
            height={300}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'enrolled', fill: '#3b82f6', name: 'Enrolled' },
              { dataKey: 'active', fill: '#10b981', name: 'Active' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Enrollment Status" subtitle="Current enrollment breakdown" exportData={mpBeneficiaryEnrollStatus}>
          <InteractivePieChart data={mpBeneficiaryEnrollStatus} colors={STATUS_COLORS} innerRadius={55} chartTitle="Enroll Status" onItemClick={openFromChart} />
        </ChartCard>
      </div>

      {/* Row 3: Card Status + Monthly Enrollment Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Card Status Breakdown" subtitle="Card printing and delivery status" exportData={mpBeneficiaryCardStatus}>
          <InteractivePieChart data={mpBeneficiaryCardStatus} colors={CARD_COLORS} chartTitle="Card Status" onItemClick={openFromChart} />
        </ChartCard>
        <ChartCard title="Monthly Enrollment Trend" subtitle="Enrollments vs approvals by month" exportData={mpBeneficiaryMonthlyEnroll}>
          <InteractiveLineChart
            data={mpBeneficiaryMonthlyEnroll}
            chartTitle="Enrollment Trend"
            height={270}
            showLegend
            onItemClick={openFromChart}
            lines={[
              { dataKey: 'enrollments', stroke: '#3b82f6', name: 'Enrolled' },
              { dataKey: 'approvals', stroke: '#10b981', name: 'Approved' },
            ]}
          />
        </ChartCard>
      </div>

      {/* Row 4: eKYC + ABHA District Coverage */}
      <div className="mb-4">
        <ChartCard title="eKYC & ABHA Coverage by District" subtitle="Completed eKYC vs ABHA-linked beneficiaries per district" exportData={mpBeneficiaryEkycAbha}>
          <InteractiveBarChart
            data={mpBeneficiaryEkycAbha}
            chartTitle="eKYC & ABHA"
            height={260}
            showLegend
            onItemClick={openFromChart}
            bars={[
              { dataKey: 'ekyc', fill: '#10b981', name: 'eKYC Completed' },
              { dataKey: 'abha', fill: '#8b5cf6', name: 'ABHA Linked' },
            ]}
          />
        </ChartCard>
      </div>

      {/* Full Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        title={`Beneficiary Records — t_bis_beneficiary_dtls (${filtered.length} records)`}
        onRowClick={(row) => openDetail({ title: String(row.ben_id), subtitle: 'Beneficiary Profile', data: row })}
      />
    </div>
  )
}
