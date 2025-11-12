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

    const totalParents = await prisma.user.count({
      where: { role: 'PARENT' },
    })

    const totalTeachers = await prisma.user.count({
      where: { role: 'TEACHER' },
    })

    const totalStudents = await prisma.student.count()

    const totalClasses = await prisma.class.count()

    // Get recent activity
    const recentSubmissions = await prisma.homeworkSubmission.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      include: {
        student: true,
        assignment: true,
      },
    })

    const recentLessons = await prisma.lesson.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        class: true,
      },
    })

    const recentActivity = [
      ...recentSubmissions.map(s => ({
        type: 'Submission',
        description: `${s.student.name} submitted ${s.assignment.title}`,
        createdAt: s.submittedAt,
      })),
      ...recentLessons.map(l => ({
        type: 'Lesson',
        description: `New lesson posted: ${l.unit} in ${l.class.name}`,
        createdAt: l.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10)

    return NextResponse.json({
      totalParents,
      totalTeachers,
      totalStudents,
      totalClasses,
      recentActivity,
    })
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
