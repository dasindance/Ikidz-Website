'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { Bell, Check } from 'lucide-react'

async function fetchNotifications() {
  const res = await fetch('/api/notifications')
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json()
}

async function markAsRead(notificationId: string) {
  const res = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to mark as read')
  return res.json()
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  })

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'MEMBERSHIP_RENEWAL':
        return 'destructive'
      case 'NEW_HOMEWORK':
        return 'default'
      case 'NEW_ANNOUNCEMENT':
        return 'secondary'
      case 'SCHEDULE_CHANGE':
        return 'destructive'
      case 'HOLIDAY_REMINDER':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Stay updated on important information
        </p>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="grid gap-4">
          {notifications.map((notification: any) => (
            <Card
              key={notification.id}
              className={notification.isRead ? 'opacity-60' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center">
                      <Bell className="mr-2 h-4 w-4" />
                      {notification.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getNotificationColor(notification.type)}>
                      {notification.type.replace('_', ' ')}
                    </Badge>
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markReadMutation.mutate(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No notifications at this time
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

