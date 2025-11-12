import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Redirect based on role
  if (session.user.role === 'ADMIN') {
    redirect('/admin/dashboard')
  } else if (session.user.role === 'TEACHER') {
    redirect('/teacher/admin')
  } else {
    redirect('/parent/dashboard')
  }
}

