import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePresignedUrl, generateUniqueKey } from '@/lib/storage/upload'
import { z } from 'zod'

const requestSchema = z.object({
  assignmentId: z.string(),
  filename: z.string(),
  contentType: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { assignmentId, filename, contentType } = requestSchema.parse(body)

    const key = generateUniqueKey(session.user.id, assignmentId, filename)
    const presignedUrl = await generatePresignedUrl(key, contentType)

    return NextResponse.json({ presignedUrl, key })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

