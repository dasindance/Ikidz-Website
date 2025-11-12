import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalEnrollments = await prisma.enrollment.count({
      where: { isActive: true },
    })

    const totalLessons = await prisma.lesson.count()

    const totalHomework = await prisma.homeworkAssignment.count()

    const totalSubmissions = await prisma.homeworkSubmission.count()

    // Get students with low class counts
    const renewalAlerts = await prisma.enrollment.findMany({
      where: {
        isActive: true,
        classesRemaining: {
          lte: 2,
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

    const formattedAlerts = renewalAlerts.map(enrollment => ({
      studentName: enrollment.student.name,
      className: enrollment.class.name,
      classesRemaining: enrollment.classesRemaining,
      parentName: enrollment.student.parent.name,
      parentEmail: enrollment.student.parent.email,
    }))

    // Recent activity
    const recentSubmissions = await prisma.homeworkSubmission.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      include: {
        student: true,
        assignment: true,
      },
    })

    const recentActivity = recentSubmissions.map(s => ({
      description: `${s.student.name} submitted ${s.assignment.title}`,
      createdAt: s.submittedAt,
    }))

    return NextResponse.json({
      totalEnrollments,
      totalLessons,
      totalHomework,
      totalSubmissions,
      renewalAlerts: formattedAlerts,
      recentActivity,
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

