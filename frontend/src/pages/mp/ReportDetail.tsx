import { useMemo } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import StackedHeading from '../../components/ui/StackedHeading'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import FraudFilterBar from '../../components/layout/FraudFilterBar'
import ClaimsFilterBar from '../../components/layout/ClaimsFilterBar'
import BeneficiariesFilterBar from '../../components/layout/BeneficiariesFilterBar'
import { useGlobalFilterData } from '../../hooks/useGlobalFilterData'
import { useFraudFilters } from '../../hooks/useFraudFilters'
import { useClaimsFilters } from '../../hooks/useClaimsFilters'
import { useApiResource } from '../../hooks/useApiResource'
import {
  fetchFraud,
  fetchClaims,
  fetchBeneficiaries,
  fetchHospitals,
  fetchPatients,
  fetchLms,
  fetchWorkflow,
} from '../../api/endpoints'
import { getReportDefinition, FRAUD_AUDIT_REPORT_TABLES } from '../../data/reportConfigs'
import { getFraudReportFilters } from '../../data/fraudFilterConfig'
import { getClaimsFiltersForPage, buildMasterReportTableColumns } from '../../data/claimsFilterConfig'
import { getBeneficiariesFiltersForPage } from '../../data/beneficiariesFilterConfig'
import { useBeneficiariesFilters } from '../../hooks/useBeneficiariesFilters'
import { useDrillDown } from '../../hooks/useDrillDown'
import { schemaTableColumns } from '../../utils/schemaColumns'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import type { TableColumn } from '../../types'
import {
  FRAUD_CASE_COLUMNS,
  FRAUD_TRIGGER_COLUMNS,
  HOSPITAL_MASTER_COLUMNS,
  WORKFLOW_USERS_COLUMNS,
  WORKFLOW_AUDIT_COLUMNS,
} from '../../data/fraudSchema'

const DEMO_COLUMNS = {
  case: FRAUD_CASE_COLUMNS,
  trigger: FRAUD_TRIGGER_COLUMNS,
  hospital: HOSPITAL_MASTER_COLUMNS,
  workflowUsers: WORKFLOW_USERS_COLUMNS,
  workflowAudit: WORKFLOW_AUDIT_COLUMNS,
} as const

const DATA_FIELD = {
  case: 'table',
  trigger: 'triggerTable',
  hospital: 'hospitalTable',
  workflowUsers: 'workflowUsers',
  workflowAudit: 'workflowAudit',
} as const

const COLUMN_FIELD = {
  case: 'columns',
  trigger: 'triggerColumns',
  hospital: 'hospitalColumns',
  workflowUsers: 'workflowUsersColumns',
  workflowAudit: 'workflowAuditColumns',
} as const

const FRAUD_REPORT_IDS = new Set([
  'fraud-audit',
  'fraud',
  'safu-overall',
  'safu-doctor-wise',
  'safu-sha-afo-wise',
  'safu-trigger-analytics',
  'safu-trigger-cases',
])

const REPORT_ALIASES: Record<string, string> = {
  fraud: 'fraud-audit',
  'safu-overall': 'fraud-audit',
  'safu-doctor-wise': 'fraud-audit',
  'safu-sha-afo-wise': 'fraud-audit',
  'safu-trigger-analytics': 'fraud-audit',
  'safu-trigger-cases': 'fraud-audit',
}

type ModuleApiData = {
  schema?: string
  columns?: string[]
  table?: Record<string, string | number>[]
  treatmentTable?: Record<string, string | number>[]
  treatmentColumns?: string[]
  treatmentSchema?: string
  morthTable?: Record<string, string | number>[]
  morthColumns?: string[]
  morthSchema?: string
  lookupTable?: Record<string, string | number>[]
  lookupColumns?: string[]
  lookupSchema?: string
  deempanelTable?: Record<string, string | number>[]
  deempanelColumns?: string[]
  deempanelSchema?: string
  hemTable?: Record<string, string | number>[]
  hemColumns?: string[]
  hemSchema?: string
  sourceTable?: Record<string, string | number>[]
  sourceColumns?: string[]
  sourceSchema?: string
  disabledTable?: Record<string, string | number>[]
  disabledColumns?: string[]
  disabledSchema?: string
  bisTable?: Record<string, string | number>[]
  bisColumns?: string[]
  bisSchema?: string
  paymentTable?: Record<string, string | number>[]
  paymentColumns?: string[]
  paymentSchema?: string
  proTable?: Record<string, string | number>[]
  proColumns?: string[]
  proSchema?: string
  audit?: Record<string, string | number>[]
  auditColumns?: string[]
  masterKpis?: { key: string; label: string; count: number; initiatedCr: number; approvedCr: number }[]
  stateHospitalSummary?: Record<string, string | number>[]
}

