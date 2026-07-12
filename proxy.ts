import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth/server'

const authMiddleware = auth.middleware({ loginUrl: '/auth/sign-in' })

/**
 * The Neon Auth middleware (currently a beta package) intercepts Server Action
 * POSTs on matched routes and returns an empty `{}` JSON body instead of letting
 * the action run, surfacing in the client as "An unexpected response was received
 * from the server" and silently blocking every mutation.
 *
 * Server Actions carry the `next-action` header. We let those pass straight
 * through — they enforce their own authentication via `getUserId()` in each
 * server action — while all normal navigation still flows through the auth
 * middleware for route protection and session refresh.
 */
export default function proxy(request: NextRequest) {
  const isServerAction =
    request.method === 'POST' && request.headers.has('next-action')

  if (isServerAction) {
    return NextResponse.next()
  }

  return authMiddleware(request)
}

export const config = {
  matcher: ['/finance/models/:path*', '/api/finance/:path*', '/api/files/:path*'],
}
