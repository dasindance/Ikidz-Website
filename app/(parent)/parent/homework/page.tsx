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
  const { data: homework, isLoading, error } = useQuery({
    queryKey: ['homework'],
    queryFn: fetchHomework,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl animate-bounce-gentle">📚</div>
          <p className="mt-4 text-muted-foreground">Loading homework...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Error loading homework. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-display bg-gradient-ikids bg-clip-text text-transparent">
          Homework 📝
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          View and submit your assignments
        </p>
      </div>

      {homework && homework.length > 0 ? (
        <div className="grid gap-6">
          {homework.map((assignment: any) => {
            const isOverdue = new Date(assignment.dueDate) < new Date()
            const isSubmitted = assignment.submissions && assignment.submissions.length > 0

            return (
              <Card key={assignment.id} className="card-fun">
                <CardHeader className={isSubmitted ? "bg-ikids-green/5" : "bg-ikids-orange/5"}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center text-xl">
                        <FileText className="mr-2 h-5 w-5 text-ikids-orange" />
                        {assignment.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-base">
                        {assignment.description}
                      </CardDescription>
                    </div>
                    {isSubmitted ? (
                      <Badge className="bg-ikids-green text-white">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Done!
                      </Badge>
                    ) : isOverdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge className="bg-ikids-yellow text-gray-800">Pending</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Class:</span>{' '}
                        {assignment.class?.name || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Due Date:</span>{' '}
                        {formatDate(assignment.dueDate)}
                      </p>
                      {isSubmitted && assignment.submissions && assignment.submissions[0] && (
                        <p className="text-sm text-muted-foreground">
                          ✅ Submitted on:{' '}
                          {formatDate(assignment.submissions[0].submittedAt)}
                        </p>
                      )}
                    </div>
                    {!isSubmitted && (
                      <Button asChild className="btn-fun bg-gradient-ikids w-full sm:w-auto">
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
        <Card className="card-fun">
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-xl font-semibold mb-2">All Caught Up!</p>
            <p className="text-muted-foreground">
              No homework assignments at this time
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

