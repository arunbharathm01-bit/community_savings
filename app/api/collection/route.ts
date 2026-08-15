import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLastSunday } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = getLastSunday(0)

  // Ensure all active members have a payment record for this week
  const members = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } })
  const settings = await prisma.settings.findUnique({ where: { id: 'global' } })
  const weeklyAmount = settings?.weeklyAmount ?? 50

  for (const m of members) {
    await prisma.weeklyPayment.upsert({
      where: { userId_weekStart: { userId: m.id, weekStart } },
      update: {},
      create: { userId: m.id, weekStart, amount: weeklyAmount, status: 'PENDING', fine: 0 },
    })
  }

  const entries = await prisma.weeklyPayment.findMany({
    where: { weekStart },
    include: { user: { select: { name: true, email: true, photo: true } } },
    orderBy: { user: { name: 'asc' } },
  })

  return NextResponse.json({ entries })
}
