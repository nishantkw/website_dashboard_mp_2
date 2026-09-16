import { Router } from 'express'
import { resolveColumns } from '../utils/schemaColumns.js'
import { buildKpi } from '../utils/kpiChange.js'
import { loadWorkflowDashboard, buildProWorkflowKpis, workflowUserKey } from '../utils/workflowRows.js'
import { clientError } from '../utils/clientError.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const data = await loadWorkflowDashboard(req.query)
    const columns = data.table.length
      ? Object.keys(data.table[0])
      : await resolveColumns('dmart_mp', 'workflow_users_t', [])
    const auditColumns = data.audit.length
      ? Object.keys(data.audit[0])
      : await resolveColumns('dmart_mp', 't_workflow_transaction_audit', [])
    const proTable = data.proTable || []
    const proColumns = proTable.length
      ? Object.keys(proTable[0])
      : await resolveColumns('dmart_mp', 'pro_workflow_users_t', [])
    const proKpis = buildProWorkflowKpis(proTable).map((k) =>
      buildKpi({
        label: k.label,
        value: k.value,
        color: k.color,
        rows: proTable,
        dateFields: ['created_dt', 'last_action_dt', 'transaction_dt'],
        predicate:
          k.label === 'Pro Users' ? (d) => Boolean(workflowUserKey(d)) : undefined,
      })
    )

    const { loadTableSafe } = await import('../utils/loadTableSafe.js')
    const [statusBis, statusTms] = await Promise.all([
      loadTableSafe('dmart_mp', 'm_status_bis', { orderBy: 'id_pk', limit: 5000 }),
      loadTableSafe('dmart_mp', 'm_status_tms', { orderBy: 'id_pk', limit: 5000 }),
    ])

    res.json({
      db: data.db || statusBis.db || statusTms.db,
      schema: data.schema,
      proSchema: proTable.length ? 'dmart_mp.pro_workflow_users_t' : '',
      statusBisSchema: statusBis.schema,
      statusTmsSchema: statusTms.schema,
      columns,
      auditColumns,
      proColumns,
      statusBisColumns: statusBis.columns,
      statusTmsColumns: statusTms.columns,
      kpis: [
        buildKpi({
          label: 'Workflow Users',
          value: data.uniqueUserCount,
          color: 'blue',
          rows: data.table,
        }),
        buildKpi({
          label: 'Audit Events',
          value: data.audit.length,
          color: 'cyan',
          rows: data.audit,
        }),
        buildKpi({
          label: 'Roles Active',
          value: data.uniqueRoleCount,
          color: 'green',
          rows: data.table,
        }),
        buildKpi({
          label: 'Hospitals',
          value: data.hospitalCount,
          color: 'purple',
          rows: data.table,
        }),
        buildKpi({
          label: 'Districts',
          value: data.districtCount,
          color: 'indigo',
          rows: data.table,
        }),
        buildKpi({
          label: 'Claim Process',
          value: data.clmCount,
          color: 'orange',
          rows: data.table,
          predicate: (d) => /^CLM/i.test(String(d.workflow_process_code || '').trim()),
        }),
      ],
      proKpis,
      charts: data.charts,
      table: data.table,
      audit: data.audit,
      proTable,
      statusBisTable: statusBis.table,
      statusTmsTable: statusTms.table,
    })
  } catch (err) {
    res.status(500).json({ error: clientError(err) })
  }
})

export default router
