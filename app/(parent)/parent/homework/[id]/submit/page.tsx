'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/FileUpload'
import { useToast } from '@/hooks/use-toast'
import { Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { validateFile } from '@/lib/storage/upload'

async function fetchHomeworkDetails(id: string) {
  const res = await fetch(`/api/homework/${id}`)
  if (!res.ok) throw new Error('Failed to fetch homework')
  return res.json()
}

async function fetchStudents() {
  const res = await fetch('/api/students')
  if (!res.ok) throw new Error('Failed to fetch students')
  return res.json()
}

async function uploadFile(file: File, presignedUrl: string) {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })
  if (!res.ok) throw new Error('Failed to upload file')
}

async function createSubmission(data: any) {
  const res = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create submission')
  return res.json()
}

async function getPresignedUrl(assignmentId: string, filename: string, contentType: string) {
  const res = await fetch('/api/upload/presigned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignmentId, filename, contentType }),
  })
  if (!res.ok) throw new Error('Failed to get upload URL')
  return res.json()
}

export default function SubmitHomeworkPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [studentId, setStudentId] = useState('')
  const [notes, setNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const { data: homework } = useQuery({
    queryKey: ['homework', params.id],
    queryFn: () => fetchHomeworkDetails(params.id),
  })

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
  })

  useEffect(() => {
    if (students && students.length > 0 && !studentId) {
      setStudentId(students[0].id)
    }
  }, [students, studentId])

  const handleFileSelected = (file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive',
      })
      return
    }
    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile || !studentId) {
      toast({
        title: 'Error',
        description: 'Please select a file and student',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      // Get presigned URL
      const { presignedUrl, key } = await getPresignedUrl(
        params.id,
        selectedFile.name,
        selectedFile.type
      )

      // Upload file to S3/R2
      await uploadFile(selectedFile, presignedUrl)

      // Create submission record
      await createSubmission({
        assignmentId: params.id,
        studentId,
        fileKey: key,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        notes: notes || undefined,
      })

      toast({
        title: 'Success',
        description: 'Homework submitted successfully',
      })

      router.push('/parent/homework')
    } catch (error) {
      console.error('Submission error:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit homework',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (!homework) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/parent/homework">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Submit Homework</h1>
        <p className="text-muted-foreground mt-2">{homework.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>{homework.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            <span className="font-medium">Class:</span> {homework.class.name}
          </p>
          <p className="text-sm">
            <span className="font-medium">Due Date:</span>{' '}
            {new Date(homework.dueDate).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Upload Your Work
          </CardTitle>
          <CardDescription>
            Upload your completed homework assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {students && students.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <select
                  id="student"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {students.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Upload File *</Label>
              <FileUpload
                selectedFile={selectedFile}
                onFileSelected={handleFileSelected}
                onRemove={() => setSelectedFile(null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes or comments..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isUploading || !selectedFile}>
                {isUploading ? 'Uploading...' : 'Submit Homework'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
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

