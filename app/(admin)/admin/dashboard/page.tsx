'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Shield,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

async function fetchAdminDashboard() {
  const res = await fetch('/api/admin/dashboard')
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again')
    }
    throw new Error('Failed to fetch dashboard')
  }
  return res.json()
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
    enabled: status === 'authenticated',
  })

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  // Check role
  if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
    // Redirect based on actual role
    if (session?.user.role === 'TEACHER') {
      router.push('/teacher/admin')
    } else {
      router.push('/parent/dashboard')
    }
    return null
  }

  if (status === 'loading' || isLoading || !data) {
    return <LoadingSpinner text="Loading admin dashboard..." />
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
          Admin Dashboard 🛡️
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome, {session?.user.name}! Full system control
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-fun border-2 border-ikids-orange/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Parents</span>
              <Users className="h-5 w-5 text-ikids-orange" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display text-ikids-orange">{data.totalParents}</div>
            <p className="text-xs text-muted-foreground mt-1">registered accounts</p>
          </CardContent>
        </Card>

        <Card className="card-fun border-2 border-ikids-blue/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Students</span>
              <GraduationCap className="h-5 w-5 text-ikids-blue" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display text-ikids-blue">{data.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">learning English</p>
          </CardContent>
        </Card>

        <Card className="card-fun border-2 border-ikids-green/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Active Classes</span>
              <BookOpen className="h-5 w-5 text-ikids-green" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display text-ikids-green">{data.totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">running now</p>
          </CardContent>
        </Card>

        <Card className="card-fun border-2 border-ikids-purple/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Teachers</span>
              <Shield className="h-5 w-5 text-ikids-purple" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display text-ikids-purple">{data.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">teaching staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild className="h-24 btn-fun bg-gradient-ikids text-lg">
          <Link href="/admin/users">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <span>Manage Users</span>
            </div>
          </Link>
        </Button>
        <Button asChild className="h-24 btn-fun bg-ikids-blue text-white text-lg">
          <Link href="/admin/classes">
            <div className="text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <span>Manage Classes</span>
            </div>
          </Link>
        </Button>
        <Button asChild className="h-24 btn-fun bg-ikids-purple text-white text-lg">
          <Link href="/admin/reports">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2" />
              <span>View Reports</span>
            </div>
          </Link>
        </Button>
      </div>

      {/* Recent Activity */}
      <Card className="card-fun">
        <CardHeader className="bg-ikids-orange/5">
          <CardTitle className="text-2xl">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {data.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((activity: any, idx: number) => (
                <div key={idx} className="p-4 bg-muted rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge>{activity.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


