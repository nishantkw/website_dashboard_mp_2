import { apiFetch } from './client'
import type { AuthUser, UserRole } from '../auth/types'
import type { KPI, ChartDataPoint } from '../types'

export async function loginApi(username: string, password: string, role: UserRole) {
  return apiFetch<{ user: AuthUser; db?: string }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    },
    60000
  )
}

export async function logoutApi() {
  return apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' })
}

export async function fetchCurrentUser() {
  return apiFetch<{ user: AuthUser }>('/auth/me')
}

export async function fetchAuthUsers() {
  return apiFetch<{
    data: Array<{
      id: number | string
      username: string
      name: string
      role: UserRole
      department: string | null
      active: boolean
      created_at?: string
    }>
    db?: string
  }>('/auth/users')
}

export async function createAuthUser(payload: {
  username: string
  name: string
  role: UserRole
  department?: string
  password: string
}) {
  return apiFetch<{
    user: {
      id: number | string
      username: string
      name: string
      role: UserRole
      department: string | null
      active: boolean
      created_at?: string
    }
  }>('/auth/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateAuthUser(
  id: string | number,
  payload: { active?: boolean; name?: string; department?: string; role?: UserRole }
) {
  return apiFetch<{
    user: {
      id: number | string
      username: string
      name: string
      role: UserRole
      department: string | null
      active: boolean
      created_at?: string
    }
  }>(`/auth/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function resetAuthUserPassword(id: string | number, password: string) {
  return apiFetch<{ ok: boolean; user: { id: string; username: string } }>(
    `/auth/users/${id}/password`,
    {
      method: 'POST',
      body: JSON.stringify({ password }),
    }
  )
}

export async function fetchOverview(qs = '') {
  return apiFetch<{
    kpis: KPI[]
    charts: {
      claimStatus: ChartDataPoint[]
      caseType: ChartDataPoint[]
      district: ChartDataPoint[]
      claimsTrend: ChartDataPoint[]
      hospitalType: ChartDataPoint[]
    }
    schemas?: Record<string, string>
    db?: string
  }>(`/overview${qs}`, {}, 60000)
}

export async function fetchOverviewHospitals(qs = '', timeoutMs = 60000) {
  return apiFetch<{
    table: Record<string, string | number>[]
    columns?: string[]
    schema?: string
    total?: number
    tableTotal?: number
    limit?: number
    offset?: number
    db?: string
  }>(`/overview/hospitals${qs}`, {}, timeoutMs)
}

export async function fetchBisCardPrinting(qs = '', timeoutMs = 8000) {
  return apiFetch<{
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    bisTable?: Record<string, string | number>[]
    columns?: string[]
    schema?: string
    bisSchema?: string
    db?: string
  }>(`/bis/card-printing${qs}`, {}, timeoutMs)
}

export async function fetchBisCardPrintData(qs = '', timeoutMs = 15000) {
  return apiFetch<{
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    columns?: string[]
    schema?: string
    augTable?: Record<string, string | number>[]
    augColumns?: string[]
    augSchema?: string
    vvsTable?: Record<string, string | number>[]
    vvsColumns?: string[]
    vvsSchema?: string
    tempTable?: Record<string, string | number>[]
    tempColumns?: string[]
    tempSchema?: string
    leftoverTable?: Record<string, string | number>[]
    leftoverColumns?: string[]
    leftoverSchema?: string
    db?: string
  }>(`/bis/card-print-data${qs}`, {}, timeoutMs)
}

export async function fetchBisPrintDedup(qs = '', timeoutMs = 15000) {
  return apiFetch<{
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    columns?: string[]
    schema?: string
    batchATable?: Record<string, string | number>[]
    batchAColumns?: string[]
    batchASchema?: string
    batchBTable?: Record<string, string | number>[]
    batchBColumns?: string[]
    batchBSchema?: string
    db?: string
  }>(`/bis/print-dedup${qs}`, {}, timeoutMs)
}

export async function fetchClaims(qs = '', timeoutMs = 8000) {
  return apiFetch<{
    kpis: KPI[]
    masterKpis?: { key: string; label: string; count: number; initiatedCr: number; approvedCr: number }[]
    stateHospitalSummary?: Record<string, string | number>[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    paymentTable?: Record<string, string | number>[]
    jsonDataTable?: Record<string, string | number>[]
    columns?: string[]
    paymentColumns?: string[]
    jsonDataColumns?: string[]
    schema?: string
    paymentSchema?: string
    jsonDataSchema?: string
    paymentKpis?: KPI[]
    jsonDataKpis?: KPI[]
    db?: string
  }>(`/claims${qs}`, {}, timeoutMs)
}

export async function fetchClaimsFilterOptions() {
  return apiFetch<{
    hospitals: string[]
    specialties: string[]
    patientStates?: string[]
    patientDistricts?: string[]
    patientGeo?: { state: string; district: string }[]
  }>('/claims/filter-options')
}

export async function fetchClaimsMasterReport(reportId: string, qs = '') {
  return apiFetch<{
    reportId: string
    rows: Record<string, string | number>[]
    total: number
    schema?: string
    db?: string
  }>(`/claims/reports/${reportId}${qs}`)
}

export async function fetchBeneficiaries(qs = '', timeoutMs = 8000) {
  return apiFetch<{
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    bisTable: Record<string, string | number>[]
    sourceTable?: Record<string, string | number>[]
    disabledTable?: Record<string, string | number>[]
    ekycTable?: Record<string, string | number>[]
    pvtgTable?: Record<string, string | number>[]
    disabledSnapTable?: Record<string, string | number>[]
    columns?: string[]
    sourceColumns?: string[]
    disabledColumns?: string[]
    ekycColumns?: string[]
    pvtgColumns?: string[]
    disabledSnapColumns?: string[]
    schema?: string
    sourceSchema?: string
    disabledSchema?: string
    ekycSchema?: string
    pvtgSchema?: string
    disabledSnapSchema?: string
    bisSchema?: string
    disabledKpis?: KPI[]
    ekycKpis?: KPI[]
    pvtgKpis?: KPI[]
    bisKpis?: KPI[]
    bisColumns?: string[]
    db?: string
  }>(`/beneficiaries${qs}`, {}, timeoutMs)
}

export async function fetchHospitals(qs = '') {
  return apiFetch<{
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    tableTotal?: number
    total?: number
    limit?: number
    offset?: number
    section?: string
    lookupTable?: Record<string, string | number>[]
    deempanelTable?: Record<string, string | number>[]
    hemTable?: Record<string, string | number>[]
    manpowerTable?: Record<string, string | number>[]
    columns?: string[]
    lookupColumns?: string[]
    deempanelColumns?: string[]
    hemColumns?: string[]
    manpowerColumns?: string[]
    schema?: string
    lookupSchema?: string
    deempanelSchema?: string
    hemSchema?: string
    manpowerSchema?: string
    deempanelKpis?: KPI[]
    hemKpis?: KPI[]
    manpowerKpis?: KPI[]
    db?: string
  }>(`/hospitals${qs}`, {}, 60000)
}

/** Scoped hospital payloads — each section loads only its data. */
export async function fetchHospitalsSection(
  section: 'overview' | 'master' | 'deempanel' | 'hem' | 'lookup' | 'manpower',
  qs = ''
) {
  const params = new URLSearchParams(qs.replace(/^\?/, ''))
  params.set('section', section)
  const s = params.toString()
  return fetchHospitals(s ? `?${s}` : `?section=${section}`)
}

export async function fetchHospitalsExport(qs = '') {
  const params = new URLSearchParams(qs.replace(/^\?/, ''))
  params.set('format', 'json')
  params.delete('limit')
  params.delete('offset')
  params.delete('page')
  const s = params.toString()
  return apiFetch<{
    table: Record<string, string | number>[]
    columns?: string[]
    total?: number
    schema?: string
    db?: string
  }>(`/hospitals/export${s ? `?${s}` : ''}`, {}, 120000)
}

export async function fetchFraud(view = 'overall', qs = '', timeoutMs = 8000) {
  const params = new URLSearchParams(qs.replace(/^\?/, ''))
  params.set('view', view)
  return apiFetch<{
    view: string
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    triggerTable: Record<string, string | number>[]
    hospitalTable: Record<string, string | number>[]
    workflowUsers: Record<string, string | number>[]
    workflowAudit: Record<string, string | number>[]
    columns?: string[]
    triggerColumns?: string[]
    hospitalColumns?: string[]
    workflowUsersColumns?: string[]
    workflowAuditColumns?: string[]
    schema?: Record<string, string>
    db?: string
  }>(`/fraud?${params.toString()}`, {}, timeoutMs)
}

export async function fetchWorkflow(qs = '', timeoutMs = 8000) {
  return apiFetch<{
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    audit?: Record<string, string | number>[]
    auditColumns?: string[]
    proTable?: Record<string, string | number>[]
    proColumns?: string[]
    proKpis?: KPI[]
    statusBisTable?: Record<string, string | number>[]
    statusBisColumns?: string[]
    statusBisSchema?: string
    statusTmsTable?: Record<string, string | number>[]
    statusTmsColumns?: string[]
    statusTmsSchema?: string
    columns?: string[]
    schema?: string
    proSchema?: string
    db?: string
  }>(`/workflow${qs}`, {}, timeoutMs)
}

export async function fetchPatients(qs = '', timeoutMs = 8000) {
  return apiFetch<{
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    treatmentTable?: Record<string, string | number>[]
    morthTable?: Record<string, string | number>[]
    stratTable?: Record<string, string | number>[]
    columns?: string[]
    treatmentColumns?: string[]
    morthColumns?: string[]
    stratColumns?: string[]
    schema?: string
    treatmentSchema?: string
    morthSchema?: string
    stratSchema?: string
    morthKpis?: KPI[]
    db?: string
  }>(`/patients${qs}`, {}, timeoutMs)
}

export async function fetchLms(qs = '', timeoutMs = 8000) {
  return apiFetch<{
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    columns?: string[]
    schema?: string
    db?: string
  }>(`/lms${qs}`, {}, timeoutMs)
}

export async function fetchUmpUsers(qs = '') {
  return apiFetch<{
    kpis: KPI[]
    charts: Record<string, ChartDataPoint[]>
    table: Record<string, string | number>[]
    columns?: string[]
    schema?: string
    db?: string
  }>(`/ump/users${qs}`)
}

export interface ImportTableColumn {
  name: string
  type: string
}

export interface ImportTableDef {
  id: string
  logicalName?: string
  schema: string
  table: string
  label: string
  source: string
  module?: string
  moduleLabel?: string
  primaryKey: string | null
  autoGeneratePk: boolean
  columnCount: number
  columns: ImportTableColumn[]
}

export async function fetchImportTables() {
  return apiFetch<{
    tables: ImportTableDef[]
    byModule: { module: string; moduleLabel: string; tables: ImportTableDef[] }[]
    total: number
  }>('/import/tables')
}

export async function suggestImportMapping(tableId: string, headers: string[]) {
  return apiFetch<{ mapping: Record<string, string>; tableId: string }>('/import/suggest-mapping', {
    method: 'POST',
    body: JSON.stringify({ tableId, headers }),
  })
}

export async function postImport(payload: {
  tableId: string
  mode: 'append' | 'upsert'
  rows: Record<string, string | number | null>[]
}) {
  return apiFetch<{
    ok: boolean
    tableId: string
    mode: string
    inserted: number
    updated?: number
    skipped: number
    total: number
    columnsUsed?: string[]
    errors: { row: number; message: string }[]
    db?: string
  }>('/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, 120000)
}

export interface ImportUploadSummary {
  id: string
  fileName: string
  displayName?: string
  fileSize: number
  mimeType?: string
  tableId: string | null
  suggestedTableId: string | null
  rowCount: number
  status: string
  inserted?: number | null
  skipped?: number | null
  importedAt?: string | null
  createdAt: string
  headerCount?: number
  source?: 'file' | 'database'
  filesPurged?: boolean
}

export interface DuplicateRowReport {
  fileRow: number
  keptFileRow: number
  everyFieldDuplicate: boolean
  keyCols: string[]
  differingFields: string[]
  row: Record<string, string>
  kept: Record<string, string>
}

export interface DuplicateReport {
  fileDuplicates: number
  keyCols: string[]
  exactCopies: DuplicateRowReport[]
  exactCopyCount: number
  keyOnlyDiffs: DuplicateRowReport[]
  keyOnlyDiffCount: number
}

export interface ImportUploadDetail extends ImportUploadSummary {
  headers: string[]
  mapping: Record<string, string>
  preview: Record<string, string>[]
  fileDuplicates?: number
  duplicateReport?: DuplicateReport | null
  importMode?: string | null
  importErrors?: { row: number; message: string }[] | null
  table?: ImportTableDef | null
  suggestions?: { id: string; label: string; mapped: number; columnCount: number }[]
  sheetName?: string | null
}

export async function fetchImportUploads() {
  return apiFetch<{ uploads: ImportUploadSummary[] }>('/import/uploads')
}

export async function fetchImportUpload(id: string) {
  return apiFetch<{ upload: ImportUploadDetail }>(`/import/uploads/${id}`)
}

export async function fetchImportUploadRows(
  id: string,
  offset = 0,
  limit = 50,
  filters: { search?: string; hospId?: string; facilityId?: string } = {},
  timeoutMs = 30000
) {
  const params = new URLSearchParams()
  params.set('offset', String(offset))
  params.set('limit', String(limit))
  if (limit > 200) params.set('detail', '1')
  if (filters.search) params.set('search', filters.search)
  if (filters.hospId) params.set('hosp_id', filters.hospId)
  if (filters.facilityId) params.set('facility_id', filters.facilityId)
  return apiFetch<{
    id: string
    source?: 'database' | 'file'
    headers: string[]
    total: number
    fileTotal?: number
    offset: number
    limit?: number
    rows: Record<string, string>[]
  }>(`/import/uploads/${id}/rows?${params.toString()}`, {}, timeoutMs)
}

export async function fetchImportUploadRowFilters(id: string) {
  return apiFetch<{
    id: string
    hospIdHeader: string | null
    facilityIdHeader: string | null
    hospIds: string[]
    facilityIds: string[]
  }>(`/import/uploads/${id}/row-filters`, {}, 30000)
}

export async function uploadImportFile(file: File, tableId?: string) {
  const form = new FormData()
  form.append('file', file)
  if (tableId) form.append('tableId', tableId)
  return apiFetch<{ upload: ImportUploadDetail }>('/import/upload', {
    method: 'POST',
    body: form,
  }, 120000)
}

export async function updateImportUpload(id: string, payload: { tableId?: string; mapping?: Record<string, string> }) {
  return apiFetch<{ upload: ImportUploadDetail }>(`/import/uploads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function commitImportUpload(
  id: string,
  payload: { tableId: string; mapping: Record<string, string> }
) {
  return apiFetch<{
    ok: boolean
    uploadId: string
    tableId: string
    mode: string
    inserted: number
    skipped: number
    skippedFile?: number
    skippedExisting?: number
    updated?: number
    uniqueKey?: string[]
    total: number
    columnsUsed?: string[]
    errors: { row: number; message: string }[]
  }>(`/import/uploads/${id}/commit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, 180000)
}

export async function deleteImportUpload(id: string) {
  return apiFetch<{ ok: boolean }>(`/import/uploads/${id}`, { method: 'DELETE' })
}
