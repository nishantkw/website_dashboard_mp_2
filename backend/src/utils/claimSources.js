import { query } from '../db/pool.js'
import { buildFilterClause } from './filters.js'
import { serializeRows } from './serialize.js'
import { getPrimaryTableForModule, getImportTable } from './schemaRegistry.js'
import { enrichClaimRow, filterClaimRows } from './claimAggregations.js'
import { pushGeoSql } from '../data/mpDivisions.js'

const primary = getPrimaryTableForModule('claims')
const SCHEMA = primary?.schema ?? 'dmart_mp'
const TABLE = primary?.table ?? 'claim_paid_excel_t'
const portability = getImportTable('dmart_mp.claim_paid_t_portability')

/** Tables used by Claim Status Dashboard — primary plus portability when State Type is Both or Portability. */
export function getClaimSourceTables(query = {}) {
  const tables = [{ schema: SCHEMA, table: TABLE }]
  const st = query.state_type
  if (portability && (!st || st === 'Both' || st === 'Portability')) {
    tables.push({ schema: portability.schema, table: portability.table })
  }
  return tables
}

const CLAIM_DISTRICT_COLS = ['patient_district_name', 'hosp_district_name']

/** Tables to COUNT for a KPI: Portability-only skips the MP excel table so we do not over-count. */
function getClaimCountTables(query = {}) {
  const st = query.state_type
  if (st === 'Portability' && portability) {
    return [{ schema: portability.schema, table: portability.table }]
  }
  const tables = [{ schema: SCHEMA, table: TABLE }]
  if (portability && (!st || st === 'Both')) {
    tables.push({ schema: portability.schema, table: portability.table })
  }
  return tables
}

function claimGeoClause(q = {}) {
  const parts = []
  const params = []
  pushGeoSql(parts, params, q, CLAIM_DISTRICT_COLS)
  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  return { clause, params }
}

/** Full SQL COUNT across claim source tables (not the 10k sample used for charts). */
export async function countClaimRows(req = { query: {} }) {
  const q = { ...req.query }
  const { clause, params } = claimGeoClause(q)
  let total = 0
  const sources = []
  for (const t of getClaimCountTables(q)) {
    try {
      const { rows } = await query(
        `SELECT COUNT(*)::bigint AS c FROM ${t.schema}.${t.table} ${clause}`,
        params
      )
      total += Number(rows[0]?.c ?? 0)
      sources.push(`${t.schema}.${t.table}`)
    } catch (err) {
      console.warn(`[claims] count skip ${t.schema}.${t.table}: ${err.message}`)
    }
  }
  return { total, sources }
}

export async function monthCountsForClaimTables(req = { query: {} }) {
  const q = { ...req.query }
  const { clause, params } = claimGeoClause(q)
  const dateExpr = 'COALESCE(claim_init_date, preauth_init_date, admission_dt)'
  let currentCount = 0
  let previousCount = 0
  for (const t of getClaimCountTables(q)) {
    try {
      const { rows } = await query(
        `SELECT
           COUNT(*) FILTER (
             WHERE ${dateExpr} >= date_trunc('month', CURRENT_DATE)
               AND ${dateExpr} < date_trunc('month', CURRENT_DATE) + interval '1 month'
           )::bigint AS cur,
           COUNT(*) FILTER (
             WHERE ${dateExpr} >= date_trunc('month', CURRENT_DATE) - interval '1 month'
               AND ${dateExpr} < date_trunc('month', CURRENT_DATE)
           )::bigint AS prev
         FROM ${t.schema}.${t.table}
         ${clause}`,
        params
      )
      currentCount += Number(rows[0]?.cur ?? 0)
      previousCount += Number(rows[0]?.prev ?? 0)
    } catch (err) {
      console.warn(`[claims] month count skip ${t.schema}.${t.table}: ${err.message}`)
    }
  }
  return { currentCount, previousCount }
}

/**
 * Load claim rows the same way as Claim Status Dashboard:
 * dmart_mp.claim_paid_excel_t plus dmart_mp.claim_paid_t_portability when applicable,
 * then apply JS state-type / division / district filters.
 */
export async function loadClaimRows(req) {
  const q = { ...req.query }

  const { clause, params } = buildFilterClause(q, {
    district: ['patient_district_name', 'hosp_district_name'],
    hospital_type: ['hospital_type'],
    searchCols: [
      'case_id',
      'patient_name',
      'hospital_name',
      'hospital_code',
      'category_details',
      'procedure_details',
      'member_id',
      'family_id',
    ],
  })

  const tables = getClaimSourceTables(q)
  let allRows = []
  let db = null
  const used = []

  for (const t of tables) {
    try {
      const { rows, _db } = await query(
        `SELECT * FROM ${t.schema}.${t.table} ${clause} ORDER BY 1 DESC LIMIT 10000`,
        params
      )
      allRows = allRows.concat(rows)
      db = _db
      used.push(`${t.schema}.${t.table}`)
    } catch (err) {
      console.warn(`[claims] skip ${t.schema}.${t.table}: ${err.message}`)
    }
  }

  const serialized = serializeRows(allRows).map(enrichClaimRow)
  const filtered = filterClaimRows(serialized, q)
  return { rows: filtered, db, sources: used }
}

export { SCHEMA, TABLE }
