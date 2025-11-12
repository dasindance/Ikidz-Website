import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect to appropriate dashboard if accessing root
    if (path === '/') {
      if (token?.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
      if (token?.role === 'TEACHER') {
        return NextResponse.redirect(new URL('/teacher/admin', req.url))
      }
      return NextResponse.redirect(new URL('/parent/dashboard', req.url))
    }

    // Allow ADMIN to access everything
    if (token?.role === 'ADMIN') {
      return NextResponse.next()
    }

    // Protect admin routes (only ADMIN can access)
    if (path.startsWith('/admin')) {
      // Redirect to user's appropriate dashboard instead of login
      if (token?.role === 'TEACHER') {
        return NextResponse.redirect(new URL('/teacher/admin', req.url))
      }
      return NextResponse.redirect(new URL('/parent/dashboard', req.url))
    }

    // Protect teacher routes
    if (path.startsWith('/teacher') && token?.role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/parent/dashboard', req.url))
    }

    // Protect parent routes
    if (path.startsWith('/parent') && token?.role !== 'PARENT') {
      return NextResponse.redirect(new URL('/teacher/admin', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/parent/:path*',
    '/teacher/:path*',
    '/admin/:path*',
  ],
}

