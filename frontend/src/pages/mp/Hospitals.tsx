import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useModuleFilters } from '../../hooks/useModuleFilters'
import { getModuleFilters } from '../../data/moduleFilterConfig'
import ModuleFilterBar from '../../components/layout/ModuleFilterBar'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchHospitals, fetchHospitalsExport, fetchOverviewHospitals } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import { TABLE_PAGE_SIZE } from '../../hooks/useTableControls'
import type { FilterField, FilterValues, KPI, TableColumn } from '../../types'
import type { ExportSheet } from '../../utils/exportUtils'
import { applyPageFilters } from '../../utils/applyPageFilters'
import { isHospitalEmpanelled, isHospitalServingClaims } from '../../components/ui/HospitalStatusCells'

const KPI_EXPORT_COLUMNS = [
  { key: 'card', label: 'Card' },
  { key: 'value', label: 'Value' },
  { key: 'change', label: 'Change %' },
  { key: 'changeLabel', label: 'Vs' },
]
const CHART_EXPORT_COLUMNS = [
  { key: 'name', label: 'Category' },
  { key: 'value', label: 'Count' },
]

function kpisToExportRows(list: KPI[]) {
  return list.map((k) => ({
    card: k.label,
    value: k.value,
    change: k.change ?? '',
    changeLabel: k.changeLabel ?? '',
  }))
}
const TYPE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
const STATUS_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#06b6d4', '#8b5cf6', '#94a3b8']
const LOOKUP_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#94a3b8']
const DEEMPANEL_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#3b82f6']

const preferredColumns: TableColumn[] = [
  { key: 'hosp_id', label: 'Hospital ID' },
  { key: 'facility_id', label: 'Facility ID' },
  { key: 'hospital_name', label: 'Name' },
  { key: 'hospital_type', label: 'Type' },
  { key: 'district_name', label: 'District' },
  { key: 'hosp_spec_type', label: 'Specialty' },
  { key: 'nabh_certified', label: 'NABH' },
  { key: 'enrl_status', label: 'Enroll Status' },
  { key: 'active_status', label: 'Currently Serving' },
  { key: 'accreditation_status', label: 'Accreditation' },
  { key: 'empaneled_date', label: 'Empaneled On' },
  { key: 'deempanel_status', label: 'De-empanelment Status' },
  { key: 'pgdnb_status', label: 'PGDNB' },
]

const lookupPreferred: TableColumn[] = [
  { key: 'id_pk', label: 'ID' },
  { key: 'lookup_cd', label: 'Lookup Code' },
  { key: 'lookup_value', label: 'Lookup Value' },
  { key: 'active_yn', label: 'Active' },
  { key: 'type', label: 'Type' },
  { key: 'created_by', label: 'Created By' },
  { key: 'created_dt', label: 'Created' },
]

const deempanelPreferred: TableColumn[] = [
  { key: 'hosp_id', label: 'Hospital ID' },
  { key: 'hospital_name', label: 'Hospital' },
  { key: 'type', label: 'Action Type' },
  { key: 'status', label: 'Status' },
  { key: 'stop_payment', label: 'Stop Payment' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'end_date', label: 'End Date' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'deempanel_scheme', label: 'Scheme' },
  { key: 'remarks', label: 'Remarks' },
  { key: 'order_id', label: 'Order ID' },
  { key: 'created_by', label: 'Created By' },
]

function isEmpaneledHospitalRow(row: Record<string, string | number>) {
  return isHospitalEmpanelled(row)
}

function isActiveHospitalRow(row: Record<string, string | number>) {
  return isHospitalServingClaims(row)
}

function isGovHospitalRow(row: Record<string, string | number>) {
  return /gov|^g$/i.test(String(row.hospital_type ?? '').trim())
}

function isPrivHospitalRow(row: Record<string, string | number>) {
  return /priv|^p$/i.test(String(row.hospital_type ?? '').trim())
}

function isDeempanelledHospitalRow(row: Record<string, string | number>) {
  const desc = String(row.hosp_status_desc ?? '').trim()
  if (desc) return /de[- ]?empane|disempanel/i.test(desc)
  const s = String(row.enrl_status ?? '').trim()
  if (!s) return false
  if (/de[- ]?empane|disempanel/i.test(s)) return true
  return s === '0'
}

