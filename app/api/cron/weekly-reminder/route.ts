import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Vercel Cron — runs every Saturday at 8 AM IST
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const members = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } })

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.id,
      message: 'Tomorrow is collection day! Please keep ₹50 ready for your weekly due.',
      type: 'PAYMENT_DUE' as const,
    })),
  })

  return NextResponse.json({ message: `Reminders sent to ${members.length} members` })
}
