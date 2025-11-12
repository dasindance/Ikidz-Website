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

    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
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
    const { title, content, category, priority } = body

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        category,
        priority: priority || 'normal',
      },
    })

    // Create notifications for all parents
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT' },
    })

    const notifications = parents.map((parent) => ({
      userId: parent.id,
      type: 'NEW_ANNOUNCEMENT' as const,
      title: 'New Announcement',
      message: title,
    }))

    await prisma.notification.createMany({
      data: notifications,
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

