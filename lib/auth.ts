import { adminAuth } from './firebase-admin'
import { prisma } from './prisma'
import { NextRequest } from 'next/server'
import type { User } from '@prisma/client'

export async function getAuthUser(req: NextRequest): Promise<User | null> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return null

    const token = authHeader.split('Bearer ')[1]
    const decoded = await adminAuth.verifyIdToken(token)

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    })

    return user
  } catch {
    return null
  }
}

export function requireRole(user: User | null, ...roles: string[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

export function isLeader(user: User | null): boolean {
  return requireRole(user, 'LEADER')
}

export function isCoLeaderOrAbove(user: User | null): boolean {
  return requireRole(user, 'LEADER', 'CO_LEADER')
}

export function isManagerOrAbove(user: User | null): boolean {
  return requireRole(user, 'LEADER', 'CO_LEADER', 'MANAGER')
}
