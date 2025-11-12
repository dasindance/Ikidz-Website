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

    // For parents, get lessons for their enrolled students
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
      })

      return NextResponse.json(lessons)
    }

    // For teachers, get all lessons they've posted
    if (session.user.role === 'TEACHER') {
      const lessons = await prisma.lesson.findMany({
        include: {
          class: true,
        },
        orderBy: {
          date: 'desc',
        },
      })

      return NextResponse.json(lessons)
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching lessons:', error)
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
    const { classId, date, unit, topics, notes } = body

    const lesson = await prisma.lesson.create({
      data: {
        classId,
        date: new Date(date),
        unit,
        topics,
        notes,
      },
      include: {
        class: true,
      },
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


