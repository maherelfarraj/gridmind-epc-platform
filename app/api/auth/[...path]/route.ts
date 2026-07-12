import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

// Wrap handlers so `auth.handler()` (and thus `getInstance()`) is only called
// at request time, not at module load / build time.
export async function GET(request: Request) {
  const { GET: handle } = auth.handler() as { GET: (r: Request) => Response | Promise<Response> }
  return handle(request)
}

export async function POST(request: Request) {
  const { POST: handle } = auth.handler() as { POST: (r: Request) => Response | Promise<Response> }
  return handle(request)
}
