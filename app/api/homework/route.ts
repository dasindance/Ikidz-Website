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

    // For parents, get homework for their enrolled students
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

      const homework = await prisma.homeworkAssignment.findMany({
        where: {
          classId: { in: enrolledClassIds },
        },
        include: {
          class: true,
          submissions: {
            where: {
              studentId: { in: students.map((s) => s.id) },
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      })

      return NextResponse.json(homework)
    }

    // For teachers, get all homework they've assigned
    if (session.user.role === 'TEACHER') {
      const homework = await prisma.homeworkAssignment.findMany({
        include: {
          class: true,
          submissions: {
            include: {
              student: true,
            },
          },
        },
        orderBy: {
          dueDate: 'desc',
        },
      })

      return NextResponse.json(homework)
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching homework:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { classId, title, description, dueDate } = body

    const homework = await prisma.homeworkAssignment.create({
      data: {
        classId,
        title,
        description,
        dueDate: new Date(dueDate),
      },
      include: {
        class: true,
      },
    })

    // Create notifications for parents of enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { classId, isActive: true },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
      },
    })

    const notifications = enrollments.map((enrollment) => ({
      userId: enrollment.student.parentId,
      type: 'NEW_HOMEWORK' as const,
      title: 'New Homework Assignment',
      message: `New homework assigned in ${homework.class.name}: ${title}`,
    }))

    await prisma.notification.createMany({
      data: notifications,
    })

    return NextResponse.json(homework, { status: 201 })
  } catch (error) {
    console.error('Error creating homework:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


