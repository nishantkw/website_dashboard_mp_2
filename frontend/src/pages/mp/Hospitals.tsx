import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../../components/charts/InteractiveCharts'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useModuleFilters } from '../../hooks/useModuleFilters'
import { getModuleFilters, type ModuleFilterKey } from '../../data/moduleFilterConfig'
import ModuleFilterBar from '../../components/layout/ModuleFilterBar'
import { useApiResource } from '../../hooks/useApiResource'
import { fetchHospitalsSection, fetchHospitalsExport, fetchOverviewHospitals } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import { TABLE_PAGE_SIZE } from '../../hooks/useTableControls'
import type { FilterField, FilterValues, KPI, TableColumn } from '../../types'
import type { ExportSheet } from '../../utils/exportUtils'
import { applyPageFilters } from '../../utils/applyPageFilters'
import { isHospitalEmpanelled, isHospitalServingClaims } from '../../components/ui/HospitalStatusCells'

export type HospitalSection = 'overview' | 'master' | 'deempanel' | 'hem' | 'lookup'

const SECTION_META: Record<
  HospitalSection,
  { title: string; filterKey: ModuleFilterKey; needsPaging?: boolean }
> = {
  overview: { title: 'Hospitals', filterKey: 'mp_hospitals', needsPaging: true },
  master: { title: 'Hospitals', filterKey: 'mp_hospitals', needsPaging: true },
  deempanel: { title: 'De-empanelment', filterKey: 'mp_hospitals_deempanel' },
  hem: { title: 'HEM Hospitals', filterKey: 'mp_hospitals_hem' },
  lookup: { title: 'Hospital Lookup', filterKey: 'mp_hospitals_lookup' },
}

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
  { key: 'reasons', label: 'Reasons' },
  { key: 'district_name', label: 'District' },
]

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

