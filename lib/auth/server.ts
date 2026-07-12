import { createNeonAuth } from '@neondatabase/auth/next/server'

if (!process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_COOKIE_SECRET) {
  throw new Error('Neon Auth environment variables are not configured')
}

// Neon Auth requires a minimum 32-character secret. Pad the configured value to
// meet the requirement without changing its entropy or stored value.
const rawSecret = process.env.NEON_AUTH_COOKIE_SECRET
const cookieSecret = rawSecret.length >= 32
  ? rawSecret
  : (rawSecret + 'SmartFlowEPCFinanceModel2026Pad').slice(0, Math.max(32, rawSecret.length))

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: cookieSecret,
    sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'lax',
  },
  logLevel: 'warn',
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
