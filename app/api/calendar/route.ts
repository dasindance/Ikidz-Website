import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get upcoming holidays
    const holidays = await prisma.holiday.findMany({
      where: {
        date: { gte: new Date() },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // For parents, get their enrolled classes' data
    if (session.user.role === 'PARENT') {
      const students = await prisma.student.findMany({
        where: { parentId: session.user.id },
        include: {
          enrollments: {
            where: { isActive: true },
          },
        },
      })

      const enrolledClassIds = students.flatMap((s) =>
        s.enrollments.map((e) => e.classId)
      )

      const upcomingHomework = await prisma.homeworkAssignment.findMany({
        where: {
          classId: { in: enrolledClassIds },
          dueDate: { gte: new Date() },
        },
        include: {
          class: true,
        },
        orderBy: {
          dueDate: 'asc',
        },
      })

      const lessons = await prisma.lesson.findMany({
        where: {
          classId: { in: enrolledClassIds },
        },
        include: {
          class: true,
        },
        orderBy: {
          date: 'desc',
        },
        take: 30,
      })

      return NextResponse.json({
        holidays,
        upcomingHomework,
        lessons,
      })
    }

    // For teachers, get all data
    if (session.user.role === 'TEACHER') {
      const upcomingHomework = await prisma.homeworkAssignment.findMany({
        where: {
          dueDate: { gte: new Date() },
        },
        include: {
          class: true,
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      })

      const lessons = await prisma.lesson.findMany({
        include: {
          class: true,
        },
        orderBy: {
          date: 'desc',
        },
        take: 50,
      })

      return NextResponse.json({
        holidays,
        upcomingHomework,
        lessons,
      })
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching calendar data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

