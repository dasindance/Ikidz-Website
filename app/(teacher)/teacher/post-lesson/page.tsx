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
import { BookOpen, Plus, X, Star } from 'lucide-react'

const BOOK_SERIES = [
  { value: 'National Geographic Our World', label: '📚 National Geographic Our World', levels: ['Starter', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'] },
  { value: 'Oxford Phonics World', label: '📖 Oxford Phonics World', levels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'] },
  { value: 'Power Up', label: '⚡ Power Up', levels: ['Starter', 'Level 1', 'Level 2', 'Level 3', 'Level 4'] },
  { value: 'Think', label: '💭 Think', levels: ['Starter', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'] },
]

const SKILLS = ['Reading', 'Writing', 'Listening', 'Speaking']

async function fetchClasses() {
  const res = await fetch('/api/classes')
  if (!res.ok) throw new Error('Failed to fetch classes')
  return res.json()
}

async function createLesson(data: any) {
  const res = await fetch('/api/lessons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create lesson')
  return res.json()
}

export default function PostLessonPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [bookSeries, setBookSeries] = useState('')
  const [bookLevel, setBookLevel] = useState('')
  const [unit, setUnit] = useState('')
  const [pageNumbers, setPageNumbers] = useState('')
  const [topics, setTopics] = useState<string[]>([''])
  const [vocabulary, setVocabulary] = useState<string[]>([''])
  const [grammarPoints, setGrammarPoints] = useState<string[]>([''])
  const [skills, setSkills] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const createMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      toast({
        title: '🎉 Success!',
        description: 'Lesson posted successfully',
      })
      router.push('/teacher/admin')
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to post lesson',
        variant: 'destructive',
      })
    },
  })

  const selectedBook = BOOK_SERIES.find(b => b.value === bookSeries)

  const addItem = (setter: any, items: string[]) => {
    setter([...items, ''])
  }

  const removeItem = (setter: any, items: string[], index: number) => {
    setter(items.filter((_, i) => i !== index))
  }

  const updateItem = (setter: any, items: string[], index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    setter(newItems)
  }

  const toggleSkill = (skill: string) => {
    setSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const filteredTopics = topics.filter((t) => t.trim() !== '')
    const filteredVocab = vocabulary.filter((v) => v.trim() !== '')
    const filteredGrammar = grammarPoints.filter((g) => g.trim() !== '')

    if (!classId || !unit || filteredTopics.length === 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    createMutation.mutate({
      classId,
      date,
      bookSeries: bookSeries || undefined,
      bookLevel: bookLevel || undefined,
      unit,
      pageNumbers: pageNumbers || undefined,
      topics: filteredTopics,
      vocabulary: filteredVocab,
      grammarPoints: filteredGrammar,
      skills,
      notes: notes || undefined,
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-display bg-gradient-ikids bg-clip-text text-transparent">Post Lesson 📖</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Record what was covered in today's class
        </p>
      </div>

      <Card className="card-fun">
        <CardHeader className="bg-gradient-fun/10">
          <CardTitle className="flex items-center text-2xl">
            <BookOpen className="mr-2 h-6 w-6 text-ikids-orange" />
            Lesson Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-ikids-blue/10 rounded-2xl space-y-4">
              <h3 className="font-semibold text-ikids-blue">📚 Book & Curriculum</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bookSeries">Book Series</Label>
                  <select
                    id="bookSeries"
                    value={bookSeries}
                    onChange={(e) => {
                      setBookSeries(e.target.value)
                      setBookLevel('')
                    }}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select book series</option>
                    {BOOK_SERIES.map((book) => (
                      <option key={book.value} value={book.value}>
                        {book.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bookLevel">Level</Label>
                  <select
                    id="bookLevel"
                    value={bookLevel}
                    onChange={(e) => setBookLevel(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    disabled={!bookSeries}
                  >
                    <option value="">Select level</option>
                    {selectedBook?.levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g., Unit 1: My Family"
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageNumbers">Pages</Label>
                  <Input
                    id="pageNumbers"
                    value={pageNumbers}
                    onChange={(e) => setPageNumbers(e.target.value)}
                    placeholder="e.g., 12-15"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topics Covered *</Label>
              {topics.map((topic, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={topic}
                    onChange={(e) => updateItem(setTopics, topics, index, e.target.value)}
                    placeholder={`Topic ${index + 1}`}
                    className="rounded-xl"
                  />
                  {topics.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(setTopics, topics, index)}
                      className="rounded-xl"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(setTopics, topics)}
                className="rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Topic
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Vocabulary Words</Label>
              {vocabulary.map((word, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={word}
                    onChange={(e) => updateItem(setVocabulary, vocabulary, index, e.target.value)}
                    placeholder={`Vocabulary word ${index + 1}`}
                    className="rounded-xl"
                  />
                  {vocabulary.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(setVocabulary, vocabulary, index)}
                      className="rounded-xl"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(setVocabulary, vocabulary)}
                className="rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Vocabulary
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Grammar Points</Label>
              {grammarPoints.map((point, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={point}
                    onChange={(e) => updateItem(setGrammarPoints, grammarPoints, index, e.target.value)}
                    placeholder={`Grammar point ${index + 1}`}
                    className="rounded-xl"
                  />
                  {grammarPoints.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(setGrammarPoints, grammarPoints, index)}
                      className="rounded-xl"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(setGrammarPoints, grammarPoints)}
                className="rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Grammar Point
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Skills Practiced</Label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <Badge
                    key={skill}
                    variant={skills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 rounded-xl transition-all hover:scale-105"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill} {skills.includes(skill) && '✓'}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes for Parents</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes or homework suggestions..."
                rows={4}
                className="rounded-xl"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="btn-fun bg-gradient-ikids"
              >
                {createMutation.isPending ? '📝 Posting...' : '✨ Post Lesson'}
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
    </div>
  )
}

