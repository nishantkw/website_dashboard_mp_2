import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import { getReportDefinition } from '../../data/reportConfigs'
import { useDrillDown } from '../../hooks/useDrillDown'

export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>()
  const report = reportId ? getReportDefinition(reportId) : null
  const { filterData } = useGlobalFilterData()
  const { openDetail, Modal } = useDrillDown()

  if (!report) {
    return <Navigate to="/dashboard/mp/reports" replace />
  }

  return (
    <div>
      <Modal />

      <div className="mb-4">
        <Link
          to="/dashboard/mp/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a5c38] transition-colors hover:text-[#2d8a4e]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Report Catalog
        </Link>
      </div>

      <PageHeader title={report.title} description={report.description} />

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a5c38] text-white">
          <FileSpreadsheet className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Standalone report view</p>
          <p className="text-xs text-slate-500">
            Use top filters, date range, and Columns to refine this report. Export from each table.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {report.tables.map((table) => {
          const filtered = filterData(table.data)
          return (
            <DataTable
              key={table.title}
              columns={table.columns}
              data={filtered}
              title={`${table.title} (${filtered.length})`}
              onRowClick={(row) =>
                openDetail({
                  title: String(
                    row.case_id ??
                      row.ben_id ??
                      row.patient_id ??
                      row.user_id ??
                      row.userid ??
                      row.name ??
                      row.code ??
                      row.reference_number ??
                      'Record'
                  ),
                  subtitle: report.title,
                  data: row,
                })
              }
            />
          )
        })}
      </div>
    </div>
  )
}
