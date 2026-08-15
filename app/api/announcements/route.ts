import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')

  const announcements = await prisma.announcement.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { name: true, photo: true } },
      _count: { select: { likes: true, comments: true } },
      comments: {
        take: 10,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true } } },
      },
      likes: { where: { userId: user.id }, select: { id: true } },
    },
  })

  const result = announcements.map((a) => ({ ...a, userLiked: a.likes.length > 0, likes: undefined }))
  return NextResponse.json({ announcements: result })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || !['LEADER', 'CO_LEADER'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, content } = await req.json()
  if (!title || !content) return NextResponse.json({ error: 'Title and content required' }, { status: 400 })

  const ann = await prisma.announcement.create({
    data: { title, content, authorId: user.id },
    include: { author: { select: { name: true } } },
  })

  // Notify all members
  const members = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } })
  await prisma.notification.createMany({
    data: members.filter((m) => m.id !== user.id).map((m) => ({
      userId: m.id,
      message: `New announcement: ${title}`,
      type: 'ANNOUNCEMENT' as const,
    })),
  })

  return NextResponse.json({ announcement: ann }, { status: 201 })
}
