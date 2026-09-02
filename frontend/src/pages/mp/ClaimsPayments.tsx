import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'
import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import ClaimsFilterBar from '../../components/layout/ClaimsFilterBar'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchClaims } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import StackedHeading from '../../components/ui/StackedHeading'
import { schemaTableColumns } from '../../utils/schemaColumns'
import { monthLabelToRange } from '../../utils/chartDrillDown'
import { getClaimsFiltersForPage, buildMasterReportTableColumns } from '../../data/claimsFilterConfig'
import { useClaimsFilters } from '../../hooks/useClaimsFilters'
import { filterRowsForClaimKpi, resolveClaimKpiKey } from '../../utils/claimKpi'
import type { KPI, TableColumn } from '../../types'

const CASE_TYPE_COLORS = ['#10b981', '#ef4444', '#8b5cf6', '#f59e0b']
const STATUS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#94a3b8', '#6366f1']
const STATE_COLORS = ['#2563eb', '#d97706']
const HOSPITAL_TYPE_COLORS = ['#10b981', '#6366f1', '#94a3b8']

const PAYMENT_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#94a3b8']

const preferredColumns: TableColumn[] = [
  { key: 'case_id', label: 'Case ID' },
  { key: 'patient_name', label: 'Patient' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'division', label: 'Division' },
  { key: 'patient_district_name', label: 'District' },
  { key: 'case_type', label: 'Case Type' },
  { key: 'specialty', label: 'Specialty' },
  { key: 'case_status', label: 'Status' },
  { key: 'amount_claim_initiated', label: 'Initiated', align: 'right' },
  { key: 'amount_claim_paid', label: 'Paid', align: 'right' },
]

