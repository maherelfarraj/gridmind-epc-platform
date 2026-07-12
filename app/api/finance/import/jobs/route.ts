/**
 * GET /api/finance/import/jobs
 *
 * Returns recent import jobs for the authenticated user with full
 * observability metadata.  Used by the import review panel and any
 * admin dashboard that tracks extraction health.
 *
 * Query params:
 *   limit  – max rows (default 20, max 100)
 *   status – filter: pending | processing | completed | failed
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRouteSession } from '@/lib/auth/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
import { financialImports } from '@/lib/db/schema'
import { summariseImportHealth, type ImportJobObservability } from '@/lib/finance/observability'
import { and, desc, eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const limitParam  = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)))
  const statusParam = searchParams.get('status') ?? null

  const conditions = [eq(financialImports.userId, session.user.id)]
  if (statusParam) conditions.push(eq(financialImports.status, statusParam))

  const rows = await db
    .select({
      id:             financialImports.id,
      filename:       financialImports.filename,
      contentType:    financialImports.contentType,
      status:         financialImports.status,
      usageMetadata:  financialImports.usageMetadata,
      errorMessage:   financialImports.errorMessage,
      startedAt:      financialImports.startedAt,
      completedAt:    financialImports.completedAt,
      createdAt:      financialImports.createdAt,
    })
    .from(financialImports)
    .where(and(...conditions))
    .orderBy(desc(financialImports.createdAt))
    .limit(limitParam)

  const health = summariseImportHealth(
    rows.map((r) => ({
      usageMetadata: r.usageMetadata as ImportJobObservability | null,
      status: r.status,
    })),
  )

  return NextResponse.json({ jobs: rows, health })
}