function filterRowsForHospitalMasterKpi<T extends Record<string, string | number>>(rows: T[], label: string): T[] {
  const key = label.trim().toLowerCase()
  if (key === 'active') return rows.filter((row) => isActiveHospitalRow(row))
  if (key === 'empanelled' || key === 'empaneled') return rows.filter((row) => isEmpaneledHospitalRow(row))
  if (key === 'de-empanelled' || key === 'deempaneled' || key === 'deempanelled') {
    return rows.filter((row) => isDeempanelledHospitalRow(row))
  }
  if (key === 'government') return rows.filter((row) => isGovHospitalRow(row))
  if (key === 'private') return rows.filter((row) => isPrivHospitalRow(row))
  return rows
}

function isDeempanelDeEmpanelRow(row: Record<string, string | number>) {
  const blob = [row.type, row.action_type, row.action, row.reasons, row.status]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean)
    .join(' ')
  if (!blob) return false
  if (/revoke/i.test(blob) && !/de[- ]?empanel|disempanel/i.test(blob)) return false
  return /de[- ]?empanel|disempanel/i.test(blob)
}

function filterRowsForDeempanelKpi<T extends Record<string, string | number>>(rows: T[], label: string): T[] | null {
  // Only section KPIs like "Deempanel De-Empanelled" — not the main hospital "De-empanelled" card.
  if (!/^deempanel\s+/i.test(label)) return null
  const key = label.replace(/^deempanel\s+/i, '').trim().toLowerCase()
  if (key === 'de-empanelled' || /de[- ]?empanel/.test(key)) {
    return rows.filter((row) => isDeempanelDeEmpanelRow(row))
  }
  if (key === 'records') return rows
  if (key === 'hospitals') return rows.filter((row) => Boolean(String(row.hosp_id ?? '').trim()))
  if (key === 'stop payment') {
    return rows.filter((row) => /^(yes|true|t|1)$/i.test(String(row.stop_payment ?? '').trim()))
  }
  if (key === 'revoke') return rows.filter((row) => /revoke/i.test(String(row.type ?? row.action_type ?? '')))
  if (key === 'with end date') return rows.filter((row) => Boolean(String(row.end_date ?? '').trim()))
  return null
}

function filterRowsForHemKpi<T extends Record<string, string | number>>(rows: T[], label: string): T[] | null {
  if (!/^hem\s+/i.test(label)) return null
  const key = label.replace(/^hem\s+/i, '').trim().toLowerCase()
  if (key === 'hospitals' || key === 'records') return rows
  if (key === 'active') {
    return rows.filter((row) => /^(1|active|yes|true)$/i.test(String(row.active_status ?? '').trim()))
  }
  if (key === 'private') {
    return rows.filter((row) => /priv|^p$/i.test(String(row.hosp_type_cd ?? row.hospital_type ?? '').trim()))
  }
  if (key === 'government') {
    return rows.filter((row) => /gov|^g$/i.test(String(row.hosp_type_cd ?? row.hospital_type ?? '').trim()))
  }
  if (key === 'with hfr') return rows.filter((row) => Boolean(String(row.hfr_hosp_id ?? '').trim()))
  if (key === 'nodal officer') return rows.filter((row) => Boolean(String(row.nodal_officer_name ?? '').trim()))
  return rows
}

const HEM_GEO_KEYS = [
  '_state_type',
  'state_type',
  'district_name',
  'dist_name',
  'hosp_district_name',
  'district',
  'division_name',
  'division',
]

function rowHasKeys(row: Record<string, string | number>, keys: string[]) {
  return keys.some((k) => Object.prototype.hasOwnProperty.call(row, k))
}

/** Apply only filters whose columns exist on this secondary table (lookup / HEM / etc.). */
function filterSecondaryHospitalTable<T extends Record<string, string | number>>(
  rows: T[],
  fields: FilterField[],
  filters: FilterValues,
  search: string
): T[] {
  if (!rows.length) return rows
  const sample = rows[0]
  const applicable = fields.filter((field) => {
    if (field.key === 'state_type' || field.key === 'division' || field.key === 'district') {
      return rowHasKeys(sample, HEM_GEO_KEYS)
    }
    if (field.key === 'nabh') {
      return rowHasKeys(sample, ['quality_certification', 'nabh_certified', 'nabh'])
    }
    if (field.key === 'hospital_type') {
      return rowHasKeys(sample, ['hospital_type', '_hospital_type', 'hosp_type_cd'])
    }
    if (field.key === 'hospital_status') {
      return rowHasKeys(sample, ['enrl_status', 'active_status', 'hosp_status_desc', 'accreditation_status'])
    }
    return true
  })
  if (!applicable.length && !search.trim()) return rows
  return applyPageFilters(rows, applicable, filters, search)
}