const paymentPreferred: TableColumn[] = [
  { key: 'case_id', label: 'Case ID' },
  { key: 'payment_type', label: 'Payment Type' },
  { key: 'bank_name', label: 'Bank' },
  { key: 'payment_unique_id', label: 'Payment Unique ID' },
  { key: 'transaction_amount', label: 'Amount', align: 'right' },
  { key: 'transaction_dt', label: 'Transaction Date' },
  { key: 'paid_flag', label: 'Paid Flag' },
  { key: 'payment_paid_dt', label: 'Paid Date' },
  { key: 'reject_flag', label: 'Reject Flag' },
  { key: 'payer_id', label: 'Payer ID' },
  { key: 'state_code', label: 'State Code' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  paymentTable: [] as Record<string, string | number>[],
  columns: [] as string[],
  paymentColumns: [] as string[],
  paymentKpis: [] as KPI[],
  masterKpis: [] as { key: string; label: string; count: number; initiatedCr: number; approvedCr: number }[],
  stateHospitalSummary: [] as Record<string, string | number>[],
}

export default function ClaimsPayments() {
  const filterFields = useMemo(() => getClaimsFiltersForPage(), [])
  const claimsFilters = useClaimsFilters(filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchClaims(claimsFilters.queryString),
    EMPTY,
    [claimsFilters.queryString]
  )

  const live = source === 'api'
  const masterKpis = data.masterKpis ?? []
  const kpis: KPI[] = data.kpis?.length
    ? data.kpis.slice(0, 6)
    : masterKpis.slice(0, 6).map((k) => ({
        label: k.label,
        value: String(k.count),
        key: k.key,
        change: 0,
        changeLabel: 'vs last month',
        color: 'blue',
      }))

  const caseTypeData = data.charts?.caseType ?? []
  const statusData = data.charts?.status ?? []
  const districtData = data.charts?.district ?? []
  const stateTypeData = data.charts?.stateType ?? []
  const hospitalTypeData = data.charts?.hospitalType ?? []
  const divisionData = data.charts?.division ?? data.charts?.patientState ?? []
  const claimsTrend = data.charts?.claimsTrend ?? []
  const paymentType = data.charts?.paymentType ?? []
  const paymentStatus = data.charts?.paymentStatus ?? []
  const paymentBank = data.charts?.paymentBank ?? []
  const paymentTrend = data.charts?.paymentTrend ?? []
  const paymentKpis = data.paymentKpis ?? []

  const districtChartHeight = Math.min(420, Math.max(260, districtData.length * 36 + 72))
  const divisionChartHeight = Math.min(380, Math.max(240, divisionData.length * 40 + 72))
  const tableRows = useMemo(
    () =>
      ((data.table ?? []) as Record<string, string | number>[]).map((row) => ({
        ...row,
        specialty: String(row.specialty ?? row._specialty_code ?? row.speciality_code ?? ''),
        specialty_code: String(row.specialty_code ?? row._specialty_code ?? row.speciality_code ?? ''),
        specialty_data: String(
          row.specialty_data ?? row._specialty_data ?? row.category_details ?? row.procedure_details ?? ''
        ),
      })),
    [data.table]
  )
  const summaryRows = (data.stateHospitalSummary ?? []) as Record<string, string | number>[]

  const summaryColumns = useMemo(() => buildMasterReportTableColumns('state-hospital-type'), [])
  const columns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.columns,
        rows: tableRows,
        preferredFirst: preferredColumns.map((c) => c.key),
        demoColumns: preferredColumns,
      }),
    [source, data.columns, tableRows]
  )
  const paymentRows = (data.paymentTable ?? []) as Record<string, string | number>[]
  const paymentColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.paymentColumns,
        rows: paymentRows,
        preferredFirst: paymentPreferred.map((c) => c.key),
      }),
    [source, data.paymentColumns, paymentRows]
  )

  const { openFromChart, openFromKpi, openDetail, closeDetail, Modal } = useDrillDown({
    live,
    tableRows,
    columns,
    datasetTitle: 'Claim Records',
    resolveContext: (chartTitle) => {
      if (/payment /i.test(chartTitle)) {
        return { rows: paymentRows, columns: paymentColumns, datasetTitle: 'Payment Details' }
      }
      return { rows: tableRows, columns, datasetTitle: 'Claim Records' }
    },
    fetchDrillDown: live
      ? async (payload, chartTitle) => {
          if (!/trend/i.test(chartTitle) || /payment /i.test(chartTitle)) return null
          const params = new URLSearchParams(claimsFilters.queryString.replace(/^\?/, ''))
          const range = monthLabelToRange(String(payload.name ?? ''))
          if (range) {
            params.set('date_from', range.from)
            params.set('date_to', range.to)
          }
          const qs = params.toString() ? `?${params.toString()}` : ''
          const res = await fetchClaims(qs)
          if (!res.ok) return null
          const rows = ((res.data.table ?? []) as Record<string, string | number>[]).map((row) => ({
            ...row,
            specialty: String(row.specialty ?? row._specialty_code ?? row.speciality_code ?? ''),
          }))
          return { rows, columns, datasetTitle: payload.name ? `Claim Records — ${payload.name}` : 'Claim Records' }
        }
      : undefined,
  })

  const [selectedKpi, setSelectedKpi] = useState<{ key: string; label: string } | null>(null)

  const kpiTableRows = useMemo(() => {
    if (!selectedKpi) return tableRows
    return filterRowsForClaimKpi(tableRows, selectedKpi.label, selectedKpi.key) ?? tableRows
  }, [tableRows, selectedKpi])

  const handleKpiClick = (kpi: KPI) => {
    const key = kpi.key || resolveClaimKpiKey(kpi.label) || kpi.label
    const next = selectedKpi?.key === key ? null : { key, label: kpi.label }
    setSelectedKpi(next)
    if (next) {
      openFromKpi(next.label, kpi.value, { change: kpi.change ?? 0, kpiKey: next.key })
    } else {
      closeDetail()
    }
    requestAnimationFrame(() => {
      document.getElementById('claim-detail-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handlePaymentKpi = (kpi: KPI) => {
    openDetail({
      title: kpi.label,
      subtitle: `${paymentRows.length} record${paymentRows.length === 1 ? '' : 's'}`,
      records: paymentRows,
      columns: paymentColumns,
      datasetTitle: 'Payment Details',
      source: live ? 'api' : 'demo',
    })
  }

  const hasPaymentCharts =
    paymentType.length > 0 || paymentStatus.length > 0 || paymentBank.length > 0 || paymentTrend.length > 0

  return (
    <div>
      <Modal />
      <PageHeader
        title="Master Report TMS — Claim Status Dashboard"
        description={
          live
            ? `${data.schema ?? 'dmart_mp.claim_paid_excel_t'}${
                data.paymentSchema ? ` · ${data.paymentSchema}` : ''
              } — FRS claim lifecycle KPIs by State Type & Hospital Type`
            : 'Connect the backend to load claim status data'
        }
        badge={<DataSourceBadge source={source} db={db} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      <ClaimsFilterBar
        fields={claimsFilters.resolvedFields}
        values={claimsFilters.filters}
        onChange={claimsFilters.setFilter}
        search={claimsFilters.search}
        onSearchChange={claimsFilters.setSearch}
        onClear={claimsFilters.clearFilters}
        activeCount={claimsFilters.activeCount}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FileSpreadsheet className="h-4 w-4 text-[#2d8a4e]" />
          <span>11 master report formats available (State Type / Division / District / Hospital / Specialty / TMS Recovery / Payment Details)</span>
        </div>
        <Link
          to="/dashboard/mp/claims-payments/master-report"
          className="rounded-lg bg-[#1a5c38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2d8a4e]"
        >
          Open Master Reports →
        </Link>
      </div>

      {kpis.length > 0 && (
        <KPIGrid kpis={kpis} selectedKey={selectedKpi?.key} onKpiClick={handleKpiClick} />
      )}

      {(caseTypeData.length > 0 || statusData.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {caseTypeData.length > 0 && (
            <ChartCard title="Case Type Distribution" exportData={caseTypeData}>
              <InteractivePieChart data={caseTypeData} colors={CASE_TYPE_COLORS} innerRadius={55} chartTitle="Case Types" onItemClick={openFromChart} />
            </ChartCard>
          )}
          {statusData.length > 0 && (
            <ChartCard title="Claim Lifecycle Status" subtitle="FRS §6 KPI buckets" exportData={statusData}>
              <InteractivePieChart data={statusData} colors={STATUS_COLORS} innerRadius={55} chartTitle="Claim Lifecycle Status" onItemClick={openFromChart} />
            </ChartCard>
          )}
        </div>
      )}

      {(stateTypeData.length > 0 || hospitalTypeData.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {stateTypeData.length > 0 && (
            <ChartCard title="State Type (MP vs Portability)" exportData={stateTypeData}>
              <InteractivePieChart data={stateTypeData} colors={STATE_COLORS} innerRadius={55} chartTitle="State Type" onItemClick={openFromChart} />
            </ChartCard>
          )}
          {hospitalTypeData.length > 0 && (
            <ChartCard title="Hospital Type" exportData={hospitalTypeData}>
              <InteractiveBarChart
                data={hospitalTypeData}
                chartTitle="Hospital Type"
                height={240}
                onItemClick={openFromChart}
                bars={[{ dataKey: 'value', fill: '#10b981', name: 'Claims' }]}
                cellColors={HOSPITAL_TYPE_COLORS}
              />
            </ChartCard>
          )}
        </div>
      )}

      {(districtData.length > 0 || divisionData.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {divisionData.length > 0 && (
            <ChartCard title="Division-wise Claims" exportData={divisionData}>
              <InteractiveBarChart
                data={divisionData}
                chartTitle="Division Claims"
                layout="vertical"
                height={divisionChartHeight}
                integerAxis
                onItemClick={openFromChart}
                bars={[{ dataKey: 'claims', fill: '#8b5cf6', name: 'Claims' }]}
              />
            </ChartCard>
          )}
          {districtData.length > 0 && (
            <ChartCard title="District-wise Claims" subtitle="Top 10 districts + Others" exportData={districtData}>
              <InteractiveBarChart
                data={districtData}
                chartTitle="District Claims"
                layout="vertical"
                height={districtChartHeight}
                integerAxis
                onItemClick={openFromChart}
                bars={[{ dataKey: 'claims', fill: '#3b82f6', name: 'Claims' }]}
              />
            </ChartCard>
          )}
        </div>
      )}

      {claimsTrend.length > 0 && (
        <div className="mb-4">
          <ChartCard title="Claims Volume Trend" subtitle="Monthly claim initiations" exportData={claimsTrend}>
            <InteractiveLineChart
              data={claimsTrend}
              chartTitle="Claims Volume Trend"
              height={260}
              integerAxis
              onItemClick={openFromChart}
              lines={[{ dataKey: 'claims', stroke: '#2563eb', name: 'Claims Initiated' }]}
            />
          </ChartCard>
        </div>
      )}

      {claimsTrend.length > 0 && (
        <div className="mb-4">
          <ChartCard title="Claims Amount Trend" subtitle="Initiated amount (₹ Cr) by month" exportData={claimsTrend}>
            <InteractiveLineChart
              data={claimsTrend}
              chartTitle="Claims Amount Trend"
              height={260}
              onItemClick={openFromChart}
              lines={[{ dataKey: 'amount', stroke: '#d97706', name: 'Amount (₹ Cr)' }]}
            />
          </ChartCard>
        </div>
      )}

      {masterKpis.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <StackedHeading
              title="Default KPI Heads"
              subtitle="Count and Initiated Amount (₹ Cr) per claim lifecycle stage"
            />
          </div>
          <table className="min-w-full text-xs">
            <thead className="bg-[#f4fbf6] text-[#1a5c38]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">KPI Head</th>
                <th className="px-3 py-2 text-right font-semibold">Count</th>
                <th className="px-3 py-2 text-right font-semibold">Initiated (Cr)</th>
                <th className="px-3 py-2 text-right font-semibold">Approved (Cr)</th>
              </tr>
            </thead>
            <tbody>
              {masterKpis.map((k) => (
                <tr key={k.key} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-700">{k.label}</td>
                  <td className="px-3 py-2 text-right">{k.count}</td>
                  <td className="px-3 py-2 text-right">{k.initiatedCr}</td>
                  <td className="px-3 py-2 text-right">{k.approvedCr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {summaryRows.length > 0 && (
        <div className="mb-4">
          <DataTable
            columns={summaryColumns.slice(0, 12)}
            data={summaryRows}
            title="Report 6 — State Type + Hospital Type Summary (FRS §5 layout)"
          />
        </div>
      )}

      <div id="claim-detail-table">
        {selectedKpi && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#2d8a4e]/20 bg-[#eaf5ed] px-4 py-2 text-sm text-[#1a5c38]">
            <span>
              Showing <strong>{selectedKpi.label}</strong> — {kpiTableRows.length} claim
              {kpiTableRows.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedKpi(null)
                closeDetail()
              }}
              className="rounded-md px-2 py-1 text-xs font-semibold text-[#1a5c38] hover:bg-white"
            >
              Show all claims
            </button>
          </div>
        )}
        <DataTable
          columns={columns}
          data={kpiTableRows}
          title={
            selectedKpi
              ? `${selectedKpi.label} (${kpiTableRows.length})`
              : `Claim Detail Records (${tableRows.length}${columns.length ? ` · schema cols: ${columns.length}` : ''})`
          }
          onRowClick={(row) =>
            openDetail({
              title: String(row.case_id || row.registration_id || 'Claim'),
              subtitle: String(row.case_status || ''),
              data: row,
            })
          }
        />
      </div>

      {paymentRows.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">Payment details — dmart_mp.payment_dtls</p>
            <p className="text-xs text-slate-500">
              Bank transaction records linked to claims (paid / rejected flags, amount, payer)
            </p>
          </div>
          {paymentKpis.length > 0 && <KPIGrid kpis={paymentKpis} onKpiClick={handlePaymentKpi} />}
          {hasPaymentCharts && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {paymentStatus.length > 0 && (
                <ChartCard title="Payment Status" subtitle="paid / rejected" exportData={paymentStatus}>
                  <InteractivePieChart
                    data={paymentStatus}
                    colors={PAYMENT_COLORS}
                    innerRadius={55}
                    chartTitle="Payment Status"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {paymentType.length > 0 && (
                <ChartCard title="Payment Type" subtitle="payment_type" exportData={paymentType}>
                  <InteractivePieChart
                    data={paymentType}
                    colors={['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8']}
                    innerRadius={55}
                    chartTitle="Payment Type"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {paymentBank.length > 0 && (
                <ChartCard title="Payment Bank" subtitle="bank_name" exportData={paymentBank}>
                  <InteractiveBarChart
                    data={paymentBank}
                    chartTitle="Payment Bank"
                    layout="vertical"
                    height={Math.min(360, Math.max(220, paymentBank.length * 36 + 72))}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#2563eb', name: 'Payments' }]}
                  />
                </ChartCard>
              )}
              {paymentTrend.length > 0 && (
                <ChartCard title="Payment Trend" subtitle="Monthly transactions" exportData={paymentTrend}>
                  <InteractiveLineChart
                    data={paymentTrend}
                    chartTitle="Payment Trend"
                    height={260}
                    integerAxis
                    onItemClick={openFromChart}
                    lines={[{ dataKey: 'payments', stroke: '#059669', name: 'Payments' }]}
                  />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={paymentColumns}
            data={paymentRows}
            title={`Payment Details — dmart_mp.payment_dtls (${paymentRows.length}${
              paymentColumns.length ? ` · ${paymentColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.case_id || row.payment_unique_id || 'Payment'),
                subtitle: 'dmart_mp.payment_dtls',
                data: row,
                columns: paymentColumns,
              })
            }
          />
        </>
      )}
    </div>
  )
}
