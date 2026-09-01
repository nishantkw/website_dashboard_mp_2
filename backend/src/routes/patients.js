import { Router } from 'express'
import { query } from '../db/pool.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { getPrimaryTableForModule } from '../utils/schemaRegistry.js'
import { buildKpi } from '../utils/kpiChange.js'
import { districtsForDivision } from '../data/mpDivisions.js'
import {
  filterTreatmentRows,
  buildTreatmentCharts,
  buildTreatmentKpis,
  parseTreatmentDate,
} from '../utils/treatmentAggregations.js'
import { normalizeMorthRow, buildMorthCharts, buildMorthKpis } from '../utils/morthAggregations.js'

/** Patients module: t_patient_dtls, treatment_dtls, t_morth_patient_details */
const router = Router()
const primary = getPrimaryTableForModule('patients')
const SCHEMA = primary?.schema ?? 'dmart_mp'
const TABLE = primary?.table ?? 't_patient_dtls'

function buildPatientWhere(q) {
  const parts = []
  const params = []

  const pushIlike = (columns, val) => {
    const ors = columns.map((col) => {
      params.push(`%${val}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    parts.push(`(${ors.join(' OR ')})`)
  }

  if (q.district) pushIlike(['district_name', 'patient_district_name', 'hosp_district_name'], q.district)
  else if (q.division) {
    const districts = districtsForDivision(q.division)
    if (districts.length) {
      const placeholders = districts.map((d) => {
        params.push(d)
        return `$${params.length}`
      })
      parts.push(`(district_name IN (${placeholders.join(', ')}) OR patient_district_name IN (${placeholders.join(', ')}))`)
    }
  }

  if (q.patient_status) pushIlike(['status_id', 'patient_status', 'ip_op'], q.patient_status)

  if (q.date_from) {
    params.push(q.date_from)
    parts.push(`COALESCE(registration_date, admission_dt)::date >= $${params.length}::date`)
  }
  if (q.date_to) {
    params.push(q.date_to)
    parts.push(`COALESCE(registration_date, admission_dt)::date <= $${params.length}::date`)
  }

  if (q.search) {
    pushIlike(['registration_id', 'name', 'hospital_name', 'referral_id', 'program_id'], q.search)
  }

  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : ''
  return { clause, params }
}

async function loadTreatmentRows(q) {
  try {
    const { rows, _db } = await query(
      `SELECT * FROM dmart_mp.treatment_dtls ORDER BY 1 DESC LIMIT 10000`
    )
    const table = filterTreatmentRows(serializeRows(rows), q)
    const columns = await resolveColumns('dmart_mp', 'treatment_dtls', table)
    return { table, columns, db: _db }
  } catch (err) {
    console.warn(`[patients] treatment_dtls skipped: ${err.message}`)
    return { table: [], columns: [], db: null }
  }
}

async function loadMorthRows() {
  try {
    const { rows, _db } = await query(
      `SELECT * FROM dmart_mp.t_morth_patient_details
       ORDER BY COALESCE(created_dt, updated_dt) DESC NULLS LAST
       LIMIT 5000`
    )
    const table = serializeRows(rows).map(normalizeMorthRow)
    const columns = await resolveColumns('dmart_mp', 't_morth_patient_details', table)
    return { table, columns, db: _db }
  } catch (err) {
    console.warn(`[patients] t_morth_patient_details skipped: ${err.message}`)
    return { table: [], columns: [], db: null }
  }
}

router.get('/', async (req, res) => {
  try {
    const { clause, params } = buildPatientWhere(req.query)

    let table = []
    let columns = []
    let db = null
    try {
      const result = await query(
        `SELECT * FROM ${SCHEMA}.${TABLE} ${clause} ORDER BY 1 DESC LIMIT 2000`,
        params
      )
      db = result._db
      table = serializeRows(result.rows)
      columns = await resolveColumns(SCHEMA, TABLE, table)
    } catch (err) {
      console.warn(`[patients] ${SCHEMA}.${TABLE} skipped: ${err.message}`)
    }

    const treatment = await loadTreatmentRows(req.query)
    if (!db) db = treatment.db
    const morth = await loadMorthRows()
    if (!db) db = morth.db

    const patientKpi = buildKpi({ label: 'Patient Records', value: table.length, color: 'blue', rows: table })
    const treatmentDated = treatment.table.map((r) => ({
      ...r,
      date_on_which: parseTreatmentDate(r.date_on_which) || r.date_on_which,
    }))
    const treatmentKpis = buildTreatmentKpis(treatment.table).map((k) =>
      buildKpi({
        label: k.label,
        value: k.value,
        color: k.color,
        rows: treatmentDated,
        dateFields: ['date_on_which'],
      })
    )
    const morthKpis = morth.table.length ? buildMorthKpis(morth.table) : []

    res.json({
      db,
      schema: `${SCHEMA}.${TABLE}`,
      treatmentSchema: 'dmart_mp.treatment_dtls',
      morthSchema: morth.columns.length || morth.table.length ? 'dmart_mp.t_morth_patient_details' : '',
      columns,
      treatmentColumns: treatment.columns,
      morthColumns: morth.columns,
      kpis: [
        patientKpi,
        ...treatmentKpis,
        ...(morth.table.length
          ? [
              buildKpi({
                label: 'MORTH Patients',
                value: morth.table.length,
                color: 'indigo',
                rows: morth.table,
                dateFields: ['created_dt', 'updated_dt'],
              }),
            ]
          : []),
      ],
      charts: { ...buildTreatmentCharts(treatment.table), ...buildMorthCharts(morth.table) },
      table,
      treatmentTable: treatment.table,
      morthTable: morth.table,
      morthKpis,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

