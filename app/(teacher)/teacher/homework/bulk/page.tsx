'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { FileText, Upload, Calendar, Zap } from 'lucide-react'

async function fetchClasses() {
  const res = await fetch('/api/classes')
  if (!res.ok) throw new Error('Failed to fetch classes')
  return res.json()
}

async function createBulkHomework(data: any) {
  const res = await fetch('/api/homework/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create bulk homework')
  return res.json()
}

export default function BulkHomeworkPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [classId, setClassId] = useState('')
  const [unitName, setUnitName] = useState('')
  const [description, setDescription] = useState('')
  const [numberOfClasses, setNumberOfClasses] = useState(8)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const createMutation = useMutation({
    mutationFn: createBulkHomework,
    onSuccess: (data) => {
      toast({
        title: '🎉 Success!',
        description: `Created ${data.count} homework assignments`,
      })
      router.push('/teacher/homework')
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create homework',
        variant: 'destructive',
      })
    },
  })

  const selectedClass = classes?.find((c: any) => c.id === classId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!classId || !unitName || !description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    createMutation.mutate({
      classId,
      unitName,
      description,
      numberOfClasses,
      startDate,
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-display bg-gradient-ikids bg-clip-text text-transparent">
          Bulk Homework Distribution ⚡
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Create homework for an entire unit at once
        </p>
      </div>

      <Card className="card-fun">
        <CardHeader className="bg-gradient-fun/10">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-ikids-orange" />
            Quick Homework Setup
          </CardTitle>
          <CardDescription>
            One assignment will be distributed across all class dates
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <select
                id="class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a class</option>
                {classes?.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {selectedClass && (
                <p className="text-sm text-muted-foreground">
                  Schedule: {selectedClass.schedule || 'Not set'}
                </p>
              )}
            </div>

            <div className="p-4 bg-ikids-blue/10 rounded-2xl space-y-4">
              <h3 className="font-semibold text-ikids-blue">📚 Unit Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="unitName">Unit Name *</Label>
                <Input
                  id="unitName"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g., Unit 8: Daily Routines"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfClasses">Number of Classes in Unit *</Label>
                <Input
                  id="numberOfClasses"
                  type="number"
                  min={1}
                  max={20}
                  value={numberOfClasses}
                  onChange={(e) => setNumberOfClasses(parseInt(e.target.value))}
                  className="rounded-xl"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Homework will be distributed across {numberOfClasses} class sessions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Assignment Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the homework assignment that will be repeated..."
                rows={5}
                className="rounded-xl"
                required
              />
              <p className="text-xs text-muted-foreground">
                💡 Tip: This description will be used for all {numberOfClasses} homework assignments.
                Mention specific pages will vary per lesson.
              </p>
            </div>

            <div className="p-4 bg-ikids-green/10 rounded-2xl">
              <h4 className="font-semibold mb-2">Preview</h4>
              <p className="text-sm">
                This will create <strong>{numberOfClasses} homework assignments</strong> starting from{' '}
                {new Date(startDate).toLocaleDateString()}, distributed evenly across the unit.
              </p>
              {selectedClass && selectedClass.daysOfWeek && (
                <p className="text-sm mt-2">
                  Based on {selectedClass.name}'s schedule, assignments will be created for each class day.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="btn-fun bg-gradient-ikids"
              >
                {createMutation.isPending ? '⚡ Creating...' : `✨ Create ${numberOfClasses} Assignments`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✅ Select your class and unit</p>
          <p>✅ Set how many classes are in the unit</p>
          <p>✅ Write one homework description</p>
          <p>✅ System automatically creates {numberOfClasses} assignments</p>
          <p>✅ Each assignment is scheduled for the next class day</p>
          <p>✅ Parents get notified for each assignment</p>
        </CardContent>
      </Card>
    </div>
  )
}

