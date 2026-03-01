import { getGroupExpenses } from '@/lib/api'

export function getTotalGroupSpending(
  expenses: NonNullable<Awaited<ReturnType<typeof getGroupExpenses>>>,
): number {
  return expenses.reduce(
    (total, expense) =>
      expense.isReimbursement ? total : total + expense.amount,
    0,
  )
}

export function getTotalActiveUserPaidFor(
  activeUserId: string | null,
  expenses: NonNullable<Awaited<ReturnType<typeof getGroupExpenses>>>,
): number {
  return expenses.reduce(
    (total, expense) =>
      expense.paidBy.id === activeUserId && !expense.isReimbursement
        ? total + expense.amount
        : total,
    0,
  )
}

type Expense = NonNullable<Awaited<ReturnType<typeof getGroupExpenses>>>[number]

export function calculateShare(
  participantId: string | null,
  expense: Pick<
    Expense,
    'amount' | 'paidFor' | 'splitMode' | 'isReimbursement'
  >,
): number {
  if (expense.isReimbursement) return 0

  const paidFors = expense.paidFor
  const userPaidFor = paidFors.find(
    (paidFor) => paidFor.participant.id === participantId,
  )

  if (!userPaidFor) return 0

  const shares = Number(userPaidFor.shares)

  switch (expense.splitMode) {
    case 'EVENLY':
      // Divide the total expense evenly among all participants
      return expense.amount / paidFors.length
    case 'BY_AMOUNT':
      // Directly add the user's share if the split mode is BY_AMOUNT
      return shares
    case 'BY_PERCENTAGE':
      // Calculate the user's share based on their percentage of the total expense
      return (expense.amount * shares) / 10000 // Assuming shares are out of 10000 for percentage
    case 'BY_SHARES':
      // Calculate the user's share based on their shares relative to the total shares
      const totalShares = paidFors.reduce(
        (sum, paidFor) => sum + Number(paidFor.shares),
        0,
      )
      return (expense.amount * shares) / totalShares
    default:
      return 0
  }
}

export function getTotalActiveUserShare(
  activeUserId: string | null,
  expenses: NonNullable<Awaited<ReturnType<typeof getGroupExpenses>>>,
): number {
  const total = expenses.reduce(
    (sum, expense) => sum + calculateShare(activeUserId, expense),
    0,
  )

  return parseFloat(total.toFixed(2))
}

export type StatsExpense = {
  id: string
  expenseDate: Date
  amount: number
  isReimbursement: boolean
  paidBy: { id: string; name: string }
  category: { id: number; grouping: string; name: string } | null
  paidFor: Array<{ participant: { id: string; name: string }; shares: number }>
  splitMode: string
}

export type StatsFilters = {
  participantId?: string
  categoryGrouping?: string
  categoryId?: number
  dateFrom?: string // YYYY-MM
  dateTo?: string // YYYY-MM
}

export type CategoryBreakdown = {
  categoryName: string
  grouping: string
  total: number
}

export type GroupingBreakdown = {
  grouping: string
  total: number
}

export type ParticipantBreakdown = {
  participantId: string
  participantName: string
  total: number
}

export function applyStatsFilters(
  expenses: StatsExpense[],
  filters: StatsFilters,
): StatsExpense[] {
  return expenses.filter((expense) => {
    if (expense.isReimbursement) return false

    if (
      filters.participantId !== undefined &&
      expense.paidBy.id !== filters.participantId
    ) {
      return false
    }

    if (
      filters.categoryGrouping !== undefined &&
      expense.category?.grouping !== filters.categoryGrouping
    ) {
      return false
    }

    if (
      filters.categoryId !== undefined &&
      expense.category?.id !== filters.categoryId
    ) {
      return false
    }

    if (filters.dateFrom !== undefined) {
      const expenseYM = expense.expenseDate.toISOString().slice(0, 7)
      if (expenseYM < filters.dateFrom) return false
    }

    if (filters.dateTo !== undefined) {
      const expenseYM = expense.expenseDate.toISOString().slice(0, 7)
      if (expenseYM > filters.dateTo) return false
    }

    return true
  })
}

export function getSpendingByCategory(
  expenses: StatsExpense[],
): CategoryBreakdown[] {
  const map = new Map<number | string, CategoryBreakdown>()

  for (const expense of expenses) {
    const key = expense.category?.id ?? 'uncategorized'
    const existing = map.get(key)
    if (existing) {
      existing.total += expense.amount
    } else {
      map.set(key, {
        categoryName: expense.category?.name ?? 'General',
        grouping: expense.category?.grouping ?? 'Uncategorized',
        total: expense.amount,
      })
    }
  }

  return Array.from(map.values())
}

export function getSpendingByGrouping(
  expenses: StatsExpense[],
): GroupingBreakdown[] {
  const map = new Map<string, number>()

  for (const expense of expenses) {
    const grouping = expense.category?.grouping ?? 'Uncategorized'
    map.set(grouping, (map.get(grouping) ?? 0) + expense.amount)
  }

  return Array.from(map.entries()).map(([grouping, total]) => ({
    grouping,
    total,
  }))
}

export function getSpendingByParticipant(
  expenses: StatsExpense[],
): ParticipantBreakdown[] {
  const map = new Map<string, ParticipantBreakdown>()

  for (const expense of expenses) {
    const { id, name } = expense.paidBy
    const existing = map.get(id)
    if (existing) {
      existing.total += expense.amount
    } else {
      map.set(id, {
        participantId: id,
        participantName: name,
        total: expense.amount,
      })
    }
  }

  return Array.from(map.values())
}
