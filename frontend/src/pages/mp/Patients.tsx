import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import type { KPI } from '../../types'
import { mpPatientKPIs, mpTreatmentData, mpPatientTableData } from '../../data/mockData'

const columns = [
  { key: 'patient_id', label: 'Patient ID' }, { key: 'name', label: 'Name' }, { key: 'treatment', label: 'Treatment' },
  { key: 'hospital', label: 'Hospital' }, { key: 'status', label: 'Status' }, { key: 'cost', label: 'Cost', align: 'right' as const },
]

export default function Patients() {
  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown()
  const { filterData } = useGlobalFilterData()
  const filtered = filterData(mpPatientTableData)

  return (
    <div>
      <Modal />
      <PageHeader title="Patients & Treatment" description="Patient details, MORTH patients and treatment stratification" schema="dmart_mp" />
      <KPIGrid kpis={mpPatientKPIs} onKpiClick={(kpi: KPI) => openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })} />
      <div className="mb-4">
        <ChartCard title="Treatment by Specialty"><InteractiveBarChart data={mpTreatmentData} chartTitle="Treatments" height={280} onItemClick={openFromChart} bars={[{ dataKey: 'patients', fill: '#3b82f6', name: 'Patients' }]} /></ChartCard>
      </div>
      <DataTable columns={columns} data={filtered} title={`Patient Records (${filtered.length})`} onRowClick={(row) => openDetail({ title: String(row.patient_id), subtitle: 'Patient', data: row })} />
    </div>
  )
}
