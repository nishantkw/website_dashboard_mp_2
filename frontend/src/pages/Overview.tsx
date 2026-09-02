import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import ChartCard from '../components/ui/ChartCard'
import DataTable from '../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../components/ui/PageHeader'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../components/charts/InteractiveCharts'
import { useDrillDown } from '../hooks/useDrillDown'
import { useApiResource } from '../hooks/useApiResource'
import { fetchOverview, fetchOverviewHospitals, fetchClaims, fetchHospitalsExport } from '../api/endpoints'
import DataSourceBadge from '../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../utils/schemaColumns'
import { TABLE_PAGE_SIZE } from '../hooks/useTableControls'
import { useGlobalFilters } from '../context/FilterContext'
import { monthLabelToRange } from '../utils/chartDrillDown'
import type { KPI, TableColumn } from '../types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const HOSPITAL_PREFERRED: TableColumn[] = [
  { key: 'hosp_name', label: 'Hospital Name' },
  { key: 'district_name', label: 'District' },
  { key: 'state_name', label: 'State' },
  { key: 'hospital_type', label: 'Type' },
  { key: 'facility_id', label: 'Facility ID' },
  { key: 'hosp_id', label: 'Hosp ID' },
  { key: 'hosp_status_desc', label: 'Status' },
  { key: 'active_status', label: 'Active' },
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

  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    fetchDrillDown: live
      ? async (payload, chartTitle) => {
          if (/hospital type/i.test(chartTitle)) {
            const res = await fetchOverviewHospitals(overviewQs)
            if (!res.ok) return null
            const rows = (res.data.table ?? []) as Record<string, string | number>[]
            const columns = schemaTableColumns({
              source: 'api',
              schemaKeys: res.data.columns,
              rows,
              preferredFirst: HOSPITAL_PREFERRED.map((c) => c.key),
              demoColumns: HOSPITAL_PREFERRED,
            })
            return { rows, columns, datasetTitle: 'Hospitals' }
          }
          if (!/claim status|case type|district.*claim|trend/i.test(chartTitle)) return null
          const params = new URLSearchParams(overviewQs.replace(/^\?/, ''))
          if (/trend/i.test(chartTitle) && payload.name) {
            const range = monthLabelToRange(String(payload.name))
            if (range) {
              params.set('date_from', range.from)
              params.set('date_to', range.to)
            }
          }
          const qs = params.toString() ? `?${params.toString()}` : ''
          const res = await fetchClaims(qs)
          if (!res.ok) return null
          const rows = (res.data.table ?? []) as Record<string, string | number>[]
          const columns = schemaTableColumns({
            source: 'api',
            schemaKeys: res.data.columns,
            rows,
            preferredFirst: ['case_id', 'patient_name', 'hospital_name', 'patient_state_name', 'patient_district_name', 'case_type', 'case_status'],
            demoColumns: [
              { key: 'case_id', label: 'Case ID' },
              { key: 'patient_name', label: 'Patient' },
              { key: 'case_status', label: 'Status' },
            ],
          })
          const datasetTitle = /trend/i.test(chartTitle) && payload.name
            ? `Claim Records — ${payload.name}`
            : 'Claim Records'
          return { rows, columns, datasetTitle }
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

  const handleKpiClick = (kpi: KPI) => {
    if (/^hospitals$/i.test(kpi.label)) {
      void showHospitalTable(kpi.label)
      return
    }
    openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0, period: 'vs last month' })
  }

  return (
    <div>
      <Modal />
      <PageHeader
        title="Overview Dashboard"
        description={
          live
            ? `Executive summary — ${Object.values(data.schemas ?? {}).slice(0, 4).join(', ')}${Object.keys(data.schemas ?? {}).length > 4 ? '…' : ''}`
            : 'Connect the backend to load executive summary data'
        }
        badge={<DataSourceBadge source={source} db={db} />}
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
                  lines={[{ dataKey: 'amount', stroke: '#d97706', name: 'Amount (₹ Cr)' }]}
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
