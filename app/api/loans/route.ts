import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateLoanInterest } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = ['LEADER', 'CO_LEADER'].includes(user.role)
  const loans = await prisma.loan.findMany({
    where: isAdmin ? {} : { userId: user.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ loans })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, reason } = await req.json()
  if (!amount || amount < 500) return NextResponse.json({ error: 'Minimum loan amount is ₹500' }, { status: 400 })

  // Check for existing active loan
  const existing = await prisma.loan.findFirst({
    where: { userId: user.id, status: { in: ['REQUESTED', 'APPROVED', 'ACTIVE'] } },
  })
  if (existing) return NextResponse.json({ error: 'You already have an active loan' }, { status: 409 })

  const settings = await prisma.settings.findUnique({ where: { id: 'global' } })
  const interest = calculateLoanInterest(amount, settings?.loanInterestRate ?? 10, settings?.loanUnitAmount ?? 500)

  const loan = await prisma.loan.create({
    data: { userId: user.id, requestedAmount: amount, reason, interest, remaining: amount + interest, status: 'REQUESTED' },
  })

  // Notify leaders
  const leaders = await prisma.user.findMany({ where: { role: { in: ['LEADER', 'CO_LEADER'] } } })
  await prisma.notification.createMany({
    data: leaders.map((l) => ({
      userId: l.id,
      message: `${user.name} requested a loan of ₹${amount}`,
      type: 'LOAN_REQUESTED' as const,
    })),
  })

  return NextResponse.json({ loan }, { status: 201 })
}
