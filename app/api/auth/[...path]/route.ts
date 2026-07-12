import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth/server'

// Call auth.handler() inside each function so the Neon Auth client is only
// instantiated at request time, not during module evaluation.
export async function GET(request: NextRequest) {
  return auth.handler().GET(request)
}

export async function POST(request: NextRequest) {
  return auth.handler().POST(request)
}
