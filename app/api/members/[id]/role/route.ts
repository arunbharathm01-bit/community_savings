import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req)
  if (!user || !['LEADER', 'CO_LEADER'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { role } = await req.json()

  const validRoles = ['LEADER', 'CO_LEADER', 'MANAGER', 'MEMBER']
  if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  // Only LEADER can promote to LEADER
  if (role === 'LEADER' && user.role !== 'LEADER')
    return NextResponse.json({ error: 'Only Leader can promote to Leader' }, { status: 403 })

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, role: true },
  })

  // Notify the user
  await prisma.notification.create({
    data: { userId: id, message: `Your role has been updated to ${role.replace('_', '-')}`, type: 'GENERAL' },
  })

  return NextResponse.json({ member: updated })
}
