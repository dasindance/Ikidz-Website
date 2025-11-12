'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { Users, GraduationCap, Shield } from 'lucide-react'

async function fetchUsers() {
  const res = await fetch('/api/admin/users')
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again')
    }
    throw new Error('Failed to fetch users')
  }
  return res.json()
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
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
    return <LoadingSpinner text="Loading users..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="card-fun max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              {error instanceof Error ? error.message : 'Failed to load users'}
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

  const { parents, teachers } = data || { parents: [], teachers: [] }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-display bg-gradient-ikids bg-clip-text text-transparent">
          User Management 👥
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage all parents and teachers
        </p>
      </div>

      {/* Teachers */}
      <Card className="card-fun">
        <CardHeader className="bg-ikids-blue/5">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-6 w-6 text-ikids-blue" />
            Teachers ({teachers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {teachers.map((teacher: any) => (
              <div key={teacher.id} className="p-4 bg-muted rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{teacher.name}</p>
                    <p className="text-sm text-muted-foreground">{teacher.email}</p>
                  </div>
                  <Badge className="bg-ikids-blue text-white">Teacher</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parents */}
      <Card className="card-fun">
        <CardHeader className="bg-ikids-green/5">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-ikids-green" />
            Parents ({parents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {parents.map((parent: any) => (
              <div key={parent.id} className="p-4 bg-muted rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">{parent.name}</p>
                    <p className="text-sm text-muted-foreground">{parent.email}</p>
                  </div>
                  <Badge className="bg-ikids-green text-white">Parent</Badge>
                </div>
                {parent.students && parent.students.length > 0 && (
                  <div className="pl-4 border-l-2 border-ikids-green/30">
                    <p className="text-sm font-medium mb-2">Students:</p>
                    <div className="space-y-1">
                      {parent.students.map((student: any) => (
                        <div key={student.id} className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{student.name}</span>
                          {student.englishLevel && (
                            <Badge variant="outline" className="text-xs">
                              {student.englishLevel}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


