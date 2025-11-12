import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { ClassCountdown } from '@/components/ClassCountdown'
import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle,
  Users,
  Upload,
  Sparkles,
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
      {/* Welcome Header */}
      <div className="text-center py-6">
        <h1 className="text-5xl font-display bg-gradient-ikids bg-clip-text text-transparent mb-2">
          Welcome, {session.user.name}! 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          Let's check on your student's progress
        </p>
      </div>

      {/* Class Countdown Cards - Most Important! */}
      <div className="grid gap-6 md:grid-cols-2">
        {data.students.flatMap((student) =>
          student.enrollments.map((enrollment) => (
            <ClassCountdown
              key={enrollment.id}
              studentName={student.name}
              className={enrollment.class.name}
              classesRemaining={enrollment.classesRemaining}
              totalClasses={enrollment.totalClasses}
              renewalDate={enrollment.renewalDate}
            />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild className="h-24 btn-fun bg-gradient-ikids text-lg">
          <Link href="/parent/homework">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2" />
              <span>Submit Homework</span>
            </div>
          </Link>
        </Button>
        <Button asChild className="h-24 btn-fun bg-ikids-blue text-white text-lg" variant="secondary">
          <Link href="/parent/lessons">
            <div className="text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <span>View Lessons</span>
            </div>
          </Link>
        </Button>
        <Button asChild className="h-24 btn-fun bg-ikids-yellow text-gray-800 text-lg" variant="outline">
          <Link href="/parent/calendar">
            <div className="text-center">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
              <span>Calendar</span>
            </div>
          </Link>
        </Button>
      </div>

      {/* Upcoming Homework - Simplified */}
      {data.upcomingHomework.length > 0 && (
        <Card className="card-fun border-2 border-ikids-orange/20">
          <CardHeader className="bg-ikids-orange/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-ikids-orange" />
                Homework Due Soon
              </CardTitle>
              <Badge className="bg-ikids-orange">
                {data.upcomingHomework.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {data.upcomingHomework.slice(0, 3).map((homework) => {
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
                    className="flex items-center justify-between p-4 bg-muted rounded-2xl hover:shadow-fun transition-all"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{homework.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Due: {formatDate(homework.dueDate)}
                      </p>
                    </div>
                    {isSubmitted ? (
                      <Badge className="bg-ikids-green text-white">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Done!
                      </Badge>
                    ) : (
                      <Button asChild size="sm" className="btn-fun bg-ikids-orange">
                        <Link href={`/parent/homework/${homework.id}/submit`}>
                          Submit
                        </Link>
                      </Button>
                    )}
                  </div>
                )
              })}
              {data.upcomingHomework.length > 3 && (
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/parent/homework">
                    View all {data.upcomingHomework.length} assignments →
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Lesson - Simplified */}
      {data.recentLessons.length > 0 && (
        <Card className="card-fun">
          <CardHeader className="bg-ikids-blue/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-ikids-blue" />
              Last Lesson
            </CardTitle>
            <CardDescription>What your student learned most recently</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {(() => {
              const lesson = data.recentLessons[0]
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{lesson.unit}</h3>
                      {lesson.bookSeries && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {lesson.bookSeries} - {lesson.bookLevel}
                          {lesson.pageNumbers && ` (Pages ${lesson.pageNumbers})`}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatDate(lesson.date)} • {lesson.class.name}
                      </p>
                    </div>
                  </div>

                  {lesson.topics.length > 0 && (
                    <div className="p-4 bg-ikids-yellow/10 rounded-2xl">
                      <p className="font-medium mb-2">📝 Topics:</p>
                      <div className="flex flex-wrap gap-2">
                        {lesson.topics.map((topic, idx) => (
                          <Badge key={idx} variant="outline" className="rounded-xl">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {lesson.vocabulary && lesson.vocabulary.length > 0 && (
                    <div className="p-4 bg-ikids-green/10 rounded-2xl">
                      <p className="font-medium mb-2">📚 New Vocabulary:</p>
                      <div className="flex flex-wrap gap-2">
                        {lesson.vocabulary.map((word, idx) => (
                          <span key={idx} className="px-3 py-1 bg-white rounded-xl text-sm font-medium">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lesson.skills && lesson.skills.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {lesson.skills.map((skill, idx) => (
                        <Badge key={idx} className="bg-ikids-purple text-white rounded-xl">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {lesson.notes && (
                    <div className="p-4 bg-muted rounded-2xl">
                      <p className="text-sm italic">"{ lesson.notes}"</p>
                      <p className="text-xs text-muted-foreground mt-2">- Teacher's note</p>
                    </div>
                  )}

                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link href="/parent/lessons">
                      View All Lessons →
                    </Link>
                  </Button>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