function buildClaimsReportTables(apiData: ModuleApiData, source: 'api' | 'mock' | 'offline', reportTables: ModuleApiData extends never ? never : { title: string; columns: TableColumn[]; data: Record<string, string | number>[] }[]) {
  if (source !== 'api') return reportTables.map((t) => ({ ...t, data: [] }))

  const tables: { title: string; columns: TableColumn[]; data: Record<string, string | number>[] }[] = []

  if (apiData.masterKpis?.length) {
    tables.push({
      title: 'FRS §6 — Claim Lifecycle KPI Heads',
      columns: [
        { key: 'label', label: 'KPI Head' },
        { key: 'count', label: 'Count', align: 'right' },
        { key: 'initiatedCr', label: 'Initiated (Cr)', align: 'right' },
        { key: 'approvedCr', label: 'Approved (Cr)', align: 'right' },
      ],
      data: apiData.masterKpis as unknown as Record<string, string | number>[],
    })
  }

  if (apiData.stateHospitalSummary?.length) {
    tables.push({
      title: 'Report 6 — State Type + Hospital Type Summary',
      columns: buildMasterReportTableColumns('state-hospital-type').slice(0, 14),
      data: apiData.stateHospitalSummary,
    })
  }

  if (apiData.table?.length) {
    const demoCols = reportTables[0]?.columns ?? []
    tables.push({
      title: apiData.schema ?? 'Claim detail records',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.columns,
        rows: apiData.table,
        preferredFirst: ['case_id', 'patient_name', 'hospital_name', 'case_status', 'amount_claim_initiated'],
        demoColumns: demoCols,
      }),
      data: apiData.table,
    })
  }

  if (apiData.paymentTable?.length) {
    const paymentDemo = reportTables[1]?.columns ?? []
    tables.push({
      title: apiData.paymentSchema ?? 'dmart_mp.payment_dtls',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.paymentColumns,
        rows: apiData.paymentTable,
        preferredFirst: paymentDemo.map((c) => c.key),
      }),
      data: apiData.paymentTable,
    })
  }

  return tables.length ? tables : reportTables
}

