import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { suggestMapping, assertSafeIdent } from './importRegistryCore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REGISTRY_PATH = path.join(__dirname, '../data/schemaRegistry.json')

let _cache = null

function loadRegistryFile() {
  if (_cache) return _cache
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8')
  _cache = JSON.parse(raw)
  return _cache
}

function toTableDef(t) {
  return {
    id: t.id,
    logicalName: t.logicalName,
    schema: t.schema,
    table: t.table,
    label: t.label,
    source: t.source,
    module: t.module,
    moduleLabel: t.moduleLabel,
    primaryKey: t.primaryKey,
    autoGeneratePk: t.autoGeneratePk,
    columnCount: t.columns.length,
    columns: t.columns,
  }
}

function cloneAsHist(src) {
  return {
    ...src,
    id: 'dmart_mp.t_bis_beneficiary_dtl_hist',
    logicalName: 't_bis_beneficiary_dtl_hist',
    schema: 'dmart_mp',
    table: 't_bis_beneficiary_dtl_hist',
    label: 'BIS Beneficiary Details History',
    module: 'beneficiaries',
    moduleLabel: 'Beneficiaries',
    source: src.source || 'migration 007',
  }
}

/** All importable tables from schemaRegistry.json (unique ids; richest column set wins). */
export function getImportTables() {
  const map = new Map()
  for (const t of loadRegistryFile().tables) {
    const existing = map.get(t.id)
    if (!existing || t.columns.length > existing.columns.length) {
      map.set(t.id, t)
    }
  }
  if (!map.has('dmart_mp.t_bis_beneficiary_dtl_hist')) {
    const src = map.get('bis_raw.t_bis_beneficiary_dtls') || map.get('dmart_mp.t_bis_beneficiary_dtls')
    if (src) map.set('dmart_mp.t_bis_beneficiary_dtl_hist', cloneAsHist(src))
  }
  return [...map.values()].map(toTableDef)
}

export function getImportTable(tableId) {
  if (!tableId) return null
  return getImportTables().find((t) => t.id === tableId) || null
}

/** Resolve a table even if it is missing from the registry (schema.table id). */
export function resolveImportTable(tableId) {
  const fromRegistry = getImportTable(tableId)
  if (fromRegistry) return fromRegistry
  const [schema, table] = String(tableId || '').split('.')
  if (!schema || !table) return null
  try {
    assertSafeIdent(schema, 'schema')
    assertSafeIdent(table, 'table')
  } catch {
    return null
  }
  return {
    id: `${schema}.${table}`,
    logicalName: table,
    schema,
    table,
    label: `${schema}.${table}`,
    source: 'live',
    module: 'other',
    moduleLabel: 'Other',
    primaryKey: null,
    autoGeneratePk: false,
    columnCount: 0,
    columns: [],
  }
}

export function getTablesByModule() {
  const grouped = {}
  for (const t of getImportTables()) {
    if (!grouped[t.module]) {
      grouped[t.module] = { module: t.module, moduleLabel: t.moduleLabel, tables: [] }
    }
    grouped[t.module].tables.push(t)
  }
  return Object.values(grouped).sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel))
}

/** Primary dashboard table per module (prefer logicalName === table name) */
export function getPrimaryTableForModule(module) {
  if (module === 'bis') {
    return (
      getImportTable('dmart_mp.t_card_printing_status') ||
      getImportTables().find((t) => t.module === 'bis') ||
      null
    )
  }

  const tables = getImportTables().filter((t) => t.module === module)
  if (!tables.length) return null

  const preferred = {
    claims: 'claim_paid_excel_t',
    hospitals: 'hospital_master_with_quality_certification_final',
    beneficiaries: 't_bis_beneficiary_dtls',
    patients: 't_patient_dtls',
    fraud: 't_suspicious_api_case_data',
    workflow: 'workflow_users_t',
    lms: 'lms_user_course_completion_status',
    ump: 'user_master_ump',
    bis: 't_card_printing_status',
  }
  const pick = preferred[module]
  if (pick) {
    const match = tables.find((t) => t.table === pick)
    if (match) return match
  }

  const exact = tables.find((t) => t.logicalName === t.table)
  if (exact) return exact

  return tables[0]
}

export function getRegistryTable(schema, table) {
  const id = `${schema}.${table}`
  return getImportTables().find((t) => t.id === id) || null
}

export { assertSafeIdent, validateMappedRows, normalizeCell, suggestMapping } from './importRegistryCore.js'

/** Pick the registry table whose columns best match the uploaded headers. */
export function suggestBestTable(headers) {
  const tables = getImportTables()
  const ranked = tables
    .map((table) => {
      const mapping = suggestMapping(headers, table)
      const mapped = Object.values(mapping).filter(Boolean).length
      return { table, mapping, mapped }
    })
    .filter((r) => r.mapped >= 2)
    .sort((a, b) => b.mapped - a.mapped)

  return ranked.slice(0, 5)
}
