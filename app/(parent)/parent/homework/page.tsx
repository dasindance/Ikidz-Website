'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { FileText, Upload, CheckCircle } from 'lucide-react'
import Link from 'next/link'

async function fetchHomework() {
  const res = await fetch('/api/homework')
  if (!res.ok) throw new Error('Failed to fetch homework')
  return res.json()
}

export default function HomeworkPage() {
  const { data: session } = useSession()
  const { data: homework, isLoading } = useQuery({
    queryKey: ['homework'],
    queryFn: fetchHomework,
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Homework Assignments</h1>
        <p className="text-muted-foreground mt-2">
          View and submit homework assignments
        </p>
      </div>

      {homework && homework.length > 0 ? (
        <div className="grid gap-6">
          {homework.map((assignment: any) => {
            const isOverdue = new Date(assignment.dueDate) < new Date()
            const isSubmitted = assignment.submissions.length > 0

            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        {assignment.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {assignment.description}
                      </CardDescription>
                    </div>
                    {isSubmitted ? (
                      <Badge>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Submitted
                      </Badge>
                    ) : isOverdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Class:</span>{' '}
                        {assignment.class.name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Due Date:</span>{' '}
                        {formatDate(assignment.dueDate)}
                      </p>
                      {isSubmitted && (
                        <p className="text-sm text-muted-foreground">
                          Submitted on:{' '}
                          {formatDate(assignment.submissions[0].submittedAt)}
                        </p>
                      )}
                    </div>
                    {!isSubmitted && (
                      <Button asChild>
                        <Link href={`/parent/homework/${assignment.id}/submit`}>
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Work
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No homework assignments at this time
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

