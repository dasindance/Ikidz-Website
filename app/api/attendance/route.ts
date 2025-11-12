import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AttendanceStatus } from '@prisma/client'
import { calculateRenewalDate } from '@/lib/renewal-calculator'
import { z } from 'zod'

const markAttendanceSchema = z.object({
  enrollmentId: z.string(),
  classId: z.string(),
  studentId: z.string(),
  date: z.string(),
  status: z.enum(['PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED', 'HOLIDAY']),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { enrollmentId, classId, studentId, date, status, notes } = markAttendanceSchema.parse(body)

    // Check if attendance already exists for this date
    const existing = await prisma.attendance.findUnique({
      where: {
        enrollmentId_date: {
          enrollmentId,
          date: new Date(date),
        },
      },
    })

    if (existing) {
      // Update existing attendance
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: status as AttendanceStatus,
          notes,
          markedBy: session.user.id,
        },
      })

      // Update enrollment count if status changed
      await updateEnrollmentCount(enrollmentId, existing.status, status as AttendanceStatus)

      return NextResponse.json(updated)
    }

    // Create new attendance record
    const attendance = await prisma.attendance.create({
      data: {
        enrollmentId,
        classId,
        studentId,
        date: new Date(date),
        status: status as AttendanceStatus,
        notes,
        markedBy: session.user.id,
      },
    })

    // Update enrollment based on attendance status
    if (status === 'PRESENT') {
      await decrementClassCount(enrollmentId)
    }

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error marking attendance:', error)
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

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')

    const where: any = {}
    if (classId) where.classId = classId
    if (studentId) where.studentId = studentId
    if (date) where.date = new Date(date)

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: true,
        class: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function decrementClassCount(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  })

  if (!enrollment || enrollment.classesRemaining <= 0) return

  const newCount = enrollment.classesRemaining - 1
  const renewalDate = calculateRenewalDate(
    newCount,
    enrollment.classesPerWeek,
    new Date()
  )

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      classesRemaining: newCount,
      renewalDate,
    },
  })

  // Create notification if classes are running low
  if (newCount <= 2) {
    const student = await prisma.student.findUnique({
      where: { id: enrollment.studentId },
      include: { parent: true },
    })

    const classInfo = await prisma.class.findUnique({
      where: { id: enrollment.classId },
    })

    if (student && classInfo) {
      await prisma.notification.create({
        data: {
          userId: student.parentId,
          type: 'MEMBERSHIP_RENEWAL',
          title: 'Class Membership Running Low',
          message: `${student.name} has only ${newCount} class${newCount === 1 ? '' : 'es'} remaining in ${classInfo.name}. Please renew soon!`,
        },
      })
    }
  }
}

async function updateEnrollmentCount(
  enrollmentId: string,
  oldStatus: AttendanceStatus,
  newStatus: AttendanceStatus
) {
  // If changing from PRESENT to something else, increment count
  if (oldStatus === 'PRESENT' && newStatus !== 'PRESENT') {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    })

    if (enrollment) {
      const newCount = enrollment.classesRemaining + 1
      const renewalDate = calculateRenewalDate(
        newCount,
        enrollment.classesPerWeek,
        new Date()
      )

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          classesRemaining: newCount,
          renewalDate,
        },
      })
    }
  }
  
  // If changing from something else to PRESENT, decrement count
  if (oldStatus !== 'PRESENT' && newStatus === 'PRESENT') {
    await decrementClassCount(enrollmentId)
  }
}

