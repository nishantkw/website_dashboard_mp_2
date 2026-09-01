import { Router } from 'express'
import { query } from '../db/pool.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { getImportTable, getPrimaryTableForModule } from '../utils/schemaRegistry.js'
import { buildKpi } from '../utils/kpiChange.js'
import { districtsForDivision } from '../data/mpDivisions.js'
import { labelRuralUrban, isRuralFlag, isUrbanFlag, ruralUrbanSqlMatch } from '../utils/ruralUrban.js'
import {
  labelCardStatus,
  labelGender,
  labelCardSourceType,
  labelledSqlMatch,
  hasFilledDate,
} from '../utils/beneficiaryCodes.js'

const router = Router()
const cardTable = getImportTable('dmart_mp.t_card_printing_status')
const CARD_SCHEMA = cardTable?.schema ?? 'dmart_mp'
const CARD_TABLE = cardTable?.table ?? 't_card_printing_status'
const bisPrimary = getPrimaryTableForModule('bis')
const BIS_SCHEMA = bisPrimary?.schema ?? 'bis_raw'
const BIS_TABLE = bisPrimary?.table ?? 't_bis_beneficiary_dtls'

function countBy(rows, keyFn) {
  const acc = {}
  for (const row of rows) {
    const key = keyFn(row)
    acc[key] = (acc[key] || 0) + 1
  }
  return Object.entries(acc)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function hasKnown(entries) {
  return entries.some((e) => e.name !== 'Unknown')
}

function buildCardPrintingWhere(q) {
  const parts = []
  const params = []

  const pushIlike = (columns, val) => {
    const ors = columns.map((col) => {
      params.push(`%${val}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    parts.push(`(${ors.join(' OR ')})`)
  }

  if (q.district) pushIlike(['district_name'], q.district)
  else if (q.division) {
    const districts = districtsForDivision(q.division)
    if (districts.length) {
      const placeholders = districts.map((d) => {
        params.push(d)
        return `$${params.length}`
      })
      parts.push(`district_name IN (${placeholders.join(', ')})`)
    }
  }

  if (q.card_status) {
    const sql = labelledSqlMatch('card_print_status', labelCardStatus(q.card_status), 'card')
    if (sql) parts.push(sql)
    else pushIlike(['card_print_status'], q.card_status)
  }
  if (q.urban_rural) {
    const sql = ruralUrbanSqlMatch('urban_or_rural', labelRuralUrban(q.urban_rural))
    if (sql) parts.push(sql)
    else pushIlike(['urban_or_rural'], q.urban_rural)
  }

  if (q.date_from) {
    params.push(q.date_from)
    parts.push(`COALESCE(enroll_date, approve_date, created_dt)::date >= $${params.length}::date`)
  }
  if (q.date_to) {
    params.push(q.date_to)
    parts.push(`COALESCE(enroll_date, approve_date, created_dt)::date <= $${params.length}::date`)
  }

  if (q.search) {
    pushIlike(
      ['card_no', 'ben_id', 'family_id', 'card_name', 'district_name', 'card_print_status', 'source_type'],
      q.search
    )
  }

  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  return { clause, params }
}

router.get('/card-printing', async (req, res) => {
  try {
    const { clause, params } = buildCardPrintingWhere(req.query)

    const { rows, _db } = await query(
      `SELECT * FROM ${CARD_SCHEMA}.${CARD_TABLE} ${clause} ORDER BY 1 DESC LIMIT 2000`,
      params
    )

    let bisRows = []
    try {
      const bis = await query(`SELECT * FROM ${BIS_SCHEMA}.${BIS_TABLE} ORDER BY 1 DESC LIMIT 500`)
      bisRows = bis.rows
    } catch {
      bisRows = []
    }

    const table = serializeRows(rows)
    const bisTable = serializeRows(bisRows)
    const columns = await resolveColumns(CARD_SCHEMA, CARD_TABLE, table)

    const statusOf = (d) => labelCardStatus(d.card_print_status)
    const approved = table.filter((d) => statusOf(d) === 'Approved').length
    const distributed = table.filter(
      (d) => statusOf(d) === 'Distributed' || hasFilledDate(d, 'card_distribute_date')
    ).length
    const downloaded = table.filter(
      (d) => statusOf(d) === 'Downloaded' || statusOf(d) === 'Marked for Download'
    ).length
    const printed = table.filter((d) => statusOf(d) === 'Printed' || hasFilledDate(d, 'card_print_date')).length
    const withAbha = table.filter((d) => Boolean(String(d.abha_no ?? d.abha_id ?? '').trim())).length
    const rural = table.filter((d) => isRuralFlag(d.urban_or_rural)).length
    const urban = table.filter((d) => isUrbanFlag(d.urban_or_rural)).length
    const families = new Set(table.map((d) => String(d.family_id ?? '').trim()).filter(Boolean)).size

    const status = countBy(table, (d) => statusOf(d))
    const district = countBy(table, (d) => String(d.district_name || d.district || 'Unknown').trim() || 'Unknown')
    const urbanRural = countBy(table, (d) => labelRuralUrban(d.urban_or_rural))
    const gender = countBy(table, (d) => labelGender(d.card_gender || d.gender))
    const sourceType = countBy(table, (d) => labelCardSourceType(d.source_type))

    res.json({
      db: _db,
      schema: `${CARD_SCHEMA}.${CARD_TABLE}`,
      bisSchema: `${BIS_SCHEMA}.${BIS_TABLE}`,
      columns,
      kpis: [
        buildKpi({ label: 'Card Records', value: table.length, color: 'blue', rows: table }),
        buildKpi({
          label: 'Families',
          value: families,
          color: 'indigo',
          rows: table,
          predicate: (d) => Boolean(String(d.family_id ?? '').trim()),
        }),
        buildKpi({
          label: 'Approved',
          value: approved,
          color: 'green',
          rows: table,
          predicate: (d) => statusOf(d) === 'Approved',
        }),
        buildKpi({
          label: 'Downloaded',
          value: downloaded,
          color: 'violet',
          rows: table,
          predicate: (d) => statusOf(d) === 'Downloaded' || statusOf(d) === 'Marked for Download',
        }),
        buildKpi({
          label: 'Distributed',
          value: distributed,
          color: 'emerald',
          rows: table,
          predicate: (d) => statusOf(d) === 'Distributed' || hasFilledDate(d, 'card_distribute_date'),
        }),
        buildKpi({
          label: 'Printed',
          value: printed,
          color: 'orange',
          rows: table,
          predicate: (d) => statusOf(d) === 'Printed' || hasFilledDate(d, 'card_print_date'),
        }),
        buildKpi({
          label: 'With ABHA',
          value: withAbha,
          color: 'cyan',
          rows: table,
          predicate: (d) => Boolean(String(d.abha_no ?? d.abha_id ?? '').trim()),
        }),
        buildKpi({
          label: 'Rural',
          value: rural,
          color: 'cyan',
          rows: table,
          predicate: (d) => isRuralFlag(d.urban_or_rural),
        }),
        buildKpi({
          label: 'Urban',
          value: urban,
          color: 'purple',
          rows: table,
          predicate: (d) => isUrbanFlag(d.urban_or_rural),
        }),
      ],
      charts: {
        status: hasKnown(status) ? status : [],
        district: hasKnown(district) ? district : [],
        urbanRural: hasKnown(urbanRural) ? urbanRural : [],
        gender: hasKnown(gender) ? gender : [],
        sourceType: hasKnown(sourceType) ? sourceType : [],
      },
      table,
      bisTable,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