const hemPreferred: TableColumn[] = [
  { key: 'hosp_id', label: 'Hospital ID' },
  { key: 'facility_id', label: 'Facility ID' },
  { key: 'hosp_name', label: 'Name' },
  { key: 'hosp_type_cd', label: 'Type' },
  { key: 'hosp_city', label: 'City' },
  { key: 'state_cd', label: 'State' },
  { key: 'active_status', label: 'Currently Serving' },
  { key: 'enrl_status', label: 'Enroll Status' },
  { key: 'hosp_spec_type', label: 'Specialty' },
  { key: 'hfr_hosp_id', label: 'HFR ID' },
  { key: 'nodal_officer_name', label: 'Nodal Officer' },
  { key: 'empaneled_date', label: 'Empaneled On' },
  { key: 'certificate_expiry_date', label: 'Certificate Expiry' },
  { key: 'bed_size', label: 'Beds' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  lookupTable: [] as Record<string, string | number>[],
  deempanelTable: [] as Record<string, string | number>[],
  hemTable: [] as Record<string, string | number>[],
  columns: [] as string[],
  lookupColumns: [] as string[],
  deempanelColumns: [] as string[],
  hemColumns: [] as string[],
  deempanelKpis: [] as KPI[],
  hemKpis: [] as KPI[],
}

export default function Hospitals() {
  const filterFields = useMemo(() => getModuleFilters('mp_hospitals'), [])
  const moduleFilters = useModuleFilters('mp_hospitals', filterFields)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [moduleFilters.queryString])

  const hospitalsQs = useMemo(() => {
    const params = new URLSearchParams(moduleFilters.queryString.replace(/^\?/, ''))
    params.set('limit', String(TABLE_PAGE_SIZE))
    params.set('offset', String((page - 1) * TABLE_PAGE_SIZE))
    const s = params.toString()
    return s ? `?${s}` : ''
  }, [moduleFilters.queryString, page])

  const { data, source, db, loading, error } = useApiResource(
    () => fetchHospitals(hospitalsQs),
    EMPTY,
    [hospitalsQs]
  )
  const live = source === 'api'
  const kpis = data.kpis ?? []
  const charts = data.charts ?? {}
  const typeData = charts.type ?? []
  const districtData = charts.district ?? []
  const divisionData = charts.division ?? []
  const enrollmentData = charts.enrollment ?? []
  const activeStatusData = charts.activeStatus ?? []
  const empanelmentTrend = charts.empanelmentTrend ?? []
  const lookupCategory = charts.lookupCategory ?? []
  const lookupStatus = charts.lookupStatus ?? []
  const deempanelType = charts.deempanelType ?? []
  const deempanelTrend = charts.deempanelTrend ?? []
  const deempanelKpis = data.deempanelKpis ?? []
  const hemOwnership = charts.hemOwnership ?? []
  const hemActive = charts.hemActive ?? []
  const hemKpis = data.hemKpis ?? []

  const barHeight = (count: number, min = 240, max = 420) =>
    Math.min(max, Math.max(min, count * 36 + 72))

  const tableRows = (data.table ?? []) as Record<string, string | number>[]
  const tableTotal = Number(data.tableTotal ?? data.total ?? tableRows.length)
  const lookupRows = (data.lookupTable ?? []) as Record<string, string | number>[]
  const deempanelRows = (data.deempanelTable ?? []) as Record<string, string | number>[]
  const hemRows = (data.hemTable ?? []) as Record<string, string | number>[]
  const filtered = moduleFilters.filterRows(tableRows)
  // Lookup is reference data (m_lookup) — hospital geo filters do not apply.
  const lookupFiltered = useMemo(
    () => filterSecondaryHospitalTable(lookupRows, filterFields, moduleFilters.filters, moduleFilters.search),
    [lookupRows, filterFields, moduleFilters.filters, moduleFilters.search]
  )
  // Live API already scopes deempanel to filtered hospitals (+ geo enrichment).
  // Re-applying hospital page filters used to wipe rows (no district/state on raw deempanel).
  const deempanelFiltered = useMemo(() => {
    if (live) {
      const q = moduleFilters.search.trim().toLowerCase()
      if (!q) return deempanelRows
      return deempanelRows.filter((row) =>
        Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
      )
    }
    return filterSecondaryHospitalTable(deempanelRows, filterFields, moduleFilters.filters, moduleFilters.search)
  }, [live, deempanelRows, filterFields, moduleFilters.filters, moduleFilters.search])
  // HEM has its own schema; only apply filters that map to HEM columns.
  const hemFiltered = useMemo(
    () => filterSecondaryHospitalTable(hemRows, filterFields, moduleFilters.filters, moduleFilters.search),
    [hemRows, filterFields, moduleFilters.filters, moduleFilters.search]
  )

  const fetchHospitalExport = useCallback(async () => {
    const res = await fetchHospitalsExport(moduleFilters.queryString)
    if (!res.ok) return []
    return (res.data.table ?? []) as Record<string, string | number>[]
  }, [moduleFilters.queryString])
  const columns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.columns,
        rows: tableRows,
        preferredFirst: preferredColumns.map((c) => c.key),
        demoColumns: preferredColumns,
      }),
    [source, data.columns, tableRows]
  )
  const lookupColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.lookupColumns,
        rows: lookupRows,
        preferredFirst: lookupPreferred.map((c) => c.key),
      }),
    [source, data.lookupColumns, lookupRows]
  )
  const deempanelColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.deempanelColumns,
        rows: deempanelRows,
        preferredFirst: deempanelPreferred.map((c) => c.key),
        demoColumns: deempanelPreferred,
      }),
    [source, data.deempanelColumns, deempanelRows]
  )
  const hemColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.hemColumns,
        rows: hemRows,
        preferredFirst: hemPreferred.map((c) => c.key),
        demoColumns: hemPreferred,
      }),
    [source, data.hemColumns, hemRows]
  )

  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    tableRows: filtered,
    columns,
    datasetTitle: 'Hospital Records',
    resolveContext: (chartTitle) => {
      if (/lookup/i.test(chartTitle)) {
        return { rows: lookupFiltered, columns: lookupColumns, datasetTitle: 'Hospital Lookup' }
      }
      if (/deempanel/i.test(chartTitle)) {
        return { rows: deempanelFiltered, columns: deempanelColumns, datasetTitle: 'De-empanelment Details' }
      }
      if (/\bhem\b/i.test(chartTitle)) {
        return { rows: hemFiltered, columns: hemColumns, datasetTitle: 'HEM Hospitals' }
      }
      return { rows: filtered, columns, datasetTitle: 'Hospital Records' }
    },
    fetchDrillDown: live
      ? async (payload, chartTitle) => {
          if (/lookup|deempanel|\bhem\b/i.test(chartTitle)) return null
          if (/hospital type/i.test(chartTitle)) {
            const params = new URLSearchParams(moduleFilters.queryString.replace(/^\?/, ''))
            const typeName = String(payload.name ?? '').trim()
            const isOthers = /^others$/i.test(typeName)
            if (typeName && !isOthers) params.set('hospital_type', typeName)
            params.set('detail', '1')
            const res = await fetchOverviewHospitals(`?${params.toString()}`, 120000)
            if (!res.ok) return null
            const rows = (res.data.table ?? []) as Record<string, string | number>[]
            return {
              rows,
              columns,
              datasetTitle: typeName ? `Hospitals — ${typeName}` : 'Hospital Records',
              alreadyFiltered: !isOthers,
            }
          }
          const res = await fetchHospitalsExport(moduleFilters.queryString)
          if (!res.ok) return null
          const rows = (res.data.table ?? []) as Record<string, string | number>[]
          return { rows, columns, datasetTitle: 'Hospital Records' }
        }
      : undefined,
  })

  const handleKpi = async (kpi: KPI) => {
    if (/lookup/i.test(kpi.label)) {
      openDetail({
        title: kpi.label,
        subtitle: `${lookupFiltered.length} record${lookupFiltered.length === 1 ? '' : 's'}`,
        records: lookupFiltered,
        columns: lookupColumns,
        datasetTitle: 'Hospital Lookup',
        source: live ? 'api' : 'demo',
      })
      return
    }
    const hemKpiRows = filterRowsForHemKpi(hemFiltered, kpi.label)
    if (hemKpiRows) {
      openDetail({
        title: kpi.label,
        subtitle: `${hemKpiRows.length} record${hemKpiRows.length === 1 ? '' : 's'}`,
        records: hemKpiRows,
        columns: hemColumns,
        datasetTitle: 'HEM Hospitals',
        source: live ? 'api' : 'demo',
      })
      return
    }
    const deempanelKpiRows = filterRowsForDeempanelKpi(deempanelFiltered, kpi.label)
    if (deempanelKpiRows) {
      openDetail({
        title: kpi.label,
        subtitle: `${deempanelKpiRows.length} record${deempanelKpiRows.length === 1 ? '' : 's'}`,
        records: deempanelKpiRows,
        columns: deempanelColumns,
        datasetTitle: 'De-empanelment Details',
        source: live ? 'api' : 'demo',
      })
      return
    }

    if (live) {
      openDetail({
        title: kpi.label,
        subtitle: 'Loading hospital records…',
        loading: true,
        source: 'api',
        datasetTitle: kpi.label,
      })
      const res = await fetchHospitalsExport(moduleFilters.queryString)
      if (!res.ok) {
        openDetail({
          title: kpi.label,
          subtitle: res.error || 'Could not load hospitals',
          records: [],
          columns,
          datasetTitle: kpi.label,
          source: 'api',
        })
        return
      }
      const rows = filterRowsForHospitalMasterKpi(
        (res.data.table ?? []) as Record<string, string | number>[],
        kpi.label
      )
      openDetail({
        title: kpi.label,
        subtitle: `${rows.length.toLocaleString()} matching hospital${rows.length === 1 ? '' : 's'}`,
        records: rows,
        columns,
        datasetTitle: kpi.label,
        source: 'api',
      })
      return
    }

    openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })
  }

  const hasCharts =
    typeData.length > 0 ||
    districtData.length > 0 ||
    divisionData.length > 0 ||
    enrollmentData.length > 0 ||
    activeStatusData.length > 0 ||
    empanelmentTrend.length > 0

  const exportSheets = useMemo((): ExportSheet[] => {
    const sheets: ExportSheet[] = []
    if (kpis.length) {
      sheets.push({ name: 'KPI Cards', rows: kpisToExportRows(kpis), columns: KPI_EXPORT_COLUMNS })
    }
    if (hemKpis.length) {
      sheets.push({ name: 'HEM KPI Cards', rows: kpisToExportRows(hemKpis), columns: KPI_EXPORT_COLUMNS })
    }
    if (deempanelKpis.length) {
      sheets.push({ name: 'Deempanel KPI Cards', rows: kpisToExportRows(deempanelKpis), columns: KPI_EXPORT_COLUMNS })
    }
    const charts: [string, Record<string, string | number>[]][] = [
      ['Hospital Type Distribution', typeData],
      ['Empanelment Status', enrollmentData],
      ['District-wise Hospitals', districtData],
      ['Division-wise Hospitals', divisionData],
      ['Active vs Inactive', activeStatusData],
      ['Empanelment Trend', empanelmentTrend],
      ['HEM Ownership', hemOwnership],
      ['HEM Active Status', hemActive],
      ['De-empanelment Action Type', deempanelType],
      ['De-empanelment Trend', deempanelTrend],
      ['Lookup Categories', lookupCategory],
      ['Lookup Status', lookupStatus],
    ]
    for (const [name, rows] of charts) {
      if (rows.length) sheets.push({ name, rows, columns: CHART_EXPORT_COLUMNS })
    }
    return sheets
  }, [
    kpis,
    hemKpis,
    deempanelKpis,
    typeData,
    enrollmentData,
    districtData,
    divisionData,
    activeStatusData,
    empanelmentTrend,
    hemOwnership,
    hemActive,
    deempanelType,
    deempanelTrend,
    lookupCategory,
    lookupStatus,
  ])

  return (
    <div>
      <Modal />
      <PageHeader
        title="Hospitals & Empanelment"
        badge={<DataSourceBadge source={source} db={db} loading={loading} />}
        exportSheets={exportSheets}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      <ModuleFilterBar
        title={moduleFilters.meta.title}
        subtitle={moduleFilters.meta.subtitle}
        searchPlaceholder={moduleFilters.meta.searchPlaceholder}
        fields={moduleFilters.resolvedFields}
        values={moduleFilters.filters}
        onChange={moduleFilters.setFilter}
        search={moduleFilters.search}
        onSearchChange={moduleFilters.setSearch}
        onClear={moduleFilters.clearFilters}
        activeCount={moduleFilters.activeCount}
      />

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={handleKpi} exportLabel="KPI Cards" />}

      {hasCharts && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {typeData.length > 0 && (
              <ChartCard title="Hospital Type Distribution" subtitle="Top types + Others" exportData={typeData}>
                <InteractivePieChart data={typeData} colors={TYPE_COLORS} innerRadius={55} chartTitle="Hospital Types" onItemClick={openFromChart} />
              </ChartCard>
            )}
            {enrollmentData.length > 0 && (
              <ChartCard title="Empanelment Status" subtitle="Hospital master status · matches De-empanelled KPI" exportData={enrollmentData}>
                <InteractivePieChart data={enrollmentData} colors={STATUS_COLORS} innerRadius={55} chartTitle="Empanelment Status" onItemClick={openFromChart} />
              </ChartCard>
            )}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {districtData.length > 0 && (
              <ChartCard title="District-wise Hospitals" subtitle="Top 10 districts + Others" exportData={districtData}>
                <InteractiveBarChart
                  data={districtData}
                  chartTitle="District Hospitals"
                  layout="vertical"
                  height={barHeight(districtData.length)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#3b82f6', name: 'Hospitals' }]}
                />
              </ChartCard>
            )}
            {divisionData.length > 0 && (
              <ChartCard title="Division-wise Hospitals" exportData={divisionData}>
                <InteractiveBarChart
                  data={divisionData}
                  chartTitle="Division Hospitals"
                  layout="vertical"
                  height={barHeight(divisionData.length)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#8b5cf6', name: 'Hospitals' }]}
                />
              </ChartCard>
            )}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeStatusData.length > 0 && (
              <ChartCard title="Active vs Inactive" exportData={activeStatusData}>
                <InteractiveBarChart
                  data={activeStatusData}
                  chartTitle="Active Status"
                  height={240}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#10b981', name: 'Hospitals' }]}
                  cellColors={['#10b981', '#ef4444', '#94a3b8']}
                />
              </ChartCard>
            )}
            {empanelmentTrend.length > 0 && (
              <ChartCard title="Empanelment Trend" subtitle="New empanelments by month" exportData={empanelmentTrend}>
                <InteractiveLineChart
                  data={empanelmentTrend}
                  chartTitle="Empanelment Trend"
                  height={260}
                  integerAxis
                  onItemClick={openFromChart}
                  lines={[{ dataKey: 'value', stroke: '#2563eb', name: 'Empanelled' }]}
                />
              </ChartCard>
            )}
          </div>
        </>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        title={`Hospital Records (${tableTotal.toLocaleString()} unique)`}
        serverPagination={
          live
            ? {
                totalRows: tableTotal,
                page,
                pageSize: TABLE_PAGE_SIZE,
                onPageChange: setPage,
              }
            : undefined
        }
        fetchExportData={live ? fetchHospitalExport : undefined}
        onRowClick={(row) =>
          openDetail({
            title: String(row.hospital_name || row.hosp_name || row.name || 'Hospital'),
            subtitle: 'Schema record',
            data: row,
          })
        }
      />

      {hemRows.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">HEM hospital — dmart_mp.t_hem_hospital</p>
            <p className="text-xs text-slate-500">
              Hospital Empanelment Module registry (ownership, HFR ID, nodal officer, certificate)
            </p>
          </div>
          {hemKpis.length > 0 && <KPIGrid kpis={hemKpis} onKpiClick={handleKpi} exportLabel="HEM KPI Cards" />}
          {(hemOwnership.length > 0 || hemActive.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {hemOwnership.length > 0 && (
                <ChartCard title="HEM Ownership" subtitle="hosp_type_cd" exportData={hemOwnership}>
                  <InteractivePieChart
                    data={hemOwnership}
                    colors={TYPE_COLORS}
                    innerRadius={55}
                    chartTitle="HEM Ownership"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {hemActive.length > 0 && (
                <ChartCard title="HEM Active Status" subtitle="active_status" exportData={hemActive}>
                  <InteractivePieChart
                    data={hemActive}
                    colors={STATUS_COLORS}
                    innerRadius={55}
                    chartTitle="HEM Active Status"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={hemColumns}
            data={hemFiltered}
            title={`HEM Hospital — dmart_mp.t_hem_hospital (${hemFiltered.length}${
              hemColumns.length ? ` · ${hemColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.hosp_name || row.hospital_name || row.hosp_id || 'HEM hospital'),
                subtitle: String(row.facility_id || 'dmart_mp.t_hem_hospital'),
                data: row,
                columns: hemColumns,
              })
            }
          />
        </>
      )}

      {deempanelRows.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">De-empanelment — dmart_mp.t_deempanelment_details</p>
            <p className="text-xs text-slate-500">
              Hospital de-empanelment, stop-payment and revoke actions (one row per hospital)
            </p>
          </div>
          {deempanelKpis.length > 0 && (
            <KPIGrid kpis={deempanelKpis} onKpiClick={handleKpi} exportLabel="Deempanel KPI Cards" />
          )}
          {(deempanelType.length > 0 || deempanelTrend.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {deempanelType.length > 0 && (
                <ChartCard title="De-empanelment Action Type" subtitle="type" exportData={deempanelType}>
                  <InteractivePieChart
                    data={deempanelType}
                    colors={DEEMPANEL_COLORS}
                    innerRadius={55}
                    chartTitle="Deempanel Type"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {deempanelTrend.length > 0 && (
                <ChartCard title="De-empanelment Trend" subtitle="Actions by start date" exportData={deempanelTrend}>
                  <InteractiveLineChart
                    data={deempanelTrend}
                    chartTitle="Deempanel Trend"
                    height={260}
                    integerAxis
                    onItemClick={openFromChart}
                    lines={[{ dataKey: 'value', stroke: '#dc2626', name: 'Actions' }]}
                  />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={deempanelColumns}
            data={deempanelFiltered}
            title={`De-empanelment Details — dmart_mp.t_deempanelment_details (${deempanelFiltered.length}${
              deempanelColumns.length ? ` · ${deempanelColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.hospital_name || row.hosp_id || 'De-empanelment'),
                subtitle: String(row.type || 'dmart_mp.t_deempanelment_details'),
                data: row,
                columns: deempanelColumns,
              })
            }
          />
        </>
      )}

      {lookupRows.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">Hospital lookup — dmart_mp.m_lookup</p>
            <p className="text-xs text-slate-500">
              Reference codes for facility type, specialty, empanelment status and related hospital master fields
            </p>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {lookupCategory.length > 0 && (
              <ChartCard title="Lookup Categories" subtitle="lookup_cd" exportData={lookupCategory}>
                <InteractiveBarChart
                  data={lookupCategory}
                  chartTitle="Lookup Categories"
                  layout="vertical"
                  height={barHeight(lookupCategory.length)}
                  integerAxis
                  onItemClick={openFromChart}
                  bars={[{ dataKey: 'value', fill: '#2563eb', name: 'Values' }]}
                />
              </ChartCard>
            )}
            {lookupStatus.length > 0 && (
              <ChartCard title="Lookup Status" subtitle="active_yn" exportData={lookupStatus}>
                <InteractivePieChart
                  data={lookupStatus}
                  colors={LOOKUP_COLORS}
                  innerRadius={55}
                  chartTitle="Lookup Status"
                  onItemClick={openFromChart}
                />
              </ChartCard>
            )}
          </div>
          <DataTable
            columns={lookupColumns}
            data={lookupFiltered}
            title={`Hospital Lookup — dmart_mp.m_lookup (${lookupFiltered.length}${
              lookupColumns.length ? ` · ${lookupColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.lookup_value || row.lookup_cd || 'Lookup'),
                subtitle: String(row.lookup_cd || 'dmart_mp.m_lookup'),
                data: row,
                columns: lookupColumns,
              })
            }
          />
        </>
      )}
    </div>
  )
}
