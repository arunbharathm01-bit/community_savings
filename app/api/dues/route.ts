import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLastSunday } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.settings.findUnique({ where: { id: 'global' } })
  const weekStart = getLastSunday(0)

  const currentWeek = await prisma.weeklyPayment.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart } },
  })

  return NextResponse.json({
    weeklyAmount: settings?.weeklyAmount ?? 50,
    currentWeek: currentWeek ?? null,
    autoPayEnabled: false,
  })
}
