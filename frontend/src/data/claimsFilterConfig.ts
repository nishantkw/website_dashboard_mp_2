import type { FilterField } from '../types'
import { DIVISION_OPTIONS, HOSPITAL_TYPE_OPTIONS } from './filterOptions'

export const STATE_TYPE_OPTIONS = [
  { value: '', label: 'Both (MP + Portability)' },
  { value: 'MP', label: 'MP' },
  { value: 'Portability', label: 'Portability' },
]

export const REPORTING_PERIOD_OPTIONS = [
  { value: '', label: 'Normal Report' },
  { value: 'year', label: 'Year wise (Financial Year)' },
  { value: 'quarter', label: 'Quarter wise' },
  { value: 'month', label: 'Month wise' },
]

export const CLAIMS_SEARCH_COLUMNS = [
  'case_id',
  'hospital_name',
  'patient_name',
  'case_status',
  'category_details',
  'procedure_details',
  'member_id',
]

/** FRS §4 — Master Report TMS 2.0 Claim filters (patient geography, not hospital division) */
export const CLAIMS_FILTER_FIELDS: FilterField[] = [
  { key: 'state_type', label: 'State Type', type: 'select', options: STATE_TYPE_OPTIONS, column: 'case_type' },
  { key: 'division', label: 'Division', type: 'select', options: DIVISION_OPTIONS, column: 'division' },
  { key: 'district', label: 'District', type: 'searchable', column: 'patient_district_name' },
  { key: 'hospital_name', label: 'Hospital Name', type: 'searchable', column: 'hospital_name' },
  {
    key: 'hospital_type',
    label: 'Hospital Type',
    type: 'select',
    options: [{ value: '', label: 'Both' }, ...HOSPITAL_TYPE_OPTIONS.filter((o) => o.value)],
    column: 'hospital_type',
  },
  { key: 'date_from', label: 'Date From', type: 'date', column: 'claim_init_date' },
  { key: 'date_to', label: 'Date To', type: 'date', column: 'claim_init_date' },
  { key: 'reporting_period', label: 'Reporting Period', type: 'select', options: REPORTING_PERIOD_OPTIONS, column: 'claim_init_date' },
  { key: 'specialty', label: 'Specialty', type: 'searchable', column: 'category_details' },
]

export const CLAIMS_MASTER_REPORTS = [
  { id: 'state-type-wise', title: 'Report 1 — State Type Wise', description: 'Aggregated by MP / Portability' },
  { id: 'division-wise', title: 'Report 2 — Division Wise', description: 'State Type + Division breakdown' },
  { id: 'district-wise', title: 'Report 3 — District Wise', description: 'State Type + Division + District' },
  { id: 'hospital-wise', title: 'Report 4 — Hospital Wise', description: 'Hospital-level claim lifecycle KPIs' },
  { id: 'specialty-wise', title: 'Report 5 — Specialty Wise', description: 'Specialty-wise KPI summary' },
  { id: 'state-hospital-type', title: 'Report 6 — State Type + Hospital Type', description: 'MP/Portability × Public/Private matrix' },
  { id: 'district-hospital-type', title: 'Report 7 — District + Hospital Type', description: 'Division, district and hospital type summary' },
  { id: 'hospital-specialty', title: 'Report 8 — Hospital + Specialty', description: 'Hospital and specialty combination' },
  { id: 'full-detail', title: 'Report 9 — Full Detail', description: 'State type, division, district, hospital, type and specialty' },
  { id: 'tms-recovery', title: 'Report 10 — TMS Recovery', description: 'Recovery cases from dmart_mp.tms_recovery (amount, reason, status, dates)' },
  { id: 'payment-dtls', title: 'Report 11 — Payment Details', description: 'Bank payments from dmart_mp.payment_dtls (paid / rejected, amount, dates)' },
]

export const CLAIM_KPI_COLUMNS = [
  { key: 'preauth_initiated', label: 'Pre-auth Initiated', hasApproved: false },
  { key: 'claims_initiated', label: 'Claims Initiated', hasApproved: false },
  { key: 'claim_rejected_closed', label: 'Claim Rejected/Closed', hasApproved: false },
  { key: 'claims_paid', label: 'Claims Paid', hasApproved: true },
  { key: 'claims_ready_for_payment', label: 'Claims Ready for Payment', hasApproved: true },
  { key: 'under_process_hospital', label: 'Under Process at Hospital', hasApproved: false },
  { key: 'under_process_isa', label: 'Under Process at ISA', hasApproved: false },
  { key: 'under_process_crc', label: 'Under Process at CRC', hasApproved: false },
  { key: 'under_process_mac', label: 'Under Process at MAC', hasApproved: false },
  { key: 'under_process_safu_afo', label: 'Under Process at SAFU & AFO', hasApproved: false },
] as const