function buildModuleTables(
  resolvedId: string,
  apiData: ModuleApiData,
  source: 'api' | 'mock' | 'offline',
  reportTables: { title: string; columns: TableColumn[]; data: Record<string, string | number>[] }[],
  filterRows: (rows: Record<string, string | number>[]) => Record<string, string | number>[]
) {
  if (source !== 'api') {
    return reportTables.map((t) => ({ ...t, data: [] }))
  }

  const tables: { title: string; columns: TableColumn[]; data: Record<string, string | number>[] }[] = []

  if (apiData.table) {
    const demoCols = reportTables[0]?.columns ?? []
    const preferredFirst = demoCols.map((c) => c.key)
    tables.push({
      title: apiData.schema ?? reportTables[0]?.title ?? resolvedId,
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.columns,
        rows: apiData.table,
        preferredFirst,
        demoColumns: demoCols,
      }),
      data: filterRows(apiData.table),
    })
  }

  if (resolvedId === 'users' && apiData.audit?.length) {
    tables.push({
      title: 'dmart_mp.t_workflow_transaction_audit',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.auditColumns,
        rows: apiData.audit,
        preferredFirst: (apiData.auditColumns ?? []).slice(0, 8),
        demoColumns: WORKFLOW_AUDIT_COLUMNS,
      }),
      data: filterRows(apiData.audit),
    })
  }

  if (resolvedId === 'patients' && apiData.treatmentTable) {
    const treatmentDemo = reportTables[1]?.columns ?? []
    tables.push({
      title: apiData.treatmentSchema ?? 'dmart_mp.treatment_dtls',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.treatmentColumns,
        rows: apiData.treatmentTable,
        preferredFirst: treatmentDemo.map((c) => c.key),
      }),
      data: filterRows(apiData.treatmentTable),
    })
  }

  if (resolvedId === 'patients' && (apiData.morthTable?.length || apiData.morthColumns?.length)) {
    const morthDemo = reportTables.find((t) => /t_morth_patient_details/i.test(t.title))?.columns ?? []
    tables.push({
      title: apiData.morthSchema ?? 'dmart_mp.t_morth_patient_details',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.morthColumns,
        rows: apiData.morthTable,
        preferredFirst: morthDemo.map((c) => c.key),
      }),
      data: filterRows(apiData.morthTable ?? []),
    })
  }

  if (resolvedId === 'hospitals' && apiData.deempanelTable?.length) {
    const deempanelDemo = reportTables[1]?.columns ?? []
    tables.push({
      title: apiData.deempanelSchema ?? 'dmart_mp.t_deempanelment_details',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.deempanelColumns,
        rows: apiData.deempanelTable,
        preferredFirst: deempanelDemo.map((c) => c.key),
        demoColumns: deempanelDemo,
      }),
      data: filterRows(apiData.deempanelTable),
    })
  }

  if (resolvedId === 'hospitals' && apiData.hemTable?.length) {
    const hemDemo = reportTables.find((t) => /t_hem_hospital/i.test(t.title))?.columns ?? []
    tables.push({
      title: apiData.hemSchema ?? 'dmart_mp.t_hem_hospital',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.hemColumns,
        rows: apiData.hemTable,
        preferredFirst: hemDemo.map((c) => c.key),
        demoColumns: hemDemo,
      }),
      data: filterRows(apiData.hemTable),
    })
  }

  if (resolvedId === 'hospitals' && apiData.lookupTable) {
    const lookupDemo = reportTables.find((t) => /m_lookup/i.test(t.title))?.columns ?? []
    tables.push({
      title: apiData.lookupSchema ?? 'dmart_mp.m_lookup',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.lookupColumns,
        rows: apiData.lookupTable,
        preferredFirst: lookupDemo.map((c) => c.key),
      }),
      data: filterRows(apiData.lookupTable),
    })
  }

  if (resolvedId === 'beneficiaries' && apiData.sourceTable) {
    const sourceDemo = reportTables[1]?.columns ?? []
    tables.push({
      title: apiData.sourceSchema ?? 'dmart_mp.m_source_data',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.sourceColumns,
        rows: apiData.sourceTable,
        preferredFirst: sourceDemo.map((c) => c.key),
      }),
      data: filterRows(apiData.sourceTable),
    })
  }

  if (resolvedId === 'beneficiaries' && apiData.disabledTable) {
    const disabledDemo = reportTables[2]?.columns ?? []
    tables.push({
      title: apiData.disabledSchema ?? 'dmart_mp.t_bis_beneficiary_disabled',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.disabledColumns,
        rows: apiData.disabledTable,
        preferredFirst: disabledDemo.map((c) => c.key),
      }),
      data: filterRows(apiData.disabledTable),
    })
  }

  if (resolvedId === 'beneficiaries' && apiData.bisTable?.length) {
    const bisDemo = reportTables[3]?.columns ?? []
    tables.push({
      title: apiData.bisSchema ?? 'bis_raw.t_bis_beneficiary_dtls',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.bisColumns,
        rows: apiData.bisTable,
        preferredFirst: bisDemo.map((c) => c.key),
      }),
      data: filterRows(apiData.bisTable),
    })
  }

  if (resolvedId === 'users' && apiData.proTable) {
    const proDemo = reportTables[1]?.columns ?? []
    tables.push({
      title: apiData.proSchema ?? 'dmart_mp.pro_workflow_users_t',
      columns: schemaTableColumns({
        source,
        schemaKeys: apiData.proColumns,
        rows: apiData.proTable,
        preferredFirst: proDemo.map((c) => c.key),
      }),
      data: filterRows(apiData.proTable),
    })
  }

  return tables.length ? tables : reportTables.map((t) => ({ ...t, data: [] }))
}

