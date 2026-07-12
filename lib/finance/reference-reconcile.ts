/**
 * lib/finance/reference-reconcile.ts
 *
 * Pure (no-DB) reconciliation logic for the Reference 50 MWp starter template.
 * Extracted from reference-seed.ts so it can be imported in tests without pulling
 * in Drizzle or Neon.
 */

import { referenceEvidenceRecords } from './reference-evidence'
import { referenceSolarIppTemplate } from './templates'
import type { FinancialModelResult, EngineResult } from './types'

const TOLERANCE_RELATIVE = 0.01  // 1% relative
const TOLERANCE_ABSOLUTE = 1.0   // 1 unit absolute for very small numbers

export interface ReconciliationItem {
  key: string
  label: string
  evidenceValue: number
  engineValue: number | null
  unit: string
  delta: number | null
  relativeDelta: number | null
  status: 'pass' | 'warn' | 'fail' | 'not_mapped'
  note: string
}

function extractEngineValues(result: EngineResult | FinancialModelResult): Record<string, number | null> {
  const s2 = result.periods[1]
  const s3 = result.periods[2]
  return {
    operatingYears:        result.periods.length,
    capacityMwp:           referenceSolarIppTemplate.capacityMwp,
    opexPerMwp:            referenceSolarIppTemplate.opexPerMwp,
    opexEscalationRate:    s2 && s3 ? (s3.operatingCost / s2.operatingCost) - 1 : null,
    adminCost_insurance:   null,
    adminCost_spv:         null,
    adminCost:             referenceSolarIppTemplate.adminCost,
    adminEscalationRate:   referenceSolarIppTemplate.adminEscalationRate,
    inflationRate:         referenceSolarIppTemplate.inflationRate,
    correctiveMaintenance: 0,
    majorMaintenance:      0,
    preventiveMaintenance: 0,
    currency:              null,
  }
}

export function reconcileReferenceEvidence(result: FinancialModelResult | EngineResult): ReconciliationItem[] {
  const engineValues = extractEngineValues(result)

  return referenceEvidenceRecords.map((rec): ReconciliationItem => {
    const engineValue = engineValues[rec.key] ?? null

    if (engineValue === null) {
      return {
        key: rec.key, label: rec.label,
        evidenceValue: rec.reviewedValue, engineValue: null,
        unit: rec.unit, delta: null, relativeDelta: null,
        status: 'not_mapped',
        note: 'Engine does not expose this as a direct numeric output — field is embedded or string-type.',
      }
    }

    const delta = Math.abs(engineValue - rec.reviewedValue)
    const base = Math.max(Math.abs(rec.reviewedValue), 1e-10)
    const relativeDelta = delta / base

    let status: 'pass' | 'warn' | 'fail'
    if (delta <= TOLERANCE_ABSOLUTE || relativeDelta <= TOLERANCE_RELATIVE) {
      status = 'pass'
    } else if (relativeDelta <= TOLERANCE_RELATIVE * 2) {
      status = 'warn'
    } else {
      status = 'fail'
    }

    const note =
      rec.decision === 'overridden'
        ? `Overridden: ${rec.normalisationNote}`
        : status === 'pass'
          ? 'Within tolerance'
          : `Delta ${(relativeDelta * 100).toFixed(2)}% — ${rec.normalisationNote}`

    return {
      key: rec.key, label: rec.label,
      evidenceValue: rec.reviewedValue, engineValue,
      unit: rec.unit, delta, relativeDelta, status, note,
    }
  })
}
