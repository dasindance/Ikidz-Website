'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // Reduced from 60s to ensure fresher data
            refetchOnWindowFocus: true, // Enable refetch on focus to catch session changes
            retry: 1, // Retry failed requests once
          },
        },
      })
  )

  return (
    <SessionProvider refetchInterval={60} refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  )
}


