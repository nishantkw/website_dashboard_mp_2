import { Router } from 'express'
import { query } from '../db/pool.js'
import { getPrimaryTableForModule } from '../utils/schemaRegistry.js'
import { changeFromCounts, isSafeIdent, monthOverMonthChange } from '../utils/kpiChange.js'
import { filterHospitalRows } from '../utils/hospitalFilters.js'
import { loadClaimRows } from '../utils/claimSources.js'
import { initiatedAmount, toCrores } from '../utils/claimStatusMapping.js'
import {
  tableColumnSet,
  hospitalIdentitySql,
  countUniqueHospitals,
  loadUniqueHospitalRows,
  parseHospitalPaging,
  stripHospitalPaging,
} from '../utils/hospitalIdentity.js'

const router = Router()

/** Overview KPIs: unique hospital count, plus module row counts. */
const OVERVIEW_MODULES = ['claims', 'beneficiaries', 'hospitals', 'fraud', 'patients', 'lms', 'workflow', 'bis']

const KPI_META = [
  { mod: 'claims', label: 'Claims', color: 'blue' },
  { mod: 'beneficiaries', label: 'Beneficiaries', color: 'green' },
  { mod: 'hospitals', label: 'Hospitals', color: 'emerald' },
  { mod: 'fraud', label: 'Fraud Cases', color: 'orange' },
  { mod: 'patients', label: 'Patients', color: 'cyan' },
  { mod: 'lms', label: 'LMS Users', color: 'purple' },
  { mod: 'workflow', label: 'Workflow Users', color: 'indigo' },
  { mod: 'bis', label: 'Card Printing', color: 'violet' },
]

async function countTable(schema, table, { uniqueHospital = false, queryParams = {} } = {}) {
  if (uniqueHospital) return countUniqueHospitals(queryParams)
  const res = await query(`SELECT COUNT(*)::int AS c FROM ${schema}.${table}`)
  return res.rows[0].c
}

