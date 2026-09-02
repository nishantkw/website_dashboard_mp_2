import { Router } from 'express'
import { buildKpi } from '../utils/kpiChange.js'
import { buildHospitalCharts, buildLookupCharts, buildDeempanelCharts, buildHemCharts } from '../utils/hospitalAggregations.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { parseHospitalPaging, stripHospitalPaging } from '../utils/hospitalIdentity.js'
import {
  loadHospitalMasterRows,
  loadDeempanelRows,
  loadHemHospitalRows,
  isActiveHospital,
  isEmpaneledHospital,
  isGovHospital,
  isPrivHospital,
  isDeempanelDeEmpanel,
  isDeempanelStopPayment,
  isDeempanelRevoke,
  hasDeempanelEndDate,
  isHemActive,
  isHemGov,
  isHemPriv,
  hasHemHfr,
  hasHemNodal,
} from '../utils/hospitalRows.js'

const router = Router()

function rowsToCsv(rows, columnKeys) {
  const cols = columnKeys?.length ? columnKeys : Object.keys(rows[0] || {})
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [cols.map(esc).join(',')]
  for (const row of rows) {
    lines.push(cols.map((c) => esc(row[c])).join(','))
  }
  return `\uFEFF${lines.join('\r\n')}`
}

router.get('/export', async (req, res) => {
  try {
    const filters = stripHospitalPaging(req.query || {})
    const { table, columns, db, schema } = await loadHospitalMasterRows(filters)
    const format = String(req.query.format || 'csv').toLowerCase()
    if (format === 'json') {
      return res.json({
        db,
        schema,
        columns,
        table,
        total: table.length,
      })
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="hospital_records.csv"')
    res.send(rowsToCsv(table, columns))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const filters = stripHospitalPaging(req.query || {})
    const { limit, offset } = parseHospitalPaging(req.query || {})
    const { table, columns, schema, db, lookupTable } = await loadHospitalMasterRows(filters)
    const totalHospitals = table.length
    const active = table.filter(isActiveHospital).length
    const empaneled = table.filter(isEmpaneledHospital).length
    const gov = table.filter(isGovHospital).length
    const priv = table.filter(isPrivHospital).length
    const lookup = lookupTable || []
    const lookupColumns = await resolveColumns('dmart_mp', 'm_lookup', lookup)
    const lookupCodes = new Set(lookup.map((r) => String(r.lookup_cd || '').trim()).filter(Boolean))
    const lookupCharts = buildLookupCharts(lookup)
    const deempanel = await loadDeempanelRows(table)
    const deempanelTable = deempanel.table
    const deempanelColumns = await resolveColumns('dmart_mp', 't_deempanelment_details', deempanelTable)
    const deempanelHospitals = new Set(deempanelTable.map((r) => String(r.hosp_id ?? '').trim()).filter(Boolean))
    const deEmpanelled = deempanelTable.filter(isDeempanelDeEmpanel).length
    const stopPayment = deempanelTable.filter(isDeempanelStopPayment).length
    const revoke = deempanelTable.filter(isDeempanelRevoke).length
    const withEndDate = deempanelTable.filter(hasDeempanelEndDate).length
    const deempanelDateFields = ['start_date', 'end_date', 'due_date', 'created_dt']
    const hem = await loadHemHospitalRows()
    const hemTable = hem.table
    const hemColumns = await resolveColumns('dmart_mp', 't_hem_hospital', hemTable)
    const hemActive = hemTable.filter(isHemActive).length
    const hemGov = hemTable.filter(isHemGov).length
    const hemPriv = hemTable.filter(isHemPriv).length
    const hemHfr = hemTable.filter(hasHemHfr).length
    const hemNodal = hemTable.filter(hasHemNodal).length
    const hemDateFields = ['empaneled_date', 'created_dt', 'updated_dt', 'certificate_expiry_date']

    res.json({
      db,
      schema,
      lookupSchema: lookup.length ? 'dmart_mp.m_lookup' : '',
      deempanelSchema: deempanelTable.length ? 'dmart_mp.t_deempanelment_details' : '',
      hemSchema: hemTable.length ? 'dmart_mp.t_hem_hospital' : '',
      columns,
      lookupColumns,
      deempanelColumns,
      hemColumns,
      kpis: [
        buildKpi({ label: 'Total Hospitals', value: totalHospitals, color: 'blue', rows: table }),
        buildKpi({
          label: 'Active',
          value: active,
          color: 'green',
          rows: table,
          predicate: isActiveHospital,
        }),
        buildKpi({
          label: 'Empanelled',
          value: empaneled,
          color: 'emerald',
          rows: table,
          predicate: isEmpaneledHospital,
        }),
        ...(deempanelTable.length
          ? [
              buildKpi({
                label: 'De-empanelled',
                value: deEmpanelled,
                color: 'red',
                rows: deempanelTable,
                dateFields: deempanelDateFields,
                predicate: isDeempanelDeEmpanel,
              }),
            ]
          : []),
        buildKpi({
          label: 'Government',
          value: gov,
          color: 'cyan',
          rows: table,
          predicate: isGovHospital,
        }),
        buildKpi({
          label: 'Private',
          value: priv,
          color: 'purple',
          rows: table,
          predicate: isPrivHospital,
        }),
        ...(hemTable.length
          ? [
              buildKpi({
                label: 'HEM Hospitals',
                value: hemTable.length,
                color: 'indigo',
                rows: hemTable,
                dateFields: hemDateFields,
              }),
            ]
          : []),
        ...(lookup.length
          ? [
              buildKpi({
                label: 'Lookup Values',
                value: lookup.length,
                color: 'orange',
                rows: lookup,
                dateFields: ['created_dt'],
              }),
              buildKpi({
                label: 'Lookup Codes',
                value: lookupCodes.size,
                color: 'indigo',
                rows: lookup,
                dateFields: ['created_dt'],
              }),
            ]
          : []),
      ],
      charts: {
        ...buildHospitalCharts(table),
        ...lookupCharts,
        ...buildDeempanelCharts(deempanelTable),
        ...buildHemCharts(hemTable),
      },
      table: table.slice(offset, offset + limit),
      tableTotal: totalHospitals,
      total: totalHospitals,
      limit,
      offset,
      lookupTable: lookup,
      deempanelTable,
      hemTable,
      hemKpis: hemTable.length
        ? [
            buildKpi({
              label: 'HEM Records',
              value: hemTable.length,
              color: 'indigo',
              rows: hemTable,
              dateFields: hemDateFields,
            }),
            buildKpi({
              label: 'HEM Active',
              value: hemActive,
              color: 'green',
              rows: hemTable,
              dateFields: hemDateFields,
              predicate: isHemActive,
            }),
            buildKpi({
              label: 'HEM Private',
              value: hemPriv,
              color: 'purple',
              rows: hemTable,
              dateFields: hemDateFields,
              predicate: isHemPriv,
            }),
            buildKpi({
              label: 'HEM Government',
              value: hemGov,
              color: 'cyan',
              rows: hemTable,
              dateFields: hemDateFields,
              predicate: isHemGov,
            }),
            buildKpi({
              label: 'HEM With HFR',
              value: hemHfr,
              color: 'blue',
              rows: hemTable,
              dateFields: hemDateFields,
              predicate: hasHemHfr,
            }),
            buildKpi({
              label: 'HEM Nodal Officer',
              value: hemNodal,
              color: 'orange',
              rows: hemTable,
              dateFields: hemDateFields,
              predicate: hasHemNodal,
            }),
          ]
        : [],
      deempanelKpis: deempanelTable.length
        ? [
            buildKpi({
              label: 'Deempanel Records',
              value: deempanelTable.length,
              color: 'red',
              rows: deempanelTable,
              dateFields: deempanelDateFields,
            }),
            buildKpi({
              label: 'Deempanel Hospitals',
              value: deempanelHospitals.size,
              color: 'orange',
              rows: deempanelTable,
              dateFields: deempanelDateFields,
            }),
            buildKpi({
              label: 'Deempanel De-Empanelled',
              value: deEmpanelled,
              color: 'red',
              rows: deempanelTable,
              dateFields: deempanelDateFields,
              predicate: isDeempanelDeEmpanel,
            }),
            buildKpi({
              label: 'Deempanel Stop Payment',
              value: stopPayment,
              color: 'violet',
              rows: deempanelTable,
              dateFields: deempanelDateFields,
              predicate: isDeempanelStopPayment,
            }),
            buildKpi({
              label: 'Deempanel Revoke',
              value: revoke,
              color: 'indigo',
              rows: deempanelTable,
              dateFields: deempanelDateFields,
              predicate: isDeempanelRevoke,
            }),
            buildKpi({
              label: 'Deempanel With End Date',
              value: withEndDate,
              color: 'cyan',
              rows: deempanelTable,
              dateFields: deempanelDateFields,
              predicate: hasDeempanelEndDate,
            }),
          ]
        : [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
