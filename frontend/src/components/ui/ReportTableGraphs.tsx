import { useMemo, useState } from 'react'
import { BarChart3, Plus, Trash2, X } from 'lucide-react'
import ChartCard from './ChartCard'
import { InteractiveBarChart, InteractiveLineChart, InteractivePieChart } from '../charts/InteractiveCharts'
import type { TableColumn } from '../../types'
import {
  aggregateReportGraph,
  columnLabel,
  createGraphSpec,
  getCategoryColumns,
  getValueColumns,
  suggestGraphs,
  type ReportChartType,
  type ReportGraphSpec,
} from '../../utils/reportTableCharts'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#94a3b8', '#ec4899']

interface ReportTableGraphsProps {
  tableTitle: string
  columns: TableColumn[]
  data: Record<string, string | number>[]
}

export default function ReportTableGraphs({ tableTitle, columns, data }: ReportTableGraphsProps) {
  const [graphs, setGraphs] = useState<ReportGraphSpec[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [draftType, setDraftType] = useState<ReportChartType>('bar')
  const [draftCategory, setDraftCategory] = useState('')
  const [draftValue, setDraftValue] = useState('__count__')
  const [draftTopN, setDraftTopN] = useState(8)

  const categoryOptions = useMemo(() => getCategoryColumns(columns, data), [columns, data])
  const valueOptions = useMemo(() => getValueColumns(columns, data), [columns, data])
  const canAddGraph = categoryOptions.length > 0 && data.length > 0

  const openPanel = () => {
    const firstCat = categoryOptions[0]?.key ?? ''
    setDraftType('bar')
    setDraftCategory(firstCat)
    setDraftValue('__count__')
    setDraftTopN(8)
    setPanelOpen(true)
  }

  const addGraph = () => {
    if (!draftCategory) return
    const spec = createGraphSpec(columns, data, {
      type: draftType,
      categoryKey: draftCategory,
      valueKey: draftValue,
      topN: draftTopN,
    })
    if (!spec) return
    setGraphs((prev) => [...prev, spec])
    setPanelOpen(false)
  }

  const addSuggested = () => {
    const suggestions = suggestGraphs(columns, data)
    setGraphs((prev) => [
      ...prev,
      ...suggestions.map((s) => ({
        ...s,
        id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      })),
    ])
  }

  const removeGraph = (id: string) => {
    setGraphs((prev) => prev.filter((g) => g.id !== id))
  }

  if (!canAddGraph && graphs.length === 0) return null

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
          <BarChart3 className="h-4 w-4 shrink-0 text-[#1a5c38]" />
          <span className="font-medium text-[#1a5c38]">Graphs for this table</span>
          <span className="truncate text-xs text-slate-500">
            {graphs.length
              ? `${graphs.length} chart${graphs.length === 1 ? '' : 's'} · options from ${tableTitle} columns`
              : 'Add charts from columns available in this report table'}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {graphs.length === 0 && canAddGraph && (
            <button
              type="button"
              onClick={addSuggested}
              className="rounded-lg border border-[#c5e0ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a5c38] hover:bg-[#e8f5ec]"
            >
              Quick suggest
            </button>
          )}
          {canAddGraph && (
            <button
              type="button"
              onClick={openPanel}
              className="inline-flex items-center gap-1 rounded-lg bg-[#1a5c38] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2d8a4e]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add graph
            </button>
          )}
        </div>
      </div>

      {panelOpen && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">Choose a graph for this table</p>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Only fields from <strong>{tableTitle}</strong> are listed below.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-xs font-semibold text-slate-600">
              Chart type
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value as ReportChartType)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-800 outline-none focus:border-[#2d8a4e]"
              >
                <option value="bar">Bar chart</option>
                <option value="pie">Pie / donut</option>
                <option value="line">Line chart</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Group by (category)
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-800 outline-none focus:border-[#2d8a4e]"
              >
                {categoryOptions.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Measure (value)
              <select
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-800 outline-none focus:border-[#2d8a4e]"
              >
                <option value="__count__">Record count</option>
                {valueOptions.map((c) => (
                  <option key={c.key} value={c.key}>
                    Sum of {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Top categories
              <select
                value={draftTopN}
                onChange={(e) => setDraftTopN(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-800 outline-none focus:border-[#2d8a4e]"
              >
                {[5, 6, 8, 10, 12, 15].map((n) => (
                  <option key={n} value={n}>
                    Top {n} + Others
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addGraph}
              disabled={!draftCategory}
              className="rounded-lg bg-[#1a5c38] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2d8a4e] disabled:opacity-50"
            >
              Add to report
            </button>
          </div>
        </div>
      )}

      {graphs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {graphs.map((spec) => {
            const series = aggregateReportGraph(data, spec)
            const catLabel = columnLabel(columns, spec.categoryKey)
            const valLabel = columnLabel(columns, spec.valueKey)
            const title = `${catLabel} — ${valLabel}`
            const height = Math.min(380, Math.max(220, series.length * 36 + 72))
            return (
              <div key={spec.id}>
                <ChartCard
                  title={title}
                  subtitle={`${tableTitle} · ${spec.type} chart`}
                  exportData={series}
                  actions={
                    <button
                      type="button"
                      onClick={() => removeGraph(spec.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      title="Remove graph"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  }
                >
                  {spec.type === 'pie' && (
                    <InteractivePieChart
                      data={series}
                      colors={PIE_COLORS}
                      innerRadius={55}
                      chartTitle={title}
                    />
                  )}
                  {spec.type === 'bar' && (
                    <InteractiveBarChart
                      data={series}
                      chartTitle={title}
                      layout="vertical"
                      height={height}
                      integerAxis={spec.valueKey === '__count__'}
                      bars={[{ dataKey: 'value', fill: '#2563eb', name: valLabel }]}
                    />
                  )}
                  {spec.type === 'line' && (
                    <InteractiveLineChart
                      data={series}
                      chartTitle={title}
                      height={260}
                      integerAxis={spec.valueKey === '__count__'}
                      lines={[{ dataKey: 'value', stroke: '#059669', name: valLabel }]}
                    />
                  )}
                </ChartCard>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
