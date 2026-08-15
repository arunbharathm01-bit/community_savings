import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLastSunday } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const full = searchParams.get('full') === 'true'
  const isAdmin = ['LEADER', 'CO_LEADER'].includes(user.role)

  // Personal stats (or community for admin)
  const [totalDeposits, pendingPayments, fines, activeLoans, totalMembers] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId: user.id, type: 'WEEKLY_DEPOSIT' }, _sum: { amount: true } }),
    prisma.weeklyPayment.aggregate({ where: { userId: user.id, status: 'PENDING' }, _sum: { amount: true } }),
    prisma.weeklyPayment.aggregate({ where: { userId: user.id }, _sum: { fine: true } }),
    prisma.loan.aggregate({ where: { userId: user.id, status: 'ACTIVE' }, _sum: { remaining: true } }),
    isAdmin ? prisma.user.count({ where: { isActive: true } }) : Promise.resolve(0),
  ])

  const baseStats = {
    balance: totalDeposits._sum.amount ?? 0,
    pendingDue: pendingPayments._sum.amount ?? 0,
    fine: fines._sum.fine ?? 0,
    loanBalance: activeLoans._sum.remaining ?? 0,
    interest: 0,
    totalMembers,
    totalCollection: 0,
    totalLoans: 0,
    pendingDues: 0,
  }

  if (!full || !isAdmin) return NextResponse.json(baseStats)

  // Full admin stats with charts
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return { month: d.toLocaleDateString('en-IN', { month: 'short' }), date: d }
  })

  const monthlyCollection = await Promise.all(
    months.map(async ({ month, date }) => {
      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      const agg = await prisma.transaction.aggregate({
        where: { type: 'WEEKLY_DEPOSIT', date: { gte: start, lt: end } },
        _sum: { amount: true },
      })
      return { month, amount: agg._sum.amount ?? 0 }
    })
  )

  const fineCollection = await Promise.all(
    months.map(async ({ month, date }) => {
      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      const agg = await prisma.weeklyPayment.aggregate({
        where: { weekStart: { gte: start, lt: end } },
        _sum: { fine: true },
      })
      return { month, amount: agg._sum.fine ?? 0 }
    })
  )

  const loanGroups = await prisma.loan.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { approvedAmount: true },
  })

  const totalCollectionAll = await prisma.transaction.aggregate({ where: { type: 'WEEKLY_DEPOSIT' }, _sum: { amount: true } })
  const totalLoansAll = await prisma.loan.aggregate({ where: { status: 'ACTIVE' }, _sum: { remaining: true } })
  const pendingDuesAll = await prisma.weeklyPayment.aggregate({ where: { status: { in: ['PENDING', 'LATE'] } }, _sum: { amount: true } })

  return NextResponse.json({
    ...baseStats,
    totalCollection: totalCollectionAll._sum.amount ?? 0,
    totalLoans: totalLoansAll._sum.remaining ?? 0,
    pendingDues: pendingDuesAll._sum.amount ?? 0,
    monthlyCollection,
    fineCollection,
    loansByStatus: loanGroups.map((g) => ({ status: g.status, count: g._count.id, amount: g._sum.approvedAmount ?? 0 })),
  })
}
