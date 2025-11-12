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

    const classes = await prisma.class.findMany({
      include: {
        enrollments: {
          where: { isActive: true },
          include: {
            student: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            homeworkAssignments: true,
          },
        },
      },
    })

    const totalStudents = await prisma.student.count()
    
    const recentSubmissions = await prisma.homeworkSubmission.findMany({
      include: {
        student: true,
        assignment: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 10,
    })

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
      take: 5,
    })

    const recentLessons = await prisma.lesson.findMany({
      include: {
        class: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 5,
    })

    return NextResponse.json({
      classes,
      totalStudents,
      recentSubmissions,
      upcomingHomework,
      recentLessons,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

