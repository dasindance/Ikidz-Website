import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all classes with active enrollments
    const classes = await prisma.class.findMany({
      include: {
        enrollments: {
          where: { isActive: true },
          include: {
            student: true,
          },
        },
      },
    })

    // Helper function to check if class is scheduled for a specific day
    const isClassOnDay = (classItem: any, date: Date) => {
      if (!classItem.daysOfWeek || classItem.daysOfWeek.length === 0) {
        return false
      }
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Convert Sunday from 0 to 7
      return classItem.daysOfWeek.includes(dayOfWeek)
    }

    // Build today's classes
    const todayClasses = classes
      .filter(c => isClassOnDay(c, today))
      .map(c => ({
        classId: c.id,
        className: c.name,
        date: today.toISOString(),
        time: c.startTime || 'TBD',
        students: c.enrollments.map(e => ({
          id: e.studentId,
          name: e.student.name,
          enrollmentId: e.id,
        })),
      }))

    // Build tomorrow's classes
    const tomorrowClasses = classes
      .filter(c => isClassOnDay(c, tomorrow))
      .map(c => ({
        classId: c.id,
        className: c.name,
        date: tomorrow.toISOString(),
        time: c.startTime || 'TBD',
        students: c.enrollments.map(e => ({
          id: e.studentId,
          name: e.student.name,
          enrollmentId: e.id,
        })),
      }))

    return NextResponse.json({
      today: todayClasses,
      tomorrow: tomorrowClasses,
    })
  } catch (error) {
    console.error('Error fetching upcoming classes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


