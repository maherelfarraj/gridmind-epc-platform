/**
 * lib/finance/rate-limit.ts
 *
 * DB-backed sliding-window rate limiter for the import pipeline.
 * Uses the financial_imports table itself — no additional Redis infra required.
 *
 * Limits:
 *  - Per user:  10 imports per rolling 60-minute window
 *  - Per user:  3  in-flight (pending/processing) imports at once
 *  - File size: 50 MB hard cap (enforced before DB check)
 *
 * Pure utilities (validateMagicBytes, detectZipBomb, UPLOAD_LIMITS) are
 * re-exported from rate-limit-pure.ts so they can be used in tests without
 * pulling in Drizzle/Neon.
 */

import { db } from '@/lib/db'
import { financialImports } from '@/lib/db/schema'
import { and, eq, gt, or, count } from 'drizzle-orm'
import { UPLOAD_LIMITS } from './rate-limit-pure'

export { UPLOAD_LIMITS, validateMagicBytes, detectZipBomb } from './rate-limit-pure'

export interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfterSeconds?: number
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000)

  // Count imports in rolling 60-min window
  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(financialImports)
    .where(
      and(
        eq(financialImports.userId, userId),
        gt(financialImports.createdAt, windowStart),
      ),
    )

  if (recentCount >= UPLOAD_LIMITS.MAX_IMPORTS_PER_HOUR) {
    return {
      allowed: false,
      reason: `Rate limit: max ${UPLOAD_LIMITS.MAX_IMPORTS_PER_HOUR} imports per hour. Try again in up to 60 minutes.`,
      retryAfterSeconds: 3600,
    }
  }

  // Count in-flight jobs
  const [{ value: inflightCount }] = await db
    .select({ value: count() })
    .from(financialImports)
    .where(
      and(
        eq(financialImports.userId, userId),
        or(
          eq(financialImports.status, 'pending'),
          eq(financialImports.status, 'processing'),
        ),
      ),
    )

  if (inflightCount >= UPLOAD_LIMITS.MAX_INFLIGHT_IMPORTS) {
    return {
      allowed: false,
      reason: `Too many concurrent imports (${inflightCount}/${UPLOAD_LIMITS.MAX_INFLIGHT_IMPORTS}). Wait for existing jobs to complete.`,
      retryAfterSeconds: 30,
    }
  }

  return { allowed: true }
}


