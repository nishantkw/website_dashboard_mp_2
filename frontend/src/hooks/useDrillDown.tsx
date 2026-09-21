import { useState, useCallback, useRef } from 'react'
import DetailModal, { type DrillDownDetail } from '../components/ui/DetailModal'
import { filterRowsForChartClick, type ChartClickPayload } from '../utils/chartDrillDown'
import { filterRowsForClaimKpi } from '../utils/claimKpi'
import {
  mergeDrillDownFilters,
  resolveDrillDownFilters,
  type DrillDownAppliedFilters,
} from '../utils/drillDownFilters'
import { useGlobalFilters } from '../context/FilterContext'
import type { TableColumn } from '../types'

export interface DrillDownContext {
  rows: Record<string, string | number>[]
  columns: TableColumn[]
  datasetTitle?: string
  /** Server already applied the chart-slice filter — do not client-filter again. */
  alreadyFiltered?: boolean
}

export interface UseDrillDownOptions {
  live?: boolean
  tableRows?: Record<string, string | number>[]
  columns?: TableColumn[]
  datasetTitle?: string
  /** Page/module filter values (division, district, dates, …) carried into the modal. */
  pageFilters?: Record<string, string | undefined> | (() => Record<string, string | undefined>)
  resolveContext?: (chartTitle: string) => DrillDownContext | null
  fetchDrillDown?: (
    payload: ChartClickPayload,
    chartTitle: string
  ) => Promise<DrillDownContext | null>
}

function resolvePageFilters(
  pageFilters?: UseDrillDownOptions['pageFilters']
): Record<string, string | undefined> {
  if (!pageFilters) return {}
  return typeof pageFilters === 'function' ? pageFilters() : pageFilters
}

