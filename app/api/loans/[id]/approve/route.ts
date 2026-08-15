import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user || !['LEADER', 'CO_LEADER'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { approved, approvedAmount } = await req.json()

  const loan = await prisma.loan.findUnique({ where: { id } })
  if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
  if (loan.status !== 'REQUESTED') return NextResponse.json({ error: 'Loan already processed' }, { status: 409 })

  const finalAmount = approvedAmount || loan.requestedAmount

  const updated = await prisma.loan.update({
    where: { id },
    data: {
      status: approved ? 'ACTIVE' : 'REJECTED',
      approvedAmount: approved ? finalAmount : null,
      remaining: approved ? finalAmount + loan.interest : 0,
      approvedById: user.id,
      approvedAt: new Date(),
    },
  })

  if (approved) {
    // Disburse loan — add transaction
    const lastTxn = await prisma.transaction.findFirst({ where: { userId: loan.userId }, orderBy: { date: 'desc' } })
    const prevBalance = lastTxn?.balance ?? 0
    await prisma.transaction.create({
      data: { userId: loan.userId, type: 'LOAN_DISBURSED', amount: finalAmount, balance: prevBalance + finalAmount, description: `Loan disbursed — Approved by ${user.name}` },
    })
    if (loan.interest > 0) {
      await prisma.transaction.create({
        data: { userId: loan.userId, type: 'INTEREST', amount: -loan.interest, balance: prevBalance + finalAmount - loan.interest, description: `Loan interest charge` },
      })
    }
  }

  await prisma.notification.create({
    data: {
      userId: loan.userId,
      message: approved ? `Your loan of ₹${finalAmount} has been approved!` : `Your loan request has been rejected.`,
      type: approved ? 'LOAN_APPROVED' : 'LOAN_REJECTED',
    },
  })

  return NextResponse.json({ loan: updated })
}
