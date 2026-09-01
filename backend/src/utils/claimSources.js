import { query } from '../db/pool.js'
import { buildFilterClause } from './filters.js'
import { serializeRows } from './serialize.js'
import { getPrimaryTableForModule, getImportTable } from './schemaRegistry.js'
import { enrichClaimRow, filterClaimRows } from './claimAggregations.js'

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

/**
 * Load claim rows the same way as Claim Status Dashboard:
 * dmart_mp.claim_paid_excel_t plus dmart_mp.claim_paid_t_portability when applicable,
 * then apply JS state-type / division / district filters.
 */
export async function loadClaimRows(req) {
  const q = { ...req.query }

  const { clause, params } = buildFilterClause(q, {
    district: ['patient_district_name'],
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