export function useDrillDown(options: UseDrillDownOptions = {}) {
  const optionsRef = useRef(options)
  optionsRef.current = options
  const { globalFilters } = useGlobalFilters()
  const globalRef = useRef(globalFilters)
  globalRef.current = globalFilters

  const [detail, setDetail] = useState<DrillDownDetail | null>(null)

  const buildApplied = useCallback((fromClick: DrillDownAppliedFilters = {}): DrillDownAppliedFilters => {
    return mergeDrillDownFilters(
      fromClick,
      resolvePageFilters(optionsRef.current.pageFilters),
      globalRef.current
    )
  }, [])

  const openDetail = useCallback((d: DrillDownDetail) => {
    const live = optionsRef.current.live
    const source = d.source ?? (live ? 'api' : 'demo')
    const appliedFilters = buildApplied(d.appliedFilters ?? {})
    if (d.loading || Array.isArray(d.records)) {
      setDetail({ ...d, source, appliedFilters })
      return
    }

    const { columns = [], tableRows = [] } = optionsRef.current
    if (live) {
      const rowData = d.data as Record<string, string | number> | undefined
      if (rowData && Object.keys(rowData).length > 0) {
        setDetail({
          ...d,
          records: [rowData],
          columns: d.columns ?? columns,
          datasetTitle: d.datasetTitle ?? optionsRef.current.datasetTitle,
          source: 'api',
          appliedFilters,
        })
        return
      }
      if (tableRows.length) {
        setDetail({
          ...d,
          records: tableRows,
          columns: d.columns ?? columns,
          datasetTitle: d.datasetTitle ?? optionsRef.current.datasetTitle,
          source: 'api',
          appliedFilters,
        })
        return
      }
    }
    setDetail({ ...d, source, appliedFilters })
  }, [buildApplied])

  const openFromChart = useCallback(
    async (payload: ChartClickPayload, chartTitle: string) => {
      const opts = optionsRef.current
      const name = String(payload.name ?? chartTitle)
      const appliedFilters = buildApplied(resolveDrillDownFilters(name, chartTitle))

      const useLiveTable = Boolean(opts.tableRows?.length || opts.resolveContext || opts.fetchDrillDown)

      if (opts.live && useLiveTable) {
        setDetail({
          title: name,
          subtitle: chartTitle,
          loading: true,
          source: 'api',
          appliedFilters,
        })

        try {
          let ctx: DrillDownContext | null = opts.resolveContext?.(chartTitle) ?? null

          if (!ctx && opts.tableRows?.length) {
            ctx = {
              rows: opts.tableRows,
              columns: opts.columns ?? [],
              datasetTitle: opts.datasetTitle,
            }
          }

          if (opts.fetchDrillDown) {
            const fetched = await opts.fetchDrillDown(payload, chartTitle)
            if (fetched) {
              ctx = fetched
              let records = ctx.alreadyFiltered
                ? ctx.rows
                : filterRowsForChartClick(ctx.rows, payload, chartTitle)

              // Server slice filter returned nothing — fall back to client filter on
              // local/export rows (common when API codes ≠ chart labels).
              if (
                ctx.alreadyFiltered &&
                records.length === 0 &&
                (opts.tableRows?.length || opts.resolveContext)
              ) {
                const local =
                  opts.resolveContext?.(chartTitle) ??
                  (opts.tableRows?.length
                    ? {
                        rows: opts.tableRows,
                        columns: opts.columns ?? [],
                        datasetTitle: opts.datasetTitle,
                      }
                    : null)
                if (local?.rows?.length) {
                  const retry = filterRowsForChartClick(local.rows, payload, chartTitle)
                  if (retry.length) {
                    records = retry
                    ctx = { ...local, alreadyFiltered: false }
                  }
                }
              }

              setDetail({
                title: name,
                subtitle: `${records.length.toLocaleString('en-IN')} record${records.length === 1 ? '' : 's'} · ${chartTitle}`,
                records,
                columns: ctx.columns,
                datasetTitle: ctx.datasetTitle ?? opts.datasetTitle,
                source: 'api',
                data: payload,
                appliedFilters,
              })
              return
            }
          }

          if (ctx) {
            const filtered = filterRowsForChartClick(ctx.rows, payload, chartTitle)
            setDetail({
              title: name,
              subtitle: `${filtered.length.toLocaleString('en-IN')} record${filtered.length === 1 ? '' : 's'} · ${chartTitle}`,
              records: filtered,
              columns: ctx.columns,
              datasetTitle: ctx.datasetTitle ?? opts.datasetTitle,
              source: 'api',
              data: payload,
              appliedFilters,
            })
            return
          }
        } catch {
          // fall through
        }
      } else if (opts.tableRows?.length) {
        const filtered = filterRowsForChartClick(opts.tableRows, payload, chartTitle)
        if (filtered.length) {
          setDetail({
            title: name,
            subtitle: chartTitle,
            records: filtered,
            columns: opts.columns ?? [],
            datasetTitle: opts.datasetTitle,
            source: 'demo',
            data: payload,
            appliedFilters,
          })
          return
        }
      }

      setDetail({
        title: name,
        subtitle: chartTitle,
        data:
          payload.value !== undefined
            ? { value: payload.value, ...payload }
            : payload,
        source: 'demo',
        appliedFilters,
      })
    },
    [buildApplied]
  )

  const openFromKpi = useCallback(
    (label: string, value: string | number, extra?: Record<string, string | number>) => {
      const opts = optionsRef.current
      // KPI labels are not chart categories — only inherit page/global geo & dates.
      const appliedFilters = buildApplied({})
      if (opts.tableRows?.length) {
        const kpiKey = extra && typeof extra.kpiKey === 'string' ? extra.kpiKey : undefined
        const claimFiltered = filterRowsForClaimKpi(opts.tableRows, label, kpiKey)
        const records = claimFiltered ?? opts.tableRows
        setDetail({
          title: label,
          subtitle: `${records.length} matching record${records.length === 1 ? '' : 's'}`,
          records,
          columns: opts.columns ?? [],
          datasetTitle: opts.datasetTitle ?? label,
          source: opts.live ? 'api' : 'demo',
          appliedFilters,
        })
        return
      }
      setDetail({
        title: label,
        subtitle: 'KPI Details',
        data: { value, ...extra },
        source: 'demo',
        appliedFilters,
      })
    },
    [buildApplied]
  )

  const closeDetail = useCallback(() => setDetail(null), [])

  const Modal = () => <DetailModal detail={detail} onClose={closeDetail} />

  return {
    detail,
    openDetail,
    closeDetail,
    openFromChart,
    openFromKpi,
    Modal,
  }
}
