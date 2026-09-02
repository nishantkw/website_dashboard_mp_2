import { Router } from 'express'
import { query } from '../db/pool.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { getPrimaryTableForModule } from '../utils/schemaRegistry.js'
import { districtsForDivision } from '../data/mpDivisions.js'
import { buildKpi } from '../utils/kpiChange.js'
import {
  filterSourceRows,
  buildSourceCharts,
  buildSourceKpis,
  hasCardNo,
} from '../utils/sourceDataAggregations.js'
import {
  filterDisabledRows,
  buildDisabledCharts,
  buildDisabledKpis,
} from '../utils/disabledAggregations.js'
import { filterBisRawRows, buildBisRawCharts, buildBisRawKpis } from '../utils/bisRawAggregations.js'
import { isRuralFlag, isUrbanFlag, rowRuralUrbanFlag, labelRuralUrban, ruralUrbanSqlMatch } from '../utils/ruralUrban.js'
import {
  labelGender,
  labelEnrlStatus,
  labelCardStatus,
  labelAadhaarStatus,
  labelRelation,
  labelSourceType,
  isActiveRecord,
  isApprovedEnrl,
  isNewOrPendingEnrl,
  isAadhaarVerified,
  hasAbha,
  labelledSqlMatch,
  ekycSqlMatch,
  enrollTrend,
} from '../utils/beneficiaryCodes.js'

const router = Router()
const mpPrimary = getPrimaryTableForModule('beneficiaries')
const SCHEMA = mpPrimary?.schema ?? 'dmart_mp'
const TABLE = mpPrimary?.table ?? 't_bis_beneficiary_dtls'

