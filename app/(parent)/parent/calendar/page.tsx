'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react'

async function fetchCalendarData() {
  const res = await fetch('/api/calendar')
  if (!res.ok) throw new Error('Failed to fetch calendar data')
  return res.json()
}

export default function ParentCalendarPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['calendar'],
    queryFn: fetchCalendarData,
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const { holidays, upcomingHomework, lessons } = data || {}

  // Group lessons by date
  const lessonsByDate = lessons?.reduce((acc: any, lesson: any) => {
    const date = new Date(lesson.date).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(lesson)
    return acc
  }, {})

  // Combine and sort all events
  const allEvents = [
    ...(holidays || []).map((h: any) => ({ ...h, type: 'holiday', date: h.date })),
    ...(upcomingHomework || []).map((h: any) => ({ ...h, type: 'homework', date: h.dueDate })),
    ...(lessons || []).map((l: any) => ({ ...l, type: 'lesson', date: l.date })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const today = new Date()
  const upcomingEvents = allEvents.filter((e) => new Date(e.date) >= today)
  const pastEvents = allEvents.filter((e) => new Date(e.date) < today).reverse()

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'holiday':
        return <CalendarIcon className="h-5 w-5" />
      case 'homework':
        return <Clock className="h-5 w-5" />
      case 'lesson':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <CalendarIcon className="h-5 w-5" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return 'destructive'
      case 'homework':
        return 'default'
      case 'lesson':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-2">
          View holidays, lessons, and upcoming homework
        </p>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>What's coming up next</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 10).map((event: any, idx: number) => (
                <div
                  key={`${event.type}-${event.id}-${idx}`}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {event.type === 'holiday' && event.name}
                          {event.type === 'homework' && event.title}
                          {event.type === 'lesson' && event.unit}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.type === 'holiday' && event.description}
                          {event.type === 'homework' && event.description}
                          {event.type === 'lesson' &&
                            `${event.class?.name} - ${event.topics.length} topics`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(event.date)}
                        </p>
                      </div>
                      <Badge variant={getEventColor(event.type)}>
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No upcoming events
            </p>
          )}
        </CardContent>
      </Card>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
            <CardDescription>Recent history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastEvents.slice(0, 10).map((event: any, idx: number) => (
                <div
                  key={`${event.type}-${event.id}-${idx}`}
                  className="flex items-start gap-4 p-4 border rounded-lg opacity-75"
                >
                  <div className="mt-1">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {event.type === 'holiday' && event.name}
                          {event.type === 'homework' && event.title}
                          {event.type === 'lesson' && event.unit}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(event.date)}
                        </p>
                      </div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holidays */}
      {holidays && holidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Holidays</CardTitle>
            <CardDescription>No classes on these dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {holidays.map((holiday: any) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{holiday.name}</p>
                    {holiday.description && (
                      <p className="text-sm text-muted-foreground">
                        {holiday.description}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(holiday.date)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


