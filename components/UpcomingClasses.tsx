'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Users, CheckCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Student {
  id: string
  name: string
  enrollmentId: string
}

interface ClassSession {
  classId: string
  className: string
  date: string
  time: string
  students: Student[]
}

interface UpcomingClassesProps {
  classes: ClassSession[]
  title: string
}

async function markAttendance(data: any) {
  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to mark attendance')
  return res.json()
}

export function UpcomingClasses({ classes, title }: UpcomingClassesProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [markedStudents, setMarkedStudents] = useState<Set<string>>(new Set())

  const markMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: (data, variables) => {
      setMarkedStudents(prev => new Set([...prev, variables.studentId]))
      queryClient.invalidateQueries({ queryKey: ['upcoming-classes'] })
      toast({
        title: '✅ Attendance Marked',
        description: 'Student marked as present',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      })
    },
  })

  const handleMarkPresent = (classSession: ClassSession, student: Student) => {
    markMutation.mutate({
      enrollmentId: student.enrollmentId,
      classId: classSession.classId,
      studentId: student.id,
      date: classSession.date,
      status: 'PRESENT',
    })
  }

  if (classes.length === 0) {
    return null
  }

  return (
    <Card className="card-fun">
      <CardHeader className="bg-ikids-blue/5">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Calendar className="h-6 w-6 text-ikids-blue" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {classes.map((classSession, idx) => (
            <div key={idx} className="p-4 border-2 border-ikids-blue/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{classSession.className}</h3>
                  <p className="text-sm text-muted-foreground">
                    {classSession.time}
                  </p>
                </div>
                <Badge className="bg-ikids-blue">
                  <Users className="h-3 w-3 mr-1" />
                  {classSession.students.length}
                </Badge>
              </div>

              {/* Quick Attendance */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Quick Attendance:</p>
                <div className="grid gap-2">
                  {classSession.students.map((student) => {
                    const isMarked = markedStudents.has(student.id)
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-xl"
                      >
                        <span className="font-medium">{student.name}</span>
                        {isMarked ? (
                          <Badge className="bg-ikids-green text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Present
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="btn-fun bg-ikids-orange"
                            onClick={() => handleMarkPresent(classSession, student)}
                            disabled={markMutation.isPending}
                          >
                            Mark Present
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


