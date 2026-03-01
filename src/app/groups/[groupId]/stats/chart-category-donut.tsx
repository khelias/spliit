'use client'

import { GroupingBreakdown } from '@/lib/totals'
import { formatCurrency } from '@/lib/utils'
import { Currency } from '@/lib/currency'
import { useLocale } from 'next-intl'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export const CHART_COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#0ea5e9', // sky
  '#f97316', // orange
]

export const GROUPING_COLOR_MAP: Record<string, string> = {
  'Food and Drink': CHART_COLORS[0],
  Transportation: CHART_COLORS[1],
  Home: CHART_COLORS[2],
  Entertainment: CHART_COLORS[3],
  Life: CHART_COLORS[4],
  Utilities: CHART_COLORS[5],
  Uncategorized: CHART_COLORS[6],
}

export function getGroupingColor(grouping: string, index: number): string {
  return GROUPING_COLOR_MAP[grouping] ?? CHART_COLORS[index % CHART_COLORS.length]
}

interface Props {
  data: GroupingBreakdown[]
  currency: Currency
}

export function ChartCategoryDonut({ data, currency }: Props) {
  const locale = useLocale()
  const total = data.reduce((s, d) => s + d.total, 0)

  const chartData = data.map((d, i) => ({
    name: d.grouping,
    value: d.total,
    color: getGroupingColor(d.grouping, i),
    pct: total > 0 ? Math.round((d.total / total) * 100) : 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => [
            value !== undefined ? formatCurrency(currency, value, locale) : '',
            '',
          ]}
        />
        <Legend
          formatter={(value, entry) => {
            const item = chartData.find((d) => d.name === value)
            return `${value} (${item?.pct ?? 0}%)`
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
