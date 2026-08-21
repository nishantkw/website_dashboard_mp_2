import { useNavigate } from 'react-router-dom'
import { FileText, Download, ChevronRight } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import ExportDropdown from '../../components/ui/ExportDropdown'

const REPORTS = [
  {
    id: 'claims',
    title: 'Claims & Payments Report',
    description: 'Preauth, claims volume, payment disbursements and case status',
    path: '/dashboard/mp/claims-payments',
  },
  {
    id: 'beneficiaries',
    title: 'Beneficiaries Report',
    description: 'Enrollment, eKYC, ABHA and card status by district',
    path: '/dashboard/mp/beneficiaries',
  },
  {
    id: 'hospitals',
    title: 'Hospitals & Empanelment Report',
    description: 'Hospital master, NABH certification and de-empanelment',
    path: '/dashboard/mp/hospitals',
  },
  {
    id: 'patients',
    title: 'Patients & Treatment Report',
    description: 'Admissions, specialties, ICD codes and discharge types',
    path: '/dashboard/mp/patients',
  },
  {
    id: 'fraud',
    title: 'Fraud & Audit Report',
    description: 'Suspicious cases, rule triggers and investigation status',
    path: '/dashboard/mp/fraud-audit',
  },
  {
    id: 'users',
    title: 'Users & Workflow Report',
    description: 'Workflow users, roles and transaction processing metrics',
    path: '/dashboard/mp/users-workflow',
  },
  {
    id: 'lms',
    title: 'LMS Training Report',
    description: 'AB-PMJAY and ABDM course completion by role and entity',
    path: '/dashboard/mp/lms-training',
  },
]

export default function Reports() {
  const navigate = useNavigate()

  const catalogExport = REPORTS.map((r) => ({
    Report: r.title,
    Description: r.description,
    ModulePath: r.path,
  }))

  return (
    <div>
      <PageHeader title="Reports" description="Download or open module-wise analytics reports for Madhya Pradesh" />

      <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c38] text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Report Catalog</p>
            <p className="text-xs text-slate-500">{REPORTS.length} reports available</p>
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
        {REPORTS.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() => navigate(report.path)}
            className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-[#2d8a4e]/40 hover:shadow-md"
          >
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#2d8a4e] group-hover:bg-[#2d8a4e] group-hover:text-white">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-[#1a5c38]">{report.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{report.description}</p>
              </div>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 group-hover:text-[#2d8a4e]" />
          </button>
        ))}
      </div>
    </div>
  )
}
