import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { razorpay } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, paymentId } = await req.json()

  const order = await razorpay.orders.create({
    amount: Math.round(amount), // already in paise
    currency: 'INR',
    receipt: `wp_${paymentId}_${Date.now()}`,
    notes: { userId: user.id, paymentId },
  })

  return NextResponse.json({ orderId: order.id, amount: order.amount, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID })
}
