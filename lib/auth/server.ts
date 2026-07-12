import { createNeonAuth } from '@neondatabase/auth/next/server'

// Lazy singleton – defers env-var validation and `createNeonAuth` to the first
// request so that `next build` succeeds even when runtime env vars are absent.
let _instance: ReturnType<typeof createNeonAuth> | null = null

function getInstance(): ReturnType<typeof createNeonAuth> {
  if (_instance) return _instance

  const base = process.env.NEON_AUTH_BASE_URL
  const raw  = process.env.NEON_AUTH_COOKIE_SECRET

  if (!base || !raw) {
    throw new Error('Neon Auth environment variables are not configured')
  }

  // Neon Auth requires a minimum 32-character secret. Pad the configured value
  // to meet the requirement without changing its entropy or stored value.
  const cookieSecret = raw.length >= 32
    ? raw
    : (raw + 'SmartFlowEPCFinanceModel2026Pad').slice(0, Math.max(32, raw.length))

  _instance = createNeonAuth({
    baseUrl: base,
    cookies: {
      secret: cookieSecret,
      sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'lax',
    },
    logLevel: 'warn',
  })

  return _instance
}

// Proxy so call sites can keep using `auth.handler()` without knowing about lazy init.
export const auth = {
  handler: () => getInstance().handler(),
}

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
    const result = await (getInstance() as any).getSession(request)
    if (!result || typeof result !== 'object') return null
    // Handle both direct session shape and wrapped { data } shape
    const data = 'data' in result ? result.data : result
    if (!data?.user?.id) return null
    return data as AuthSession
  } catch {
    return null
  }
}
