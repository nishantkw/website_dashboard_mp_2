import { useState, useCallback, useRef } from 'react'
import DetailModal, { type DrillDownDetail } from '../components/ui/DetailModal'
import { filterRowsForChartClick, type ChartClickPayload } from '../utils/chartDrillDown'
import { filterRowsForClaimKpi } from '../utils/claimKpi'
import { resolveDrillDownFilters } from '../utils/drillDownFilters'
import type { TableColumn } from '../types'

export interface DrillDownContext {
  rows: Record<string, string | number>[]
  columns: TableColumn[]
  datasetTitle?: string
}

export interface UseDrillDownOptions {
  live?: boolean
  tableRows?: Record<string, string | number>[]
  columns?: TableColumn[]
  datasetTitle?: string
  resolveContext?: (chartTitle: string) => DrillDownContext | null
  fetchDrillDown?: (
    payload: ChartClickPayload,
    chartTitle: string
  ) => Promise<DrillDownContext | null>
}

export function useDrillDown(options: UseDrillDownOptions = {}) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [detail, setDetail] = useState<DrillDownDetail | null>(null)

  const openDetail = useCallback((d: DrillDownDetail) => {
    if (d.records?.length) {
      setDetail({
        ...d,
        source: d.source ?? (optionsRef.current.live ? 'api' : 'demo'),
      })
      return
    }

    const { live, columns = [], tableRows = [] } = optionsRef.current
    if (live && !d.records?.length) {
      const rowData = d.data as Record<string, string | number> | undefined
      if (rowData && Object.keys(rowData).length > 0) {
        setDetail({
          ...d,
          records: [rowData],
          columns: d.columns ?? columns,
          datasetTitle: d.datasetTitle ?? optionsRef.current.datasetTitle,
          source: 'api',
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
        })
        return
      }
    }
    setDetail({ ...d, source: d.source ?? (live ? 'api' : 'demo') })
  }, [])

  const openFromChart = useCallback(
    async (payload: ChartClickPayload, chartTitle: string) => {
      const opts = optionsRef.current
      const name = String(payload.name ?? chartTitle)
      const appliedFilters = resolveDrillDownFilters(name, chartTitle)

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
            if (fetched) ctx = fetched
          }

          if (ctx) {
            const filtered = filterRowsForChartClick(ctx.rows, payload, chartTitle)
            setDetail({
              title: name,
              subtitle: chartTitle,
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
    []
  )

  const openFromKpi = useCallback(
    (label: string, value: string | number, extra?: Record<string, string | number>) => {
      const opts = optionsRef.current
      if (opts.tableRows?.length) {
        const kpiKey = extra && typeof extra.kpiKey === 'string' ? extra.kpiKey : undefined
        const claimFiltered = filterRowsForClaimKpi(opts.tableRows, label, kpiKey)
        const records = claimFiltered ?? opts.tableRows
        setDetail({
          title: label,
          subtitle: `${records.length} matching claim${records.length === 1 ? '' : 's'}`,
          records,
          columns: opts.columns ?? [],
          datasetTitle: label,
          source: opts.live ? 'api' : 'demo',
        })
        return
      }
      setDetail({
        title: label,
        subtitle: 'KPI Details',
        data: { value, ...extra },
        source: 'demo',
      })
    },
    []
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
