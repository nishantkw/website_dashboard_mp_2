import { Link } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'

interface DashboardReportsBannerProps {
  reportPath: string
  /** Short label on the button, e.g. "Open Card Printing Report" */
  buttonLabel?: string
  /** Optional extra hint shown beside the icon */
  hint?: string
}

export default function DashboardReportsBanner({
  reportPath,
  buttonLabel = 'Open Report →',
  hint = 'Row-level detail tables live in Reports. Use KPI cards and charts here for analysis.',
}: DashboardReportsBannerProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
        <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#2d8a4e]" />
        <span>{hint}</span>
      </div>
      <Link
        to={reportPath}
        className="shrink-0 rounded-lg bg-[#1a5c38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2d8a4e]"
      >
        {buttonLabel}
      </Link>
    </div>
  )
}
