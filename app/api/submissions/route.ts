import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPublicUrl } from '@/lib/storage/upload'
import { z } from 'zod'

const submissionSchema = z.object({
  assignmentId: z.string(),
  studentId: z.string(),
  fileKey: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { assignmentId, studentId, fileKey, fileName, fileSize, notes } =
      submissionSchema.parse(body)

    // Verify the student belongs to this parent
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student || student.parentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create submission
    const submission = await prisma.homeworkSubmission.create({
      data: {
        assignmentId,
        studentId,
        fileUrl: getPublicUrl(fileKey),
        fileName,
        fileSize,
        notes,
      },
      include: {
        assignment: {
          include: {
            class: true,
          },
        },
        student: true,
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For parents, get their students' submissions
    if (session.user.role === 'PARENT') {
      const students = await prisma.student.findMany({
        where: { parentId: session.user.id },
      })

      const submissions = await prisma.homeworkSubmission.findMany({
        where: {
          studentId: { in: students.map((s) => s.id) },
        },
        include: {
          assignment: {
            include: {
              class: true,
            },
          },
          student: true,
        },
        orderBy: {
          submittedAt: 'desc',
        },
      })

      return NextResponse.json(submissions)
    }

    // For teachers, get all submissions
    if (session.user.role === 'TEACHER') {
      const submissions = await prisma.homeworkSubmission.findMany({
        include: {
          assignment: {
            include: {
              class: true,
            },
          },
          student: true,
        },
        orderBy: {
          submittedAt: 'desc',
        },
      })

      return NextResponse.json(submissions)
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


