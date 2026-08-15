import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const members = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, phone: true, role: true, photo: true, joinDate: true, isActive: true },
    orderBy: [{ role: 'asc' }, { joinDate: 'asc' }],
  })

  return NextResponse.json({ members })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || !['LEADER', 'CO_LEADER'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, name, phone } = await req.json()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Member already exists' }, { status: 409 })

  const newMember = await prisma.user.create({
    data: { firebaseUid: `pending-${Date.now()}`, email, name, phone, role: 'MEMBER' },
  })
  return NextResponse.json({ member: newMember }, { status: 201 })
}
