import { query } from '../db/pool.js'
import { serializeRows } from './serialize.js'
import { getPrimaryTableForModule } from './schemaRegistry.js'
import { filterHospitalRows } from './hospitalFilters.js'

const HOSPITAL_LOAD_COLUMNS = [
  'hosp_name',
  'hospital_name',
  'district_name',
  'dist_name',
  'state_name',
  'hospital_type',
  'facility_id',
  'hosp_id',
  'hospital_code',
  'hosp_status_desc',
  'enrl_status',
  'active_status',
  'hosp_empaneled_date',
  'empaneled_date',
  'hosp_city',
  'hosp_address',
  'hosp_mobile_no',
  'bed_size',
  'quality_certification',
  'accreditation_status',
  'nabh_certified',
  'hosp_spec_type',
  'pgdnb_status',
  'deempanel_status',
]

const CACHE_TTL_MS = 15 * 60 * 1000
const colSetCache = new Map()
let uniqueCache = null
let uniqueInflight = null

export async function tableColumnSet(schema, table) {
  const id = `${schema}.${table}`
  const hit = colSetCache.get(id)
  if (hit) return hit
  const res = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2`,
    [schema, table]
  )
  const set = new Set(res.rows.map((r) => r.column_name))
  colSetCache.set(id, set)
  return set
}

export function invalidateHospitalUniqueCache() {
  uniqueCache = null
}

export function peekHospitalUniqueCache() {
  if (!uniqueCache) return null
  if (Date.now() - uniqueCache.loadedAt > CACHE_TTL_MS) {
    uniqueCache = null
    return null
  }
  return uniqueCache
}

export function parseHospitalPaging(q = {}) {
  const limit = Math.min(Math.max(Number.parseInt(q.limit, 10) || 200, 1), 500)
  const offset = Math.max(Number.parseInt(q.offset, 10) || 0, 0)
  return { limit, offset }
}

export function stripHospitalPaging(q = {}) {
  const rest = { ...q }
  delete rest.limit
  delete rest.offset
  delete rest.format
  delete rest.page
  return rest
}

/** Master tables used for unique hospital counts (primary first so richer rows win). */
export function hospitalMasterSources() {
  const primary = getPrimaryTableForModule('hospitals')
  const seen = new Set()
  const list = []
  const add = (schema, table) => {
    const id = `${schema}.${table}`
    if (seen.has(id)) return
    seen.add(id)
    list.push({ schema, table, id })
  }
  if (primary) add(primary.schema, primary.table)
  add('dmart_mp', 'hospital_master_with_quality_certification_final')
  add('dmart_mp', 'hospital_master_with_quality_certification')
  add('dmart_mp', 'hospital_master')
  return list
}

function sqlIdentPart(cols, column, prefix) {
  if (!cols.has(column)) return null
  return `CASE WHEN NULLIF(btrim(${column}::text), '') IS NOT NULL THEN '${prefix}' || lower(btrim(${column}::text)) END`
}

/**
 * One hospital once: hosp_id, then facility_id, then hospital_code, then name+district.
 * Prefixes keep IDs from colliding across columns when sources are unioned.
 */
export function hospitalIdentitySql(cols) {
  const has = (name) => cols.has(name)
  const parts = []
  const hospId = sqlIdentPart(cols, 'hosp_id', 'hosp:')
  if (hospId) parts.push(hospId)
  const facility = sqlIdentPart(cols, 'facility_id', 'fac:')
  if (facility) parts.push(facility)
  const code = sqlIdentPart(cols, 'hospital_code', 'code:')
  if (code) parts.push(code)
  if (has('hosp_name') && has('district_name')) {
    parts.push(
      `NULLIF('name:' || lower(btrim(COALESCE(hosp_name, ''))) || '|' || lower(btrim(COALESCE(district_name, ''))), 'name:|')`
    )
  } else if (has('hospital_name') && has('district_name')) {
    parts.push(
      `NULLIF('name:' || lower(btrim(COALESCE(hospital_name, ''))) || '|' || lower(btrim(COALESCE(district_name, ''))), 'name:|')`
    )
  } else if (has('hosp_name')) {
    parts.push(`NULLIF('name:' || lower(btrim(hosp_name)), 'name:')`)
  } else if (has('hospital_name')) {
    parts.push(`NULLIF('name:' || lower(btrim(hospital_name)), 'name:')`)
  }
  return parts.length ? `COALESCE(${parts.join(', ')})` : null
}

/** Same uniqueness as hospitalIdentitySql, for in-memory merge. */
export function hospitalRowIdentity(row) {
  const id = String(row.hosp_id ?? '').trim()
  if (id) return `hosp:${id.toLowerCase()}`
  const fac = String(row.facility_id ?? '').trim()
  if (fac) return `fac:${fac.toLowerCase()}`
  const code = String(row.hospital_code ?? '').trim()
  if (code) return `code:${code.toLowerCase()}`
  const name = String(row.hosp_name || row.hospital_name || '').trim().toLowerCase()
  const dist = String(row.district_name || row.dist_name || '').trim().toLowerCase()
  if (name || dist) return `name:${name}|${dist}`
  return ''
}

function dateOrderColumn(cols) {
  if (cols.has('hosp_empaneled_date')) return 'hosp_empaneled_date'
  if (cols.has('empaneled_date')) return 'empaneled_date'
  if (cols.has('hosp_request_date')) return 'hosp_request_date'
  return null
}

export async function uniqueHospitalContext() {
  const primary = getPrimaryTableForModule('hospitals')
  if (!primary) return null
  const cols = await tableColumnSet(primary.schema, primary.table)
  const keySql = hospitalIdentitySql(cols)
  if (!keySql) return null
  return { ...primary, cols, keySql }
}

export async function queryDistinctHospitalMaster(schema, table, { columns } = {}) {
  const cols = await tableColumnSet(schema, table)
  const keySql = hospitalIdentitySql(cols)
  const dateCol = dateOrderColumn(cols)
  let selectList = '*'
  if (columns) {
    const picked = columns.filter((c) => cols.has(c))
    if (!picked.length) return { rows: [], _db: null }
    selectList = picked.join(', ')
  }
  if (!keySql) {
    return query(`SELECT ${selectList} FROM ${schema}.${table}`)
  }
  const orderExtra = dateCol ? `, ${dateCol} DESC NULLS LAST` : ''
  return query(
    `SELECT ${selectList} FROM (
       SELECT DISTINCT ON (${keySql}) ${selectList}
       FROM ${schema}.${table}
       WHERE ${keySql} IS NOT NULL
       ORDER BY ${keySql}${orderExtra}
     ) unique_hosp`
  )
}

export async function countUniqueHospitals(queryParams = {}) {
  const loaded = await loadUniqueHospitalRows()
  return filterHospitalRows(loaded.table, queryParams).length
}

async function buildUniqueHospitalRows() {
  const sources = hospitalMasterSources()
  const fetched = await Promise.all(
    sources.map(async (src) => {
      try {
        const result = await queryDistinctHospitalMaster(src.schema, src.table, {
          columns: HOSPITAL_LOAD_COLUMNS,
        })
        return { src, result }
      } catch (err) {
        console.warn(`[hospitals] unique rows skip ${src.id}: ${err.message}`)
        return { src, result: { rows: [], _db: null } }
      }
    })
  )

  const merged = []
  const seen = new Set()
  const used = []
  let db = 'postgres'

  for (const { src, result } of fetched) {
    if (!result.rows?.length) continue
    db = result._db || db
    used.push(src.id)
    for (const row of serializeRows(result.rows)) {
      const key = hospitalRowIdentity(row)
      if (!key || seen.has(key)) continue
      seen.add(key)
      merged.push(row)
    }
  }

  let columns = HOSPITAL_LOAD_COLUMNS
  if (merged[0]) {
    columns = HOSPITAL_LOAD_COLUMNS.filter((c) => Object.prototype.hasOwnProperty.call(merged[0], c))
  }

  const nameCol = columns.includes('hosp_name')
    ? 'hosp_name'
    : columns.includes('hospital_name')
      ? 'hospital_name'
      : columns[0]
  merged.sort((a, b) => String(a[nameCol] ?? '').localeCompare(String(b[nameCol] ?? '')))

  return {
    table: merged,
    columns,
    schema: used.join(' + ') || 'dmart_mp.hospital_master_with_quality_certification',
    db,
    sourcesUsed: used.length,
  }
}

export async function loadUniqueHospitalRows() {
  const hit = peekHospitalUniqueCache()
  if (hit) return hit
  if (uniqueInflight) return uniqueInflight
  uniqueInflight = buildUniqueHospitalRows()
    .then((result) => {
      if (result.sourcesUsed > 0) {
        uniqueCache = { ...result, loadedAt: Date.now() }
        return uniqueCache
      }
      return result
    })
    .finally(() => {
      uniqueInflight = null
    })
  return uniqueInflight
}
