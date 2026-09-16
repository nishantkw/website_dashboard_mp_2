import { Router } from 'express'
import { clientError } from '../utils/clientError.js'
import { buildKpi } from '../utils/kpiChange.js'
import { buildHospitalCharts, buildLookupCharts, buildDeempanelCharts, buildHemCharts } from '../utils/hospitalAggregations.js'
import { resolveColumns } from '../utils/schemaColumns.js'
import { parseHospitalPaging, stripHospitalPaging } from '../utils/hospitalIdentity.js'
import {
  loadHospitalMasterRows,
  loadDeempanelRows,
  loadHemHospitalRows,
  loadLookupRows,
  isActiveHospital,
  isEmpaneledHospital,
  isDeempanelledHospital,
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

const SECTIONS = new Set(['overview', 'master', 'deempanel', 'hem', 'lookup', 'manpower', 'all'])

function rowsToCsv(rows, columnKeys) {
  const cols = columnKeys?.length ? columnKeys : Object.keys(rows[0] || {})
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [cols.map(esc).join(',')]
  for (const row of rows) {
    lines.push(cols.map((c) => esc(row[c])).join(','))
  }
  return `\uFEFF${lines.join('\r\n')}`
}

function parseSection(q = {}) {
  const raw = String(q.section || 'all').trim().toLowerCase()
  return SECTIONS.has(raw) ? raw : 'all'
}

function stripSection(q = {}) {
  const rest = { ...q }
  delete rest.section
  return rest
}

function buildMasterKpis(table) {
  const totalHospitals = table.length
  const active = table.filter(isActiveHospital).length
  const empaneled = table.filter(isEmpaneledHospital).length
  const deEmpanelledHospitals = table.filter(isDeempanelledHospital).length
  const gov = table.filter(isGovHospital).length
  const priv = table.filter(isPrivHospital).length
  return [
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
    buildKpi({
      label: 'De-empanelled',
      value: deEmpanelledHospitals,
      color: 'red',
      rows: table,
      predicate: isDeempanelledHospital,
    }),
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
  ]
}

function buildDeempanelPayload(deempanelTable, deempanelColumns, db) {
  const deempanelHospitals = new Set(deempanelTable.map((r) => String(r.hosp_id ?? '').trim()).filter(Boolean))
  const deEmpanelledActions = deempanelTable.filter(isDeempanelDeEmpanel).length
  const stopPayment = deempanelTable.filter(isDeempanelStopPayment).length
  const revoke = deempanelTable.filter(isDeempanelRevoke).length
  const withEndDate = deempanelTable.filter(hasDeempanelEndDate).length
  const deempanelDateFields = ['start_date', 'end_date', 'due_date', 'created_dt']
  return {
    db,
    deempanelSchema: deempanelTable.length ? 'dmart_mp.t_deempanelment_details' : '',
    deempanelColumns,
    charts: buildDeempanelCharts(deempanelTable),
    deempanelTable,
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
            value: deEmpanelledActions,
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
  }
}

function buildHemPayload(hemTable, hemColumns, db) {
  const hemActive = hemTable.filter(isHemActive).length
  const hemGov = hemTable.filter(isHemGov).length
  const hemPriv = hemTable.filter(isHemPriv).length
  const hemHfr = hemTable.filter(hasHemHfr).length
  const hemNodal = hemTable.filter(hasHemNodal).length
  const hemDateFields = ['empaneled_date', 'created_dt', 'updated_dt', 'certificate_expiry_date']
  return {
    db,
    hemSchema: hemTable.length ? 'dmart_mp.t_hem_hospital' : '',
    hemColumns,
    charts: buildHemCharts(hemTable),
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
    kpis: hemTable.length
      ? [
          buildKpi({
            label: 'HEM Hospitals',
            value: hemTable.length,
            color: 'indigo',
            rows: hemTable,
            dateFields: hemDateFields,
          }),
        ]
      : [],
  }
}

function buildLookupPayload(lookup, lookupColumns, db) {
  const lookupCodes = new Set(lookup.map((r) => String(r.lookup_cd || '').trim()).filter(Boolean))
  return {
    db,
    lookupSchema: lookup.length ? 'dmart_mp.m_lookup' : '',
    lookupColumns,
    charts: buildLookupCharts(lookup),
    lookupTable: lookup,
    kpis: lookup.length
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
      : [],
  }
}

async function loadManpowerRows() {
  const { loadTableSafe, countByField } = await import('../utils/loadTableSafe.js')
  const loaded = await loadTableSafe('dmart_mp', 't_hem_manpower', {
    orderBy: 'COALESCE(updated_dt, created_dt) DESC NULLS LAST',
    limit: 10000,
  })
  return { ...loaded, charts: {
    manpowerType: countByField(loaded.table, 'manpower_type'),
    specialization: countByField(loaded.table, 'specialization').slice(0, 20),
    active: countByField(loaded.table, 'active_status'),
  } }
}

function buildManpowerPayload(manpowerTable, manpowerColumns, db, charts = {}) {
  const active = manpowerTable.filter((d) => /^(1|active|yes|true)$/i.test(String(d.active_status ?? '').trim())).length
  const withHpr = manpowerTable.filter((d) => Boolean(String(d.hprid ?? '').trim())).length
  const doctors = manpowerTable.filter((d) => /doc|medical|physician/i.test(String(d.manpower_type ?? ''))).length
  return {
    db,
    manpowerSchema: manpowerTable.length ? 'dmart_mp.t_hem_manpower' : '',
    manpowerColumns,
    charts: {
      manpowerType: charts.manpowerType || [],
      manpowerSpecialization: charts.specialization || [],
      manpowerActive: charts.active || [],
    },
    manpowerTable,
    manpowerKpis: manpowerTable.length
      ? [
          buildKpi({
            label: 'Manpower Records',
            value: manpowerTable.length,
            color: 'indigo',
            rows: manpowerTable,
            dateFields: ['created_dt', 'updated_dt'],
          }),
          buildKpi({
            label: 'Manpower Active',
            value: active,
            color: 'green',
            rows: manpowerTable,
            dateFields: ['created_dt', 'updated_dt'],
            predicate: (d) => /^(1|active|yes|true)$/i.test(String(d.active_status ?? '').trim()),
          }),
          buildKpi({
            label: 'Manpower With HPR',
            value: withHpr,
            color: 'cyan',
            rows: manpowerTable,
            dateFields: ['created_dt', 'updated_dt'],
            predicate: (d) => Boolean(String(d.hprid ?? '').trim()),
          }),
          buildKpi({
            label: 'Manpower Doctors',
            value: doctors,
            color: 'blue',
            rows: manpowerTable,
            dateFields: ['created_dt', 'updated_dt'],
            predicate: (d) => /doc|medical|physician/i.test(String(d.manpower_type ?? '')),
          }),
        ]
      : [],
    kpis: manpowerTable.length
      ? [
          buildKpi({
            label: 'HEM Manpower',
            value: manpowerTable.length,
            color: 'indigo',
            rows: manpowerTable,
            dateFields: ['created_dt', 'updated_dt'],
          }),
        ]
      : [],
  }
}

router.get('/export', async (req, res) => {
  try {
    const filters = stripHospitalPaging(stripSection(req.query || {}))
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
    res.status(500).json({ error: clientError(err) })
  }
})

router.get('/', async (req, res) => {
  try {
    const section = parseSection(req.query || {})
    const filters = stripHospitalPaging(stripSection(req.query || {}))
    const { limit, offset } = parseHospitalPaging(req.query || {})

    if (section === 'hem') {
      const hem = await loadHemHospitalRows()
      const hemColumns = await resolveColumns('dmart_mp', 't_hem_hospital', hem.table)
      return res.json(buildHemPayload(hem.table, hemColumns, hem.db))
    }

    if (section === 'manpower') {
      const manpower = await loadManpowerRows()
      return res.json(buildManpowerPayload(manpower.table, manpower.columns, manpower.db, manpower.charts))
    }

    if (section === 'lookup') {
      const lookupLoad = await loadLookupRows()
      const lookup = lookupLoad.table || []
      const lookupColumns = await resolveColumns('dmart_mp', 'm_lookup', lookup)
      return res.json(buildLookupPayload(lookup, lookupColumns, lookupLoad.db))
    }

    if (section === 'deempanel') {
      const { table, db } = await loadHospitalMasterRows(filters)
      const deempanel = await loadDeempanelRows(table)
      const deempanelColumns = await resolveColumns('dmart_mp', 't_deempanelment_details', deempanel.table)
      return res.json(buildDeempanelPayload(deempanel.table, deempanelColumns, db || deempanel.db))
    }

    if (section === 'overview' || section === 'master') {
      const { table, columns, schema, db } = await loadHospitalMasterRows(filters)
      const totalHospitals = table.length
      return res.json({
        db,
        schema,
        columns,
        kpis: buildMasterKpis(table),
        charts: buildHospitalCharts(table),
        table: section === 'master' ? table.slice(offset, offset + limit) : [],
        tableTotal: totalHospitals,
        total: totalHospitals,
        limit,
        offset,
        section,
      })
    }

    // section=all — full payload (reports / legacy)
    const { table, columns, schema, db, lookupTable } = await loadHospitalMasterRows(filters)
    const lookup = lookupTable || []
    const [deempanel, hem, lookupColumns] = await Promise.all([
      loadDeempanelRows(table),
      loadHemHospitalRows(),
      resolveColumns('dmart_mp', 'm_lookup', lookup),
    ])
    const [deempanelColumns, hemColumns] = await Promise.all([
      resolveColumns('dmart_mp', 't_deempanelment_details', deempanel.table),
      resolveColumns('dmart_mp', 't_hem_hospital', hem.table),
    ])
    const hemPayload = buildHemPayload(hem.table, hemColumns, hem.db)
    const lookupPayload = buildLookupPayload(lookup, lookupColumns, db)
    const deempanelPayload = buildDeempanelPayload(deempanel.table, deempanelColumns, deempanel.db)

    res.json({
      db,
      schema,
      lookupSchema: lookupPayload.lookupSchema,
      deempanelSchema: deempanelPayload.deempanelSchema,
      hemSchema: hemPayload.hemSchema,
      columns,
      lookupColumns,
      deempanelColumns,
      hemColumns,
      kpis: [
        ...buildMasterKpis(table),
        ...(hemPayload.kpis || []),
        ...(lookupPayload.kpis || []),
      ],
      charts: {
        ...buildHospitalCharts(table),
        ...lookupPayload.charts,
        ...deempanelPayload.charts,
        ...hemPayload.charts,
      },
      table: table.slice(offset, offset + limit),
      tableTotal: table.length,
      total: table.length,
      limit,
      offset,
      lookupTable: lookup,
      deempanelTable: deempanel.table,
      hemTable: hem.table,
      hemKpis: hemPayload.hemKpis,
      deempanelKpis: deempanelPayload.deempanelKpis,
    })
  } catch (err) {
    res.status(500).json({ error: clientError(err) })
  }
})

export default router
