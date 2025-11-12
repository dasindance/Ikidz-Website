import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { notifyMembershipRenewal } from '@/lib/notifications/create'

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find enrollments with low class count (2 or fewer classes remaining)
    const lowBalanceEnrollments = await prisma.enrollment.findMany({
      where: {
        isActive: true,
        classesRemaining: {
          lte: 2,
          gt: 0,
        },
      },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
        class: true,
      },
    })

    let notificationsSent = 0

    for (const enrollment of lowBalanceEnrollments) {
      // Check if we've already sent a notification recently (within 7 days)
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: enrollment.student.parentId,
          type: 'MEMBERSHIP_RENEWAL',
          message: {
            contains: enrollment.class.name,
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      })

      if (!recentNotification) {
        await notifyMembershipRenewal(
          enrollment.student.parentId,
          enrollment.student.name,
          enrollment.class.name,
          enrollment.classesRemaining
        )
        notificationsSent++
      }
    }

    // Find enrollments that are expiring soon (within 7 days)
    const expiringEnrollments = await prisma.enrollment.findMany({
      where: {
        isActive: true,
        expirationDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
        class: true,
      },
    })

    for (const enrollment of expiringEnrollments) {
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: enrollment.student.parentId,
          type: 'MEMBERSHIP_RENEWAL',
          message: {
            contains: enrollment.class.name,
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      })

      if (!recentNotification) {
        await prisma.notification.create({
          data: {
            userId: enrollment.student.parentId,
            type: 'MEMBERSHIP_RENEWAL',
            title: 'Class Membership Expiring Soon',
            message: `${enrollment.student.name}'s membership for ${enrollment.class.name} expires on ${enrollment.expirationDate?.toLocaleDateString()}. Please renew soon.`,
          },
        })
        notificationsSent++
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent,
      lowBalanceCount: lowBalanceEnrollments.length,
      expiringCount: expiringEnrollments.length,
    })
  } catch (error) {
    console.error('Error checking memberships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


