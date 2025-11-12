'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { TrendingUp, Users, BookOpen, FileText, CheckCircle } from 'lucide-react'

async function fetchReports() {
  const res = await fetch('/api/admin/reports')
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again')
    }
    throw new Error('Failed to fetch reports')
  }
  return res.json()
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: fetchReports,
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
    return <LoadingSpinner text="Loading reports..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="card-fun max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              {error instanceof Error ? error.message : 'Failed to load reports'}
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
          System Reports 📊
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Analytics and insights
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-fun border-2 border-ikids-orange/20">
          <CardHeader>
            <CardTitle className="text-sm">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display text-ikids-orange">
              {data?.totalEnrollments || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="card-fun border-2 border-ikids-blue/20">
          <CardHeader>
            <CardTitle className="text-sm">Lessons Posted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display text-ikids-blue">
              {data?.totalLessons || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="card-fun border-2 border-ikids-purple/20">
          <CardHeader>
            <CardTitle className="text-sm">Homework Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display text-ikids-purple">
              {data?.totalHomework || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="card-fun border-2 border-ikids-green/20">
          <CardHeader>
            <CardTitle className="text-sm">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display text-ikids-green">
              {data?.totalSubmissions || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renewal Alerts */}
      {data?.renewalAlerts && data.renewalAlerts.length > 0 && (
        <Card className="card-fun border-2 border-ikids-orange">
          <CardHeader className="bg-ikids-orange/10">
            <CardTitle className="text-2xl text-ikids-orange">
              ⚠️ Renewal Alerts ({data.renewalAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {data.renewalAlerts.map((alert: any, idx: number) => (
                <div key={idx} className="p-4 bg-muted rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{alert.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.className} - {alert.classesRemaining} classes left
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Parent: {alert.parentName} ({alert.parentEmail})
                      </p>
                    </div>
                    <Badge variant="destructive">Urgent</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="card-fun">
        <CardHeader className="bg-ikids-blue/5">
          <CardTitle className="text-2xl">System Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-2xl">
              <p className="text-sm">
                <CheckCircle className="inline h-4 w-4 text-ikids-green mr-2" />
                System is running smoothly
              </p>
            </div>
            {data?.recentActivity && data.recentActivity.length > 0 && (
              <div className="space-y-2">
                {data.recentActivity.map((activity: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted rounded-xl text-sm">
                    {activity.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


