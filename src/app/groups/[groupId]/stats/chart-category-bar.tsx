'use client'

import { CategoryBreakdown } from '@/lib/totals'
import { formatCurrency } from '@/lib/utils'
import { Currency } from '@/lib/currency'
import { useLocale } from 'next-intl'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getGroupingColor } from './chart-category-donut'

const MAX_ITEMS = 10

const MAX_CATEGORY_NAME_LENGTH = 18

interface Props {
  data: CategoryBreakdown[]
  currency: Currency
}

export function ChartCategoryBar({ data, currency }: Props) {
  const locale = useLocale()

  const sorted = [...data].sort((a, b) => b.total - a.total)
  const displayed = sorted.slice(0, MAX_ITEMS)
  const remainder = sorted.length - MAX_ITEMS

  const chartData = displayed.map((d) => ({
    name:
      d.categoryName.length > MAX_CATEGORY_NAME_LENGTH
        ? d.categoryName.slice(0, MAX_CATEGORY_NAME_LENGTH - 1) + '…'
        : d.categoryName,
    fullName: d.categoryName,
    value: d.total,
    grouping: d.grouping,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36 + 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatCurrency(currency, v, locale)}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number | undefined, _name, props) => [
              value !== undefined ? formatCurrency(currency, value, locale) : '',
              props.payload?.fullName ?? '',
            ]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getGroupingColor(entry.grouping, index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {remainder > 0 && (
        <p className="text-sm text-muted-foreground text-center mt-1">
          …and {remainder} more
        </p>
      )}
    </div>
  )
}
