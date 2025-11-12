'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { BookOpen } from 'lucide-react'

async function fetchLessons() {
  const res = await fetch('/api/lessons')
  if (!res.ok) throw new Error('Failed to fetch lessons')
  return res.json()
}

export default function LessonsPage() {
  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: fetchLessons,
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Lesson History</h1>
        <p className="text-muted-foreground mt-2">
          View what was covered in recent lessons
        </p>
      </div>

      {lessons && lessons.length > 0 ? (
        <div className="grid gap-6">
          {lessons.map((lesson: any) => (
            <Card key={lesson.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <BookOpen className="mr-2 h-5 w-5" />
                      {lesson.unit}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {formatDate(lesson.date)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{lesson.class.name}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Topics Covered:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {lesson.topics.map((topic: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {lesson.notes && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-semibold mb-1">Teacher's Notes:</h4>
                      <p className="text-sm text-muted-foreground italic">
                        {lesson.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No lessons recorded yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

