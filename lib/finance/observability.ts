/**
 * lib/finance/observability.ts
 *
 * Structured observability helpers for the financial import pipeline.
 * Every import job emits a typed ImportJobEvent which is persisted via
 * the DB update in the route handler.  Aggregation helpers allow the
 * admin / ops dashboard to query health metrics without a separate APM.
 */

import type { FinancialModelResult } from './types'
import type { ExtractedField } from './import-schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImportPhase =
  | 'upload_received'
  | 'guard_passed'
  | 'guard_failed'
  | 'rate_limited'
  | 'idempotency_hit'
  | 'blob_stored'
  | 'ai_started'
  | 'ai_completed'
  | 'ai_failed'
  | 'reconciliation_started'
  | 'reconciliation_completed'
  | 'reconciliation_failed'
  | 'job_completed'
  | 'job_failed'

export interface AiUsageMetadata {
  modelId: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCostUsd: number       // computed: total_tokens × cost-per-token for the model
  latencyMs: number
  requestId?: string
}

export interface ReconciliationMetadata {
  totalFields: number
  highConfidence: number          // confidence >= 0.90
  mediumConfidence: number        // 0.75 <= confidence < 0.90
  lowConfidence: number           // confidence < 0.75
  unresolvedCount: number         // fields with no source evidence
  overriddenCount: number         // reviewer overrides applied
  rejectedCount: number           // fields rejected by reviewer
  validationErrorCount: number
  validationWarningCount: number
  validationInfoCount: number
}

export interface ImportJobObservability {
  jobId: string
  userId: string
  filename: string
  contentType: string
  fileSizeBytes: number
  phases: Array<{ phase: ImportPhase; ts: string; meta?: Record<string, unknown> }>
  ai?: AiUsageMetadata
  reconciliation?: ReconciliationMetadata
  durationMs?: number
}

// ---------------------------------------------------------------------------
// Cost table (approximate, update when model pricing changes)
// ---------------------------------------------------------------------------
const COST_PER_1K_TOKENS: Record<string, number> = {
  'gpt-4o':              0.005,
  'gpt-4o-mini':         0.00060,
  'gpt-4-turbo':         0.010,
  'claude-3-5-sonnet':   0.003,
  'claude-3-haiku':      0.00025,
}

function estimateCost(modelId: string, totalTokens: number): number {
  const rateKey = Object.keys(COST_PER_1K_TOKENS).find((k) => modelId.includes(k))
  const rate = rateKey ? COST_PER_1K_TOKENS[rateKey] : 0.005
  return (totalTokens / 1000) * rate
}

// ---------------------------------------------------------------------------
// Builder — accumulate phases during a request lifecycle
// ---------------------------------------------------------------------------
export class ImportJobTracker {
  private phases: ImportJobObservability['phases'] = []
  private startTs = Date.now()

  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly filename: string,
    public readonly contentType: string,
    public readonly fileSizeBytes: number,
  ) {}

  phase(phase: ImportPhase, meta?: Record<string, unknown>) {
    this.phases.push({ phase, ts: new Date().toISOString(), meta })
    return this
  }

  buildAiMetadata(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
    requestId?: string,
  ): AiUsageMetadata {
    const totalTokens = inputTokens + outputTokens
    return {
      modelId,
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens,
      estimatedCostUsd: estimateCost(modelId, totalTokens),
      latencyMs,
      requestId,
    }
  }

  buildReconciliationMetadata(fields: ExtractedField[], result: FinancialModelResult): ReconciliationMetadata {
    const high   = fields.filter((f) => f.confidence >= 0.90).length
    const medium = fields.filter((f) => f.confidence >= 0.75 && f.confidence < 0.90).length
    const low    = fields.filter((f) => f.confidence < 0.75).length
    const unresolved = fields.filter((f) => !f.evidence || f.evidence === '').length
    const overridden = fields.filter((f) => f.status === 'mapped' && f.confidence < 0.9).length
    const rejected   = fields.filter((f) => f.status === 'conflict').length
    return {
      totalFields: fields.length,
      highConfidence: high,
      mediumConfidence: medium,
      lowConfidence: low,
      unresolvedCount: unresolved,
      overriddenCount: overridden,
      rejectedCount: rejected,
      validationErrorCount:   result.validations.filter((v) => v.severity === 'error').length,
      validationWarningCount: result.validations.filter((v) => v.severity === 'warning').length,
      validationInfoCount:    result.validations.filter((v) => v.severity === 'info').length,
    }
  }

  snapshot(ai?: AiUsageMetadata, reconciliation?: ReconciliationMetadata): ImportJobObservability {
    return {
      jobId: this.jobId,
      userId: this.userId,
      filename: this.filename,
      contentType: this.contentType,
      fileSizeBytes: this.fileSizeBytes,
      phases: [...this.phases],
      ai,
      reconciliation,
      durationMs: Date.now() - this.startTs,
    }
  }
}

// ---------------------------------------------------------------------------
// Aggregation helpers — used by admin dashboard queries
// ---------------------------------------------------------------------------

export interface ImportHealthSummary {
  totalJobs: number
  completed: number
  failed: number
  rateLimited: number
  avgDurationMs: number
  avgConfidencePct: number
  avgEstimatedCostUsd: number
  topUnresolvedFields: string[]
}

/**
 * Derive a health summary from an array of raw usageMetadata JSONB blobs
 * retrieved from the DB.  Call this in a server component or RSC.
 */
export function summariseImportHealth(
  rows: Array<{ usageMetadata: ImportJobObservability | null; status: string }>,
): ImportHealthSummary {
  const completed = rows.filter((r) => r.status === 'completed').length
  const failed    = rows.filter((r) => r.status === 'failed').length
  const rateLimit = rows.filter((r) => r.usageMetadata?.phases.some((p) => p.phase === 'rate_limited')).length
  const withMeta  = rows.filter((r) => r.usageMetadata != null).map((r) => r.usageMetadata!)

  const avgDuration = withMeta.length
    ? withMeta.reduce((s, m) => s + (m.durationMs ?? 0), 0) / withMeta.length
    : 0

  const withAi = withMeta.filter((m) => m.ai)
  const avgCost = withAi.length
    ? withAi.reduce((s, m) => s + (m.ai!.estimatedCostUsd), 0) / withAi.length
    : 0

  const withRecon = withMeta.filter((m) => m.reconciliation)
  const avgConf = withRecon.length
    ? withRecon.reduce((s, m) => {
        const r = m.reconciliation!
        const total = r.totalFields || 1
        return s + ((r.highConfidence + r.mediumConfidence * 0.825) / total)
      }, 0) / withRecon.length
    : 0

  return {
    totalJobs: rows.length,
    completed,
    failed,
    rateLimited: rateLimit,
    avgDurationMs: Math.round(avgDuration),
    avgConfidencePct: Math.round(avgConf * 100),
    avgEstimatedCostUsd: Number(avgCost.toFixed(5)),
    topUnresolvedFields: [],
  }
}
