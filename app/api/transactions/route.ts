import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const type = searchParams.get('type')
  const month = searchParams.get('month')
  const year = searchParams.get('year')
  const isAdmin = ['LEADER', 'CO_LEADER', 'MANAGER'].includes(user.role)
  const targetUserId = isAdmin && searchParams.get('userId') ? searchParams.get('userId')! : user.id

  const where: Record<string, unknown> = { userId: targetUserId }
  if (type) where.type = type
  if (month || year) {
    const y = parseInt(year || String(new Date().getFullYear()))
    const m = month ? parseInt(month) - 1 : 0
    where.date = {
      gte: month ? new Date(y, m, 1) : new Date(y, 0, 1),
      lt: month ? new Date(y, m + 1, 1) : new Date(y + 1, 0, 1),
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limit,
  })

  return NextResponse.json({ transactions })
}
