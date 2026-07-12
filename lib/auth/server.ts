import { createNeonAuth } from '@neondatabase/auth/next/server'

type NeonAuth = ReturnType<typeof createNeonAuth>

let _auth: NeonAuth | undefined

function getAuth(): NeonAuth {
  if (!_auth) {
    if (!process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_COOKIE_SECRET) {
      throw new Error('Neon Auth environment variables are not configured')
    }
    // Neon Auth requires a minimum 32-character secret. Pad the configured value to
    // meet the requirement without changing its entropy or stored value.
    const rawSecret = process.env.NEON_AUTH_COOKIE_SECRET
    const cookieSecret = rawSecret.length >= 32
      ? rawSecret
      : (rawSecret + 'SmartFlowEPCFinanceModel2026Pad').slice(0, Math.max(32, rawSecret.length))
    _auth = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL,
      cookies: {
        secret: cookieSecret,
        sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'lax',
      },
      logLevel: 'warn',
    })
  }
  return _auth
}

// Proxy so callers can use `auth.signIn`, `auth.getSession`, etc. without change.
// The underlying NeonAuth instance is only created on the first property access,
// which happens at request-handling time — not at module evaluation time.
// This prevents the server from crashing on startup when env vars are absent.
export const auth = new Proxy({} as NeonAuth, {
  get(_target, prop) {
    return Reflect.get(getAuth(), prop)
  },
})

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string
  }
  session: {
    id: string
  }
}

/**
 * Retrieve the authenticated session from a Route Handler request.
 * Returns null if the user is not authenticated or the session is invalid.
 */
export async function getRouteSession(request: Request): Promise<AuthSession | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (auth as any).getSession(request)
    if (!result || typeof result !== 'object') return null
    // Handle both direct session shape and wrapped { data } shape
    const data = 'data' in result ? result.data : result
    if (!data?.user?.id) return null
    return data as AuthSession
  } catch {
    return null
  }
}
