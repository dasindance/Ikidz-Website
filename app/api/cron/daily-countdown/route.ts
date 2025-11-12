import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { formatRenewalMessage } from '@/lib/renewal-calculator'

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        isActive: true,
        classesRemaining: {
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

    for (const enrollment of enrollments) {
      // Check if notification was already sent today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: enrollment.student.parentId,
          type: 'MEMBERSHIP_RENEWAL',
          createdAt: {
            gte: today,
          },
          message: {
            contains: enrollment.student.name,
          },
        },
      })

      if (existingNotification) {
        continue // Already sent today
      }

      // Create daily countdown notification
      const message = formatRenewalMessage(
        enrollment.classesRemaining,
        enrollment.renewalDate
      )

      await prisma.notification.create({
        data: {
          userId: enrollment.student.parentId,
          type: 'MEMBERSHIP_RENEWAL',
          title: `📚 Class Update for ${enrollment.student.name}`,
          message: `${enrollment.class.name}: ${message}`,
        },
      })

      notificationsSent++

      // Send email for urgent renewals (2 or fewer classes)
      if (enrollment.classesRemaining <= 2 && enrollment.student.parent.emailPreferences) {
        // Email sending would happen here
        // For now, just mark that we should send it
        console.log(`Would send renewal email to ${enrollment.student.parent.email}`)
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent,
      enrollmentsChecked: enrollments.length,
    })
  } catch (error) {
    console.error('Error in daily countdown cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


