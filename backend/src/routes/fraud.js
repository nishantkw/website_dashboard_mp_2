import { Router } from 'express'
import { query } from '../db/pool.js'
import { buildFilterClause } from '../utils/filters.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import {
  FRAUD_CASE_SCHEMA,
  FRAUD_CASE_TABLE,
  FRAUD_TRIGGER_SCHEMA,
  FRAUD_TRIGGER_TABLE,
  HOSPITAL_SCHEMA,
  HOSPITAL_TABLE,
  WORKFLOW_USERS_SCHEMA,
  WORKFLOW_USERS_TABLE,
  WORKFLOW_AUDIT_SCHEMA,
  WORKFLOW_AUDIT_TABLE,
  buildSafuKpis,
  buildSafuCharts,
  statsForRows,
} from '../utils/safuAggregations.js'
import { buildHospitalWhere } from '../utils/hospitalFilters.js'
import { normalizeHospitalRow, loadDeempanelDateMap } from '../utils/hospitalRows.js'

const router = Router()
const VALID_VIEWS = ['overall', 'doctor-wise', 'sha-afo-wise', 'trigger-analytics']

function appendDateRange(clause, params, parts) {
  if (!parts.length) return clause
  if (clause) return `${clause} AND ${parts.join(' AND ')}`
  return `WHERE ${parts.join(' AND ')}`
}

async function loadTable(schema, table, orderBy = '1 DESC', limit = 5000, whereClause = '', params = []) {
  try {
    const res = await query(`SELECT * FROM ${schema}.${table} ${whereClause} ORDER BY ${orderBy} LIMIT ${limit}`, params)
    return { rows: serializeRows(res.rows), db: res._db }
  } catch {
    return { rows: [], db: null }
  }
}

