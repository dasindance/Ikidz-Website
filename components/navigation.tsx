'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Home,
  BookOpen,
  FileText,
  Calendar,
  Bell,
  User,
  LogOut,
  Settings,
  Users,
  MessageSquare,
} from 'lucide-react'

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  const isTeacher = session.user.role === 'TEACHER'
  const isParent = session.user.role === 'PARENT'

  const parentLinks = [
    { href: '/parent/dashboard', label: 'Dashboard', icon: Home },
    { href: '/parent/homework', label: 'Homework', icon: FileText },
    { href: '/parent/lessons', label: 'Lessons', icon: BookOpen },
    { href: '/parent/calendar', label: 'Calendar', icon: Calendar },
    { href: '/parent/announcements', label: 'Announcements', icon: MessageSquare },
    { href: '/parent/notifications', label: 'Notifications', icon: Bell },
  ]

  const teacherLinks = [
    { href: '/teacher/admin', label: 'Dashboard', icon: Home },
    { href: '/teacher/post-lesson', label: 'Post Lesson', icon: BookOpen },
    { href: '/teacher/homework', label: 'Homework', icon: FileText },
    { href: '/teacher/announcements', label: 'Announcements', icon: MessageSquare },
    { href: '/teacher/students', label: 'Students', icon: Users },
    { href: '/teacher/calendar', label: 'Calendar', icon: Calendar },
  ]

  const links = isTeacher ? teacherLinks : parentLinks

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-ikids rounded-xl flex items-center justify-center text-white font-display text-lg">
                  iK
                </div>
                <span className="text-2xl font-display bg-gradient-ikids bg-clip-text text-transparent">iKids</span>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all',
                      isActive
                        ? 'bg-gradient-ikids text-white shadow-fun'
                        : 'text-gray-700 hover:bg-ikids-orange/10 hover:text-ikids-orange'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {session.user.name} ({isTeacher ? 'Teacher' : 'Parent'})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block pl-3 pr-4 py-2 text-base font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="inline mr-2 h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

