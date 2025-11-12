'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Calendar as CalendarIcon, Plus, Clock, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

async function fetchCalendarData() {
  const res = await fetch('/api/calendar')
  if (!res.ok) throw new Error('Failed to fetch calendar data')
  return res.json()
}

async function createHoliday(data: any) {
  const res = await fetch('/api/holidays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create holiday')
  return res.json()
}

export default function TeacherCalendarPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showHolidayForm, setShowHolidayForm] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['calendar'],
    queryFn: fetchCalendarData,
  })

  const createMutation = useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Holiday created successfully',
      })
      setShowHolidayForm(false)
      setName('')
      setDate('')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create holiday',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ name, date, description })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  const { holidays, upcomingHomework, lessons } = data || {}

  // Combine and sort all events
  const allEvents = [
    ...(holidays || []).map((h: any) => ({ ...h, type: 'holiday', date: h.date })),
    ...(upcomingHomework || []).map((h: any) => ({ ...h, type: 'homework', date: h.dueDate })),
    ...(lessons || []).map((l: any) => ({ ...l, type: 'lesson', date: l.date })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const today = new Date()
  const upcomingEvents = allEvents.filter((e) => new Date(e.date) >= today)

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage holidays and view schedule
          </p>
        </div>
        <Button onClick={() => setShowHolidayForm(!showHolidayForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Holiday
        </Button>
      </div>

      {showHolidayForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Holiday</CardTitle>
            <CardDescription>Create a new holiday or schedule change</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Holiday Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Thanksgiving Break"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Holiday'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHolidayForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Schedule</CardTitle>
          <CardDescription>All upcoming events</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 20).map((event: any, idx: number) => (
                <div
                  key={`${event.type}-${event.id}-${idx}`}
                  className="flex items-start gap-4 p-4 border rounded-lg"
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
                          {event.type === 'homework' &&
                            `${event.class?.name} - ${event._count?.submissions || 0} submissions`}
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

      {/* Holidays List */}
      {holidays && holidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Holidays & Schedule Changes</CardTitle>
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

