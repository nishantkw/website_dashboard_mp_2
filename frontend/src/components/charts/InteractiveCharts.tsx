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
  return n.toLocaleString('en-IN', { maximumFractionDigits: 1 })
}

interface LineLabelProps {
  x?: number | string
  y?: number | string
  value?: any
  stroke: string
  seriesIndex: number
}

function LineValueLabel({ x, y, value, stroke, seriesIndex }: LineLabelProps) {
  if (x == null || y == null || value == null) return null
  const offsets = [
    { dx: 0, dy: -12 },
    { dx: 0, dy: 16 },
    { dx: 16, dy: -4 },
  ]
  const { dx, dy } = offsets[seriesIndex % offsets.length]
  return (
    <text
      x={Number(x) + dx}
      y={Number(y) + dy}
      textAnchor={dx > 0 ? 'start' : 'middle'}
      fill={stroke}
      fontSize={10}
      fontWeight={700}
      paintOrder="stroke"
      stroke="#fff"
      strokeWidth={3.5}
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
  xKey?: string
  cellColors?: string[]
}

export function InteractiveBarChart({
  data,
  bars,
  layout = 'horizontal',
  height = 260,
  onItemClick,
  chartTitle = 'Chart',
  showLegend = false,
  xKey = 'name',
  cellColors,
}: InteractiveBarChartProps) {
  const isVertical = layout === 'vertical'
  const handleClick = (entry: ChartClickPayload) => {
    onItemClick?.(entry, chartTitle)
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        barCategoryGap={isVertical ? '18%' : '22%'}
        barGap={4}
        margin={isVertical ? { top: 8, right: 88, left: 8, bottom: 8 } : { top: 36, right: 12, left: 8, bottom: showLegend ? 4 : 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        {isVertical ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatChartValue(v)} />
            <YAxis dataKey={xKey} type="category" tick={{ fontSize: 11, fill: '#475569' }} width={92} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={42} tickFormatter={(v) => formatChartValue(v)} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
        {showLegend && <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />}
        {bars.map((bar, barIdx) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.fill}
            name={bar.name ?? bar.dataKey}
            radius={isVertical ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            maxBarSize={36}
            style={CLICK_STYLE}
            onClick={(data) => {
              const payload = (data as { payload?: ChartClickPayload })?.payload
              if (payload) handleClick(payload)
            }}
          >
            <LabelList
              dataKey={bar.dataKey}
              position={isVertical ? 'right' : 'top'}
              formatter={(v) => formatChartValue(v)}
              style={{ fontSize: 9, fontWeight: 700, fill: '#334155' }}
            />
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
  const actualInner = innerRadius ? 45 : 0
  const actualOuter = innerRadius ? 75 : 70
  const totalVal = data.reduce((acc, curr) => acc + Number(curr.value || 0), 0)

  const renderPieLabel = (props: any) => {
    const { cx, x, y, percent, name, value, fill } = props
    if (percent === undefined) return null

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
    <div className="flex flex-col items-center w-full">
      <ResponsiveContainer width="100%" height={height - 60}>
        <PieChart margin={{ top: 20, right: 65, bottom: 20, left: 65 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={actualInner}
            outerRadius={actualOuter}
            minAngle={10}
            paddingAngle={actualInner ? 3 : 0}
            dataKey="value"
            style={CLICK_STYLE}
            label={showLabels ? renderPieLabel : false}
            labelLine={showLabels ? { strokeWidth: 1, stroke: '#9ca3af' } : false}
            onClick={(entry) => onItemClick?.(entry as unknown as ChartClickPayload, chartTitle)}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} style={CLICK_STYLE} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => Number(v).toLocaleString('en-IN')} />
        </PieChart>
      </ResponsiveContainer>

      {/* Color-Coded Item Legend Grid */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-2 px-2 border-t border-slate-100 w-full text-xs">
        {data.map((item, i) => {
          const valNum = Number(item.value || 0)
          const pct = totalVal > 0 ? ((valNum / totalVal) * 100).toFixed(0) : '0'
          return (
            <button
              key={i}
              onClick={() => onItemClick?.({ name: item.name, value: item.value } as ChartClickPayload, chartTitle)}
              className="flex items-center gap-1.5 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors cursor-pointer text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="font-semibold text-slate-700">{item.name}:</span>
              <span className="font-bold text-slate-900">{formatChartValue(valNum)}</span>
              <span className="text-[10px] text-slate-500 font-medium">({pct}%)</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface InteractiveLineChartProps {
  data: ChartDataPoint[]
  lines: { dataKey: string; stroke: string; name?: string; yAxisId?: string }[]
  height?: number
  onItemClick?: (payload: ChartClickPayload, chartTitle: string) => void
  chartTitle?: string
  dualAxis?: boolean
  showLegend?: boolean
}

export function InteractiveLineChart({
  data,
  lines,
  height = 260,
  onItemClick,
  chartTitle = 'Chart',
  dualAxis = false,
  showLegend = true,
}: InteractiveLineChartProps) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          style={CLICK_STYLE}
          margin={{ top: 28, right: dualAxis ? 36 : 16, left: 8, bottom: showLegend ? 8 : 4 }}
        >
          <defs>
            {lines.map((line) => (
              <linearGradient key={line.dataKey} id={`fill-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.stroke} stopOpacity={0.22} />
                <stop offset="100%" stopColor={line.stroke} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8eef0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          {dualAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
          )}
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          )}
          {lines.slice(0, 1).filter((line) => (line.yAxisId ?? 'left') !== 'right').map((line) => (
            <Area
              key={`area-${line.dataKey}`}
              yAxisId={line.yAxisId ?? 'left'}
              type="monotone"
              dataKey={line.dataKey}
              fill={`url(#fill-${line.dataKey})`}
              stroke="none"
              name={line.name ?? line.dataKey}
              legendType="none"
              isAnimationActive={false}
              activeDot={false}
            />
          ))}
          {lines.map((line, lineIdx) => {
            const axis = line.yAxisId ?? 'left'
            const isRight = axis === 'right'
            return (
              <Line
                key={line.dataKey}
                yAxisId={axis}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={isRight ? 2.75 : 2.4}
                name={line.name ?? line.dataKey}
                dot={{ r: 3.5, fill: '#fff', stroke: line.stroke, strokeWidth: 2 }}
                activeDot={{
                  r: 6,
                  fill: line.stroke,
                  stroke: '#fff',
                  strokeWidth: 2,
                  style: CLICK_STYLE,
                  onClick: (_e, payload) => {
                    const p = (payload as { payload?: ChartClickPayload })?.payload
                    if (p) onItemClick?.(p, chartTitle)
                  },
                }}
              >
                <LabelList
                  dataKey={line.dataKey}
                  content={(props) => (
                    <LineValueLabel
                      {...props}
                      stroke={line.stroke}
                      seriesIndex={lineIdx}
                    />
                  )}
                />
              </Line>
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
