import { query } from '../db/pool.js'
import { assertSafeIdent, normalizeCell } from './schemaRegistry.js'
import { dedupeRows, pickKeyColumns, canonicalRowKey } from './dedupe.js'
import { serializeRows } from './serialize.js'
import { invalidateHospitalUniqueCache } from './hospitalIdentity.js'

const BATCH = 150
const LOOKUP = 400
const INT4_MAX = 2147483647
const SKIP_INT_WIDEN = new Set(['m_flag', 'status_id', 'status_id_pk', 'active_flag', 'final_level', 'active_yn'])

function exceedsInt4(val) {
  if (val == null || val === '') return false
  const n = Number(String(val).replace(/[₹,\s]/g, ''))
  return Number.isFinite(n) && Math.abs(n) > INT4_MAX
}

/** node-pg infers JS numbers as int4, which rejects NHA ids (e.g. 100005858984). */
function pgBindValue(val, dataType) {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number' && /int|numeric|bigint|real|double|decimal/.test(dataType || '')) {
    return String(val)
  }
  if (typeof val === 'bigint') return String(val)
  return val
}

async function widenIntegerColumnsIfNeeded(schema, table, live, rows) {
  let changed = false
  for (const col of live) {
    if (!['integer', 'smallint'].includes(col.data_type)) continue
    if (SKIP_INT_WIDEN.has(col.column_name)) continue
    const overflow = rows.some((r) => exceedsInt4(r?.[col.column_name]))
    if (!overflow) continue
    assertSafeIdent(col.column_name, 'column')
    await query(
      `ALTER TABLE ${schema}.${table} ALTER COLUMN ${col.column_name} TYPE bigint USING ${col.column_name}::bigint`
    )
    changed = true
    console.warn(`[import] ${schema}.${table}.${col.column_name}: integer → bigint (value exceeds int4)`)
  }
  return changed
}

