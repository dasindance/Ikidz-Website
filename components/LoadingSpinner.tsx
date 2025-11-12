'use client'

import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-ikids-orange" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

