import { Router } from 'express'
import { query } from '../db/pool.js'
import { clientError } from '../utils/clientError.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { buildKpi } from '../utils/kpiChange.js'

/** NAFU/SAFU source master: dmart_mp.m_nafu_safu_source */
const router = Router()
const SCHEMA = 'dmart_mp'
const TABLE = 'm_nafu_safu_source'

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

  if (q.status) pushIlike(['status'], q.status)
  if (q.trigger_type) pushIlike(['trigger_type'], q.trigger_type)
  if (q.fraud_not_fraud) pushIlike(['fraud_not_fraud'], q.fraud_not_fraud)
  if (q.safu_action) pushIlike(['safu_action'], q.safu_action)

  if (q.date_from) {
    params.push(String(q.date_from).slice(0, 10))
    parts.push(`COALESCE(trigger_timestamp, api_response_date, updated_dt)::date >= $${params.length}::date`)
  }
  if (q.date_to) {
    params.push(String(q.date_to).slice(0, 10))
    parts.push(`COALESCE(trigger_timestamp, api_response_date, updated_dt)::date <= $${params.length}::date`)
  }

  if (q.search) {
    pushIlike(
      [
        'suspicious_id',
        'pmrssm_id',
        'status',
        'trigger_reason',
        'trigger_description',
        'suspicious_entity',
        'trigger_type',
        'file_name',
        'fraud_not_fraud',
        'safu_action',
        'updated_by',
      ],
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
        `SELECT * FROM ${SCHEMA}.${TABLE} ${clause}
         ORDER BY COALESCE(trigger_timestamp, updated_dt, api_response_date) DESC NULLS LAST
         LIMIT 5000`,
        params
      )
      db = result._db
      table = serializeRows(result.rows)
      columns = await resolveColumns(SCHEMA, TABLE, table)
    } catch (err) {
      console.warn(`[nafu-safu-source] ${SCHEMA}.${TABLE} skipped: ${err.message}`)
    }

    res.json({
      db,
      schema: `${SCHEMA}.${TABLE}`,
      columns,
      kpis: [
        buildKpi({ label: 'Source Records', value: table.length, color: 'blue', rows: table }),
        buildKpi({
          label: 'Unique Suspicious IDs',
          value: uniqueCount(table, 'suspicious_id'),
          color: 'orange',
          rows: table,
        }),
        buildKpi({
          label: 'Trigger Types',
          value: uniqueCount(table, 'trigger_type'),
          color: 'violet',
          rows: table,
        }),
        buildKpi({
          label: 'Fraud Flags',
          value: uniqueCount(table, 'fraud_not_fraud'),
          color: 'red',
          rows: table,
        }),
      ],
      charts: {
        byStatus: namedChart(table, 'status'),
        byTriggerType: namedChart(table, 'trigger_type'),
        byFraudFlag: namedChart(table, 'fraud_not_fraud'),
        bySafuAction: namedChart(table, 'safu_action'),
      },
      table,
    })
  } catch (err) {
    res.status(500).json({ error: clientError(err) })
  }
})

export default router
