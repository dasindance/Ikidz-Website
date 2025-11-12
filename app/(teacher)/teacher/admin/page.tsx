import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import {
  BookOpen,
  FileText,
  Users,
  MessageSquare,
  Calendar as CalendarIcon,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

async function getTeacherDashboardData() {
  const classes = await prisma.class.findMany({
    include: {
      enrollments: {
        where: { isActive: true },
        include: {
          student: true,
        },
      },
      _count: {
        select: {
          lessons: true,
          homeworkAssignments: true,
        },
      },
    },
  })

  const totalStudents = await prisma.student.count()
  
  const recentSubmissions = await prisma.homeworkSubmission.findMany({
    include: {
      student: true,
      assignment: {
        include: {
          class: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
    take: 10,
  })

  const upcomingHomework = await prisma.homeworkAssignment.findMany({
    where: {
      dueDate: { gte: new Date() },
    },
    include: {
      class: true,
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
    take: 5,
  })

  const recentLessons = await prisma.lesson.findMany({
    include: {
      class: true,
    },
    orderBy: {
      date: 'desc',
    },
    take: 5,
  })

  return {
    classes,
    totalStudents,
    recentSubmissions,
    upcomingHomework,
    recentLessons,
  }
}

export default async function TeacherAdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const data = await getTeacherDashboardData()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your classes and students
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/teacher/post-lesson">
              <BookOpen className="mr-2 h-4 w-4" />
              Post Lesson
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/teacher/announcements">
              <MessageSquare className="mr-2 h-4 w-4" />
              New Announcement
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.classes.length}</div>
            <p className="text-xs text-muted-foreground">active classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
            <p className="text-xs text-muted-foreground">enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Homework
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.upcomingHomework.length}
            </div>
            <p className="text-xs text-muted-foreground">assignments due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Submissions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.recentSubmissions.length}
            </div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Classes Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Classes</CardTitle>
          <CardDescription>Overview of all your active classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.classes.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{classItem.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {classItem.description}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Schedule: {classItem.schedule || 'Not set'}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{classItem.enrollments.length}</p>
                    <p className="text-muted-foreground">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{classItem._count.lessons}</p>
                    <p className="text-muted-foreground">Lessons</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">
                      {classItem._count.homeworkAssignments}
                    </p>
                    <p className="text-muted-foreground">Homework</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Homework Submissions</CardTitle>
            <CardDescription>Latest work from students</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {data.recentSubmissions.slice(0, 5).map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{submission.student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {submission.assignment.class.name} -{' '}
                        {submission.assignment.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No recent submissions
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Lessons */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Lessons</CardTitle>
            <CardDescription>Lessons you've posted</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentLessons.length > 0 ? (
              <div className="space-y-3">
                {data.recentLessons.map((lesson) => (
                  <div key={lesson.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{lesson.unit}</p>
                      <p className="text-xs text-muted-foreground">
                        {lesson.class.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(lesson.date)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lesson.topics.length} topics covered
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No lessons posted yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

