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
import { FileText, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

async function fetchHomework() {
  const res = await fetch('/api/homework')
  if (!res.ok) throw new Error('Failed to fetch homework')
  return res.json()
}

async function fetchClasses() {
  const res = await fetch('/api/classes')
  if (!res.ok) throw new Error('Failed to fetch classes')
  return res.json()
}

async function createHomework(data: any) {
  const res = await fetch('/api/homework', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create homework')
  return res.json()
}

export default function TeacherHomeworkPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  const { data: homework, isLoading } = useQuery({
    queryKey: ['homework'],
    queryFn: fetchHomework,
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const createMutation = useMutation({
    mutationFn: createHomework,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Homework assignment created',
      })
      setShowForm(false)
      setClassId('')
      setTitle('')
      setDescription('')
      setDueDate('')
      queryClient.invalidateQueries({ queryKey: ['homework'] })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create homework',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ classId, title, description, dueDate })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Homework Assignments</h1>
          <p className="text-muted-foreground mt-2">
            Manage homework assignments and view submissions
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Assignment
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Homework Assignment</CardTitle>
            <CardDescription>Add a new homework assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <select
                  id="class"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a class</option>
                  {classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Assignment'}
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
        {homework?.map((assignment: any) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    {assignment.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {assignment.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">{assignment.class.name}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Due Date:</span>{' '}
                    {formatDate(assignment.dueDate)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Submissions:</span>{' '}
                    {assignment.submissions.length}
                  </p>
                </div>
                {assignment.submissions.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold mb-2">Submissions:</h4>
                    <div className="space-y-2">
                      {assignment.submissions.map((sub: any) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span className="text-sm">{sub.student.name}</span>
                          <Button size="sm" variant="outline" asChild>
                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

