import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  BookOpen,
  FileText,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle,
  Users,
} from 'lucide-react'

async function getDashboardData(userId: string) {
  // Get parent's students
  const students = await prisma.student.findMany({
    where: { parentId: userId },
    include: {
      enrollments: {
        where: { isActive: true },
        include: {
          class: true,
        },
      },
      homeworkSubmissions: {
        include: {
          assignment: true,
        },
        orderBy: {
          submittedAt: 'desc',
        },
        take: 5,
      },
    },
  })

  // Get upcoming homework for enrolled classes
  const enrolledClassIds = students.flatMap((s) =>
    s.enrollments.map((e) => e.classId)
  )

  const upcomingHomework = await prisma.homeworkAssignment.findMany({
    where: {
      classId: { in: enrolledClassIds },
      dueDate: { gte: new Date() },
    },
    include: {
      class: true,
      submissions: true,
    },
    orderBy: {
      dueDate: 'asc',
    },
    take: 5,
  })

  // Get recent lessons
  const recentLessons = await prisma.lesson.findMany({
    where: {
      classId: { in: enrolledClassIds },
    },
    include: {
      class: true,
    },
    orderBy: {
      date: 'desc',
    },
    take: 5,
  })

  // Get unread notifications
  const unreadNotifications = await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  // Get upcoming holidays
  const upcomingHolidays = await prisma.holiday.findMany({
    where: {
      date: { gte: new Date() },
    },
    orderBy: {
      date: 'asc',
    },
    take: 3,
  })

  return {
    students,
    upcomingHomework,
    recentLessons,
    unreadNotifications,
    upcomingHolidays,
  }
}

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/login')
  }

  const data = await getDashboardData(session.user.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {session.user.name}!</h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your student's classes
        </p>
      </div>

      {/* Students Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.students.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                {student.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {student.enrollments.map((enrollment) => {
                  const needsRenewal = enrollment.classesRemaining <= 2
                  return (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {enrollment.class.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {enrollment.classesRemaining} classes left
                        </p>
                      </div>
                      {needsRenewal && (
                        <Badge variant="destructive">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Renewal Due
                        </Badge>
                      )}
                    </div>
                  )
                })}
                {student.enrollments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Not enrolled in any classes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Homework
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.upcomingHomework.length}
            </div>
            <p className="text-xs text-muted-foreground">
              assignments to complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Lessons
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.recentLessons.length}</div>
            <p className="text-xs text-muted-foreground">
              lessons this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notifications
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.unreadNotifications.length}
            </div>
            <p className="text-xs text-muted-foreground">unread</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Holidays
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.upcomingHolidays.length}
            </div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Homework */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Homework</CardTitle>
          <CardDescription>Assignments due soon</CardDescription>
        </CardHeader>
        <CardContent>
          {data.upcomingHomework.length > 0 ? (
            <div className="space-y-4">
              {data.upcomingHomework.map((homework) => {
                const isSubmitted = homework.submissions.some((s) =>
                  data.students.some((st) =>
                    st.homeworkSubmissions.some(
                      (sub) => sub.assignmentId === homework.id
                    )
                  )
                )
                return (
                  <div
                    key={homework.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{homework.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {homework.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">
                          {homework.class.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Due: {formatDate(homework.dueDate)}
                        </span>
                      </div>
                    </div>
                    {isSubmitted && (
                      <Badge>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Submitted
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No upcoming homework assignments
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lessons</CardTitle>
          <CardDescription>What your student learned recently</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentLessons.length > 0 ? (
            <div className="space-y-4">
              {data.recentLessons.map((lesson) => (
                <div key={lesson.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{lesson.unit}</h4>
                    <Badge variant="outline">{lesson.class.name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(lesson.date)}
                  </p>
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Topics covered:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {lesson.topics.map((topic, idx) => (
                        <li key={idx}>{topic}</li>
                      ))}
                    </ul>
                  </div>
                  {lesson.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      Note: {lesson.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No recent lessons
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

