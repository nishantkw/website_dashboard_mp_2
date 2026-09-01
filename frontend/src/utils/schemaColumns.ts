import type { TableColumn } from '../types'

/** Patient state before patient district (source tables list district first). Division sits before district. */
export function preferPatientGeoOrder(keys: string[]): string[] {
  const state = 'patient_state_name'
  const dist = 'patient_district_name'
  let out = [...keys]
  if (out.includes(state) && out.includes(dist)) {
    const insertAt = Math.min(out.indexOf(state), out.indexOf(dist))
    out = out.filter((k) => k !== state && k !== dist)
    out.splice(insertAt, 0, state, dist)
  }
  if (out.includes('division') && out.includes(dist)) {
    const without = out.filter((k) => k !== 'division')
    const at = without.indexOf(dist)
    without.splice(at >= 0 ? at : 0, 0, 'division')
    out = without
  }
  return out
}

/** Build DataTable columns from field names. */
export function columnsFromKeys(
  keys: string[],
  preferredFirst: string[] = [],
  labelByKey: Record<string, string> = {}
): TableColumn[] {
  const geoKeys = preferPatientGeoOrder(keys)
  const ordered = preferPatientGeoOrder([
    ...preferredFirst.filter((k) => geoKeys.includes(k)),
    ...geoKeys.filter((k) => !preferredFirst.includes(k)),
  ])
  return ordered.map((key) => ({
    key,
    label: labelByKey[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    align: /amount|tat|age|flag|capacity|beds|id_pk|status_id/i.test(key) ? ('right' as const) : ('left' as const),
  }))
}

/**
 * Live DB → schema columns only (`schemaKeys` / row keys).
 * Offline / mock → preferred column defs only when rows exist; otherwise empty.
 */
export function schemaTableColumns(opts: {
  source: 'api' | 'mock' | 'offline'
  schemaKeys?: string[]
  rows?: Record<string, string | number>[]
  preferredFirst?: string[]
  demoColumns?: TableColumn[]
}): TableColumn[] {
  const { source, schemaKeys, rows = [], preferredFirst = [], demoColumns } = opts

  if (source === 'api' || source === 'offline') {
    const rawKeys = schemaKeys?.length ? [...schemaKeys] : rows.length ? Object.keys(rows[0]) : []
    for (const k of preferredFirst) {
      if (!rawKeys.includes(k) && rows.some((r) => r[k] != null && String(r[k]).trim() !== '')) {
        const distAt = rawKeys.indexOf('patient_district_name')
        rawKeys.splice(distAt >= 0 ? distAt : 0, 0, k)
      }
    }
    const allowed = demoColumns?.map((c) => c.key)
    const keys = allowed?.length ? rawKeys.filter((k) => allowed.includes(k)) : rawKeys
    const labelByKey = Object.fromEntries((demoColumns ?? []).map((c) => [c.key, c.label]))
    return keys.length ? columnsFromKeys(keys, preferredFirst, labelByKey) : []
  }

  if (demoColumns?.length) return demoColumns
  if (rows.length) return columnsFromKeys(Object.keys(rows[0]), preferredFirst)
  return []
}
