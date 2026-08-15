import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Settings ───────────────────────────────────────────────
  await prisma.settings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      weeklyAmount: 50,
      fineAmount: 10,
      loanInterestRate: 10,
      loanUnitAmount: 500,
      communityName: 'Sunrise Community',
    },
  })

  // ─── Test Users (Firebase UIDs are mocked for seed) ─────────
  const testUsers = [
    {
      firebaseUid: 'seed-leader-uid',
      name: 'Arun Kumar',
      email: 'leader@test.com',
      phone: '9876543210',
      role: 'LEADER' as const,
      photo: null,
    },
    {
      firebaseUid: 'seed-coleader-uid',
      name: 'Priya Sharma',
      email: 'coleader@test.com',
      phone: '9876543211',
      role: 'CO_LEADER' as const,
      photo: null,
    },
    {
      firebaseUid: 'seed-manager-uid',
      name: 'Ravi Patel',
      email: 'manager@test.com',
      phone: '9876543212',
      role: 'MANAGER' as const,
      photo: null,
    },
    {
      firebaseUid: 'seed-member-uid',
      name: 'Sunita Devi',
      email: 'member@test.com',
      phone: '9876543213',
      role: 'MEMBER' as const,
      photo: null,
    },
  ]

  const createdUsers: { [key: string]: string } = {}

  for (const u of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, isVerified: true },
      create: {
        ...u,
        isVerified: true,
        joinDate: new Date('2024-01-07'),
      },
    })
    createdUsers[u.role] = user.id
    console.log(`✅ User created: ${u.name} (${u.role})`)
  }

  // ─── Sample Weekly Payments (last 4 weeks) ───────────────────
  const now = new Date()
  const getLastSunday = (weeksAgo: number) => {
    const d = new Date(now)
    const day = d.getDay()
    d.setDate(d.getDate() - day - weeksAgo * 7)
    d.setHours(0, 0, 0, 0)
    return d
  }

  for (const role of ['LEADER', 'CO_LEADER', 'MANAGER', 'MEMBER']) {
    const userId = createdUsers[role]
    for (let w = 3; w >= 1; w--) {
      const weekStart = getLastSunday(w)
      await prisma.weeklyPayment.upsert({
        where: { userId_weekStart: { userId, weekStart } },
        update: {},
        create: {
          userId,
          weekStart,
          amount: 50,
          status: 'PAID',
          fine: 0,
          paidAt: new Date(weekStart.getTime() + 2 * 60 * 60 * 1000),
        },
      })
    }
    const currentWeek = getLastSunday(0)
    await prisma.weeklyPayment.upsert({
      where: { userId_weekStart: { userId, weekStart: currentWeek } },
      update: {},
      create: {
        userId,
        weekStart: currentWeek,
        amount: 50,
        status: role === 'MEMBER' ? 'PENDING' : 'PAID',
        fine: 0,
        paidAt: role === 'MEMBER' ? null : new Date(),
      },
    })
  }

  // ─── Sample Transactions ─────────────────────────────────────
  const leaderId = createdUsers['LEADER']
  const memberId = createdUsers['MEMBER']

  const sampleTxns = [
    { userId: leaderId, type: 'WEEKLY_DEPOSIT' as const, amount: 50, balance: 200, description: 'Weekly deposit - Week 1', date: new Date('2024-08-02') },
    { userId: leaderId, type: 'WEEKLY_DEPOSIT' as const, amount: 50, balance: 250, description: 'Weekly deposit - Week 2', date: new Date('2024-08-09') },
    { userId: memberId, type: 'WEEKLY_DEPOSIT' as const, amount: 50, balance: 150, description: 'Weekly deposit - Week 1', date: new Date('2024-08-02') },
    { userId: memberId, type: 'FINE' as const, amount: -10, balance: 140, description: 'Late payment fine', date: new Date('2024-08-12') },
    { userId: memberId, type: 'LOAN_DISBURSED' as const, amount: 1000, balance: 1140, description: 'Loan disbursed', date: new Date('2024-08-15') },
    { userId: memberId, type: 'INTEREST' as const, amount: -20, balance: 1120, description: 'Loan interest', date: new Date('2024-08-15') },
  ]

  for (const txn of sampleTxns) {
    await prisma.transaction.create({ data: txn })
  }

  // ─── Sample Loan ─────────────────────────────────────────────
  await prisma.loan.create({
    data: {
      userId: memberId,
      requestedAmount: 1500,
      approvedAmount: 1000,
      reason: 'Medical emergency',
      interest: 20,
      remaining: 1020,
      status: 'ACTIVE',
      approvedById: leaderId,
      approvedAt: new Date('2024-08-15'),
    },
  })

  // ─── Sample Announcements ────────────────────────────────────
  const ann1 = await prisma.announcement.create({
    data: {
      title: 'Festival Celebration 🎉',
      content: 'Everyone come before 8AM. Venue: Temple. Dress code: Traditional attire. Prasadam will be distributed.',
      authorId: leaderId,
      createdAt: new Date('2024-08-01'),
    },
  })

  await prisma.announcement.create({
    data: {
      title: 'Weekly Collection Reminder',
      content: 'This Sunday is collection day. Please ensure your ₹50 is ready. Late payments will incur a ₹10 fine.',
      authorId: leaderId,
      createdAt: new Date('2024-08-03'),
    },
  })

  await prisma.like.create({
    data: { announcementId: ann1.id, userId: memberId },
  })
  await prisma.comment.create({
    data: {
      announcementId: ann1.id,
      userId: memberId,
      message: 'Will be there! 🙏',
    },
  })

  // ─── Sample Notifications ────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: memberId, message: 'Tomorrow is collection day. Please keep ₹50 ready.', type: 'PAYMENT_DUE', read: false },
      { userId: memberId, message: 'Your loan of ₹1,000 has been approved by the Leader.', type: 'LOAN_APPROVED', read: true },
      { userId: memberId, message: 'A fine of ₹10 has been applied for late payment.', type: 'FINE_APPLIED', read: true },
    ],
  })

  console.log('\n🎉 Seed complete!')
  console.log('─────────────────────────────')
  console.log('Test Accounts:')
  console.log('Leader:    leader@test.com    / Leader@123')
  console.log('Co-Leader: coleader@test.com  / CoLeader@123')
  console.log('Manager:   manager@test.com   / Manager@123')
  console.log('Member:    member@test.com    / Member@123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
