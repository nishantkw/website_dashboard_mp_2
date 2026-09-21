import { useMemo } from 'react'
import ChartCard from '../../components/ui/ChartCard'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import DashboardReportsBanner from '../../components/ui/DashboardReportsBanner'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import ClaimsFilterBar from '../../components/layout/ClaimsFilterBar'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchClaims } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { pageHeaderDescription } from '../../utils/displayLabels'
import { schemaTableColumns } from '../../utils/schemaColumns'
import { monthLabelToRange } from '../../utils/chartDrillDown'
import { getClaimsFiltersForPage } from '../../data/claimsFilterConfig'
import { useClaimsFilters } from '../../hooks/useClaimsFilters'
import type { KPI, TableColumn } from '../../types'

const PAYMENT_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#94a3b8']

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
  paymentTable: [] as Record<string, string | number>[],
  paymentColumns: [] as string[],
  paymentSchema: undefined as string | undefined,
  paymentKpis: [] as KPI[],
  charts: {} as Record<string, never>,
}

export default function ClaimPaymentDetails() {
  const filterFields = useMemo(() => getClaimsFiltersForPage(), [])
  const claimsFilters = useClaimsFilters(filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchClaims(claimsFilters.queryString),
    EMPTY,
    [claimsFilters.queryString]
  )

  const live = source === 'api'
  const paymentType = data.charts?.paymentType ?? []
  const paymentStatus = data.charts?.paymentStatus ?? []
  const paymentBank = data.charts?.paymentBank ?? []
  const paymentTrend = data.charts?.paymentTrend ?? []
  const paymentKpis = data.paymentKpis ?? []
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

  const { openFromChart, openDetail, Modal } = useDrillDown({
    live,
    tableRows: paymentRows,
    columns: paymentColumns,
    datasetTitle: 'Claim Payment Details',
    pageFilters: claimsFilters.filters,
    fetchDrillDown: live
      ? async (payload, chartTitle) => {
          const sliceName = String(payload.name ?? '').trim()
          const wantsTrend = /trend/i.test(chartTitle)
          if (!wantsTrend || !sliceName) return null
          const params = new URLSearchParams(claimsFilters.queryString.replace(/^\?/, ''))
          const range = monthLabelToRange(sliceName)
          if (range) {
            params.set('date_from', range.from)
            params.set('date_to', range.to)
          }
          const qs = params.toString() ? `?${params.toString()}` : ''
          const res = await fetchClaims(qs)
          if (!res.ok) return null
          return {
            rows: (res.data.paymentTable ?? []) as Record<string, string | number>[],
            columns: paymentColumns,
            datasetTitle: payload.name ? `Claim Payment Details — ${payload.name}` : 'Claim Payment Details',
            alreadyFiltered: wantsTrend,
          }
        }
      : undefined,
  })

  const handlePaymentKpi = (kpi: KPI) => {
    openDetail({
      title: kpi.label,
      subtitle: `${paymentRows.length} record${paymentRows.length === 1 ? '' : 's'}`,
      records: paymentRows,
      columns: paymentColumns,
      datasetTitle: 'Claim Payment Details',
      source: live ? 'api' : 'demo',
    })
  }

  const hasPaymentCharts =
    paymentType.length > 0 || paymentStatus.length > 0 || paymentBank.length > 0 || paymentTrend.length > 0

  return (
    <div>
      <Modal />
      <PageHeader
        title="Claim Payment Details"
        description={
          live
            ? pageHeaderDescription(
                data.paymentSchema ?? 'dmart_mp.payment_dtls',
                'Bank transaction records linked to claims — paid / rejected flags, amount, and payer'
              )
            : 'Connect the backend to load claim payment records'
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
        subtitle="FRS — filters apply to claim payment transactions"
      />

      <DashboardReportsBanner
        reportPath="/dashboard/mp/reports/claims"
        buttonLabel="Open Payment Details Report →"
        hint="Full row-level payment export — Master Reports → Report 11 — Payment Details."
      />

      {paymentKpis.length > 0 && <KPIGrid kpis={paymentKpis} onKpiClick={handlePaymentKpi} />}

      {hasPaymentCharts && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {paymentStatus.length > 0 && (
            <ChartCard title="Payment Status" subtitle="Paid vs rejected" exportData={paymentStatus}>
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
            <ChartCard title="Payment Type" subtitle="By payment method" exportData={paymentType}>
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
            <ChartCard title="Payment Bank" subtitle="By bank name" exportData={paymentBank}>
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

      {!loading && paymentRows.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          No payment records for the current filters. Adjust filters or connect the backend to load data.
        </p>
      )}
    </div>
  )
}
