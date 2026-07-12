import { NextResponse, type NextRequest } from 'next/server'
import { getRouteSession } from '@/lib/auth/server'
import { seedReferenceTemplate } from '@/lib/finance/reference-seed'

/**
 * POST /api/finance/seed-reference
 *
 * One-time idempotent endpoint that publishes the Reference 50 MWp starter template
 * into the Neon database. Requires an authenticated session.
 *
 * Returns the reconciliation report so the caller can confirm all evidence
 * records are within tolerance before deploying to production.
 */
export async function POST(request: NextRequest) {
  const session = await getRouteSession(request)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await seedReferenceTemplate()
    return NextResponse.json(result, { status: result.skipped ? 200 : 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seed failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/finance/seed-reference
 *
 * Returns the current reconciliation report without persisting anything.
 * Useful for verifying evidence deltas in CI without a DB connection.
 */
export async function GET(request: NextRequest) {
  const session = await getRouteSession(request)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reconcileReferenceEvidence } = await import('@/lib/finance/reference-reconcile')
  const { calculateFinancialModel } = await import('@/lib/finance/calculate')
  const { referenceSolarIppTemplate } = await import('@/lib/finance/templates')
  const result = calculateFinancialModel(referenceSolarIppTemplate)
  const reconciliation = reconcileReferenceEvidence(result)

  return NextResponse.json({
    reconciliation,
    totalFields: reconciliation.length,
    passed: reconciliation.filter((r) => r.status === 'pass').length,
    warned: reconciliation.filter((r) => r.status === 'warn').length,
    failed: reconciliation.filter((r) => r.status === 'fail').length,
    notMapped: reconciliation.filter((r) => r.status === 'not_mapped').length,
  })
}
