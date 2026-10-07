import { Router } from 'express'
import { query } from '../db/pool.js'
import { clientError } from '../utils/clientError.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { buildKpi } from '../utils/kpiChange.js'

/**
 * ICD Doctor Details — ONLY dmart_mp.icd_data_doctor_details.
 * Isolated from doctor_details_with_registartionandcaseid (Doctor Details page).
 * Do not join or merge those tables.
 */
const router = Router()
const SCHEMA = 'dmart_mp'
const TABLE = 'icd_data_doctor_details'

function buildWhere(q) {
  const parts = []
  const params = []

  const pushIlike = (columns, val) => {
    const ors = columns.map((col) => {
      params.push(`%${val}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    parts.push(`(${ors.join(' OR ')})`)
  }

  if (q.type) pushIlike(['type', 'typedescription'], q.type)
  if (q.code) pushIlike(['code'], q.code)
  if (q.search) {
    pushIlike(
      ['registration_id', 'case_id', 'code', 'display', 'type', 'typedescription', 'idpk'],
      q.search
    )
  }

  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  return { clause, params }
}

function uniqueCount(rows, key) {
  const set = new Set()
  for (const row of rows) {
    const v = String(row[key] ?? '').trim()
    if (v) set.add(v.toLowerCase())
  }
  return set.size
}

function namedChart(rows, key, limit = 12) {
  const map = new Map()
  for (const row of rows) {
    const name = String(row[key] || 'Unknown').trim() || 'Unknown'
    map.set(name, (map.get(name) || 0) + 1)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

router.get('/', async (req, res) => {
  try {
    const { clause, params } = buildWhere(req.query)

    let table = []
    let columns = []
    let db = null
    try {
      const result = await query(
        `SELECT * FROM ${SCHEMA}.${TABLE} ${clause} ORDER BY 1 DESC LIMIT 5000`,
        params
      )
      db = result._db
      table = serializeRows(result.rows)
      columns = await resolveColumns(SCHEMA, TABLE, table)
    } catch (err) {
      console.warn(`[icd-doctors] ${SCHEMA}.${TABLE} skipped: ${err.message}`)
    }

    res.json({
      db,
      schema: `${SCHEMA}.${TABLE}`,
      columns,
      kpis: [
        buildKpi({ label: 'ICD Records', value: table.length, color: 'blue', rows: table }),
        buildKpi({
          label: 'Unique ICD Codes',
          value: uniqueCount(table, 'code'),
          color: 'emerald',
          rows: table,
        }),
        buildKpi({
          label: 'Unique Cases',
          value: uniqueCount(table, 'case_id'),
          color: 'cyan',
          rows: table,
        }),
        buildKpi({
          label: 'ICD Types',
          value: uniqueCount(table, 'type'),
          color: 'violet',
          rows: table,
        }),
      ],
      charts: {
        byType: namedChart(table, 'type'),
        byCode: namedChart(table, 'code', 15),
      },
      table,
    })
  } catch (err) {
    res.status(500).json({ error: clientError(err) })
  }
})

export default router
