import { Router } from 'express'
import { query } from '../db/pool.js'
import { buildFilterClause } from '../utils/filters.js'
import { serializeRows } from '../utils/serialize.js'
import { resolveColumns, resolveColumnsMany } from '../utils/schemaColumns.js'
import { buildKpi } from '../utils/kpiChange.js'

const router = Router()

router.get('/users', async (req, res) => {
  try {
    const { clause, params } = buildFilterClause(req.query, {
      role: ['role_name'],
      user_status: ['active_status', 'status'],
      searchCols: ['email_id', 'role_name', 'entity_name', 'app_name', 'user_id'],
    })

    const master = await query(
      `SELECT * FROM ump_raw.user_master_ump ${clause} ORDER BY 1 DESC LIMIT 2000`,
      params
    )
    const detail = await query(
      `SELECT * FROM ump_raw.ump_user_dtl ORDER BY 1 DESC LIMIT 2000`
    )

    const masterTable = serializeRows(master.rows)
    const detailTable = serializeRows(detail.rows)

    const table = masterTable.map((r) => {
      const d =
        detailTable.find((x) => String(x.email_id) === String(r.email_id)) ||
        detailTable.find((x) => String(x.user_id) === String(r.user_id)) ||
        {}
      const merged = { ...r }
      for (const [k, v] of Object.entries(d)) {
        if (k === 'id_pk') {
          merged.ump_user_dtl_id_pk = v
          continue
        }
        if (merged[k] === undefined || merged[k] === '' || merged[k] === null) {
          merged[`dtl_${k}`] = v
        } else if (String(merged[k]) !== String(v)) {
          merged[`dtl_${k}`] = v
        }
      }
      return merged
    })

    // Schema columns even when both tables are empty
    const columns = table[0]
      ? Object.keys(table[0])
      : await resolveColumnsMany(
          [
            ['ump_raw', 'user_master_ump'],
            ['ump_raw', 'ump_user_dtl'],
          ],
          table
        )

    const byRole = {}
    const byStatus = {}
    const byGender = {}
    const byState = {}
    const byApp = {}
    const byEntity = {}
    let active = 0
    let inactive = 0
    for (const d of table) {
      const role = String(d.role_name || 'Unknown').trim() || 'Unknown'
      byRole[role] = (byRole[role] || 0) + 1

      const status = String(d.active_status || d.status || 'Unknown').trim() || 'Unknown'
      byStatus[status] = (byStatus[status] || 0) + 1
      if (/^active$/i.test(status)) active += 1
      else if (/de-?active|inactive/i.test(status)) inactive += 1

      const gender = String(d.user_gender || '').trim().toUpperCase()
      const genderLabel = gender === 'M' || gender === 'MALE' ? 'M' : gender === 'F' || gender === 'FEMALE' ? 'F' : gender || 'Unknown'
      byGender[genderLabel] = (byGender[genderLabel] || 0) + 1

      const state = String(d.user_state_code || '').trim() || 'Unknown'
      byState[state] = (byState[state] || 0) + 1

      const app = String(d.app_name || 'Unknown').trim() || 'Unknown'
      byApp[app] = (byApp[app] || 0) + 1

      const entity = String(d.entity_name || 'Unknown').trim() || 'Unknown'
      byEntity[entity] = (byEntity[entity] || 0) + 1
    }

    const STATE_NAMES = {
      3: 'Punjab',
      5: 'Uttarakhand',
      7: 'Delhi',
      8: 'Rajasthan',
      9: 'Uttar Pradesh',
      10: 'Bihar',
      20: 'Jharkhand',
      21: 'Odisha',
      23: 'Madhya Pradesh',
      27: 'Maharashtra',
      28: 'Andhra Pradesh',
      36: 'Telangana',
    }

    function topEntries(entries, limit = 10) {
      const sorted = [...entries].sort((a, b) => b.value - a.value)
      if (sorted.length <= limit) return sorted
      const top = sorted.slice(0, limit)
      const rest = sorted.slice(limit)
      return [...top, { name: 'Others', value: rest.reduce((s, r) => s + r.value, 0) }]
    }

    const stateChart = topEntries(
      Object.entries(byState).map(([code, value]) => ({
        name: STATE_NAMES[code] ? `${code} — ${STATE_NAMES[code]}` : code,
        value,
      }))
    )

    res.json({
      db: master._db,
      schema: 'ump_raw.user_master_ump + ump_raw.ump_user_dtl',
      columns,
      kpis: [
        buildKpi({ label: 'Total Users', value: table.length, color: 'blue', rows: table }),
        buildKpi({
          label: 'Active Users',
          value: active,
          color: 'green',
          rows: table,
          predicate: (d) => /^active$/i.test(String(d.active_status || '').trim()),
        }),
        buildKpi({
          label: 'Inactive Users',
          value: inactive,
          color: 'orange',
          rows: table,
          predicate: (d) => /de-?active|inactive/i.test(String(d.active_status || '').trim()),
        }),
        buildKpi({
          label: 'Roles',
          value: Object.keys(byRole).length,
          color: 'purple',
          rows: table,
        }),
        buildKpi({
          label: 'States',
          value: Object.keys(byState).filter((k) => k !== 'Unknown').length,
          color: 'cyan',
          rows: table,
        }),
        buildKpi({
          label: 'Female Users',
          value: byGender.F || 0,
          color: 'violet',
          rows: table,
          predicate: (d) => /^f(emale)?$/i.test(String(d.user_gender || '').trim()),
        }),
      ],
      charts: {
        roleDistribution: Object.entries(byRole).map(([name, value]) => ({ name, value })),
        status: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        gender: Object.entries(byGender).map(([name, value]) => ({ name, value })),
        state: stateChart,
        app: Object.entries(byApp).map(([name, value]) => ({ name, value })),
        entity: Object.entries(byEntity).map(([name, value]) => ({ name, value })),
      },
      table,
      masterTable,
      detailTable,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
