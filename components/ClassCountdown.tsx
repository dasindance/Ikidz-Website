'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { formatRenewalMessage, isRenewalUrgent } from '@/lib/renewal-calculator'

interface ClassCountdownProps {
  studentName: string
  className: string
  classesRemaining: number
  totalClasses: number
  renewalDate: Date | null
}

export function ClassCountdown({
  studentName,
  className,
  classesRemaining,
  totalClasses,
  renewalDate,
}: ClassCountdownProps) {
  const isUrgent = isRenewalUrgent(classesRemaining, renewalDate)
  const percentage = (classesRemaining / totalClasses) * 100
  const message = formatRenewalMessage(classesRemaining, renewalDate)

  return (
    <Card className={`card-fun ${isUrgent ? 'border-2 border-ikids-orange' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-display text-ikids-orange mb-1">{className}</h3>
            <p className="text-sm text-muted-foreground">{studentName}</p>
          </div>
          {isUrgent ? (
            <AlertCircle className="h-8 w-8 text-ikids-orange animate-pulse" />
          ) : (
            <CheckCircle className="h-8 w-8 text-ikids-green" />
          )}
        </div>

        <div className="space-y-4">
          {/* Large Number Display */}
          <div className="text-center py-4">
            <div className="text-6xl font-display bg-gradient-ikids bg-clip-text text-transparent">
              {classesRemaining}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              classes remaining
            </p>
          </div>

          {/* Progress Bar */}
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute h-full rounded-full transition-all duration-500 ${
                percentage > 30
                  ? 'bg-gradient-ikids'
                  : 'bg-ikids-orange'
              }`}
              style={{ width: `${Math.max(5, percentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {totalClasses - classesRemaining} used
            </span>
            <span className="font-medium">{classesRemaining} left</span>
          </div>

          {/* Renewal Date */}
          {renewalDate && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
              <Calendar className="h-4 w-4 text-ikids-blue" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Renewal Date</p>
                <p className="text-sm font-medium">
                  {renewalDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Status Message */}
          <Badge
            variant={isUrgent ? 'destructive' : 'default'}
            className="w-full py-2 justify-center text-center rounded-xl"
          >
            {message}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

