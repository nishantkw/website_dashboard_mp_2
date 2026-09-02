import { useNavigate } from 'react-router-dom'
import { FileText, Download, ChevronRight, BarChart3 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import ExportDropdown from '../../components/ui/ExportDropdown'
import StackedHeading from '../../components/ui/StackedHeading'
import { REPORT_CATALOG } from '../../data/reportConfigs'
import { CLAIMS_MASTER_REPORTS } from '../../data/claimsFilterConfig'

export default function Reports() {
  const navigate = useNavigate()

  const catalogExport = REPORT_CATALOG.map((r) => ({
    Report: r.title,
    Description: r.description,
    ReportPath: `/dashboard/mp/reports/${r.id}`,
  }))

  return (
    <div>
      <PageHeader title="Reports" description="Open dedicated report pages with field data, filters and column selection" />

      <div className="mb-5 rounded-xl border border-[#b8dcc4] bg-gradient-to-r from-[#f4fbf6] to-white p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3 border-b border-[#dceee3] pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a5c38] text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <StackedHeading
            size="section"
            titleAs="p"
            title="Master Report TMS — Claim"
            subtitle="11 report formats from master reports filters · "
            titleClassName="text-[#1a5c38]"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CLAIMS_MASTER_REPORTS.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => navigate(`/dashboard/mp/claims-payments/master-report?report=${report.id}`)}
              className="rounded-lg border border-[#c5e0ce] bg-white px-3 py-2.5 text-left text-xs hover:border-[#2d8a4e] hover:bg-[#f4fbf6]"
            >
              <span className="block font-semibold leading-normal text-slate-800">{report.title}</span>
              <p className="mt-1.5 leading-normal text-slate-500">{report.description}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/mp/claims-payments/master-report')}
          className="mt-3 text-xs font-semibold text-[#1a5c38] hover:text-[#2d8a4e]"
        >
          Open Master Report page →
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a5c38] text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <StackedHeading
              size="section"
              titleAs="p"
              title="Report Catalog"
              subtitle={`${REPORT_CATALOG.length} reports available`}
            />
          </div>
        </div>
        <ExportDropdown
          title="MP Report Catalog"
          subtitle="Available analytics reports"
          filename="mp_report_catalog"
          data={catalogExport}
          buttonSize="sm"
          variant="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {REPORT_CATALOG.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() =>
              report.id === 'claims'
                ? navigate('/dashboard/mp/claims-payments/master-report')
                : navigate(`/dashboard/mp/reports/${report.id}`)
            }
            className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-[#2d8a4e]/40 hover:shadow-md"
          >
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#2d8a4e] transition-colors group-hover:bg-[#2d8a4e] group-hover:text-white">
                <Download className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <StackedHeading
                  size="section"
                  titleAs="p"
                  title={report.title}
                  subtitle={report.description}
                  titleClassName="group-hover:text-[#1a5c38]"
                />
              </div>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 group-hover:text-[#2d8a4e]" />
          </button>
        ))}
      </div>
    </div>
  )
}
