import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { amount } = await req.json()

  const loan = await prisma.loan.findUnique({ where: { id } })
  if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
  if (loan.userId !== user.id && !['LEADER', 'CO_LEADER'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (loan.status !== 'ACTIVE') return NextResponse.json({ error: 'Loan is not active' }, { status: 409 })

  const repayAmount = Math.min(amount, loan.remaining)
  const newRemaining = loan.remaining - repayAmount

  await prisma.loanRepayment.create({
    data: { loanId: id, amount: repayAmount, interest: 0 },
  })

  const updated = await prisma.loan.update({
    where: { id },
    data: { remaining: newRemaining, status: newRemaining <= 0 ? 'COMPLETED' : 'ACTIVE' },
  })

  const lastTxn = await prisma.transaction.findFirst({ where: { userId: loan.userId }, orderBy: { date: 'desc' } })
  await prisma.transaction.create({
    data: {
      userId: loan.userId,
      type: 'LOAN_REPAYMENT',
      amount: -repayAmount,
      balance: (lastTxn?.balance ?? 0) - repayAmount,
      description: `Loan repayment — Remaining: ₹${newRemaining}`,
    },
  })

  return NextResponse.json({ loan: updated })
}
