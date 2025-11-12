import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const bulkHomeworkSchema = z.object({
  classId: z.string(),
  unitName: z.string(),
  description: z.string(),
  numberOfClasses: z.number().min(1).max(20),
  startDate: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { classId, unitName, description, numberOfClasses, startDate } = bulkHomeworkSchema.parse(body)

    // Get class information
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
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
    })

    if (!classInfo) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Calculate class dates based on schedule
    const classDates = calculateClassDates(
      new Date(startDate),
      classInfo.daysOfWeek || [1, 3, 5], // Default to Mon/Wed/Fri if not set
      numberOfClasses
    )

    // Create homework assignments
    const homeworkAssignments = []
    
    for (let i = 0; i < classDates.length; i++) {
      const classDate = classDates[i]
      const dueDate = new Date(classDate)
      dueDate.setDate(dueDate.getDate() - 1) // Due day before class

      const homework = await prisma.homeworkAssignment.create({
        data: {
          classId,
          title: `${unitName} - Lesson ${i + 1}`,
          description: `${description}\n\n(Part ${i + 1} of ${numberOfClasses})`,
          dueDate,
        },
      })

      homeworkAssignments.push(homework)

      // Create notifications for parents
      for (const enrollment of classInfo.enrollments) {
        await prisma.notification.create({
          data: {
            userId: enrollment.student.parentId,
            type: 'NEW_HOMEWORK',
            title: 'New Homework Assignment',
            message: `${unitName} - Lesson ${i + 1} assigned for ${classInfo.name}. Due: ${dueDate.toLocaleDateString()}`,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      count: homeworkAssignments.length,
      assignments: homeworkAssignments,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating bulk homework:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateClassDates(startDate: Date, daysOfWeek: number[], numberOfClasses: number): Date[] {
  const dates: Date[] = []
  let currentDate = new Date(startDate)
  
  while (dates.length < numberOfClasses) {
    const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay()
    
    if (daysOfWeek.includes(dayOfWeek)) {
      dates.push(new Date(currentDate))
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

