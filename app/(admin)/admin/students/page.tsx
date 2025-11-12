'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { GraduationCap, User, BookOpen } from 'lucide-react'

async function fetchAllStudents() {
  const res = await fetch('/api/students')
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again')
    }
    throw new Error('Failed to fetch students')
  }
  return res.json()
}

export default function AdminStudentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const { data: students, isLoading, error } = useQuery({
    queryKey: ['admin-students'],
    queryFn: fetchAllStudents,
    enabled: status === 'authenticated' && session?.user.role === 'ADMIN',
  })

  // Redirect if not authenticated or not admin
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
    if (session?.user.role === 'TEACHER') {
      router.push('/teacher/admin')
    } else {
      router.push('/parent/dashboard')
    }
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
      <div className="text-center">
        <h1 className="text-4xl font-display bg-gradient-ikids bg-clip-text text-transparent">
          All Students 🎓
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Complete student directory
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {students?.map((student: any) => (
          <Card key={student.id} className="card-fun">
            <CardHeader className="bg-ikids-orange/5">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-ikids-orange" />
                {student.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {student.parent && (
                <div className="p-3 bg-muted rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Parent</p>
                  </div>
                  <p className="text-sm">{student.parent.name}</p>
                  <p className="text-xs text-muted-foreground">{student.parent.email}</p>
                </div>
              )}

              {student.englishLevel && (
                <Badge className="bg-ikids-blue text-white">
                  Level: {student.englishLevel}
                </Badge>
              )}

              {student.targetExam && (
                <Badge className="bg-ikids-purple text-white">
                  Target: {student.targetExam}
                </Badge>
              )}

              {student.enrollments && student.enrollments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Enrolled Classes:</p>
                  <div className="space-y-2">
                    {student.enrollments.map((enrollment: any) => (
                      <div key={enrollment.id} className="p-2 bg-ikids-green/10 rounded-xl">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{enrollment.class.name}</p>
                          <Badge variant="outline">
                            {enrollment.classesRemaining} left
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