function buildBeneficiaryWhere(q) {
  const parts = []
  const params = []

  const pushIlike = (columns, val) => {
    const ors = columns.map((col) => {
      params.push(`%${val}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    parts.push(`(${ors.join(' OR ')})`)
  }

  if (q.district) pushIlike(['dist_name'], q.district)
  else if (q.division) {
    const districts = districtsForDivision(q.division)
    if (districts.length) {
      const placeholders = districts.map((d) => {
        params.push(d)
        return `$${params.length}`
      })
      parts.push(`dist_name IN (${placeholders.join(', ')})`)
    }
  }

  if (q.gender) {
    const sql = labelledSqlMatch('gender', labelGender(q.gender), 'gender')
    if (sql) parts.push(sql)
    else pushIlike(['gender'], q.gender)
  }
  if (q.enrollment_status) {
    const sql = labelledSqlMatch('enrl_status', labelEnrlStatus(q.enrollment_status), 'enrl')
    if (sql) parts.push(sql)
    else pushIlike(['enrl_status'], q.enrollment_status)
  }
  if (q.card_status) {
    const sql = labelledSqlMatch('card_status', labelCardStatus(q.card_status), 'card')
    if (sql) parts.push(sql)
    else pushIlike(['card_status'], q.card_status)
  }
  if (q.urban_rural) {
    const sql = ruralUrbanSqlMatch('rural_urban_flag', labelRuralUrban(q.urban_rural))
    if (sql) parts.push(sql)
    else pushIlike(['rural_urban_flag'], q.urban_rural)
  }
  if (q.ekyc) {
    const sql = ekycSqlMatch(q.ekyc)
    if (sql) parts.push(sql)
    else pushIlike(['json_obj_ben_ekyc_dtl'], q.ekyc)
  }

  if (q.search) {
    pushIlike(['ben_id', 'family_id', 'member_id', 'name', 'dist_name', 'card_no', 'abha_id'], q.search)
  }

  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  return { clause, params }
}

async function loadSourceRows(q) {
  try {
    const { rows, _db } = await query(
      `SELECT * FROM dmart_mp.m_source_data ORDER BY id_pk DESC LIMIT 10000`
    )
    const table = filterSourceRows(serializeRows(rows), q)
    const columns = await resolveColumns('dmart_mp', 'm_source_data', table)
    return { table, columns, db: _db }
  } catch (err) {
    console.warn(`[beneficiaries] m_source_data skipped: ${err.message}`)
    return { table: [], columns: [], db: null }
  }
}

async function loadDisabledRows(q) {
  try {
    const { rows, _db } = await query(
      `SELECT * FROM dmart_mp.t_bis_beneficiary_disabled ORDER BY COALESCE(disabled_date, created_dt, updated_dt) DESC NULLS LAST LIMIT 10000`
    )
    const table = filterDisabledRows(serializeRows(rows), q)
    const columns = await resolveColumns('dmart_mp', 't_bis_beneficiary_disabled', table)
    return { table, columns, db: _db }
  } catch (err) {
    console.warn(`[beneficiaries] t_bis_beneficiary_disabled skipped: ${err.message}`)
    return { table: [], columns: [], db: null }
  }
}

async function loadBisRawRows(q) {
  try {
    const { rows, _db } = await query(
      `SELECT * FROM bis_raw.t_bis_beneficiary_dtls ORDER BY id_pk DESC LIMIT 10000`
    )
    const table = filterBisRawRows(serializeRows(rows), q)
    const columns = await resolveColumns('bis_raw', 't_bis_beneficiary_dtls', table)
    return { table, columns, db: _db }
  } catch (err) {
    console.warn(`[beneficiaries] bis_raw.t_bis_beneficiary_dtls skipped: ${err.message}`)
    return { table: [], columns: [], db: null }
  }
}

async function loadHistRows(q) {
  try {
    const { rows, _db } = await query(
      `SELECT * FROM dmart_mp.t_bis_beneficiary_dtl_hist ORDER BY COALESCE(updated_dt, created_dt, enrol_date) DESC NULLS LAST LIMIT 10000`
    )
    const table = filterBisRawRows(serializeRows(rows), q)
    const columns = await resolveColumns('dmart_mp', 't_bis_beneficiary_dtl_hist', table)
    return { table, columns, db: _db }
  } catch (err) {
    console.warn(`[beneficiaries] t_bis_beneficiary_dtl_hist skipped: ${err.message}`)
    return { table: [], columns: [], db: null }
  }
}

function countByLabel(table, labelFn) {
  const acc = {}
  for (const d of table) {
    const name = labelFn(d)
    acc[name] = (acc[name] || 0) + 1
  }
  return Object.entries(acc).map(([name, value]) => ({ name, value }))
}

function hasKnown(entries) {
  return entries.some((e) => e.name !== 'Unknown')
}

function summarizeBeneficiaries(table) {
  const active = table.filter(isActiveRecord).length
  const approved = table.filter(isApprovedEnrl).length
  const pending = table.filter(isNewOrPendingEnrl).length
  const rural = table.filter((d) => isRuralFlag(rowRuralUrbanFlag(d))).length
  const urban = table.filter((d) => isUrbanFlag(rowRuralUrbanFlag(d))).length
  const aadhaar = table.filter(isAadhaarVerified).length
  const abha = table.filter(hasAbha).length
  const byDistrict = {}
  for (const d of table) {
    const dist = String(d.dist_name || d.district || d.dist_cd || 'Unknown').trim() || 'Unknown'
    if (!byDistrict[dist]) byDistrict[dist] = { enrolled: 0, active: 0 }
    byDistrict[dist].enrolled += 1
    if (isActiveRecord(d)) byDistrict[dist].active += 1
  }
  const districtChart = Object.entries(byDistrict)
    .map(([name, counts]) => ({
      name,
      enrolled: counts.enrolled,
      active: counts.active,
    }))
    .sort((a, b) => b.enrolled - a.enrolled)

  const gender = countByLabel(table, (d) => labelGender(d.gender))
  const enrollStatus = countByLabel(table, (d) => labelEnrlStatus(d.enrl_status))
  const cardStatus = countByLabel(table, (d) => labelCardStatus(d.card_status))
  const aadhaarStatus = countByLabel(table, (d) => labelAadhaarStatus(d.aadhar_status ?? d.aadhaar_status))
  const scheme = countByLabel(table, (d) => String(d.scheme_code || '').trim() || 'Unknown')
  const sourceType = countByLabel(table, (d) => labelSourceType(d.source_type || d.src_flag))
  const relation = countByLabel(table, (d) => labelRelation(d.relation))
  const authMode = countByLabel(table, (d) => String(d.auth_mode || '').trim() || 'Unknown')

  return {
    active,
    approved,
    pending,
    rural,
    urban,
    aadhaar,
    abha,
    districtChart,
    gender: hasKnown(gender) ? gender : [],
    enrollStatus: hasKnown(enrollStatus) ? enrollStatus : [],
    cardStatus: hasKnown(cardStatus) ? cardStatus : [],
    aadhaarStatus: hasKnown(aadhaarStatus) ? aadhaarStatus : [],
    scheme: hasKnown(scheme) ? scheme : [],
    sourceType: hasKnown(sourceType) ? sourceType : [],
    relation: hasKnown(relation) ? relation : [],
    authMode: hasKnown(authMode) ? authMode : [],
    enrollTrend: enrollTrend(table),
  }
}

router.get('/', async (req, res) => {
  try {
    const { clause, params } = buildBeneficiaryWhere(req.query)

    let martRows = []
    let db = null
    try {
      const result = await query(
        `SELECT * FROM ${SCHEMA}.${TABLE} ${clause} ORDER BY 1 DESC LIMIT 2000`,
        params
      )
      martRows = serializeRows(result.rows)
      db = result._db
    } catch (err) {
      console.warn(`[beneficiaries] ${SCHEMA}.${TABLE} skipped: ${err.message}`)
    }

    const bisRaw = await loadBisRawRows(req.query)
    if (!db) db = bisRaw.db
    const useBisAsPrimary = martRows.length === 0 && bisRaw.table.length > 0
    const table = useBisAsPrimary ? bisRaw.table : martRows
    const columns = useBisAsPrimary
      ? bisRaw.columns
      : await resolveColumns(SCHEMA, TABLE, table)
    const schema = useBisAsPrimary ? 'bis_raw.t_bis_beneficiary_dtls' : `${SCHEMA}.${TABLE}`
    const showBisSection = martRows.length > 0 && bisRaw.table.length > 0
    const summary = summarizeBeneficiaries(table)
    const {
      active,
      approved,
      pending,
      rural,
      urban,
      aadhaar,
      abha,
      districtChart,
      gender,
      enrollStatus,
      cardStatus,
      aadhaarStatus,
      scheme,
      sourceType,
      relation,
      authMode,
      enrollTrend: enrollTrendChart,
    } = summary

    const source = await loadSourceRows(req.query)
    const sourceKpis = buildSourceKpis(source.table).map((k) =>
      buildKpi({
        label: k.label,
        value: k.value,
        color: k.color,
        rows: source.table,
        dateFields: ['created_dt', 'updated_dt'],
        predicate:
          k.label === 'Source Cards'
            ? hasCardNo
            : k.label === 'Source Families'
              ? (d) => Boolean(String(d.src_family_id || d.bis_family_id || '').trim())
              : undefined,
      })
    )
    const disabled = await loadDisabledRows(req.query)
    const disabledKpis = buildDisabledKpis(disabled.table).map((k) =>
      buildKpi({
        label: k.label,
        value: k.value,
        color: k.color,
        rows: disabled.table,
        dateFields: ['disabled_date', 'created_dt', 'updated_dt'],
        predicate:
          k.label === 'Disabled Cards'
            ? (d) => Boolean(String(d.card_no ?? '').trim())
            : k.label === 'Disabled Families'
              ? (d) => Boolean(String(d.family_id ?? '').trim())
              : undefined,
      })
    )
    const hist = await loadHistRows(req.query)
    if (!db) db = hist.db
    const bisKpis = buildBisRawKpis(bisRaw.table).map((k) =>
      buildKpi({
        label: k.label,
        value: k.value,
        color: k.color,
        rows: bisRaw.table,
        dateFields: ['created_dt', 'updated_dt', 'enrol_date'],
        predicate:
          k.label === 'BIS Active'
            ? isActiveRecord
            : k.label === 'BIS Families'
              ? (d) => Boolean(String(d.family_id ?? '').trim())
              : undefined,
      })
    )

    res.json({
      db: db || source.db || disabled.db || hist.db,
      schema,
      sourceSchema: source.table.length ? 'dmart_mp.m_source_data' : '',
      disabledSchema: disabled.table.length ? 'dmart_mp.t_bis_beneficiary_disabled' : '',
      histSchema: hist.table.length ? 'dmart_mp.t_bis_beneficiary_dtl_hist' : '',
      bisSchema: bisRaw.table.length ? 'bis_raw.t_bis_beneficiary_dtls' : '',
      columns,
      sourceColumns: source.columns,
      disabledColumns: disabled.columns,
      histColumns: hist.columns,
      bisColumns: bisRaw.columns,
      kpis: [
        buildKpi({ label: 'Total Beneficiaries', value: table.length, color: 'blue', rows: table }),
        buildKpi({
          label: 'Active',
          value: active,
          color: 'green',
          rows: table,
          predicate: isActiveRecord,
        }),
        buildKpi({
          label: 'Approved',
          value: approved,
          color: 'emerald',
          rows: table,
          predicate: isApprovedEnrl,
        }),
        buildKpi({
          label: 'New / Pending',
          value: pending,
          color: 'orange',
          rows: table,
          predicate: isNewOrPendingEnrl,
        }),
        buildKpi({
          label: 'Aadhaar Verified',
          value: aadhaar,
          color: 'violet',
          rows: table,
          predicate: isAadhaarVerified,
        }),
        buildKpi({
          label: 'With ABHA',
          value: abha,
          color: 'indigo',
          rows: table,
          predicate: hasAbha,
        }),
        buildKpi({
          label: 'Rural',
          value: rural,
          color: 'cyan',
          rows: table,
          predicate: (d) => isRuralFlag(rowRuralUrbanFlag(d)),
        }),
        buildKpi({
          label: 'Urban',
          value: urban,
          color: 'purple',
          rows: table,
          predicate: (d) => isUrbanFlag(rowRuralUrbanFlag(d)),
        }),
        ...(source.table.length ? sourceKpis : []),
      ],
      charts: {
        gender,
        urbanRural: [
          { name: 'Rural', value: rural },
          { name: 'Urban', value: urban },
        ],
        district: districtChart,
        enrollStatus,
        cardStatus,
        aadhaarStatus,
        scheme,
        benSourceType: sourceType,
        benRelation: relation,
        authMode,
        enrollTrend: enrollTrendChart,
        ...buildSourceCharts(source.table),
        ...buildDisabledCharts(disabled.table),
        ...(showBisSection ? buildBisRawCharts(bisRaw.table) : {}),
      },
      table,
      sourceTable: source.table,
      disabledTable: disabled.table,
      disabledKpis,
      histTable: hist.table,
      histKpis: hist.table.length
        ? [
            buildKpi({ label: 'History Records', value: hist.table.length, color: 'indigo', rows: hist.table }),
          ]
        : [],
      bisTable: showBisSection ? bisRaw.table : [],
      bisKpis: showBisSection ? bisKpis : [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
