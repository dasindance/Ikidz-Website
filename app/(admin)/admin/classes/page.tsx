'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { BookOpen, Users, FileText } from 'lucide-react'

async function fetchClasses() {
  const res = await fetch('/api/classes')
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again')
    }
    throw new Error('Failed to fetch classes')
  }
  return res.json()
}

export default function AdminClassesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const { data: classes, isLoading, error } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: fetchClasses,
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
    return <LoadingSpinner text="Loading classes..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="card-fun max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              {error instanceof Error ? error.message : 'Failed to load classes'}
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
          Class Management 📚
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          All active classes in the system
        </p>
      </div>

      <div className="grid gap-6">
        {classes?.map((classItem: any) => (
          <Card key={classItem.id} className="card-fun">
            <CardHeader className="bg-ikids-blue/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-ikids-blue" />
                  {classItem.name}
                </CardTitle>
                <Badge className="bg-ikids-blue text-white">
                  {classItem._count?.enrollments || 0} students
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {classItem.description && (
                  <p className="text-muted-foreground">{classItem.description}</p>
                )}
                
                {classItem.schedule && (
                  <div className="p-3 bg-muted rounded-xl">
                    <p className="text-sm">
                      <span className="font-medium">Schedule:</span> {classItem.schedule}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-ikids-green/10 rounded-xl">
                    <p className="text-2xl font-display text-ikids-green">
                      {classItem._count?.enrollments || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="p-3 bg-ikids-orange/10 rounded-xl">
                    <p className="text-2xl font-display text-ikids-orange">
                      {classItem._count?.lessons || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Lessons</p>
                  </div>
                  <div className="p-3 bg-ikids-purple/10 rounded-xl">
                    <p className="text-2xl font-display text-ikids-purple">
                      {classItem._count?.homeworkAssignments || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Homework</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


