'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatsFilters as StatsFiltersType } from '@/lib/totals'
import { useTranslations } from 'next-intl'

export type { StatsFiltersType as StatsFilters }

interface StatsFiltersProps {
  participants: { id: string; name: string }[]
  categoryGroupings: string[]
  categories: { id: number; name: string; grouping: string }[]
  filters: StatsFiltersType
  onFiltersChange: (filters: StatsFiltersType) => void
}

export function StatsFiltersBar({
  participants,
  categoryGroupings,
  categories,
  filters,
  onFiltersChange,
}: StatsFiltersProps) {
  const t = useTranslations('Stats.Filters')

  const filteredCategories =
    filters.categoryGrouping !== undefined
      ? categories.filter((c) => c.grouping === filters.categoryGrouping)
      : categories

  const isAnyFilterActive =
    filters.participantId !== undefined ||
    filters.categoryGrouping !== undefined ||
    filters.categoryId !== undefined ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined

  function resetFilters() {
    onFiltersChange({
      participantId: undefined,
      categoryGrouping: undefined,
      categoryId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filters.participantId ?? '__everyone__'}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            participantId: v === '__everyone__' ? undefined : v,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-auto sm:min-w-[140px]">
          <SelectValue placeholder={t('spender')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__everyone__">{t('everyone')}</SelectItem>
          {participants.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryGrouping ?? '__all__'}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            categoryGrouping: v === '__all__' ? undefined : v,
            categoryId: undefined,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px]">
          <SelectValue placeholder={t('categoryGrouping')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('allGroupings')}</SelectItem>
          {categoryGroupings.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId !== undefined ? String(filters.categoryId) : '__all__'}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            categoryId: v === '__all__' ? undefined : Number(v),
          })
        }
      >
        <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px]">
          <SelectValue placeholder={t('category')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('allCategories')}</SelectItem>
          {filteredCategories.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground shrink-0">
            {t('dateFrom')}
          </span>
          <input
            type="month"
            value={filters.dateFrom ?? ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateFrom: e.target.value || undefined,
              })
            }
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground shrink-0">
            {t('dateTo')}
          </span>
          <input
            type="month"
            value={filters.dateTo ?? ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateTo: e.target.value || undefined,
              })
            }
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      {isAnyFilterActive && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10">
          {t('reset')}
        </Button>
      )}
    </div>
  )
}
