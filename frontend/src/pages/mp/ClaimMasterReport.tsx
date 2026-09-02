import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import ClaimsFilterBar from '../../components/layout/ClaimsFilterBar'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchClaimsMasterReport } from '../../api/endpoints'
import { CLAIMS_MASTER_REPORTS, getClaimsFiltersForPage, buildMasterReportTableColumns } from '../../data/claimsFilterConfig'
import { useClaimsFilters } from '../../hooks/useClaimsFilters'

const DEFAULT_REPORT_ID = 'full-detail'

export default function ClaimMasterReport() {
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('report')
  const initialReport =
    requested && CLAIMS_MASTER_REPORTS.some((r) => r.id === requested) ? requested : DEFAULT_REPORT_ID
  const [reportId, setReportId] = useState(initialReport)

  useEffect(() => {
    const q = searchParams.get('report')
    if (q && CLAIMS_MASTER_REPORTS.some((r) => r.id === q)) setReportId(q)
  }, [searchParams])
  const filterFields = useMemo(() => getClaimsFiltersForPage(), [])
  const claimsFilters = useClaimsFilters(filterFields)
  const reportMeta = CLAIMS_MASTER_REPORTS.find((r) => r.id === reportId)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchClaimsMasterReport(reportId, claimsFilters.queryString),
    { rows: [], reportId: '', total: 0, schema: '' },
    [reportId, claimsFilters.queryString]
  )

  const live = source === 'api'
  const columns = useMemo(() => buildMasterReportTableColumns(reportId), [reportId])
  const rows = (data.rows ?? []) as Record<string, string | number>[]

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/dashboard/mp/claims-payments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a5c38] hover:text-[#2d8a4e]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Claim Status Dashboard
        </Link>
      </div>

      <PageHeader
        title="Master Report TMS Claim"
        description={
          live
            ? (reportMeta?.description ?? 'Aggregated claim lifecycle report')
            : 'Connect the backend to load master report data'
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
        subtitle="Filters apply to all master report formats"
      />

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1a5c38]">Report Format</label>
        <select
          value={reportId}
          onChange={(e) => setReportId(e.target.value)}
          className="w-full max-w-xl cursor-pointer rounded-lg border border-[#c5e0ce] bg-[#f4fbf6] px-3 py-2 text-sm font-semibold text-[#1a5c38] outline-none focus:border-[#2d8a4e]"
        >
          {CLAIMS_MASTER_REPORTS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        title={`${reportMeta?.title ?? reportId} (${rows.length} rows)`}
      />
    </div>
  )
}
