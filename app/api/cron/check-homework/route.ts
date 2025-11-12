import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find homework due in the next 2 days that hasn't been submitted
    const upcomingHomework = await prisma.homeworkAssignment.findMany({
      where: {
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        class: {
          include: {
            enrollments: {
              where: { isActive: true },
              include: {
                student: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
          },
        },
        submissions: true,
      },
    })

    let notificationsSent = 0

    for (const homework of upcomingHomework) {
      const submittedStudentIds = homework.submissions.map((s) => s.studentId)

      for (const enrollment of homework.class.enrollments) {
        // Skip if already submitted
        if (submittedStudentIds.includes(enrollment.studentId)) {
          continue
        }

        // Check if we've already sent a reminder recently
        const recentNotification = await prisma.notification.findFirst({
          where: {
            userId: enrollment.student.parentId,
            type: 'NEW_HOMEWORK',
            message: {
              contains: homework.title,
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
            },
          },
        })

        if (!recentNotification) {
          await prisma.notification.create({
            data: {
              userId: enrollment.student.parentId,
              type: 'NEW_HOMEWORK',
              title: 'Homework Due Soon',
              message: `Reminder: ${homework.title} for ${homework.class.name} is due on ${homework.dueDate.toLocaleDateString()}.`,
            },
          })
          notificationsSent++
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent,
      homeworkChecked: upcomingHomework.length,
    })
  } catch (error) {
    console.error('Error checking homework:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


