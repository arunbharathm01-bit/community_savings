import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyRazorpaySignature } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = await req.json()

  const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
  if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  // Mark weekly payment as paid
  const payment = await prisma.weeklyPayment.update({
    where: { id: paymentId },
    data: { status: 'PAID', paidAt: new Date(), paymentRef: razorpay_payment_id },
  })

  // Create transaction
  const lastTxn = await prisma.transaction.findFirst({ where: { userId: user.id }, orderBy: { date: 'desc' } })
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'WEEKLY_DEPOSIT',
      amount: payment.amount,
      balance: (lastTxn?.balance ?? 0) + payment.amount,
      description: `Weekly deposit via UPI`,
      reference: razorpay_payment_id,
    },
  })

  if (payment.fine > 0) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'FINE',
        amount: -payment.fine,
        balance: (lastTxn?.balance ?? 0) + payment.amount - payment.fine,
        description: `Late payment fine`,
      },
    })
  }

  return NextResponse.json({ success: true })
}
