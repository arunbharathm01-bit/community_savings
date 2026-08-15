import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLastSunday } from '@/lib/utils'

// Vercel Cron Job — runs every Monday at 6 AM IST
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = getLastSunday(0) // last Sunday
  const settings = await prisma.settings.findUnique({ where: { id: 'global' } })
  const fine = settings?.fineAmount ?? 10

  const late = await prisma.weeklyPayment.findMany({
    where: { weekStart, status: 'PENDING' },
    include: { user: { select: { id: true, name: true } } },
  })

  let count = 0
  for (const payment of late) {
    await prisma.weeklyPayment.update({
      where: { id: payment.id },
      data: { status: 'LATE', fine },
    })
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        message: `You missed this week's payment. A fine of ₹${fine} has been applied.`,
        type: 'FINE_APPLIED',
      },
    })
    count++
  }

  return NextResponse.json({ message: `Marked ${count} payments as late`, count })
}
