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

    // For parents, get their students
    if (session.user.role === 'PARENT') {
      const students = await prisma.student.findMany({
        where: { parentId: session.user.id },
        include: {
          enrollments: {
            where: { isActive: true },
            include: {
              class: true,
            },
          },
        },
      })

      return NextResponse.json(students)
    }

    // For teachers and admins, get all students
    if (session.user.role === 'TEACHER' || session.user.role === 'ADMIN') {
      const students = await prisma.student.findMany({
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          enrollments: {
            where: { isActive: true },
            include: {
              class: true,
            },
          },
        },
      })

      return NextResponse.json(students)
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


