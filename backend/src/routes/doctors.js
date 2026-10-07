import { Router } from 'express'
import { query } from '../db/pool.js'
import { clientError } from '../utils/clientError.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { buildKpi } from '../utils/kpiChange.js'

/**
 * Doctor Details — ONLY dmart_mp.doctor_details_with_registartionandcaseid.
 * Isolated from icd_data_doctor_details (ICD Doctor Details page).
 * Do not join or merge those tables.
 */
const router = Router()
const SCHEMA = 'dmart_mp'
const TABLE = 'doctor_details_with_registartionandcaseid'

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

  if (q.docqualification) pushIlike(['docqualification'], q.docqualification)
  if (q.search) {
    pushIlike(
      ['docregnum', 'docname', 'docqualification', 'doccontactnumber', 'registration_id', 'case_id'],
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

function qualificationChart(rows) {
  const map = new Map()
  for (const row of rows) {
    const name = String(row.docqualification || 'Unknown').trim() || 'Unknown'
    map.set(name, (map.get(name) || 0) + 1)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
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
      console.warn(`[doctors] ${SCHEMA}.${TABLE} skipped: ${err.message}`)
    }

    res.json({
      db,
      schema: `${SCHEMA}.${TABLE}`,
      columns,
      kpis: [
        buildKpi({ label: 'Doctor Records', value: table.length, color: 'blue', rows: table }),
        buildKpi({
          label: 'Unique Doctors',
          value: uniqueCount(table, 'docregnum') || uniqueCount(table, 'docname'),
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
          label: 'Registrations',
          value: uniqueCount(table, 'registration_id'),
          color: 'violet',
          rows: table,
        }),
      ],
      charts: {
        qualification: qualificationChart(table),
      },
      table,
    })
  } catch (err) {
    res.status(500).json({ error: clientError(err) })
  }
})

export default router
