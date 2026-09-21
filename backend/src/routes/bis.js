import { Router } from 'express'
import { query } from '../db/pool.js'
import { clientError } from '../utils/clientError.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { getImportTable, getPrimaryTableForModule } from '../utils/schemaRegistry.js'
import { buildKpi } from '../utils/kpiChange.js'
import { pushGeoSql, rowGeoDistrict, matchesDistrictFilter, matchesDivisionFilter } from '../data/mpDivisions.js'
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

const CARD_DISTRICT_COLUMNS = ['district_name', 'district_cd', 'sub_district_name', 'subdistrict_town']

function filterCardPrintingRows(rows, q = {}) {
  if (!q || (!q.district && !q.division && !q.card_status && !q.urban_rural && !q.date_from && !q.date_to && !q.search)) {
    return rows
  }
  return rows.filter((row) => {
    const district = rowGeoDistrict(row, CARD_DISTRICT_COLUMNS)
    if (q.district && !matchesDistrictFilter(district, q.district)) return false
    if (!q.district && q.division && !matchesDivisionFilter(district, q.division)) return false
    return true
  })
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

  pushGeoSql(parts, params, q, CARD_DISTRICT_COLUMNS)

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

    const table = filterCardPrintingRows(serializeRows(rows), req.query)
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
    res.status(500).json({ error: clientError(err) })
  }
})

/** Card print batch extracts from PMJAY_dmart_mp_Schema_Reference.docx */
router.get('/card-print-data', async (req, res) => {
  try {
    const { loadTableSafe, countByField } = await import('../utils/loadTableSafe.js')
    const [aug, vvs, temp, leftover] = await Promise.all([
      loadTableSafe('dmart_mp', 'card_print_data_madhya_pradesh_01aug2025', {
        orderBy: 'COALESCE(approve_date, created_dt) DESC NULLS LAST',
        limit: 10000,
      }),
      loadTableSafe('dmart_mp', 'card_print_data_madhya_pradesh_vvs_29may2025_f', {
        orderBy: 'COALESCE(approve_date, created_dt) DESC NULLS LAST',
        limit: 10000,
      }),
      loadTableSafe('dmart_mp', 'card_print_data_temp_t_bis_ekyc_dtl_mp_20260703_with_village_na', {
        orderBy: 'COALESCE(approve_date, created_dt) DESC NULLS LAST',
        limit: 10000,
      }),
      loadTableSafe('dmart_mp', 'left_over_cards_for_print_of_mp_with_village_name_09aug2026_fin', {
        orderBy: 'COALESCE(approve_date, created_dt) DESC NULLS LAST',
        limit: 10000,
      }),
    ])

    const primary = aug.table.length ? aug : vvs.table.length ? vvs : temp
    const status = countByField(primary.table, 'card_status')
    const district = countByField(primary.table, 'dist_name')
    const urbanRural = countBy(primary.table, (d) => labelRuralUrban(d.rural_urban_flag ?? d.urban_or_rural))

    res.json({
      db: aug.db || vvs.db || temp.db || leftover.db,
      schema: primary.schema,
      columns: primary.columns,
      kpis: [
        buildKpi({ label: 'Aug 2025 Batch', value: aug.table.length, color: 'blue', rows: aug.table }),
        buildKpi({ label: 'VVS May 2025', value: vvs.table.length, color: 'indigo', rows: vvs.table }),
        buildKpi({ label: 'Temp e-KYC Jul 2026', value: temp.table.length, color: 'violet', rows: temp.table }),
        buildKpi({ label: 'Leftover Cards', value: leftover.table.length, color: 'orange', rows: leftover.table }),
      ],
      charts: {
        status: hasKnown(status) ? status : [],
        district: hasKnown(district) ? district : [],
        urbanRural: hasKnown(urbanRural) ? urbanRural : [],
      },
      augTable: aug.table,
      augColumns: aug.columns,
      augSchema: aug.schema,
      vvsTable: vvs.table,
      vvsColumns: vvs.columns,
      vvsSchema: vvs.schema,
      tempTable: temp.table,
      tempColumns: temp.columns,
      tempSchema: temp.schema,
      leftoverTable: leftover.table,
      leftoverColumns: leftover.columns,
      leftoverSchema: leftover.schema,
      table: primary.table,
    })
  } catch (err) {
    res.status(500).json({ error: clientError(err) })
  }
})

/** Already-printed card de-duplication lists */
router.get('/print-dedup', async (_req, res) => {
  try {
    const { loadTableSafe } = await import('../utils/loadTableSafe.js')
    const [batchA, batchB] = await Promise.all([
      loadTableSafe('dmart_mp', 'already_printed_card_no_290626', { orderBy: '1', limit: 50000 }),
      loadTableSafe('dmart_mp', 'already_printed_card_no_34321992_8672488_09082026', {
        orderBy: '1',
        limit: 50000,
      }),
    ])
    res.json({
      db: batchA.db || batchB.db,
      schema: batchA.schema || batchB.schema,
      kpis: [
        buildKpi({ label: 'Printed (29-Jun batch)', value: batchA.table.length, color: 'blue', rows: batchA.table }),
        buildKpi({
          label: 'Printed (09-Aug batch)',
          value: batchB.table.length,
          color: 'indigo',
          rows: batchB.table,
        }),
      ],
      charts: {},
      batchATable: batchA.table,
      batchAColumns: batchA.columns,
      batchASchema: batchA.schema,
      batchBTable: batchB.table,
      batchBColumns: batchB.columns,
      batchBSchema: batchB.schema,
      table: batchA.table,
      columns: batchA.columns,
    })
  } catch (err) {
    res.status(500).json({ error: clientError(err) })
  }
})

export default router
