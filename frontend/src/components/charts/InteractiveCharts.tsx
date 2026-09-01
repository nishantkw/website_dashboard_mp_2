import {
  BarChart, Bar, PieChart, Pie, Cell, Line, LabelList,
  Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { ChartDataPoint } from '../../types'

const CLICK_STYLE = { cursor: 'pointer' }

function formatChartValue(value: unknown): string {
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  const abs = Math.abs(n)
  if (abs >= 10000000) {
    const cr = n / 10000000
    return `${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)} Cr`
  }
  if (abs >= 1000) {
    const k = n / 1000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`
  }
  if (Number.isInteger(n)) return n.toLocaleString('en-IN')
  return n.toLocaleString('en-IN', { maximumFractionDigits: abs < 1 ? 2 : 1 })
}

interface LineLabelProps {
  x?: number | string
  y?: number | string
  value?: unknown
  payload?: ChartClickPayload
}

/** Value label above each line/area point — click opens the same drill-down as the dot. */
function PointLabel({
  x,
  y,
  value,
  payload,
  onPointClick,
}: LineLabelProps & { onPointClick?: (payload: ChartClickPayload) => void }) {
  if (x == null || y == null || value == null) return null
  return (
    <text
      x={Number(x)}
      y={Number(y) - 8}
      textAnchor="middle"
      dominantBaseline="auto"
      className="fill-slate-700"
      fontSize={10}
      fontWeight={700}
      style={CLICK_STYLE}
      onClick={(e) => {
        e.stopPropagation()
        if (payload) onPointClick?.(payload)
      }}
    >
      {formatChartValue(value)}
    </text>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string; stroke?: string; dataKey?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const seen = new Set<string>()
  const items: typeof payload = []
  for (let i = payload.length - 1; i >= 0; i--) {
    const item = payload[i]
    const key = String(item.dataKey ?? item.name)
    if (seen.has(key)) continue
    seen.add(key)
    items.unshift(item)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.stroke }} />
              {item.name}
            </span>
            <span className="font-bold tabular-nums text-slate-900">{formatChartValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ChartClickPayload {
  name?: string
  value?: number
  [key: string]: string | number | undefined
}

interface InteractiveBarChartProps {
  data: ChartDataPoint[]
  bars: { dataKey: string; fill: string; name?: string }[]
  layout?: 'horizontal' | 'vertical'
  height?: number
  onItemClick?: (payload: ChartClickPayload, chartTitle: string) => void
  chartTitle?: string
  showLegend?: boolean
  showBarLabels?: boolean
  xKey?: string
  cellColors?: string[]
  integerAxis?: boolean
}

function truncateCategory(value: unknown, maxChars: number): string {
  const s = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (s.length <= maxChars) return s
  return `${s.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`
}

export function InteractiveBarChart({
  data,
  bars,
  layout = 'horizontal',
  height = 260,
  onItemClick,
  chartTitle = 'Chart',
  showLegend = false,
  showBarLabels,
  xKey = 'name',
  cellColors,
  integerAxis = false,
}: InteractiveBarChartProps) {
  const isVertical = layout === 'vertical'
  const manyCategories = data.length > 8
  const labelsOn = showBarLabels !== false
  const labelFontSize = data.length > 12 ? 8 : data.length > 8 ? 9 : 10
  const handleClick = (entry: ChartClickPayload) => {
    onItemClick?.(entry, chartTitle)
  }

  const longestLabel = data.reduce((n, row) => Math.max(n, String(row[xKey] ?? '').length), 0)
  const longLabels = isVertical && longestLabel > 16
  const yWidth = longLabels ? 188 : isVertical ? 120 : 44
  const maxChars = longLabels ? 30 : 22

  const valueKeys = bars.map((b) => b.dataKey)
  const maxVal = data.reduce((n, row) => {
    const rowMax = valueKeys.reduce((m, key) => Math.max(m, Number(row[key] ?? 0) || 0), 0)
    return Math.max(n, rowMax)
  }, 0)
  const integerTop = Math.max(1, Math.ceil(maxVal))
  const integerTicks =
    integerAxis && integerTop <= 8
      ? Array.from({ length: integerTop + 1 }, (_, i) => i)
      : undefined
  const yAxisProps = integerAxis
    ? {
        allowDecimals: false,
        domain: [0, integerTop] as [number, number],
        ticks: integerTicks,
        tickCount: integerTicks ? integerTicks.length : Math.min(6, Math.max(3, integerTop + 1)),
      }
    : {}

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        barCategoryGap={isVertical ? (longLabels ? '32%' : '22%') : '24%'}
        barGap={6}
        margin={
          isVertical
            ? { top: 8, right: labelsOn ? 44 : 20, left: 8, bottom: 8 }
            : {
                top: labelsOn ? 32 : 12,
                right: 12,
                left: 8,
                bottom: manyCategories ? 56 : showLegend ? 28 : 16,
              }
        }
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#eef2f6"
          vertical={isVertical}
          horizontal={!isVertical}
        />
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatChartValue(v)}
              {...yAxisProps}
            />
            <YAxis
              dataKey={xKey}
              type="category"
              interval={0}
              width={yWidth}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: longLabels ? 10 : 11, fill: '#475569' }}
              tickFormatter={(v) => truncateCategory(v, maxChars)}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={manyCategories ? -32 : 0}
              textAnchor={manyCategories ? 'end' : 'middle'}
              height={manyCategories ? 52 : 30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => formatChartValue(v)}
              {...yAxisProps}
            />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
        {showLegend && (
          <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
        )}
        {bars.map((bar, barIdx) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.fill}
            name={bar.name ?? bar.dataKey}
            radius={isVertical ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            maxBarSize={isVertical ? 22 : 32}
            style={CLICK_STYLE}
            onClick={(data) => {
              const evt = data as { payload?: ChartClickPayload; dataKey?: string }
              const payload = evt.payload
              if (payload) {
                handleClick({
                  ...payload,
                  _seriesKey: evt.dataKey ? String(evt.dataKey) : payload._seriesKey,
                })
              }
            }}
          >
            {labelsOn && (
              <LabelList
                dataKey={bar.dataKey}
                position={isVertical ? 'right' : 'top'}
                formatter={(v) => formatChartValue(v)}
                style={{ fontSize: labelFontSize, fontWeight: 700, fill: '#334155' }}
              />
            )}
            {cellColors && barIdx === 0 && data.map((_, i) => (
              <Cell key={i} fill={cellColors[i % cellColors.length]} style={CLICK_STYLE} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

interface InteractivePieChartProps {
  data: ChartDataPoint[]
  colors: string[]
  height?: number
  innerRadius?: number
  onItemClick?: (payload: ChartClickPayload, chartTitle: string) => void
  chartTitle?: string
  showLabels?: boolean
}

export function InteractivePieChart({
  data,
  colors,
  height = 320,
  innerRadius = 0,
  onItemClick,
  chartTitle = 'Chart',
  showLabels = true,
}: InteractivePieChartProps) {
  const isDonut = Boolean(innerRadius)
  const slices = [...data].sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
  const crowded = slices.length > 5
  const drawSliceLabels = showLabels && !crowded && !isDonut
  const actualInner = isDonut ? 58 : 0
  const actualOuter = isDonut ? 86 : 70
  const labelPadding = drawSliceLabels ? 70 : 8
  const chartHeight = Math.max(228, Math.min(height - 40, actualOuter * 2 + (drawSliceLabels ? 70 : 24)))
  const totalVal = slices.reduce((acc, curr) => acc + Number(curr.value || 0), 0)
  const gap = crowded ? 1 : slices.length <= 2 ? 3 : 2

  const renderPieLabel = (props: any) => {
    const { cx, x, y, percent, name, value, fill } = props
    if (percent === undefined || percent < 0.08) return null

    const textAnchor = x > cx ? 'start' : 'end'
    const formatted = formatChartValue(value)
    const pctStr = `${(percent * 100).toFixed(0)}%`

    return (
      <text
        x={x}
        y={y}
        fill={fill || '#374151'}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={10.5}
        fontWeight={600}
      >
        {`${name}: ${formatted} (${pctStr})`}
      </text>
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="relative flex w-full items-center justify-center" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: labelPadding, bottom: 8, left: labelPadding }}>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={actualInner}
              outerRadius={actualOuter}
              minAngle={crowded ? 2 : 6}
              paddingAngle={gap}
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
              style={CLICK_STYLE}
              label={drawSliceLabels ? renderPieLabel : false}
              labelLine={false}
              onClick={(entry) => onItemClick?.(entry as unknown as ChartClickPayload, chartTitle)}
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} style={CLICK_STYLE} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => Number(v).toLocaleString('en-IN')} />
          </PieChart>
        </ResponsiveContainer>
        {isDonut && totalVal > 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums leading-none text-slate-900 sm:text-xl">
              {formatChartValue(totalVal)}
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
          </div>
        )}
      </div>

      <div
        className={`mt-2 w-full border-t border-slate-100 px-2 pt-2 text-xs ${
          slices.length > 4 ? 'grid grid-cols-1 gap-1 sm:grid-cols-2' : 'flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5'
        }`}
      >
        {slices.map((item, i) => {
          const valNum = Number(item.value || 0)
          const pct = totalVal > 0 ? ((valNum / totalVal) * 100).toFixed(0) : '0'
          return (
            <button
              key={`${item.name}-${i}`}
              type="button"
              onClick={() => onItemClick?.({ name: item.name, value: item.value } as ChartClickPayload, chartTitle)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-slate-100"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="min-w-0 truncate font-semibold text-slate-700">{item.name}</span>
              <span className="ml-auto shrink-0 font-bold tabular-nums text-slate-900">{formatChartValue(valNum)}</span>
              <span className="shrink-0 text-[10px] font-medium text-slate-500">({pct}%)</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface InteractiveLineChartProps {
  data: ChartDataPoint[]
  lines: { dataKey: string; stroke: string; name?: string }[]
  height?: number
  onItemClick?: (payload: ChartClickPayload, chartTitle: string) => void
  chartTitle?: string
  /** Force integer y-axis ticks (counts, never fractional). */
  integerAxis?: boolean
}

/** Single-axis trend line. Never pass more than one series unless they share a unit —
 *  two measures of different scale belong in two charts, not two y-scales on one plot. */
export function InteractiveLineChart({
  data,
  lines,
  height = 260,
  onItemClick,
  chartTitle = 'Chart',
  integerAxis = false,
}: InteractiveLineChartProps) {
  const showLegend = lines.length > 1
  const dense = data.length > 10
  const showPointLabels = !dense
  const xInterval = dense ? Math.max(0, Math.ceil(data.length / 8) - 1) : 0

  const yAxisProps = integerAxis
    ? { allowDecimals: false, tickCount: 5 }
    : {}

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          style={CLICK_STYLE}
          margin={{ top: showPointLabels ? 24 : 12, right: 16, left: 4, bottom: dense ? 36 : showLegend ? 8 : 4 }}
          onClick={(state: { activePayload?: Array<{ payload?: ChartClickPayload }> }) => {
            const point = state?.activePayload?.[0]?.payload
            if (point) onItemClick?.(point, chartTitle)
          }}
        >
          <CartesianGrid stroke="#e8eef0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={{ stroke: '#d7dee2' }}
            tickLine={false}
            interval={xInterval}
            angle={dense ? -40 : 0}
            textAnchor={dense ? 'end' : 'middle'}
            height={dense ? 48 : 30}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => formatChartValue(v)}
            {...yAxisProps}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          )}
          {lines.map((line) => (
            <Area
              key={`area-${line.dataKey}`}
              type="monotone"
              dataKey={line.dataKey}
              fill={line.stroke}
              fillOpacity={0.08}
              stroke="none"
              name={line.name ?? line.dataKey}
              legendType="none"
              isAnimationActive={false}
              activeDot={false}
            />
          ))}
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeWidth={2}
              name={line.name ?? line.dataKey}
              dot={dense ? false : { r: 4, fill: line.stroke, stroke: '#fff', strokeWidth: 2 }}
              activeDot={(dotProps: { cx?: number; cy?: number; payload?: ChartClickPayload }) => (
                <circle
                  cx={dotProps.cx}
                  cy={dotProps.cy}
                  r={7}
                  fill={line.stroke}
                  stroke="#fff"
                  strokeWidth={2}
                  style={CLICK_STYLE}
                  onClick={() => {
                    if (dotProps.payload) onItemClick?.(dotProps.payload, chartTitle)
                  }}
                />
              )}
            >
              {showPointLabels && (
                <LabelList
                  dataKey={line.dataKey}
                  content={(props) => (
                    <PointLabel
                      {...props}
                      onPointClick={(payload) => onItemClick?.(payload, chartTitle)}
                    />
                  )}
                />
              )}
            </Line>
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
