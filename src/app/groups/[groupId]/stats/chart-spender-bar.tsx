'use client'

import { ParticipantBreakdown } from '@/lib/totals'
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
import { CHART_COLORS } from './chart-category-donut'

interface Props {
  data: ParticipantBreakdown[]
  currency: Currency
  activeParticipantId?: string
}

export function ChartSpenderBar({ data, currency, activeParticipantId }: Props) {
  const locale = useLocale()

  const sorted = [...data].sort((a, b) => b.total - a.total)

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 44 + 40)}>
      <BarChart
        data={sorted}
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
          dataKey="participantName"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number | undefined, _name, props) => [
            value !== undefined ? formatCurrency(currency, value, locale) : '',
            props.payload?.participantName ?? '',
          ]}
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
          {sorted.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              opacity={
                activeParticipantId === undefined ||
                entry.participantId === activeParticipantId
                  ? 1
                  : 0.5
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
