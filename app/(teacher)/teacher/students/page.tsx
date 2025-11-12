'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen } from 'lucide-react'

async function fetchStudents() {
  const res = await fetch('/api/students')
  if (!res.ok) throw new Error('Failed to fetch students')
  return res.json()
}

export default function StudentsPage() {
  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
  })

  if (isLoading) {
    return <div>Loading...</div>
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