export function buildMasterReportTableColumns(reportId: string) {
  if (reportId === 'tms-recovery') {
    return [
      { key: 'sr_no', label: 'Sr No' },
      { key: 'case_id', label: 'Case ID' },
      { key: 'hosp_disp_code', label: 'Hospital Disp Code' },
      { key: 'requested_recovery_amount', label: 'Requested Recovery Amount', align: 'right' as const },
      { key: 'tobe_recovered_amt', label: 'To Be Recovered', align: 'right' as const },
      { key: 'recovered_amt', label: 'Recovered Amount', align: 'right' as const },
      { key: 'reason', label: 'Reason' },
      { key: 'remarks', label: 'Remarks' },
      { key: 'recovery_status', label: 'Recovery Status' },
      { key: 'recovered_case_id', label: 'Recovered Case ID' },
      { key: 'created_dt', label: 'Created Date' },
      { key: 'recovery_date', label: 'Recovery Date' },
      { key: 'payer_id', label: 'Payer ID' },
      { key: 'state_name', label: 'State' },
      { key: 'state_code', label: 'State Code' },
    ]
  }

  if (reportId === 'payment-dtls') {
    return [
      { key: 'sr_no', label: 'Sr No' },
      { key: 'case_id', label: 'Case ID' },
      { key: 'payment_type', label: 'Payment Type' },
      { key: 'bank_name', label: 'Bank' },
      { key: 'payment_unique_id', label: 'Payment Unique ID' },
      { key: 'transaction_amount', label: 'Amount', align: 'right' as const },
      { key: 'transaction_dt', label: 'Transaction Date' },
      { key: 'paid_flag', label: 'Paid Flag' },
      { key: 'payment_paid_dt', label: 'Paid Date' },
      { key: 'reject_flag', label: 'Reject Flag' },
      { key: 'reject_code', label: 'Reject Code' },
      { key: 'payer_id', label: 'Payer ID' },
      { key: 'state_code', label: 'State Code' },
      { key: 'payment_remarks', label: 'Remarks' },
    ]
  }

  const dimCols: { key: string; label: string; align?: 'right' }[] = [{ key: 'sr_no', label: 'Sr No' }]

  if (
    ['state-type-wise', 'division-wise', 'district-wise', 'hospital-wise', 'state-hospital-type', 'full-detail'].includes(
      reportId
    )
  ) {
    dimCols.push({ key: 'state_type', label: 'State Type' })
  }
  if (['division-wise', 'district-wise', 'hospital-wise', 'district-hospital-type', 'hospital-specialty', 'full-detail'].includes(reportId)) {
    dimCols.push({ key: 'division', label: 'Division' })
  }
  if (['district-wise', 'hospital-wise', 'district-hospital-type', 'hospital-specialty', 'full-detail'].includes(reportId)) {
    dimCols.push({ key: 'district', label: 'District' })
  }
  if (['hospital-wise', 'hospital-specialty', 'full-detail'].includes(reportId)) {
    dimCols.push({ key: 'hospital_name', label: 'Hospital Name' })
  }
  if (['hospital-wise', 'state-hospital-type', 'district-hospital-type', 'full-detail'].includes(reportId)) {
    dimCols.push({ key: 'hospital_type', label: 'Hospital Type' })
  }
  if (reportId === 'specialty-wise') dimCols.push({ key: 'specialty', label: 'Specialty' })
  if (reportId === 'specialty-wise' || reportId === 'hospital-specialty' || reportId === 'full-detail') {
    if (!dimCols.some((c) => c.key === 'specialty')) dimCols.push({ key: 'specialty', label: 'Specialty' })
  }
  if (reportId === 'district-hospital-type') dimCols.push({ key: 'hospital_count', label: 'No. of Hospitals', align: 'right' })

  const kpiCols: { key: string; label: string; align?: 'right' }[] = []
  for (const kpi of CLAIM_KPI_COLUMNS) {
    kpiCols.push({ key: `${kpi.key}_count`, label: `${kpi.label} — Count`, align: 'right' })
    kpiCols.push({ key: `${kpi.key}_initiated_cr`, label: `${kpi.label} — Init Cr`, align: 'right' })
    if (kpi.hasApproved) {
      kpiCols.push({ key: `${kpi.key}_approved_cr`, label: `${kpi.label} — Appr Cr`, align: 'right' })
    }
  }

  return [...dimCols, ...kpiCols]
}

export const SPECIALTY_REPORT_IDS = ['specialty-wise', 'hospital-specialty', 'full-detail']

export function getClaimsFiltersForPage() {
  return CLAIMS_FILTER_FIELDS
}
