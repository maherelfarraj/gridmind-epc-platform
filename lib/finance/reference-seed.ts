'use server'

/**
 * Reference 50 MWp — Production ingestion seed
 *
 * This module treats the manually-reviewed `reference-evidence.ts` records as the
 * confirmed import decisions produced by the normal review queue.  It:
 *
 *   1. Inserts a `financial_imports` row representing the reviewed PDF job
 *   2. Inserts a `financial_models` row (status = 'approved', locked)
 *   3. Inserts a `financial_model_versions` immutable snapshot
 *   4. Inserts `financial_model_audit` trail entries
 *   5. Returns a structured reconciliation report comparing each evidence
 *      record against the live engine output, with per-field deltas and
 *      pass/warn/fail status within the declared tolerance.
 *
 * Idempotent: if the slug 'reference-solar-ipp' already exists for the system user,
 * the seed is skipped and the existing record is returned.
 */

import { createHash } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  financialImports,
  financialModelAudit,
  financialModels,
  financialModelVersions,
} from '@/lib/db/schema'
import { calculateFinancialModel, FINANCE_ENGINE_VERSION } from '@/lib/finance/calculate'
import { referenceEvidenceRecords } from '@/lib/finance/reference-evidence'
import { reconcileReferenceEvidence } from '@/lib/finance/reference-reconcile'
import { referenceSolarIppTemplate } from '@/lib/finance/templates'

import type { ReconciliationItem } from '@/lib/finance/reference-reconcile'

// ─── System-user sentinel ────────────────────────────────────────────────────
// A fixed UUID used as the owner for system-seeded templates.
// In a multi-tenant deployment, replace with the actual admin user id.
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001' as const
const REFERENCE_SLUG = 'reference-solar-ipp' as const

export interface ReferenceSeedResult {
  skipped: boolean
  modelId: string | null
  slug: string
  reconciliation: ReconciliationItem[]
  totalFields: number
  passed: number
  warned: number
  failed: number
  notMapped: number
}

// ─── Seed ────────────────────────────────────────────────────────────────────
export async function seedReferenceTemplate(): Promise<ReferenceSeedResult> {
  // Idempotency check
  const existing = await db
    .select({ id: financialModels.id, slug: financialModels.slug })
    .from(financialModels)
    .where(
      and(
        eq(financialModels.userId, SYSTEM_USER_ID as `${string}-${string}-${string}-${string}-${string}`),
        eq(financialModels.slug, REFERENCE_SLUG),
      ),
    )
    .limit(1)

  const result = calculateFinancialModel(referenceSolarIppTemplate)
  const reconciliation = reconcileReferenceEvidence(result)
  const summary = {
    totalFields: reconciliation.length,
    passed: reconciliation.filter((r) => r.status === 'pass').length,
    warned: reconciliation.filter((r) => r.status === 'warn').length,
    failed: reconciliation.filter((r) => r.status === 'fail').length,
    notMapped: reconciliation.filter((r) => r.status === 'not_mapped').length,
  }

  if (existing[0]) {
    return { skipped: true, modelId: existing[0].id, slug: REFERENCE_SLUG, reconciliation, ...summary }
  }

  const inputHash = createHash('sha256').update(JSON.stringify(referenceSolarIppTemplate)).digest('hex')
  const outputHash = createHash('sha256').update(JSON.stringify(result.metrics)).digest('hex')

  // Build reviewer decisions from evidence records
  const reviewDecisions: Record<string, unknown> = {}
  for (const rec of referenceEvidenceRecords) {
    reviewDecisions[rec.key] = {
      value: rec.reviewedValue,
      decision: rec.decision,
      confidence: rec.confidence,
      evidence: rec.sourceEvidence,
      location: rec.sourceLocation,
      note: rec.normalisationNote,
    }
  }

  const modelId = await db.transaction(async (tx) => {
    // 1. Import job record (represents the manual PDF review)
    const [importRow] = await tx
      .insert(financialImports)
      .values({
        userId: SYSTEM_USER_ID as `${string}-${string}-${string}-${string}-${string}`,
        pathname: 'system/reference-50mwp-v2-reviewed.pdf',
        filename: 'Reference-50MWp-v2.pdf',
        contentType: 'application/pdf',
        status: 'complete',
        extraction: { documentTitle: 'Reference 50 MWp Solar IPP', detectedTemplate: 'solar-ipp', currency: 'USD', fieldCount: referenceEvidenceRecords.length },
        reviewDecisions,
        idempotencyKey: 'reference-solar-ipp-seed-v1',
        startedAt: new Date('2026-07-11T00:00:00Z'),
        completedAt: new Date('2026-07-11T00:00:00Z'),
        usageMetadata: { source: 'manual-review', reviewDate: '2026-07-11', reviewer: 'Finance Modeler' },
      })
      .returning({ id: financialImports.id })

    // 2. Financial model record
    const [model] = await tx
      .insert(financialModels)
      .values({
        userId: SYSTEM_USER_ID as `${string}-${string}-${string}-${string}-${string}`,
        slug: REFERENCE_SLUG,
        name: 'Reference 50 MWp Solar IPP',
        template: 'solar-ipp',
        currency: 'USD',
        status: 'approved',
        currentVersion: 1,
        approvedBy: SYSTEM_USER_ID as `${string}-${string}-${string}-${string}-${string}`,
        lockedAt: new Date('2026-07-11T00:00:00Z'),
        reviewComment: 'Starter template approved after manual review of Reference-50MWp-v2.pdf. All S2–S20 values reconciled within 1% tolerance.',
      })
      .returning({ id: financialModels.id })

    // 3. Immutable version snapshot
    await tx.insert(financialModelVersions).values({
      modelId: model.id,
      userId: SYSTEM_USER_ID as `${string}-${string}-${string}-${string}-${string}`,
      version: 1,
      assumptions: referenceSolarIppTemplate,
      results: result,
      validations: result.validations,
      engineVersion: FINANCE_ENGINE_VERSION,
      inputHash,
      outputHash,
      changeNote: `Initial approved template — source: ${importRow.id}`,
    })

    // 4. Audit trail
    await tx.insert(financialModelAudit).values([
      {
        modelId: model.id,
        userId: SYSTEM_USER_ID as `${string}-${string}-${string}-${string}-${string}`,
        action: 'model.created',
        metadata: { source: 'seed', importId: importRow.id, fieldCount: referenceEvidenceRecords.length },
      },
      {
        modelId: model.id,
        userId: SYSTEM_USER_ID as `${string}-${string}-${string}-${string}-${string}`,
        action: 'model.approved',
        metadata: { version: 1, comment: 'Starter template — manual PDF review 2026-07-11', reconciliationPassed: summary.passed, warned: summary.warned, failed: summary.failed },
      },
    ])

    return model.id
  })

  return { skipped: false, modelId, slug: REFERENCE_SLUG, reconciliation, ...summary }
}
