'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { UpcomingClasses } from '@/components/UpcomingClasses'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  FileText,
  Users,
  MessageSquare,
  Upload,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

async function fetchDashboardData() {
  const res = await fetch('/api/teacher/dashboard')
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again')
    }
    throw new Error('Failed to fetch dashboard data')
  }
  return res.json()
}

async function fetchUpcomingClasses() {
  const res = await fetch('/api/upcoming-classes')
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again')
    }
    throw new Error('Failed to fetch upcoming classes')
  }
  return res.json()
}

export default function TeacherAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: fetchDashboardData,
    enabled: status === 'authenticated',
  })

  const { data: upcomingData } = useQuery({
    queryKey: ['upcoming-classes'],
    queryFn: fetchUpcomingClasses,
    refetchInterval: 60000, // Refresh every minute
    enabled: status === 'authenticated',
  })

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  // Check role
  if (status === 'authenticated' && session?.user.role !== 'TEACHER' && session?.user.role !== 'ADMIN') {
    router.push('/parent/dashboard')
    return null
  }

  if (status === 'loading' || isLoading || !data) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="card-fun max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              {error instanceof Error ? error.message : 'Failed to load dashboard'}
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
      {/* Welcome Header */}
      <div className="text-center py-6">
        <h1 className="text-5xl font-display bg-gradient-ikids bg-clip-text text-transparent mb-2">
          Welcome, {session?.user.name}! 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          Ready to teach today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild className="h-24 btn-fun bg-gradient-ikids text-lg">
          <Link href="/teacher/post-lesson">
            <div className="text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <span>Post Lesson</span>
            </div>
          </Link>
        </Button>
        <Button asChild className="h-24 btn-fun bg-ikids-blue text-white text-lg">
          <Link href="/teacher/homework">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <span>Homework</span>
            </div>
          </Link>
        </Button>
        <Button asChild className="h-24 btn-fun bg-ikids-yellow text-gray-800 text-lg">
          <Link href="/teacher/announcements">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <span>Announcements</span>
            </div>
          </Link>
        </Button>
      </div>

      {/* Upcoming Classes with Quick Attendance */}
      {upcomingData?.today && upcomingData.today.length > 0 && (
        <UpcomingClasses classes={upcomingData.today} title="📅 Today's Classes" />
      )}

      {upcomingData?.tomorrow && upcomingData.tomorrow.length > 0 && (
        <UpcomingClasses classes={upcomingData.tomorrow} title="🔜 Tomorrow's Classes" />
      )}

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="card-fun">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-ikids-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display text-ikids-orange">{data.classes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">active classes</p>
          </CardContent>
        </Card>

        <Card className="card-fun">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-ikids-green" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display text-ikids-blue">{data.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">enrolled</p>
          </CardContent>
        </Card>

        <Card className="card-fun">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Homework Due</CardTitle>
            <FileText className="h-4 w-4 text-ikids-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display text-ikids-yellow">{data.upcomingHomework?.length || 0}</div>
            <p className="text-xs text-muted-foreground">assignments</p>
          </CardContent>
        </Card>

        <Card className="card-fun">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Submissions</CardTitle>
            <Upload className="h-4 w-4 text-ikids-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display text-ikids-purple">{data.recentSubmissions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">to review</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      {data.recentSubmissions && data.recentSubmissions.length > 0 && (
        <Card className="card-fun">
          <CardHeader className="bg-ikids-purple/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-ikids-purple" />
              Recent Homework Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {data.recentSubmissions.slice(0, 5).map((submission: any) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-2xl hover:shadow-fun transition-all"
                >
                  <div>
                    <p className="font-semibold">{submission.student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.assignment.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(submission.submittedAt)}
                    </p>
                  </div>
                  <Button size="sm" className="btn-fun bg-ikids-purple" asChild>
                    <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                      View Work
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