export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>()
  const report = reportId ? getReportDefinition(reportId) : null
  const { filterData } = useGlobalFilterData()
  const isFraudReport = reportId ? FRAUD_REPORT_IDS.has(reportId) : false
  const resolvedId = reportId ? (REPORT_ALIASES[reportId] ?? reportId) : ''
  const isClaimsReport = resolvedId === 'claims'
  const isBeneficiariesReport = resolvedId === 'beneficiaries'

  const fraudFilterFields = useMemo(() => getFraudReportFilters(), [])
  const fraudFilters = useFraudFilters(fraudFilterFields)
  const claimsFilterFields = useMemo(() => getClaimsFiltersForPage(), [])
  const claimsFilters = useClaimsFilters(claimsFilterFields)
  const beneficiariesFilterFields = useMemo(() => getBeneficiariesFiltersForPage(), [])
  const beneficiariesFilters = useBeneficiariesFilters(beneficiariesFilterFields)

  const loader = useMemo(() => {
    if (isFraudReport) {
      return () => fetchFraud('overall', fraudFilters.queryString)
    }
    switch (resolvedId) {
      case 'claims':
        return () => fetchClaims(claimsFilters.queryString)
      case 'beneficiaries':
        return () => fetchBeneficiaries(beneficiariesFilters.queryString)
      case 'hospitals':
        return () => fetchHospitals()
      case 'patients':
        return () => fetchPatients()
      case 'lms':
        return () => fetchLms()
      case 'users':
        return () => fetchWorkflow()
      default:
        return async () => ({ ok: false as const, error: 'No API for this report' })
    }
  }, [isFraudReport, resolvedId, fraudFilters.queryString, claimsFilters.queryString, beneficiariesFilters.queryString])

  const { data: apiData, source, db, loading, error } = useApiResource<Record<string, unknown>>(
    loader as () => Promise<import('../../api/client').ApiResult<Record<string, unknown>>>,
    { table: [], columns: [] },
    [loader]
  )

  const live = source === 'api'
  const { openDetail, Modal } = useDrillDown({ live, datasetTitle: report?.title })

  if (!report) {
    return <Navigate to="/dashboard/mp/reports" replace />
  }

  const tablesRaw = isFraudReport
    ? FRAUD_AUDIT_REPORT_TABLES.map((spec) => {
        const dataField = DATA_FIELD[spec.tableKey]
        const colField = COLUMN_FIELD[spec.tableKey]
        const fraudData = apiData
        const rows = (fraudData[dataField] || []) as Record<string, string | number>[]
        const schemaKeys = (fraudData[colField] || spec.columnKeys) as string[]
        const filtered = fraudFilters.filterRows(rows, [...spec.columnKeys])
        return {
          title: spec.title,
          columns: schemaTableColumns({
            source,
            schemaKeys: Array.isArray(schemaKeys) ? schemaKeys : [...spec.columnKeys],
            rows: filtered,
            preferredFirst:
              spec.tableKey === 'hospital' ? [...spec.columnKeys] : [...spec.columnKeys].slice(0, 6),
            demoColumns: DEMO_COLUMNS[spec.tableKey],
          }),
          data: filtered,
        }
      })
    : isClaimsReport
      ? buildClaimsReportTables(apiData as ModuleApiData, source, report.tables)
      : buildModuleTables(resolvedId, apiData as ModuleApiData, source, report.tables, filterData)

  const tables =
    isBeneficiariesReport && !live
      ? tablesRaw.map((table) => ({
          ...table,
          data: beneficiariesFilters.filterRows(table.data),
        }))
      : tablesRaw

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

      <PageHeader
        title={report.title}
        description={report.description}
        badge={<DataSourceBadge source={source} db={db} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      {isFraudReport && (
        <FraudFilterBar
          fields={fraudFilters.resolvedFields}
          values={fraudFilters.filters}
          onChange={fraudFilters.setFilter}
          search={fraudFilters.search}
          onSearchChange={fraudFilters.setSearch}
          onClear={fraudFilters.clearFilters}
          activeCount={fraudFilters.activeCount}
          subtitle="FRS §5 — full filter set for Fraud and Audit report export"
        />
      )}

      {isClaimsReport && (
        <ClaimsFilterBar
          fields={claimsFilters.resolvedFields}
          values={claimsFilters.filters}
          onChange={claimsFilters.setFilter}
          search={claimsFilters.search}
          onSearchChange={claimsFilters.setSearch}
          onClear={claimsFilters.clearFilters}
          activeCount={claimsFilters.activeCount}
          subtitle="FRS §4 — Master Report TMS Claim filters"
        />
      )}

      {isBeneficiariesReport && (
        <BeneficiariesFilterBar
          fields={beneficiariesFilters.resolvedFields}
          values={beneficiariesFilters.filters}
          onChange={beneficiariesFilters.setFilter}
          search={beneficiariesFilters.search}
          onSearchChange={beneficiariesFilters.setSearch}
          onClear={beneficiariesFilters.clearFilters}
          activeCount={beneficiariesFilters.activeCount}
        />
      )}

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-4 shadow-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a5c38] text-white">
          <FileSpreadsheet className="h-4 w-4" />
        </div>
        <StackedHeading
          size="section"
          titleAs="p"
          title="Standalone report view"
          subtitle={
            isFraudReport
              ? 'Filters map to schema columns (division_name, district_name, investigation_status, trigger_type, etc.).'
              : live
                ? 'Live schema columns from database — use top filters and export from each table.'
                : 'Use top filters, date range, and Columns to refine this report. Export from each table.'
          }
        />
      </div>

      <div className="space-y-5">
        {tables.map((table) => {
          const filtered = isFraudReport ? table.data : table.data
          return (
            <DataTable
              key={table.title}
              columns={table.columns}
              data={filtered}
              title={`${table.title} (${filtered.length})`}
              onRowClick={(row) =>
                openDetail({
                  title: String(
                    row.reference_number ??
                      row.case_id ??
                      row.ben_id ??
                      row.registration_id ??
                      row.hosp_name ??
                      row.patient_id ??
                      row.user_id ??
                      row.userid ??
                      row.workflow_user ??
                      row.hospital_name ??
                      row.name ??
                      row.code ??
                      'Record'
                  ),
                  subtitle: report.title,
                  data: row,
                  records: [row],
                  columns: table.columns,
                  source: live ? 'api' : 'demo',
                })
              }
            />
          )
        })}
      </div>
    </div>
  )
}
