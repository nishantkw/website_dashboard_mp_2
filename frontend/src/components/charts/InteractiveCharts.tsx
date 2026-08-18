import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { ChartDataPoint } from '../../types'

const CLICK_STYLE = { cursor: 'pointer' }

function formatChartValue(value: unknown): string {
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  if (n >= 10000000) {
    const cr = n / 10000000
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)} Cr`
  }
  if (n >= 100000) {
    const lakh = n / 100000
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} L`
  }
  if (Number.isInteger(n)) return n.toLocaleString('en-IN')
  return n.toLocaleString('en-IN', { maximumFractionDigits: 1 })
}

const LABEL_STYLE = { fontSize: 10, fontWeight: 600, fill: '#374151' }

interface LineLabelProps {
  x?: number | string
  y?: number | string
  value?: any
  stroke: string
  above: boolean
}

function LineValueLabel({ x, y, value, stroke, above }: LineLabelProps) {
  if (x == null || y == null || value == null) return null
  return (
    <text
      x={Number(x)}
      y={Number(y)}
      dy={above ? -10 : 16}
      textAnchor="middle"
      fill={stroke}
      fontSize={10}
      fontWeight={600}
      paintOrder="stroke"
      stroke="#fff"
      strokeWidth={3}
    >
      {formatChartValue(value)}
    </text>
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
        margin={isVertical ? { top: 10, right: 85, left: 10, bottom: 10 } : { top: 32, right: 15, left: 15, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        {isVertical ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey={xKey} type="category" tick={{ fontSize: 12 }} width={90} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
          </>
        )}
        <Tooltip />
        {showLegend && <Legend />}
        {bars.map((bar, barIdx) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.fill}
            name={bar.name ?? bar.dataKey}
            radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
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
              style={{ ...LABEL_STYLE, fill: bar.fill }}
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
  const multiLine = lines.length > 1

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        style={CLICK_STYLE}
        margin={{ top: multiLine ? 36 : 24, right: dualAxis ? 24 : 16, left: 8, bottom: multiLine ? 32 : 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
        {dualAxis && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />}
        <Tooltip />
        {showLegend && <Legend />}
        {lines.map((line, lineIdx) => (
          <Line
            key={line.dataKey}
            yAxisId={line.yAxisId ?? 'left'}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={2}
            name={line.name ?? line.dataKey}
            dot={{ r: 4, style: CLICK_STYLE }}
            activeDot={{
              r: 6,
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
                  above={!multiLine || lineIdx % 2 === 0}
                />
              )}
            />
          </Line>
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
