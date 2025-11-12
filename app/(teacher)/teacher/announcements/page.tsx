'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Plus } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

async function fetchAnnouncements() {
  const res = await fetch('/api/announcements')
  if (!res.ok) throw new Error('Failed to fetch announcements')
  return res.json()
}

async function createAnnouncement(data: any) {
  const res = await fetch('/api/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create announcement')
  return res.json()
}

export default function TeacherAnnouncementsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState('normal')

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: fetchAnnouncements,
  })

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Announcement posted successfully',
      })
      setShowForm(false)
      setTitle('')
      setContent('')
      setCategory('general')
      setPriority('normal')
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to post announcement',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ title, content, category, priority })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground mt-2">
            Post updates and announcements for parents
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
            <CardDescription>Post a new announcement for all parents</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="general">General</option>
                    <option value="schedule_change">Schedule Change</option>
                    <option value="holiday">Holiday</option>
                    <option value="promotion">Promotion</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Posting...' : 'Post Announcement'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {announcements?.map((announcement: any) => (
          <Card key={announcement.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    {announcement.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {formatDateTime(announcement.createdAt)}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {announcement.category.replace('_', ' ')}
                  </Badge>
                  {announcement.priority === 'high' && (
                    <Badge variant="destructive">High Priority</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


