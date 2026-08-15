import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.split('Bearer ')[1]
    const decoded = await adminAuth.verifyIdToken(token)
    const { name, email, photo } = await req.json()

    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: { name: name || decoded.name, photo: photo || null },
      create: {
        firebaseUid: decoded.uid,
        email: email || decoded.email || '',
        name: name || decoded.name || email?.split('@')[0] || 'User',
        photo: photo || null,
        isVerified: decoded.email_verified ?? false,
        role: 'MEMBER',
      },
    })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('Auth sync error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
