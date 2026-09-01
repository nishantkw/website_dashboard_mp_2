import { Router } from 'express'
import { query } from '../db/pool.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { getPrimaryTableForModule } from '../utils/schemaRegistry.js'
import { buildKpi } from '../utils/kpiChange.js'

const router = Router()
const primary = getPrimaryTableForModule('lms')
const SCHEMA = primary?.schema ?? 'dmart_mp'
const TABLE = primary?.table ?? 'lms_user_course_completion_status'

function buildLmsWhere(q) {
  const parts = []
  const params = []

  const pushIlike = (columns, val) => {
    const ors = columns.map((col) => {
      params.push(`%${val}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    parts.push(`(${ors.join(' OR ')})`)
  }

  if (q.role) pushIlike(['role'], q.role)
  if (q.training_status) pushIlike(['ab_pmjay_status'], q.training_status)
  if (q.abdm_status) pushIlike(['abdm_status'], q.abdm_status)

  if (q.search) {
    pushIlike(['userid', 'username', 'firstname', 'lastname', 'role', 'parententity', 'selfentity'], q.search)
  }

  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  return { clause, params }
}

router.get('/', async (req, res) => {
  try {
    const { clause, params } = buildLmsWhere(req.query)

    const { rows, _db } = await query(
      `SELECT * FROM ${SCHEMA}.${TABLE} ${clause} ORDER BY 1 DESC LIMIT 2000`,
      params
    )

    const table = serializeRows(rows)
    const columns = await resolveColumns(SCHEMA, TABLE, table)

    res.json({
      db: _db,
      schema: `${SCHEMA}.${TABLE}`,
      columns,
      kpis: [buildKpi({ label: 'LMS Records', value: table.length, color: 'blue', rows: table })],
      charts: {},
      table,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
