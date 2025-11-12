import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const holidaySchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  description: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, date, description } = holidaySchema.parse(body)

    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date),
        description,
      },
    })

    // Notify all parents about the holiday
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT' },
    })

    const notifications = parents.map((parent) => ({
      userId: parent.id,
      type: 'HOLIDAY_REMINDER' as const,
      title: 'Holiday Announcement',
      message: `${name} on ${new Date(date).toLocaleDateString()}${description ? `: ${description}` : ''}`,
    }))

    await prisma.notification.createMany({
      data: notifications,
    })

    return NextResponse.json(holiday, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating holiday:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


