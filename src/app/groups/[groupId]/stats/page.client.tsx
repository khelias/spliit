'use client'

import { useCurrentGroup } from '@/app/groups/[groupId]/current-group-context'
import { TotalsGroupSpending } from '@/app/groups/[groupId]/stats/totals-group-spending'
import { TotalsYourShare } from '@/app/groups/[groupId]/stats/totals-your-share'
import { TotalsYourSpendings } from '@/app/groups/[groupId]/stats/totals-your-spending'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveUser } from '@/lib/hooks'
import {
  applyStatsFilters,
  getSpendingByCategory,
  getSpendingByGrouping,
  getSpendingByParticipant,
  StatsFilters,
} from '@/lib/totals'
import { getCurrencyFromGroup } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { StatsFiltersBar } from './stats-filters'

const ChartCategoryDonut = dynamic(
  () =>
    import('./chart-category-donut').then((m) => ({
      default: m.ChartCategoryDonut,
    })),
  { ssr: false },
)

const ChartCategoryBar = dynamic(
  () =>
    import('./chart-category-bar').then((m) => ({
      default: m.ChartCategoryBar,
    })),
  { ssr: false },
)

const ChartSpenderBar = dynamic(
  () =>
    import('./chart-spender-bar').then((m) => ({
      default: m.ChartSpenderBar,
    })),
  { ssr: false },
)

export function TotalsPageClient() {
  const { groupId, group } = useCurrentGroup()
  const activeUser = useActiveUser(groupId)
  const t = useTranslations('Stats')

  const [filters, setFilters] = useState<StatsFilters>({})

  const participantId =
    activeUser && activeUser !== 'None' ? activeUser : undefined

  const { data } = trpc.groups.stats.get.useQuery({
    groupId,
    participantId,
  })

  // Derive all unique category groupings and categories from expenses
  const { categoryGroupings, categories, allParticipants } = useMemo(() => {
    if (!data)
      return { categoryGroupings: [], categories: [], allParticipants: [] }

    const groupingsSet = new Set<string>()
    const catMap = new Map<
      number,
      { id: number; name: string; grouping: string }
    >()

    for (const e of data.expenses) {
      if (e.category) {
        groupingsSet.add(e.category.grouping)
        catMap.set(e.category.id, e.category)
      }
    }

    return {
      categoryGroupings: Array.from(groupingsSet).sort(),
      categories: Array.from(catMap.values()),
      allParticipants: data.participants,
    }
  }, [data])

  // Apply filters client-side
  const filteredExpenses = useMemo(() => {
    if (!data) return []
    return applyStatsFilters(data.expenses, filters)
  }, [data, filters])

  const groupingBreakdown = useMemo(
    () => getSpendingByGrouping(filteredExpenses),
    [filteredExpenses],
  )
  const categoryBreakdown = useMemo(
    () => getSpendingByCategory(filteredExpenses),
    [filteredExpenses],
  )
  const participantBreakdown = useMemo(
    () => getSpendingByParticipant(filteredExpenses),
    [filteredExpenses],
  )

  // Use inline computation instead of getTotalGroupSpending to avoid type mismatch
  const totalGroupSpendings = useMemo(
    () =>
      filteredExpenses.reduce(
        (total, expense) =>
          expense.isReimbursement ? total : total + expense.amount,
        0,
      ),
    [filteredExpenses],
  )

  const totalParticipantSpendings = useMemo(
    () =>
      participantId !== undefined
        ? filteredExpenses.reduce(
            (total, expense) =>
              expense.paidBy.id === participantId && !expense.isReimbursement
                ? total + expense.amount
                : total,
            0,
          )
        : undefined,
    [participantId, filteredExpenses],
  )

  const totalParticipantShare = useMemo(() => {
    if (participantId === undefined) return undefined
    const total = filteredExpenses.reduce((sum, expense) => {
      if (expense.isReimbursement) return sum
      const paidFors = expense.paidFor
      const userPaidFor = paidFors.find(
        (pf) => pf.participant.id === participantId,
      )
      if (!userPaidFor) return sum
      const shares = Number(userPaidFor.shares)
      switch (expense.splitMode) {
        case 'EVENLY':
          return sum + expense.amount / paidFors.length
        case 'BY_AMOUNT':
          return sum + shares
        case 'BY_PERCENTAGE':
          return sum + (expense.amount * shares) / 10000
        case 'BY_SHARES': {
          const totalShares = paidFors.reduce(
            (s, pf) => s + Number(pf.shares),
            0,
          )
          return sum + (expense.amount * shares) / totalShares
        }
        default:
          return sum
      }
    }, 0)
    return parseFloat(total.toFixed(2))
  }, [participantId, filteredExpenses])

  if (!data || !group) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('Totals.title')}</CardTitle>
          <CardDescription>{t('Totals.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <div className="flex flex-col gap-7">
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <Skeleton className="mt-1 h-3 w-48" />
                <Skeleton className="mt-3 h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const currency = getCurrencyFromGroup(group)
  const hasExpenses = filteredExpenses.length > 0

  return (
    <>
      {/* Filter bar */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <StatsFiltersBar
            participants={allParticipants}
            categoryGroupings={categoryGroupings}
            categories={categories}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </CardContent>
      </Card>

      {/* Totals + Donut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('Totals.title')}</CardTitle>
            <CardDescription>{t('Totals.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <TotalsGroupSpending
              totalGroupSpendings={totalGroupSpendings}
              currency={currency}
            />
            {participantId && (
              <>
                <TotalsYourSpendings
                  totalParticipantSpendings={totalParticipantSpendings}
                  currency={currency}
                />
                <TotalsYourShare
                  totalParticipantShare={totalParticipantShare}
                  currency={currency}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Charts.byGrouping')}</CardTitle>
            <CardDescription>
              {t('Charts.byGroupingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasExpenses && groupingBreakdown.length > 0 ? (
              <ChartCategoryDonut
                data={groupingBreakdown}
                currency={currency}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('noExpenses')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Horizontal bar chart by category */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('Charts.byCategory')}</CardTitle>
          <CardDescription>{t('Charts.byCategoryDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {hasExpenses && categoryBreakdown.length > 0 ? (
            <ChartCategoryBar data={categoryBreakdown} currency={currency} />
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('noExpenses')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bar chart by spender */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('Charts.bySpender')}</CardTitle>
          <CardDescription>{t('Charts.bySpenderDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {hasExpenses && participantBreakdown.length > 0 ? (
            <ChartSpenderBar
              data={participantBreakdown}
              currency={currency}
              activeParticipantId={participantId}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('noExpenses')}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