function isActiveHospitalRow(row: Record<string, string | number>) {
  return isHospitalServingClaims(row)
}
function isEmpaneledHospitalRow(row: Record<string, string | number>) {
  return isHospitalEmpanelled(row)
}
function isDeempanelledHospitalRow(row: Record<string, string | number>) {
  const desc = String(row.hosp_status_desc ?? '').trim()
  if (desc) return /de[- ]?empane|disempanel/i.test(desc)
  const s = String(row.enrl_status ?? '').trim()
  if (!s) return false
  if (/de[- ]?empane|disempanel/i.test(s)) return true
  return s === '0'
}
function isGovHospitalRow(row: Record<string, string | number>) {
  return /gov|^g$/i.test(String(row.hospital_type ?? '').trim())
}
function isPrivHospitalRow(row: Record<string, string | number>) {
  return /priv|^p$/i.test(String(row.hospital_type ?? '').trim())
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

export default function Hospitals({ section = 'master' }: { section?: HospitalSection }) {
  const meta = SECTION_META[section]
  const filterFields = useMemo(() => getModuleFilters(meta.filterKey), [meta.filterKey])
  const moduleFilters = useModuleFilters(meta.filterKey, filterFields)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [moduleFilters.queryString, section])

  const hospitalsQs = useMemo(() => {
    const params = new URLSearchParams(moduleFilters.queryString.replace(/^\?/, ''))
    if (meta.needsPaging) {
      params.set('limit', String(TABLE_PAGE_SIZE))
      params.set('offset', String((page - 1) * TABLE_PAGE_SIZE))
    }
    const s = params.toString()
    return s ? `?${s}` : ''
  }, [moduleFilters.queryString, page, meta.needsPaging])

  const { data, source, db, loading, error } = useApiResource(
    () => fetchHospitalsSection(section, hospitalsQs),
    EMPTY,
    [hospitalsQs, section]
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

  const filtered = useMemo(
    () => (live ? tableRows : moduleFilters.filterRows(tableRows)),
    [live, tableRows, moduleFilters.filterRows]
  )
  const lookupFiltered = useMemo(
    () => filterSecondaryHospitalTable(lookupRows, filterFields, moduleFilters.filters, moduleFilters.search),
    [lookupRows, filterFields, moduleFilters.filters, moduleFilters.search]
  )
  const deempanelFiltered = useMemo(() => {
    if (live) {
      const q = moduleFilters.search.trim().toLowerCase()
      let rows = deempanelRows
      if (moduleFilters.filters.date_from || moduleFilters.filters.date_to) {
        rows = applyPageFilters(rows, filterFields.filter((f) => f.key === 'date_from' || f.key === 'date_to'), moduleFilters.filters)
      }
      if (!q) return rows
      return rows.filter((row) =>
        Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
      )
    }
    return filterSecondaryHospitalTable(deempanelRows, filterFields, moduleFilters.filters, moduleFilters.search)
  }, [live, deempanelRows, filterFields, moduleFilters.filters, moduleFilters.search])
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

  const { openDetail, openFromChart, openFromKpi, Modal } = useDrillDown({
    live,
    tableRows: filtered,
    columns,
    datasetTitle: meta.title,
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
    fetchDrillDown:
      live && (section === 'overview' || section === 'master')
        ? async (payload, chartTitle) => {
            if (/lookup|deempanel|\bhem\b/i.test(chartTitle)) return null
            if (/hospital types|type distribution/i.test(chartTitle)) {
              const typeName = String(payload.name ?? '').trim()
              const isOthers = /^others$/i.test(typeName)
              const params = new URLSearchParams(moduleFilters.queryString.replace(/^\?/, ''))
              if (typeName && !isOthers) params.set('hospital_type', typeName)
              params.set('limit', '500')
              params.set('offset', '0')
              const res = await fetchOverviewHospitals(`?${params.toString()}`, 120000)
              if (!res.ok) return null
              return {
                rows: (res.data.table ?? []) as Record<string, string | number>[],
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
    if (/lookup/i.test(kpi.label) || section === 'lookup') {
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
    if (hemKpiRows || section === 'hem') {
      const rows = hemKpiRows ?? hemFiltered
      openDetail({
        title: kpi.label,
        subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'}`,
        records: rows,
        columns: hemColumns,
        datasetTitle: 'HEM Hospitals',
        source: live ? 'api' : 'demo',
      })
      return
    }
    const deempanelKpiRows = filterRowsForDeempanelKpi(deempanelFiltered, kpi.label)
    if (deempanelKpiRows || section === 'deempanel') {
      const rows = deempanelKpiRows ?? deempanelFiltered
      openDetail({
        title: kpi.label,
        subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'}`,
        records: rows,
        columns: deempanelColumns,
        datasetTitle: 'De-empanelment Details',
        source: live ? 'api' : 'demo',
      })
      return
    }

    if (live && (section === 'overview' || section === 'master')) {
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

  const exportSheets = useMemo((): ExportSheet[] => {
    const sheets: ExportSheet[] = []
    if (section === 'hem') {
      const hemAll = [...kpis, ...hemKpis]
      if (hemAll.length) {
        sheets.push({ name: 'HEM KPI Cards', rows: kpisToExportRows(hemAll), columns: KPI_EXPORT_COLUMNS })
      }
    } else if (kpis.length) {
      sheets.push({ name: 'KPI Cards', rows: kpisToExportRows(kpis), columns: KPI_EXPORT_COLUMNS })
    }
    if (section !== 'hem' && hemKpis.length) {
      sheets.push({ name: 'HEM KPI Cards', rows: kpisToExportRows(hemKpis), columns: KPI_EXPORT_COLUMNS })
    }
    if (deempanelKpis.length) {
      sheets.push({ name: 'Deempanel KPI Cards', rows: kpisToExportRows(deempanelKpis), columns: KPI_EXPORT_COLUMNS })
    }
    const chartSheets: Array<[string, typeof typeData]> = [
      ['Hospital Types', typeData],
      ['Empanelment Status', enrollmentData],
      ['District-wise Hospitals', districtData],
      ['Division-wise Hospitals', divisionData],
      ['Active Status', activeStatusData],
      ['Empanelment Trend', empanelmentTrend],
      ['HEM Ownership', hemOwnership],
      ['HEM Active Status', hemActive],
      ['De-empanelment Action Type', deempanelType],
      ['De-empanelment Trend', deempanelTrend],
      ['Lookup Categories', lookupCategory],
      ['Lookup Status', lookupStatus],
    ]
    for (const [name, rows] of chartSheets) {
      if (rows.length) sheets.push({ name, rows, columns: CHART_EXPORT_COLUMNS })
    }
    return sheets
  }, [
    section,
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

  const showMasterCharts = section === 'overview' || section === 'master'
  const showMasterTable = section === 'overview' || section === 'master'
  const showFilterBar = filterFields.length > 0 || meta.filterKey === 'mp_hospitals_lookup'

  return (
    <div>
      <Modal />
      <PageHeader
        title={meta.title}
        badge={<DataSourceBadge source={source} db={db} loading={loading} />}
        exportSheets={exportSheets}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      {showFilterBar && (
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
      )}

      {(section === 'master' || section === 'overview') && kpis.length > 0 && (
        <KPIGrid kpis={kpis} onKpiClick={handleKpi} exportLabel="KPI Cards" />
      )}

      {section === 'lookup' && kpis.length > 0 && (
        <KPIGrid kpis={kpis} onKpiClick={handleKpi} exportLabel="Lookup KPI Cards" />
      )}

      {showMasterCharts && (
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

      {showMasterTable && (
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
      )}

      {section === 'hem' && (
        <>
          <div className="mb-4 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">HEM hospital — dmart_mp.t_hem_hospital</p>
            <p className="text-xs text-slate-500">
              Hospital Empanelment Module registry (ownership, HFR ID, nodal officer, certificate)
            </p>
          </div>
          {(kpis.length > 0 || hemKpis.length > 0) && (
            <KPIGrid
              kpis={[...kpis, ...hemKpis]}
              onKpiClick={handleKpi}
              exportLabel="HEM KPI Cards"
            />
          )}
          {(hemOwnership.length > 0 || hemActive.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {hemOwnership.length > 0 && (
                <ChartCard title="HEM Ownership" subtitle="hosp_type_cd" exportData={hemOwnership}>
                  <InteractivePieChart data={hemOwnership} colors={TYPE_COLORS} innerRadius={55} chartTitle="HEM Ownership" onItemClick={openFromChart} />
                </ChartCard>
              )}
              {hemActive.length > 0 && (
                <ChartCard title="HEM Active Status" subtitle="active_status" exportData={hemActive}>
                  <InteractivePieChart data={hemActive} colors={STATUS_COLORS} innerRadius={55} chartTitle="HEM Active Status" onItemClick={openFromChart} />
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

      {section === 'deempanel' && (
        <>
          <div className="mb-4 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">De-empanelment — dmart_mp.t_deempanelment_details</p>
            <p className="text-xs text-slate-500">Hospital de-empanelment, stop-payment and revoke actions</p>
          </div>
          {deempanelKpis.length > 0 && (
            <KPIGrid kpis={deempanelKpis} onKpiClick={handleKpi} exportLabel="Deempanel KPI Cards" />
          )}
          {(deempanelType.length > 0 || deempanelTrend.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {deempanelType.length > 0 && (
                <ChartCard title="De-empanelment Action Type" subtitle="type" exportData={deempanelType}>
                  <InteractivePieChart data={deempanelType} colors={DEEMPANEL_COLORS} innerRadius={55} chartTitle="De-empanelment Action Type" onItemClick={openFromChart} />
                </ChartCard>
              )}
              {deempanelTrend.length > 0 && (
                <ChartCard title="De-empanelment Trend" subtitle="Actions by start date" exportData={deempanelTrend}>
                  <InteractiveLineChart
                    data={deempanelTrend}
                    chartTitle="De-empanelment Trend"
                    height={260}
                    integerAxis
                    onItemClick={openFromChart}
                    lines={[{ dataKey: 'value', stroke: '#ef4444', name: 'Actions' }]}
                  />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={deempanelColumns}
            data={deempanelFiltered}
            title={`De-empanelment Details (${deempanelFiltered.length}${
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

      {section === 'lookup' && (
        <>
          <div className="mb-4 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">Hospital lookup — dmart_mp.m_lookup</p>
            <p className="text-xs text-slate-500">Reference codes used for hospital type and related mappings</p>
          </div>
          {(lookupCategory.length > 0 || lookupStatus.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {lookupCategory.length > 0 && (
                <ChartCard title="Lookup Categories" subtitle="lookup_cd" exportData={lookupCategory}>
                  <InteractivePieChart data={lookupCategory} colors={LOOKUP_COLORS} innerRadius={55} chartTitle="Lookup Categories" onItemClick={openFromChart} />
                </ChartCard>
              )}
              {lookupStatus.length > 0 && (
                <ChartCard title="Lookup Status" subtitle="active_yn" exportData={lookupStatus}>
                  <InteractivePieChart data={lookupStatus} colors={STATUS_COLORS} innerRadius={55} chartTitle="Lookup Status" onItemClick={openFromChart} />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={lookupColumns}
            data={lookupFiltered}
            title={`Lookup Values (${lookupFiltered.length}${lookupColumns.length ? ` · ${lookupColumns.length} schema cols` : ''})`}
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