router.get('/', async (req, res) => {
  try {
    const view = VALID_VIEWS.includes(String(req.query.view || '')) ? String(req.query.view) : 'overall'

    const { clause, params } = buildFilterClause(req.query, {
      division: ['division_name'],
      district: ['district_name'],
      fraud_type: ['fraud_type'],
      investigation_status: ['investigation_status'],
      hospital_type: ['hospital_type'],
      application_type: ['application_type'],
      entity_type: ['entity_type'],
      investigator: ['investigator'],
      trigger_type: ['trigger_type'],
      trigger_code: ['trigger_code'],
      searchCols: [
        'reference_number',
        'hospital_name',
        'fraud_type',
        'investigator',
        'entity_id',
        'entity_type',
        'trigger_type',
        'trigger_code',
      ],
    })

    const dateParts = []
    if (req.query.date_from) {
      params.push(String(req.query.date_from))
      dateParts.push(`crt_date::date >= $${params.length}::date`)
    }
    if (req.query.date_to) {
      params.push(String(req.query.date_to))
      dateParts.push(`crt_date::date <= $${params.length}::date`)
    }
    const caseClause = appendDateRange(clause, params, dateParts)

    const triggerFilter = buildFilterClause(req.query, {
      district: ['district_name'],
      trigger_type: ['trigger_type'],
      trigger_code: ['trigger_code'],
      application_type: ['application_type'],
      searchCols: ['reference_number', 'trigger_type', 'trigger_code', 'trigger_reason'],
    })
    const tParams = [...triggerFilter.params]
    const tDateParts = []
    if (req.query.trigger_date_from) {
      tParams.push(String(req.query.trigger_date_from))
      tDateParts.push(`trigger_time::date >= $${tParams.length}::date`)
    }
    if (req.query.trigger_date_to) {
      tParams.push(String(req.query.trigger_date_to))
      tDateParts.push(`trigger_time::date <= $${tParams.length}::date`)
    }
    const triggerWhereFinal = appendDateRange(triggerFilter.clause, tParams, tDateParts)

    const hospitalFilter = buildHospitalWhere(req.query)
    const workflowFilter = buildFilterClause(req.query, {
      district: ['hosp_district_name', 'patient_district_name'],
      hospital_type: ['hospital_type'],
      investigator: ['user_name'],
      workflow_user: ['workflow_user', 'dashboard_workflow_role'],
      searchCols: ['registration_id', 'hospital_name', 'workflow_user', 'user_name'],
    })

    const casesRes = await query(
      `SELECT * FROM ${FRAUD_CASE_SCHEMA}.${FRAUD_CASE_TABLE} ${caseClause} ORDER BY suspicion_id DESC LIMIT 5000`,
      params
    )
    const triggersRes = await query(
      `SELECT * FROM ${FRAUD_TRIGGER_SCHEMA}.${FRAUD_TRIGGER_TABLE} ${triggerWhereFinal} ORDER BY id_pk DESC LIMIT 5000`,
      tParams
    )
    const [hospitalRes, workflowUsersRes, workflowAuditRes] = await Promise.all([
      loadTable(HOSPITAL_SCHEMA, HOSPITAL_TABLE, 'hosp_id DESC NULLS LAST', 5000, hospitalFilter.clause, hospitalFilter.params),
      loadTable(WORKFLOW_USERS_SCHEMA, WORKFLOW_USERS_TABLE, 'id_pk DESC', 5000, workflowFilter.clause, workflowFilter.params),
      loadTable(WORKFLOW_AUDIT_SCHEMA, WORKFLOW_AUDIT_TABLE, 'work_id_pk DESC', 2000),
    ])

    const deempanelByHosp = await loadDeempanelDateMap()
    const table = serializeRows(casesRes.rows)
    const triggerTable = serializeRows(triggersRes.rows)
    const hospitalTable = hospitalRes.rows.map((r) => normalizeHospitalRow(r, deempanelByHosp))
    const workflowUsers = workflowUsersRes.rows
    const workflowAudit = workflowAuditRes.rows

    const columns = await resolveColumns(FRAUD_CASE_SCHEMA, FRAUD_CASE_TABLE, table)
    const triggerColumns = await resolveColumns(FRAUD_TRIGGER_SCHEMA, FRAUD_TRIGGER_TABLE, triggerTable)
    const hospitalColumns = [
      ...new Set([
        ...(await resolveColumns(HOSPITAL_SCHEMA, HOSPITAL_TABLE, hospitalTable)),
        'empaneled_date',
        'deempanel_date',
      ]),
    ]
    const workflowUsersColumns = await resolveColumns(
      WORKFLOW_USERS_SCHEMA,
      WORKFLOW_USERS_TABLE,
      workflowUsers
    )
    const workflowAuditColumns = await resolveColumns(
      WORKFLOW_AUDIT_SCHEMA,
      WORKFLOW_AUDIT_TABLE,
      workflowAudit
    )

    const stats = statsForRows(table)

    res.json({
      db: casesRes._db,
      view,
      schema: {
        case: `${FRAUD_CASE_SCHEMA}.${FRAUD_CASE_TABLE}`,
        trigger: `${FRAUD_TRIGGER_SCHEMA}.${FRAUD_TRIGGER_TABLE}`,
        hospital: `${HOSPITAL_SCHEMA}.${HOSPITAL_TABLE}`,
        workflowUsers: `${WORKFLOW_USERS_SCHEMA}.${WORKFLOW_USERS_TABLE}`,
        workflowAudit: `${WORKFLOW_AUDIT_SCHEMA}.${WORKFLOW_AUDIT_TABLE}`,
      },
      columns,
      triggerColumns,
      hospitalColumns,
      workflowUsersColumns,
      workflowAuditColumns,
      kpis: buildSafuKpis(view, table, triggerTable, stats),
      charts: buildSafuCharts(view, table, triggerTable, workflowUsers),
      table,
      triggerTable,
      hospitalTable,
      workflowUsers,
      workflowAudit,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
