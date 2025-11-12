'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Error',
          description: 'Invalid email or password',
          variant: 'destructive',
        })
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-fun p-4">
      <Card className="w-full max-w-md card-fun">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-ikids rounded-3xl flex items-center justify-center text-white font-display text-3xl animate-bounce-gentle">
            iK
          </div>
          <CardTitle className="text-4xl font-display bg-gradient-ikids bg-clip-text text-transparent">iKids Portal</CardTitle>
          <CardDescription className="text-center text-base">
            Welcome! Sign in to start learning 🎉
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full btn-fun bg-gradient-ikids hover:opacity-90" disabled={isLoading}>
              {isLoading ? '🔄 Signing in...' : '🚀 Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-sm font-semibold mb-2">Demo Accounts:</p>
            <div className="text-xs space-y-1">
              <p>Teacher: teacher@example.com / teacher123</p>
              <p>Parent: parent@example.com / parent123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

