'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { Users, BookOpen } from 'lucide-react'

async function fetchStudents() {
  const res = await fetch('/api/students')
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again')
    }
    throw new Error('Failed to fetch students')
  }
  return res.json()
}

export default function StudentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
    enabled: status === 'authenticated' && (session?.user.role === 'TEACHER' || session?.user.role === 'ADMIN'),
  })

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  // Check role - only teachers and admins can access
  if (status === 'authenticated' && session?.user.role !== 'TEACHER' && session?.user.role !== 'ADMIN') {
    router.push('/parent/dashboard')
    return null
  }

  if (status === 'loading' || isLoading) {
    return <LoadingSpinner text="Loading students..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="card-fun max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              {error instanceof Error ? error.message : 'Failed to load students'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full mt-4 btn-fun bg-gradient-ikids"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all your students
        </p>
      </div>

      <div className="grid gap-6">
        {students && students.length > 0 ? (
          students.map((student: any) => (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{student.name}</CardTitle>
                      {student.parent && (
                        <CardDescription>
                          Parent: {student.parent.name} ({student.parent.email})
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Enrolled Classes
                    </h4>
                    {student.enrollments && student.enrollments.length > 0 ? (
                      <div className="grid gap-2">
                        {student.enrollments.map((enrollment: any) => (
                          <div
                            key={enrollment.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {enrollment.class.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {enrollment.class.schedule}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {enrollment.classesRemaining} classes left
                              </p>
                              <Badge
                                variant={
                                  enrollment.classesRemaining <= 2
                                    ? 'destructive'
                                    : 'default'
                                }
                              >
                                {enrollment.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not enrolled in any classes
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No students yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


