import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'iKids Portal - ESL Management',
  description: 'iKids ESL Management Portal for Parents and Teachers',
  keywords: ['iKids', 'ESL', 'English', 'Learning', 'Education'],
  authors: [{ name: 'iKids' }],
  themeColor: '#FF6B6B',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

