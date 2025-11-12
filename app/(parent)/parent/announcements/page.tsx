'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { MessageSquare, AlertCircle } from 'lucide-react'

async function fetchAnnouncements() {
  const res = await fetch('/api/announcements')
  if (!res.ok) throw new Error('Failed to fetch announcements')
  return res.json()
}

export default function AnnouncementsPage() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: fetchAnnouncements,
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'schedule_change':
        return 'destructive'
      case 'holiday':
        return 'default'
      case 'promotion':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground mt-2">
          Important updates from your teacher
        </p>
      </div>

      {announcements && announcements.length > 0 ? (
        <div className="grid gap-6">
          {announcements.map((announcement: any) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      {announcement.title}
                      {announcement.priority === 'high' && (
                        <AlertCircle className="ml-2 h-4 w-4 text-destructive" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {formatDateTime(announcement.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge variant={getCategoryColor(announcement.category)}>
                    {announcement.category.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No announcements at this time
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


