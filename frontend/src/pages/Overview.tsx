import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import ChartCard from '../components/ui/ChartCard'
import DataTable from '../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../components/ui/PageHeader'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../components/charts/InteractiveCharts'
import { useDrillDown } from '../hooks/useDrillDown'
import { useApiResource } from '../hooks/useApiResource'
import { fetchOverview, fetchOverviewHospitals, fetchClaims, fetchHospitalsExport, fetchBeneficiaries, fetchFraud, fetchPatients, fetchLms, fetchWorkflow, fetchBisCardPrinting } from '../api/endpoints'
import DataSourceBadge from '../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../utils/schemaColumns'
import { TABLE_PAGE_SIZE } from '../hooks/useTableControls'
import { useGlobalFilters } from '../context/FilterContext'
import { monthLabelToRange } from '../utils/chartDrillDown'
import type { KPI, TableColumn } from '../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const CLAIM_PREFERRED: TableColumn[] = [
  { key: 'case_id', label: 'Case ID' },
  { key: 'patient_name', label: 'Patient' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'patient_state_name', label: 'State' },
  { key: 'patient_district_name', label: 'District' },
  { key: 'case_type', label: 'Case Type' },
  { key: 'case_status', label: 'Status' },
]

const BENEFICIARY_PREFERRED: TableColumn[] = [
  { key: 'ben_id', label: 'Ben ID' },
  { key: 'name', label: 'Name' },
  { key: 'dist_name', label: 'District' },
  { key: 'gender', label: 'Gender' },
  { key: 'enrl_status', label: 'Enroll Status' },
  { key: 'card_status', label: 'Card Status' },
]

const FRAUD_PREFERRED: TableColumn[] = [
  { key: 'reference_number', label: 'Reference' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'district_name', label: 'District' },
  { key: 'investigation_status', label: 'Status' },
  { key: 'trigger_type', label: 'Trigger Type' },
]

const PATIENT_PREFERRED: TableColumn[] = [
  { key: 'registration_id', label: 'Reg ID' },
  { key: 'name', label: 'Name' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'gender', label: 'Gender' },
  { key: 'registration_date', label: 'Registration Date' },
]

const LMS_PREFERRED: TableColumn[] = [
  { key: 'userid', label: 'User ID' },
  { key: 'username', label: 'Username' },
  { key: 'firstname', label: 'First Name' },
  { key: 'lastname', label: 'Last Name' },
  { key: 'role', label: 'Role' },
]

const WORKFLOW_PREFERRED: TableColumn[] = [
  { key: 'workflow_user', label: 'User' },
  { key: 'workflow_role', label: 'Role' },
  { key: 'status_descrption', label: 'Status' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'created_dt', label: 'Created' },
]

const BIS_PREFERRED: TableColumn[] = [
  { key: 'card_no', label: 'Card No.' },
  { key: 'ben_id', label: 'Ben ID' },
  { key: 'card_name', label: 'Name' },
  { key: 'district_name', label: 'District' },
  { key: 'card_print_status', label: 'Print Status' },
]

function columnsFromRows(
  schemaKeys: string[] | undefined,
  rows: Record<string, string | number>[],
  preferred: TableColumn[]
) {
  const preferredFirst = preferred.map((c) => c.key)
  const filtered = schemaTableColumns({
    source: 'api',
    schemaKeys,
    rows,
    preferredFirst,
    demoColumns: preferred,
  })
  if (filtered.length) return filtered
  return schemaTableColumns({
    source: 'api',
    schemaKeys,
    rows,
    preferredFirst,
  })
}

function withQuery(qs: string, extra: Record<string, string>) {
  const params = new URLSearchParams(qs.replace(/^\?/, ''))
  for (const [key, value] of Object.entries(extra)) params.set(key, value)
  const s = params.toString()
  return s ? `?${s}` : ''
}

