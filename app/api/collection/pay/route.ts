import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || !['LEADER', 'CO_LEADER', 'MANAGER'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { paymentId, status } = await req.json()

  const payment = await prisma.weeklyPayment.findUnique({
    where: { id: paymentId },
    include: { user: true },
  })
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

  const updated = await prisma.weeklyPayment.update({
    where: { id: paymentId },
    data: { status, paidAt: status === 'PAID' ? new Date() : null },
  })

  // Create transaction record
  if (status === 'PAID') {
    const lastTxn = await prisma.transaction.findFirst({
      where: { userId: payment.userId },
      orderBy: { date: 'desc' },
    })
    const prevBalance = lastTxn?.balance ?? 0
    await prisma.transaction.create({
      data: {
        userId: payment.userId,
        type: 'WEEKLY_DEPOSIT',
        amount: payment.amount,
        balance: prevBalance + payment.amount,
        description: `Weekly deposit — ${new Date(payment.weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      },
    })
    await prisma.notification.create({
      data: { userId: payment.userId, message: `Your weekly payment of ₹${payment.amount} has been received.`, type: 'PAYMENT_RECEIVED' },
    })
  }

  return NextResponse.json({ payment: updated })
}
