import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'
import ChartCard from '../../components/ui/ChartCard'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import ClaimsFilterBar from '../../components/layout/ClaimsFilterBar'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchClaims } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import StackedHeading from '../../components/ui/StackedHeading'
import { pageHeaderDescription } from '../../utils/displayLabels'
import MoneyColumnHeader from '../../components/ui/MoneyColumnHeader'
import { formatMoneyValue, type MoneyNotation } from '../../utils/moneyFormat'
import { schemaTableColumns } from '../../utils/schemaColumns'
import { monthLabelToRange } from '../../utils/chartDrillDown'
import { getClaimsFiltersForPage } from '../../data/claimsFilterConfig'
import { useClaimsFilters } from '../../hooks/useClaimsFilters'
import { canonicalMpDistrict, getDivisionForDistrict } from '../../data/filterOptions'
import { resolveClaimKpiKey } from '../../utils/claimKpi'
import type { KPI, TableColumn } from '../../types'

const CASE_TYPE_COLORS = ['#10b981', '#ef4444', '#8b5cf6', '#f59e0b']
const STATUS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#94a3b8', '#6366f1']
const STATE_COLORS = ['#2563eb', '#d97706']
const HOSPITAL_TYPE_COLORS = ['#10b981', '#6366f1', '#94a3b8']

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

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  jsonDataTable: [] as Record<string, string | number>[],
  columns: [] as string[],
  jsonDataColumns: [] as string[],
  jsonDataKpis: [] as KPI[],
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
    : masterKpis.slice(0, 6).map((k, i) => ({
        label: k.label,
        value: String(k.count),
        key: k.key,
        change: 0,
        changeLabel: 'vs last month',
        color: (['blue', 'green', 'emerald', 'orange', 'cyan', 'purple'] as const)[i % 6],
      }))

  const caseTypeData = data.charts?.caseType ?? []
  const statusData = data.charts?.status ?? []
  const districtData = data.charts?.district ?? []
  const stateTypeData = data.charts?.stateType ?? []
  const hospitalTypeData = data.charts?.hospitalType ?? []
  const divisionData = data.charts?.division ?? data.charts?.patientState ?? []
  const claimsTrend = data.charts?.claimsTrend ?? []
  const jsonDataKpis = data.jsonDataKpis ?? []

  const districtChartHeight = Math.min(420, Math.max(260, districtData.length * 36 + 72))
  const divisionChartHeight = Math.min(380, Math.max(240, divisionData.length * 40 + 72))
  const statusChartHeight = Math.min(420, Math.max(280, statusData.length * 32 + 64))
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
  const filteredTable = useMemo(
    () => claimsFilters.filterRows(tableRows),
    [claimsFilters.filterRows, tableRows]
  )

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
  const jsonDataRows = (data.jsonDataTable ?? []) as Record<string, string | number>[]
  const jsonDataColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.jsonDataColumns,
        rows: jsonDataRows,
        preferredFirst: [
          'id',
          'registration_id',
          'patientnumber',
          'packagecode',
          'packagedesc',
          'claimedamount',
          'approvedamount',
          'netpayable',
          'status',
        ],
      }),
    [source, data.jsonDataColumns, jsonDataRows]
  )

  const { openFromChart, openFromKpi, openDetail, closeDetail, Modal } = useDrillDown({
    live,
    tableRows: filteredTable,
    columns,
    datasetTitle: 'Claim Records',
    pageFilters: claimsFilters.filters,
    fetchDrillDown: live
      ? async (payload, chartTitle) => {
          const sliceName = String(payload.name ?? '').trim()
          const wantsDistrict =
            /district/i.test(chartTitle) &&
            !/division/i.test(chartTitle) &&
            Boolean(sliceName) &&
            !/^others$/i.test(sliceName)
          const wantsDivision =
            /division/i.test(chartTitle) &&
            !/district/i.test(chartTitle) &&
            Boolean(sliceName) &&
            !/^others$/i.test(sliceName)
          const wantsTrend = /trend/i.test(chartTitle)
          if (!wantsTrend && !wantsDistrict && !wantsDivision) return null
          const params = new URLSearchParams(claimsFilters.queryString.replace(/^\?/, ''))
          if (wantsTrend) {
            const range = monthLabelToRange(sliceName)
            if (range) {
              params.set('date_from', range.from)
              params.set('date_to', range.to)
            }
          }
          if (wantsDistrict) {
            const district = canonicalMpDistrict(sliceName) || sliceName
            params.set('district', district)
            const parentDiv = getDivisionForDistrict(district)
            if (parentDiv) params.set('division', parentDiv)
          }
          if (wantsDivision) params.set('division', sliceName)
          const qs = params.toString() ? `?${params.toString()}` : ''
          const res = await fetchClaims(qs)
          if (!res.ok) return null
          const rows = ((res.data.table ?? []) as Record<string, string | number>[]).map((row) => ({
            ...row,
            specialty: String(row.specialty ?? row._specialty_code ?? row.speciality_code ?? ''),
          }))
          return {
            rows,
            columns,
            datasetTitle: payload.name ? `Claim Records — ${payload.name}` : 'Claim Records',
            alreadyFiltered: wantsDistrict || wantsDivision || wantsTrend,
          }
        }
      : undefined,
  })

  const [selectedKpi, setSelectedKpi] = useState<{ key: string; label: string } | null>(null)
  const [moneyNotation, setMoneyNotation] = useState<MoneyNotation>('indian')

  const handleKpiClick = (kpi: KPI) => {
    const key = kpi.key || resolveClaimKpiKey(kpi.label) || kpi.label
    const next = selectedKpi?.key === key ? null : { key, label: kpi.label }
    setSelectedKpi(next)
    if (next) {
      openFromKpi(next.label, kpi.value, { change: kpi.change ?? 0, kpiKey: next.key })
    } else {
      closeDetail()
    }
  }

  return (
    <div>
      <Modal />
      <PageHeader
        title="Master Report TMS — Claim Status Dashboard"
        description={
          live
            ? pageHeaderDescription(
                data.schema ?? 'dmart_mp.claim_paid_excel_t',
                'FRS claim lifecycle KPIs by state type and hospital type'
              )
            : 'Connect the backend to load claim status data'
        }
        badge={<DataSourceBadge source={source} db={db} loading={loading} />}
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
          <span>
            Detailed tables (Report 6 matrix, full claim records) — open{' '}
            <strong>Master Reports</strong>
            {' · '}
            Payment KPIs and charts —{' '}
            <Link to="/dashboard/mp/claim-payment-details" className="font-semibold text-[#1a5c38] hover:underline">
              Claim Payment Details
            </Link>
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            to="/dashboard/mp/claim-payment-details"
            className="rounded-lg border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-2 text-xs font-semibold text-[#1a5c38] hover:bg-[#e8f5ec]"
          >
            Claim Payment Details →
          </Link>
          <Link
            to="/dashboard/mp/claims-payments/master-report"
            className="rounded-lg bg-[#1a5c38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2d8a4e]"
          >
            Open Master Reports →
          </Link>
        </div>
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
            <ChartCard
              title="Claim Lifecycle Status"
              subtitle="KPI buckets (overlapping — not unique claim total)"
              exportData={statusData}
            >
              <InteractiveBarChart
                data={statusData}
                chartTitle="Claim Lifecycle Status"
                layout="vertical"
                height={statusChartHeight}
                integerAxis
                onItemClick={openFromChart}
                bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Count' }]}
                cellColors={STATUS_COLORS}
              />
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
          <ChartCard title="Claims Amount Trend" subtitle="Initiated amount (₹) by month" exportData={claimsTrend}>
            <InteractiveLineChart
              data={claimsTrend}
              chartTitle="Claims Amount Trend"
              height={240}
              onItemClick={openFromChart}
              lines={[{ dataKey: 'amount', stroke: '#d97706', name: 'Amount (₹)' }]}
            />
          </ChartCard>
        </div>
      )}

      {jsonDataRows.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <StackedHeading
              size="section"
              titleAs="p"
              title="Claim Line Items"
              subtitle="Package and procedure line amounts (claimed vs approved, TDS/RF, net payable)"
              titleClassName="text-sm font-semibold text-[#1a5c38]"
              subtitleClassName="text-xs text-slate-500"
            />
          </div>
          {jsonDataKpis.length > 0 && (
            <KPIGrid
              kpis={jsonDataKpis}
              onKpiClick={(kpi) =>
                openDetail({
                  title: kpi.label,
                  subtitle: `${jsonDataRows.length} line item${jsonDataRows.length === 1 ? '' : 's'}`,
                  records: jsonDataRows,
                  columns: jsonDataColumns,
                })
              }
            />
          )}
          <p className="text-xs text-slate-500">
            Full line-item export: <strong>Reports → Master Report TMS — Claims & Payments</strong> (Claim Line Items).
          </p>
        </>
      )}

      {masterKpis.length > 0 && (
        <div className="mb-4 mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <StackedHeading
              title="Default KPI Heads"
              subtitle="Count and exact initiated / approved amount per claim lifecycle stage"
            />
          </div>
          <table className="min-w-full text-xs">
            <thead className="bg-[#f4fbf6] text-[#1a5c38]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">KPI Head</th>
                <th className="px-3 py-2 text-right font-semibold">Count</th>
                <th className="px-3 py-2 text-right font-semibold">
                  <MoneyColumnHeader label="Initiated Amount" notation={moneyNotation} onChange={setMoneyNotation} />
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <MoneyColumnHeader label="Approved Amount" notation={moneyNotation} onChange={setMoneyNotation} />
                </th>
              </tr>
            </thead>
            <tbody>
              {masterKpis.map((k) => (
                <tr key={k.key} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-700">{k.label}</td>
                  <td className="px-3 py-2 text-right">{k.count}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoneyValue(k.initiatedCr, moneyNotation)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoneyValue(k.approvedCr, moneyNotation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