async function findDateColumn(schema, table) {
  const res = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
       AND data_type IN ('timestamp without time zone', 'timestamp with time zone', 'date')
     ORDER BY
       CASE
         WHEN column_name ILIKE '%crt%' OR column_name ILIKE 'created%' THEN 0
         WHEN column_name ILIKE '%date%' OR column_name ILIKE '%_at' OR column_name ILIKE '%_dt' THEN 1
         ELSE 2
       END
     LIMIT 1`,
    [schema, table]
  )
  const name = res.rows[0]?.column_name
  return isSafeIdent(name) ? name : null
}

async function monthCountsForTable(schema, table, { uniqueHospital = false } = {}) {
  const col = await findDateColumn(schema, table)
  if (!col) return { currentCount: 0, previousCount: 0 }

  let countExpr = 'COUNT(*)'
  if (uniqueHospital) {
    const cols = await tableColumnSet(schema, table)
    const keySql = hospitalIdentitySql(cols)
    if (keySql) countExpr = `COUNT(DISTINCT ${keySql})`
  }

  const res = await query(
    `SELECT
       ${countExpr} FILTER (
         WHERE ${col} >= date_trunc('month', CURRENT_DATE)
           AND ${col} < date_trunc('month', CURRENT_DATE) + interval '1 month'
       )::int AS cur,
       ${countExpr} FILTER (
         WHERE ${col} >= date_trunc('month', CURRENT_DATE) - interval '1 month'
           AND ${col} < date_trunc('month', CURRENT_DATE)
       )::int AS prev
     FROM ${schema}.${table}`
  )
  return {
    currentCount: res.rows[0]?.cur ?? 0,
    previousCount: res.rows[0]?.prev ?? 0,
  }
}

function hospitalTypeFromRows(rows) {
  const counts = new Map()
  for (const row of rows) {
    const name = String(row.hospital_type || 'Unknown').trim() || 'Unknown'
    counts.set(name, (counts.get(name) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function namedCounts(rows, nameFn) {
  const map = new Map()
  for (const row of rows) {
    const name = String(nameFn(row) || 'Unknown').trim() || 'Unknown'
    map.set(name, (map.get(name) || 0) + 1)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function claimsTrendFromRows(rows) {
  const byMonth = new Map()
  for (const row of rows) {
    const raw = row.claim_init_date || row.preauth_init_date || row.admission_dt
    if (!raw) continue
    const d = raw instanceof Date ? raw : new Date(raw)
    if (Number.isNaN(d.getTime())) continue
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const name = d.toLocaleString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    const cur = byMonth.get(key) || { name, claims: 0, amount: 0 }
    cur.claims += 1
    cur.amount += toCrores(initiatedAmount(row))
    byMonth.set(key, cur)
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([, m]) => ({ ...m, amount: Math.round(m.amount * 100) / 100 }))
}

router.get('/', async (req, res) => {
  try {
    const q = req.query || {}
    const schemas = {}
    const counts = {}
    const momByMod = {}

    for (const mod of OVERVIEW_MODULES) {
      const primary = getPrimaryTableForModule(mod)
      if (!primary) continue
      const id = `${primary.schema}.${primary.table}`
      schemas[mod] = id
      try {
        if (mod === 'claims') continue
        counts[mod] = await countTable(primary.schema, primary.table, {
          uniqueHospital: mod === 'hospitals',
          queryParams: mod === 'hospitals' ? q : {},
        })
        momByMod[mod] = await monthCountsForTable(primary.schema, primary.table, {
          uniqueHospital: mod === 'hospitals',
        })
      } catch {
        counts[mod] = 0
        momByMod[mod] = { currentCount: 0, previousCount: 0 }
      }
    }

    let claimRows = []
    let claimDb = null
    let claimSources = []
    try {
      const loaded = await loadClaimRows(req)
      claimRows = loaded.rows
      claimDb = loaded.db
      claimSources = loaded.sources
    } catch (err) {
      console.warn(`[overview] claims load skipped: ${err.message}`)
    }
    counts.claims = claimRows.length
    momByMod.claims = monthOverMonthChange(claimRows)
    if (claimSources.length) schemas.claims = claimSources.join(', ')

    const statusDist = { rows: namedCounts(claimRows, (r) => r.case_status) }
    const caseTypeDist = { rows: namedCounts(claimRows, (r) => r.case_type) }
    const districtDist = {
      rows: namedCounts(claimRows, (r) => r.hosp_district_name || r._patient_district).slice(0, 10),
    }
    const claimsTrend = { rows: claimsTrendFromRows(claimRows) }

    const hospitalsPrimary = getPrimaryTableForModule('hospitals')
    let hospitalTypeRows
    if (q.state_type || q.division || q.district) {
      const loaded = await loadUniqueHospitalRows()
      const filtered = filterHospitalRows(loaded.table, q)
      hospitalTypeRows = hospitalTypeFromRows(filtered)
      counts.hospitals = filtered.length
    } else {
      const hospitalCols = await tableColumnSet(hospitalsPrimary.schema, hospitalsPrimary.table)
      const hospitalKeySql = hospitalIdentitySql(hospitalCols)
      const hospitalDateCol = hospitalCols.has('hosp_empaneled_date')
        ? 'hosp_empaneled_date'
        : hospitalCols.has('empaneled_date')
          ? 'empaneled_date'
          : null
      const hospitalOrderExtra = hospitalDateCol ? `, ${hospitalDateCol} DESC NULLS LAST` : ''
      const hospitalTypeDist = hospitalKeySql
        ? await query(
            `SELECT COALESCE(hospital_type, 'Unknown') AS name, COUNT(*)::int AS value
             FROM (
               SELECT DISTINCT ON (${hospitalKeySql}) hospital_type
               FROM ${hospitalsPrimary.schema}.${hospitalsPrimary.table}
               WHERE ${hospitalKeySql} IS NOT NULL
               ORDER BY ${hospitalKeySql}${hospitalOrderExtra}
             ) unique_hosp
             GROUP BY 1 ORDER BY 2 DESC`
          )
        : await query(
            `SELECT COALESCE(hospital_type, 'Unknown') AS name, COUNT(*)::int AS value
             FROM ${hospitalsPrimary.schema}.${hospitalsPrimary.table}
             GROUP BY 1 ORDER BY 2 DESC`
          )
      hospitalTypeRows = hospitalTypeDist.rows
    }

    const firstQuery = claimDb ? { _db: claimDb } : await query('SELECT 1')

    res.json({
      db: firstQuery._db,
      schemas,
      kpis: KPI_META.map(({ mod, label, color }) => {
        const mom = changeFromCounts(
          momByMod[mod]?.currentCount ?? 0,
          momByMod[mod]?.previousCount ?? 0
        )
        return {
          label,
          value: String(counts[mod] ?? 0),
          change: mom.change,
          changeLabel: mom.changeLabel,
          color,
        }
      }),
      charts: {
        claimStatus: statusDist.rows,
        caseType: caseTypeDist.rows,
        district: districtDist.rows,
        claimsTrend: claimsTrend.rows,
        hospitalType: hospitalTypeRows,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/hospitals', async (req, res) => {
  try {
    const result = await loadUniqueHospitalRows()
    const table = filterHospitalRows(result.table, stripHospitalPaging(req.query || {}))
    const { limit, offset } = parseHospitalPaging(req.query || {})
    res.json({
      db: result.db,
      schema: result.schema,
      columns: result.columns,
      table: table.slice(offset, offset + limit),
      total: table.length,
      tableTotal: table.length,
      limit,
      offset,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
