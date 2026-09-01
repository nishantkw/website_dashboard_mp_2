import { Router } from 'express'
import { query } from '../db/pool.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns, preferPatientGeoOrder } from '../utils/schemaColumns.js'
import { buildClaimsDashboard, buildMasterReport } from '../utils/claimAggregations.js'
import { loadClaimRows, getClaimSourceTables, SCHEMA, TABLE } from '../utils/claimSources.js'
import { monthOverMonthChange, buildKpi } from '../utils/kpiChange.js'
import {
  filterPaymentRows,
  buildPaymentCharts,
  buildPaymentKpis,
  isPaidPayment,
  isRejectedPayment,
} from '../utils/paymentAggregations.js'

const router = Router()

async function loadRecoveryRows(req) {
  const q = req.query || {}
  let db = null
  let table = []
  try {
    const result = await query(
      `SELECT * FROM dmart_mp.tms_recovery ORDER BY created_dt DESC NULLS LAST LIMIT 10000`
    )
    db = result._db
    table = serializeRows(result.rows)
  } catch (err) {
    console.warn(`[claims] tms_recovery skipped: ${err.message}`)
    return { rows: [], db }
  }

  const search = String(q.search || '').trim().toLowerCase()
  const from = String(q.date_from || '').slice(0, 10)
  const to = String(q.date_to || '').slice(0, 10)

  const filtered = table.filter((row) => {
    if (from || to) {
      const d = String(row.created_dt || row.recovery_date || '').slice(0, 10)
      if (from && d && d < from) return false
      if (to && d && d > to) return false
    }
    if (search) {
      const hay = Object.values(row).join(' ').toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })

  return {
    rows: filtered.map((row, i) => ({ sr_no: i + 1, ...row })),
    db,
  }
}

async function loadPaymentRows(req) {
  const q = req.query || {}
  try {
    const result = await query(
      `SELECT * FROM dmart_mp.payment_dtls ORDER BY COALESCE(transaction_dt, payment_paid_dt, payment_reject_dt) DESC NULLS LAST LIMIT 10000`
    )
    const table = filterPaymentRows(serializeRows(result.rows), q)
    const columns = await resolveColumns('dmart_mp', 'payment_dtls', table)
    return { table, columns, db: result._db }
  } catch (err) {
    console.warn(`[claims] payment_dtls skipped: ${err.message}`)
    return { table: [], columns: [], db: null }
  }
}

router.get('/', async (req, res) => {
  try {
    const { rows, db } = await loadClaimRows(req)
    const schemaCols = preferPatientGeoOrder(await resolveColumns(SCHEMA, TABLE, rows))
    const columns = schemaCols.includes('division')
      ? schemaCols
      : (() => {
          const next = [...schemaCols]
          const at = next.indexOf('patient_district_name')
          next.splice(at >= 0 ? at : 0, 0, 'division')
          return next
        })()
    const dashboard = buildClaimsDashboard(rows)
    const payment = await loadPaymentRows(req)
    const paymentKpis = buildPaymentKpis(payment.table).map((k) =>
      buildKpi({
        label: k.label,
        value: k.value,
        color: k.color,
        rows: payment.table,
        dateFields: ['transaction_dt', 'payment_paid_dt', 'payment_reject_dt'],
        predicate:
          k.label === 'Payments Paid'
            ? isPaidPayment
            : k.label === 'Payments Rejected'
              ? isRejectedPayment
              : undefined,
      })
    )

    res.json({
      db: db || payment.db,
      schema: `${SCHEMA}.${TABLE}`,
      paymentSchema: payment.table.length ? 'dmart_mp.payment_dtls' : '',
      columns,
      paymentColumns: payment.columns,
      kpis: dashboard.kpis.map((k) => {
        const bucketRows = rows.filter((r) => (r._kpi_bucket || '') === k.key)
        const mom = monthOverMonthChange(bucketRows.length ? bucketRows : rows)
        return {
          key: k.key,
          label: k.label,
          value: String(k.count),
          subValue: `₹${k.initiatedCr} Cr initiated`,
          change: mom.change,
          changeLabel: mom.changeLabel,
          color: 'blue',
          meta: k,
        }
      }),
      paymentKpis,
      masterKpis: dashboard.kpis,
      stateHospitalSummary: dashboard.stateHospitalSummary,
      charts: { ...dashboard.charts, ...buildPaymentCharts(payment.table) },
      table: rows.slice(0, req.query.date_from || req.query.date_to ? 10000 : 2000),
      paymentTable: payment.table,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/filter-options', async (_req, res) => {
  const tables = getClaimSourceTables({})

  async function distinctValues(sqlExpr) {
    const names = new Set()
    for (const t of tables) {
      try {
        const { rows } = await query(
          `SELECT DISTINCT TRIM(${sqlExpr}) AS name
           FROM ${t.schema}.${t.table}
           WHERE ${sqlExpr} IS NOT NULL AND TRIM(${sqlExpr}) <> ''
           ORDER BY 1
           LIMIT 2000`
        )
        for (const row of rows) {
          const name = String(row.name || '').trim()
          if (name) names.add(name)
        }
      } catch {
        // column may be missing on a secondary table
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b))
  }

  try {
    const hospitals = await distinctValues('hospital_name::text')
    const specialtyCodes = await distinctValues('speciality_code::text')
    let specialties = specialtyCodes
    if (!specialties.length) {
      specialties = await distinctValues(
        "COALESCE(NULLIF(TRIM(category_details::text), ''), NULLIF(TRIM(speciality_code::text), ''))"
      )
    }
    if (!specialties.length) specialties = await distinctValues('category_details::text')
    const patientStates = await distinctValues('patient_state_name::text')
    const patientDistricts = await distinctValues('patient_district_name::text')

    const geoSeen = new Set()
    const patientGeo = []
    for (const t of tables) {
      try {
        const { rows } = await query(
          `SELECT DISTINCT TRIM(patient_state_name::text) AS state, TRIM(patient_district_name::text) AS district
           FROM ${t.schema}.${t.table}
           WHERE patient_state_name IS NOT NULL AND TRIM(patient_state_name::text) <> ''
             AND patient_district_name IS NOT NULL AND TRIM(patient_district_name::text) <> ''
           ORDER BY 1, 2
           LIMIT 5000`
        )
        for (const row of rows) {
          const state = String(row.state || '').trim()
          const district = String(row.district || '').trim()
          if (!state || !district) continue
          const key = `${state}|${district}`
          if (geoSeen.has(key)) continue
          geoSeen.add(key)
          patientGeo.push({ state, district })
        }
      } catch {
        // column may be missing
      }
    }

    res.json({ hospitals, specialties, patientStates, patientDistricts, patientGeo })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const VALID_REPORT_IDS = new Set([
  'state-type-wise',
  'division-wise',
  'district-wise',
  'hospital-wise',
  'specialty-wise',
  'state-hospital-type',
  'district-hospital-type',
  'hospital-specialty',
  'full-detail',
  'tms-recovery',
  'payment-dtls',
])

router.get('/reports/:reportId', async (req, res) => {
  try {
    if (!VALID_REPORT_IDS.has(req.params.reportId)) {
      return res.status(404).json({ error: 'Unknown master report format', validIds: [...VALID_REPORT_IDS] })
    }
    if (req.params.reportId === 'tms-recovery') {
      const { rows, db } = await loadRecoveryRows(req)
      return res.json({
        db,
        schema: 'dmart_mp.tms_recovery',
        reportId: req.params.reportId,
        rows,
        total: rows.length,
      })
    }
    if (req.params.reportId === 'payment-dtls') {
      const { table, db } = await loadPaymentRows(req)
      const rows = table.map((row, i) => ({ sr_no: i + 1, ...row }))
      return res.json({
        db,
        schema: 'dmart_mp.payment_dtls',
        reportId: req.params.reportId,
        rows,
        total: rows.length,
      })
    }
    const { rows, db } = await loadClaimRows(req)
    const reportRows = buildMasterReport(req.params.reportId, rows)
    res.json({
      db,
      schema: `${SCHEMA}.${TABLE}`,
      reportId: req.params.reportId,
      rows: reportRows,
      total: reportRows.length,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