const HOSPITAL_PREFERRED: TableColumn[] = [
  { key: 'hosp_name', label: 'Hospital Name' },
  { key: 'district_name', label: 'District' },
  { key: 'state_name', label: 'State' },
  { key: 'hospital_type', label: 'Type' },
  { key: 'facility_id', label: 'Facility ID' },
  { key: 'hosp_id', label: 'Hosp ID' },
  { key: 'hosp_status_desc', label: 'Empanelment Status' },
  { key: 'active_status', label: 'Currently Serving' },
  { key: 'hosp_empaneled_date', label: 'Empaneled On' },
  { key: 'hosp_city', label: 'City' },
  { key: 'hosp_address', label: 'Address' },
  { key: 'hosp_mobile_no', label: 'Mobile' },
  { key: 'bed_size', label: 'Beds', align: 'right' },
  { key: 'quality_certification', label: 'Quality Certification' },
]

export default function Overview() {
  const tableRef = useRef<HTMLDivElement>(null)
  const [hospitalRows, setHospitalRows] = useState<Record<string, string | number>[]>([])
  const [hospitalColumns, setHospitalColumns] = useState<TableColumn[]>([])
  const [hospitalLoading, setHospitalLoading] = useState(false)
  const [hospitalError, setHospitalError] = useState('')
  const [hospitalPage, setHospitalPage] = useState(1)
  const [hospitalTotal, setHospitalTotal] = useState(0)
  const { globalFilters } = useGlobalFilters()
  const overviewQs = useMemo(() => {
    const params = new URLSearchParams()
    if (globalFilters.state_type) params.set('state_type', globalFilters.state_type)
    if (globalFilters.state_type !== 'Portability') {
      if (globalFilters.division) params.set('division', globalFilters.division)
      if (globalFilters.district) params.set('district', globalFilters.district)
    }
    const s = params.toString()
    return s ? `?${s}` : ''
  }, [globalFilters.state_type, globalFilters.division, globalFilters.district])

  useEffect(() => {
    setHospitalPage(1)
    setHospitalRows([])
    setHospitalTotal(0)
  }, [overviewQs])

  const { data, source, db, loading, error } = useApiResource(
    () => fetchOverview(overviewQs),
    {
      kpis: [] as KPI[],
      charts: {
        claimStatus: [],
        caseType: [],
        district: [],
        claimsTrend: [],
        hospitalType: [],
      },
      schemas: {} as Record<string, string>,
    },
    [overviewQs]
  )
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const statusDist = data.charts?.claimStatus ?? []
  const caseTypeDist = data.charts?.caseType ?? []
  const districtDist = data.charts?.district ?? []
  const claimsTrendLive = data.charts?.claimsTrend ?? []
  const hospitalTypeDist = data.charts?.hospitalType ?? []

  const { openFromChart, openDetail, Modal } = useDrillDown({
    live,
    fetchDrillDown: live
      ? async (payload, chartTitle) => {
          if (/hospital type/i.test(chartTitle)) {
            const params = new URLSearchParams(overviewQs.replace(/^\?/, ''))
            const typeName = String(payload.name ?? '').trim()
            const isOthers = /^others$/i.test(typeName)
            if (typeName && !isOthers) params.set('hospital_type', typeName)
            params.set('detail', '1')
            const res = await fetchOverviewHospitals(`?${params.toString()}`, 120000)
            if (!res.ok) return null
            const rows = (res.data.table ?? []) as Record<string, string | number>[]
            const columns = schemaTableColumns({
              source: 'api',
              schemaKeys: res.data.columns,
              rows,
              preferredFirst: HOSPITAL_PREFERRED.map((c) => c.key),
              demoColumns: HOSPITAL_PREFERRED,
            })
            return {
              rows,
              columns,
              datasetTitle: typeName ? `Hospitals — ${typeName}` : 'Hospitals',
              alreadyFiltered: !isOthers,
            }
          }
          if (!/claim status|case type|district.*claim|trend/i.test(chartTitle)) return null
          const params = new URLSearchParams(overviewQs.replace(/^\?/, ''))
          const sliceName = String(payload.name ?? '').trim()
          const isOthers = /^others$/i.test(sliceName)
          if (/trend/i.test(chartTitle) && sliceName) {
            const range = monthLabelToRange(sliceName)
            if (range) {
              params.set('date_from', range.from)
              params.set('date_to', range.to)
            }
          }
          if (/district/i.test(chartTitle) && sliceName && !isOthers) {
            params.set('district', sliceName)
          }
          if (/claim status/i.test(chartTitle) && sliceName && !isOthers) {
            params.set('case_status', sliceName)
          }
          if (/case type/i.test(chartTitle) && sliceName && !isOthers) {
            params.set('case_type', sliceName)
          }
          params.set('detail', '1')
          const qs = params.toString() ? `?${params.toString()}` : ''
          const res = await fetchClaims(qs, 60000)
          if (!res.ok) return null
          const rows = (res.data.table ?? []) as Record<string, string | number>[]
          const columns = schemaTableColumns({
            source: 'api',
            schemaKeys: res.data.columns,
            rows,
            preferredFirst: CLAIM_PREFERRED.map((c) => c.key),
            demoColumns: CLAIM_PREFERRED,
          })
          const datasetTitle = /trend/i.test(chartTitle) && sliceName
            ? `Claim Records — ${sliceName}`
            : 'Claim Records'
          return {
            rows,
            columns,
            datasetTitle,
            alreadyFiltered: !isOthers,
          }
        }
      : undefined,
  })

  const showHospitalTable = async (title = 'Hospitals', pageNum = 1) => {
    setHospitalError('')
    setHospitalLoading(true)
    if (pageNum === 1) {
      openDetail({ title, subtitle: 'Loading unique hospitals…', loading: true, source: 'api' })
    }
    try {
      const params = new URLSearchParams(overviewQs.replace(/^\?/, ''))
      params.set('limit', String(TABLE_PAGE_SIZE))
      params.set('offset', String((pageNum - 1) * TABLE_PAGE_SIZE))
      const res = await fetchOverviewHospitals(`?${params.toString()}`)
      if (!res.ok) {
        setHospitalError(res.error || 'Could not load hospitals')
        openDetail({
          title,
          subtitle: 'Could not load hospitals',
          data: { error: res.error || 'Request failed' },
          source: 'api',
        })
        return
      }
      const rows = (res.data.table ?? []) as Record<string, string | number>[]
      const total = Number(res.data.total ?? res.data.tableTotal ?? rows.length)
      const columns = schemaTableColumns({
        source: 'api',
        schemaKeys: res.data.columns,
        rows,
        preferredFirst: HOSPITAL_PREFERRED.map((c) => c.key),
        demoColumns: HOSPITAL_PREFERRED,
      })
      setHospitalRows(rows)
      setHospitalColumns(columns)
      setHospitalTotal(total)
      setHospitalPage(pageNum)
      openDetail({
        title,
        subtitle: `${total.toLocaleString()} unique hospital${total === 1 ? '' : 's'}`,
        records: rows,
        columns,
        datasetTitle: 'Hospitals',
        source: 'api',
      })
      requestAnimationFrame(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } finally {
      setHospitalLoading(false)
    }
  }

  const fetchOverviewHospitalExport = useCallback(async () => {
    const res = await fetchHospitalsExport(overviewQs)
    if (!res.ok) return []
    return (res.data.table ?? []) as Record<string, string | number>[]
  }, [overviewQs])

  const KPI_FETCH_MS = 60000

  const showKpiRecords = async (kpi: KPI) => {
    const key = String(kpi.key || kpi.label).toLowerCase()
    openDetail({ title: kpi.label, subtitle: 'Loading records…', loading: true, source: 'api' })
    try {
      let rows: Record<string, string | number>[] = []
      let columns: TableColumn[] = []
      let datasetTitle = kpi.label

      if (key === 'claims' || /^claims$/i.test(kpi.label)) {
        const res = await fetchClaims(withQuery(overviewQs, { detail: '1' }), KPI_FETCH_MS)
        if (!res.ok) throw new Error(res.error || 'Could not load claims')
        rows = (res.data.table ?? []) as Record<string, string | number>[]
        columns = columnsFromRows(res.data.columns, rows, CLAIM_PREFERRED)
        datasetTitle = 'Claim Records'
      } else if (key === 'beneficiaries' || /beneficiar/i.test(kpi.label)) {
        const res = await fetchBeneficiaries(overviewQs, KPI_FETCH_MS)
        if (!res.ok) throw new Error(res.error || 'Could not load beneficiaries')
        rows = (res.data.table ?? []) as Record<string, string | number>[]
        columns = columnsFromRows(res.data.columns, rows, BENEFICIARY_PREFERRED)
        datasetTitle = 'Beneficiary Records'
      } else if (key === 'fraud' || /fraud/i.test(kpi.label)) {
        const res = await fetchFraud('overall', overviewQs, KPI_FETCH_MS)
        if (!res.ok) throw new Error(res.error || 'Could not load fraud cases')
        rows = (res.data.table ?? []) as Record<string, string | number>[]
        columns = columnsFromRows(res.data.columns, rows, FRAUD_PREFERRED)
        datasetTitle = 'Fraud & Audit Records'
      } else if (key === 'patients' || /patient/i.test(kpi.label)) {
        const res = await fetchPatients(overviewQs, KPI_FETCH_MS)
        if (!res.ok) throw new Error(res.error || 'Could not load patients')
        rows = (res.data.table ?? []) as Record<string, string | number>[]
        columns = columnsFromRows(res.data.columns, rows, PATIENT_PREFERRED)
        datasetTitle = 'Patient Records'
      } else if (key === 'lms' || /lms/i.test(kpi.label)) {
        const res = await fetchLms(overviewQs, KPI_FETCH_MS)
        if (!res.ok) throw new Error(res.error || 'Could not load LMS users')
        rows = (res.data.table ?? []) as Record<string, string | number>[]
        columns = columnsFromRows(res.data.columns, rows, LMS_PREFERRED)
        datasetTitle = 'LMS Users'
      } else if (key === 'workflow' || /workflow/i.test(kpi.label)) {
        const res = await fetchWorkflow(overviewQs, KPI_FETCH_MS)
        if (!res.ok) throw new Error(res.error || 'Could not load workflow users')
        rows = (res.data.table ?? []) as Record<string, string | number>[]
        columns = columnsFromRows(res.data.columns, rows, WORKFLOW_PREFERRED)
        datasetTitle = 'Workflow Users'
      } else if (key === 'bis' || /card printing/i.test(kpi.label)) {
        const res = await fetchBisCardPrinting(overviewQs, KPI_FETCH_MS)
        if (!res.ok) throw new Error(res.error || 'Could not load card printing records')
        rows = (res.data.table ?? []) as Record<string, string | number>[]
        columns = columnsFromRows(res.data.columns, rows, BIS_PREFERRED)
        datasetTitle = 'Card Printing Records'
      } else {
        openDetail({
          title: kpi.label,
          subtitle: 'No records available for this card',
          records: [],
          columns: [],
          source: 'api',
        })
        return
      }

      openDetail({
        title: kpi.label,
        subtitle: `${rows.length.toLocaleString()} record${rows.length === 1 ? '' : 's'}`,
        records: rows,
        columns,
        datasetTitle,
        source: 'api',
      })
    } catch (err) {
      openDetail({
        title: kpi.label,
        subtitle: err instanceof Error ? err.message : 'Could not load records',
        records: [],
        columns: [],
        source: 'api',
      })
    }
  }

  const handleKpiClick = (kpi: KPI) => {
    const key = String(kpi.key || kpi.label).toLowerCase()
    if (key === 'hospitals' || /^hospitals$/i.test(kpi.label)) {
      void showHospitalTable(kpi.label)
      return
    }
    void showKpiRecords(kpi)
  }

  return (
    <div>
      <Modal />
      <PageHeader
        title="Overview Dashboard"
        description={
          loading
            ? undefined
            : live
            ? `Executive summary — ${Object.values(data.schemas ?? {}).slice(0, 4).join(', ')}${Object.keys(data.schemas ?? {}).length > 4 ? '…' : ''}`
            : 'Connect the backend to load executive summary data'
        }
        badge={<DataSourceBadge source={source} db={db} loading={loading} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={handleKpiClick} />}

      {live && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {statusDist.length > 0 && (
              <ChartCard title="Claim Status Distribution" exportData={statusDist}>
                <InteractivePieChart data={statusDist} colors={COLORS} innerRadius={60} chartTitle="Claim Status" onItemClick={openFromChart} />
              </ChartCard>
            )}
            {caseTypeDist.length > 0 && (
              <ChartCard title="Case Type Distribution" exportData={caseTypeDist}>
                <InteractivePieChart data={caseTypeDist} colors={COLORS} innerRadius={60} chartTitle="Case Type" onItemClick={openFromChart} />
              </ChartCard>
            )}
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {districtDist.length > 0 && (
              <ChartCard title="Top Districts by Claim Volume" exportData={districtDist}>
                <InteractiveBarChart data={districtDist} chartTitle="District Claims" layout="vertical" height={280} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Claims' }]} />
              </ChartCard>
            )}
            {hospitalTypeDist.length > 0 && (
              <ChartCard title="Hospitals by Type" exportData={hospitalTypeDist}>
                <InteractivePieChart data={hospitalTypeDist} colors={COLORS} innerRadius={60} chartTitle="Hospital Type" onItemClick={openFromChart} />
              </ChartCard>
            )}
          </div>
          {claimsTrendLive.length > 0 && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Claims Volume Trend" exportData={claimsTrendLive}>
                <InteractiveLineChart
                  data={claimsTrendLive}
                  chartTitle="Claims Volume Trend"
                  height={240}
                  integerAxis
                  onItemClick={openFromChart}
                  lines={[{ dataKey: 'claims', stroke: '#2563eb', name: 'Claims Initiated' }]}
                />
              </ChartCard>
              <ChartCard title="Claims Amount Trend" exportData={claimsTrendLive}>
                <InteractiveLineChart
                  data={claimsTrendLive}
                  chartTitle="Claims Amount Trend"
                  height={240}
                  onItemClick={openFromChart}
                  lines={[{ dataKey: 'amount', stroke: '#d97706', name: 'Amount (₹)' }]}
                />
              </ChartCard>
            </div>
          )}
        </>
      )}

      <div ref={tableRef}>
        {hospitalError && (
          <p className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{hospitalError}</p>
        )}
        {(hospitalLoading || hospitalRows.length > 0) && (
          <DataTable
            columns={hospitalColumns}
            data={hospitalRows}
            title={
              hospitalLoading
                ? 'Hospitals — loading unique records…'
                : `Hospitals (${hospitalTotal.toLocaleString()} unique)`
            }
            serverPagination={
              hospitalTotal > 0
                ? {
                    totalRows: hospitalTotal,
                    page: hospitalPage,
                    pageSize: TABLE_PAGE_SIZE,
                    onPageChange: (next) => {
                      void showHospitalTable('Hospitals', next)
                    },
                  }
                : undefined
            }
            fetchExportData={fetchOverviewHospitalExport}
            onRowClick={(row) =>
              openDetail({
                title: String(row.hosp_name || row.hospital_name || row.hosp_id || 'Hospital'),
                subtitle: String(row.district_name || row.state_name || 'Hospital details'),
                data: row,
                columns: hospitalColumns,
                source: 'api',
              })
            }
          />
        )}
      </div>
    </div>
  )
}