async function getLiveColumns(schema, table) {
  const { rows } = await query(
    `SELECT column_name, data_type, is_nullable, column_default,
            COALESCE(is_identity, 'NO') AS is_identity
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, table]
  )
  return rows
}

async function getTableType(schema, table) {
  const { rows } = await query(
    `SELECT table_type FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = $2`,
    [schema, table]
  )
  return rows[0]?.table_type || null
}

function isSerialCol(col) {
  return col.is_identity === 'YES' || String(col.column_default || '').includes('nextval')
}

function signature(cols) {
  return cols.join('\0')
}

async function fetchExistingByKeys(schema, table, keyCols, rows) {
  if (!keyCols?.length || !rows.length) return []
  keyCols.forEach((c) => assertSafeIdent(c, 'column'))

  const values = rows
    .map((r) => keyCols.map((c) => r[c]))
    .filter((parts) => parts.every((v) => v !== null && v !== undefined && String(v).trim() !== ''))
  if (!values.length) return []

  const found = []
  for (let i = 0; i < values.length; i += LOOKUP) {
    const chunk = values.slice(i, i + LOOKUP)
    if (keyCols.length === 1) {
      const col = keyCols[0]
      const { rows: hits } = await query(
        `SELECT * FROM ${schema}.${table} WHERE ${col}::text = ANY($1::text[])`,
        [chunk.map((v) => String(v[0]))]
      )
      found.push(...hits)
    } else {
      const placeholders = chunk
        .map((_, idx) => `(${keyCols.map((__, j) => `$${idx * keyCols.length + j + 1}::text`).join(', ')})`)
        .join(', ')
      const params = chunk.flatMap((v) => v.map((x) => String(x)))
      const { rows: hits } = await query(
        `SELECT * FROM ${schema}.${table}
         WHERE (${keyCols.map((c) => `${c}::text`).join(', ')}) IN (${placeholders})`,
        params
      )
      found.push(...hits)
    }
  }
  return serializeRows(found)
}

/**
 * Insert mapped rows, automatically skipping file duplicates and rows already in the database.
 */
export async function insertMappedRows(tableDef, rows) {
  assertSafeIdent(tableDef.schema, 'schema')
  assertSafeIdent(tableDef.table, 'table')

  const tableType = await getTableType(tableDef.schema, tableDef.table)
  if (!tableType) {
    throw new Error(`Table ${tableDef.schema}.${tableDef.table} does not exist`)
  }
  if (tableType === 'VIEW') {
    throw new Error(`${tableDef.id} is a view. Import into the underlying table instead.`)
  }

  let live = await getLiveColumns(tableDef.schema, tableDef.table)
  if (!live.length) {
    throw new Error(`No columns found for ${tableDef.id}`)
  }
  if (await widenIntegerColumnsIfNeeded(tableDef.schema, tableDef.table, live, rows)) {
    live = await getLiveColumns(tableDef.schema, tableDef.table)
  }
  const liveByName = Object.fromEntries(live.map((c) => [c.column_name, c]))
  const serialNames = new Set(live.filter(isSerialCol).map((c) => c.column_name))

  const prepared = []
  let skippedEmpty = 0
  for (const raw of rows) {
    const mapped = {}
    for (const [col, val] of Object.entries(raw || {})) {
      const liveCol = liveByName[col]
      if (!liveCol) continue
      const normalized = normalizeCell(val, liveCol.data_type)
      if (serialNames.has(col) && (normalized === null || normalized === '')) {
        continue
      }
      mapped[col] = normalized
    }
    if (Object.keys(mapped).length === 0) {
      skippedEmpty++
      continue
    }
    prepared.push(mapped)
  }

  const available = new Set(prepared.flatMap((r) => Object.keys(r)))
  const keyCols = pickKeyColumns(tableDef.table, available)
  const fileDeduped = dedupeRows(prepared, null)
  let skippedFile = fileDeduped.duplicates
  let toWrite = fileDeduped.rows

  let skippedExisting = 0
  let updated = 0

  if (keyCols && toWrite.length) {
    const existingRows = await fetchExistingByKeys(tableDef.schema, tableDef.table, keyCols, toWrite)
    const fresh = []
    for (const row of toWrite) {
      const cols = Object.keys(row)
      const want = canonicalRowKey(row, cols)
      const already = existingRows.some((ex) => canonicalRowKey(ex, cols) === want)
      if (already) skippedExisting++
      else fresh.push(row)
    }
    toWrite = fresh
  }

  let inserted = 0
  const rowErrors = []
  const groups = new Map()
  for (const row of toWrite) {
    const cols = Object.keys(row)
    const key = signature(cols)
    if (!groups.has(key)) groups.set(key, { cols, rows: [] })
    groups.get(key).rows.push(row)
  }

  for (const { cols, rows: groupRows } of groups.values()) {
    cols.forEach((c) => assertSafeIdent(c, 'column'))
    for (let i = 0; i < groupRows.length; i += BATCH) {
      const chunk = groupRows.slice(i, i + BATCH)
      const placeholders = []
      const params = []
      chunk.forEach((row) => {
        const start = params.length
        cols.forEach((c) => params.push(pgBindValue(row[c], liveByName[c]?.data_type)))
        placeholders.push(`(${cols.map((_, idx) => `$${start + idx + 1}`).join(', ')})`)
      })

      const sql = `INSERT INTO ${tableDef.schema}.${tableDef.table} (${cols.join(', ')}) VALUES ${placeholders.join(', ')}`
      try {
        const result = await query(sql, params)
        inserted += result.rowCount ?? chunk.length
      } catch (err) {
        if (/duplicate key|unique constraint/i.test(err.message || '')) {
          for (let r = 0; r < chunk.length; r++) {
            const row = chunk[r]
            const p = cols.map((c) => pgBindValue(row[c], liveByName[c]?.data_type))
            const ph = cols.map((_, idx) => `$${idx + 1}`)
            try {
              await query(
                `INSERT INTO ${tableDef.schema}.${tableDef.table} (${cols.join(', ')}) VALUES (${ph.join(', ')})`,
                p
              )
              inserted++
            } catch (rowErr) {
              if (/duplicate key|unique constraint/i.test(rowErr.message || '')) skippedExisting++
              else {
                rowErrors.push({ row: i + r + 1, message: rowErr.message })
                if (rowErrors.length >= 25) break
              }
            }
          }
        } else {
          for (let r = 0; r < chunk.length; r++) {
            const row = chunk[r]
            const p = cols.map((c) => pgBindValue(row[c], liveByName[c]?.data_type))
            const ph = cols.map((_, idx) => `$${idx + 1}`)
            try {
              await query(
                `INSERT INTO ${tableDef.schema}.${tableDef.table} (${cols.join(', ')}) VALUES (${ph.join(', ')})`,
                p
              )
              inserted++
            } catch (rowErr) {
              if (/duplicate key|unique constraint/i.test(rowErr.message || '')) skippedExisting++
              else {
                rowErrors.push({ row: i + r + 1, message: rowErr.message })
                if (rowErrors.length >= 25) break
              }
            }
          }
        }
      }
      if (rowErrors.length >= 25) break
    }
    if (rowErrors.length >= 25) break
  }

  invalidateHospitalUniqueCache()

  return {
    inserted,
    updated,
    skipped: skippedEmpty + skippedFile + skippedExisting,
    skippedEmpty,
    skippedFile,
    skippedExisting,
    total: rows.length,
    errors: rowErrors,
    columnsUsed: [...new Set(prepared.flatMap((r) => Object.keys(r)))],
    uniqueKey: ['every field'],
  }
}
