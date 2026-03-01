import { getGroup, getGroupExpenses } from '@/lib/api'
import {
  getTotalActiveUserPaidFor,
  getTotalActiveUserShare,
  getTotalGroupSpending,
} from '@/lib/totals'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const getGroupStatsProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      participantId: z.string().optional(),
    }),
  )
  .query(async ({ input: { groupId, participantId } }) => {
    const [expenses, group] = await Promise.all([
      getGroupExpenses(groupId),
      getGroup(groupId),
    ])
    const totalGroupSpendings = getTotalGroupSpending(expenses)

    const totalParticipantSpendings =
      participantId !== undefined
        ? getTotalActiveUserPaidFor(participantId, expenses)
        : undefined
    const totalParticipantShare =
      participantId !== undefined
        ? getTotalActiveUserShare(participantId, expenses)
        : undefined

    return {
      totalGroupSpendings,
      totalParticipantSpendings,
      totalParticipantShare,
      expenses: expenses.map((e) => ({
        id: e.id,
        expenseDate: e.expenseDate,
        amount: e.amount,
        isReimbursement: e.isReimbursement,
        paidBy: e.paidBy,
        category: e.category
          ? {
              id: e.category.id,
              grouping: e.category.grouping,
              name: e.category.name,
            }
          : null,
        paidFor: e.paidFor.map((pf) => ({
          participant: pf.participant,
          shares: Number(pf.shares),
        })),
        splitMode: e.splitMode,
      })),
      participants: group?.participants ?? [],
    }
  })
