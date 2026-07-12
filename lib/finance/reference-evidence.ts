/**
 * Reference 50 MWp Solar IPP — Source Evidence Record
 *
 * Every assumption in referenceSolarIppTemplate is traceable to a line item or cell
 * in the supplied source document. This file is the single source of truth for
 * provenance; it does not participate in any calculation.
 *
 * Source document : Reference-50MWp-v2.pdf
 * Reviewed by     : Finance Modeler
 * Review date     : 2026-07-11
 * Status          : APPROVED — values published to starter template
 */

export interface EvidenceRecord {
  key: string
  label: string
  reviewedValue: number
  unit: string
  confidence: number
  decision: 'accepted' | 'rejected' | 'overridden'
  sourceEvidence: string
  sourceLocation: string
  normalisationNote: string
}

export const referenceEvidenceRecords: EvidenceRecord[] = [
  {
    key: 'operatingYears',
    label: 'Operating life',
    reviewedValue: 20,
    unit: 'years',
    confidence: 1.0,
    decision: 'accepted',
    sourceEvidence: 'Columns S1–S20 across all schedule tables',
    sourceLocation: 'PDF header row — Operating & Administrative Expenses',
    normalisationNote: 'Period count read directly as column count S1 to S20',
  },
  {
    key: 'currency',
    label: 'Model currency',
    reviewedValue: 0,
    unit: 'USD',
    confidence: 1.0,
    decision: 'accepted',
    sourceEvidence: 'Table header: "Operating & Administrative Expenses USD"',
    sourceLocation: 'PDF — table header',
    normalisationNote: 'ISO 4217 code confirmed from table heading',
  },
  {
    key: 'capacityMwp',
    label: 'Installed capacity',
    reviewedValue: 50,
    unit: 'MWp',
    confidence: 1.0,
    decision: 'accepted',
    sourceEvidence: 'Project title: "Reference 50 MWp"',
    sourceLocation: 'PDF — document title',
    normalisationNote: 'Read directly from document title',
  },
  {
    key: 'opexPerMwp',
    label: 'O&M cost per MWp (steady-state)',
    reviewedValue: 20_000,
    unit: 'USD/MWp/yr',
    confidence: 0.95,
    decision: 'accepted',
    sourceEvidence: 'S2 total O&M = 1,000,000 USD ÷ 50 MWp = 20,000 USD/MWp. S1 = 40,000/MWp (commissioning year premium).',
    sourceLocation: 'PDF — "Operation and Maintenance (USD/MWp)" row, columns S1–S2',
    normalisationNote: 'S2 steady-state value used as base; S1 commissioning premium acknowledged in template comments',
  },
  {
    key: 'opexEscalationRate',
    label: 'O&M escalation rate',
    reviewedValue: 0.017,
    unit: 'decimal/yr',
    confidence: 0.97,
    decision: 'accepted',
    sourceEvidence: 'S2 = 1,000,000; S3 = 1,017,000 → implied rate = (1,017,000 / 1,000,000) − 1 = 1.70%',
    sourceLocation: 'PDF — "Operation and Maintenance" row, S2 and S3 columns',
    normalisationNote: 'Rate derived from adjacent period ratio; confirmed consistent across S3→S4 and S4→S5',
  },
  {
    key: 'adminCost_insurance',
    label: 'Insurance fees (S2 baseline)',
    reviewedValue: 182_570,
    unit: 'USD/yr',
    confidence: 1.0,
    decision: 'accepted',
    sourceEvidence: 'Insurance Fees S2 = 182,570 (S1 = 0 — pre-COD)',
    sourceLocation: 'PDF — "Insurance Fees" row, column S2',
    normalisationNote: 'S1 is construction period; operational insurance starts S2',
  },
  {
    key: 'adminCost_spv',
    label: 'SPV / project company cost (S2 baseline)',
    reviewedValue: 15_000,
    unit: 'USD/yr',
    confidence: 1.0,
    decision: 'accepted',
    sourceEvidence: 'SPV cost S2 = 15,000',
    sourceLocation: 'PDF — "SPV cost" row, column S2',
    normalisationNote: 'Assumed to escalate at the same ~1.70% rate as other admin lines; S2→S3 = 15,255',
  },
  {
    key: 'adminCost',
    label: 'Total admin cost (composite S2 baseline)',
    reviewedValue: 197_570,
    unit: 'USD/yr',
    confidence: 0.99,
    decision: 'accepted',
    sourceEvidence: 'Insurance 182,570 + SPV 15,000 = 197,570. PDF total: "Total Admin Expenses S2 = 197,570"',
    sourceLocation: 'PDF — "Total Admin Expenses" row, column S2',
    normalisationNote: 'Composite matches PDF Total Admin Expenses line exactly. Other Admin Expenses = 0 across all periods.',
  },
  {
    key: 'adminEscalationRate',
    label: 'Admin cost escalation rate',
    reviewedValue: 0.017,
    unit: 'decimal/yr',
    confidence: 0.97,
    decision: 'accepted',
    sourceEvidence: 'Total Admin S2 = 197,570; S3 = 200,929 → (200,929 / 197,570) − 1 = 1.70%',
    sourceLocation: 'PDF — "Total Admin Expenses" row, columns S2 and S3',
    normalisationNote: 'Rate consistent with O&M escalation confirming a single inflation index applies to all OPEX lines',
  },
  {
    key: 'inflationRate',
    label: 'Model inflation rate',
    reviewedValue: 0.017,
    unit: 'decimal/yr',
    confidence: 0.90,
    decision: 'accepted',
    sourceEvidence: 'All operating cost lines escalate at ~1.70%/yr; no separate CPI assumption visible in source',
    sourceLocation: 'PDF — implied from all escalating cost rows',
    normalisationNote: 'Adopted as model-wide inflation proxy; overridden from provisional 2.5% to match PDF-implied 1.7%',
  },
  {
    key: 'correctiveMaintenance',
    label: 'Corrective maintenance (note — embedded)',
    reviewedValue: 0,
    unit: 'USD/yr',
    confidence: 0.85,
    decision: 'overridden',
    sourceEvidence: 'S1–S4 = 0; S5 onwards ~69,682–78,409/yr at ~1.05% of revenue. Included inside opexPerMwp aggregate.',
    sourceLocation: 'PDF — "corrective maintenance 1.05%" row, columns S1–S20',
    normalisationNote: 'Modelled implicitly inside opexPerMwp; not a separate model assumption in current engine version',
  },
  {
    key: 'majorMaintenance',
    label: 'Major maintenance reserve (note — embedded)',
    reviewedValue: 0,
    unit: 'USD/yr',
    confidence: 0.85,
    decision: 'overridden',
    sourceEvidence: 'Ranges 63,246–66,898/yr at ~1.00% of capex/MWp. Reserve account treatment not yet modelled separately.',
    sourceLocation: 'PDF — "Major Maintenance (Reserved Account) 1.00%" row, columns S1–S20',
    normalisationNote: 'Included in opexPerMwp aggregate. Dedicated reserve account and DSRA will be added in advanced Solar IPP engine.',
  },
  {
    key: 'preventiveMaintenance',
    label: 'Preventive maintenance (note — embedded)',
    reviewedValue: 0,
    unit: 'USD/yr',
    confidence: 0.85,
    decision: 'overridden',
    sourceEvidence: 'S1–S4 = 0; S5 onwards ~65,045–74,675/yr at ~1.00% of O&M. Included inside opexPerMwp aggregate.',
    sourceLocation: 'PDF — "Preventive Maintenance 1.00%" row, columns S1–S20',
    normalisationNote: 'Modelled implicitly inside opexPerMwp; separate line items will be added in advanced engine.',
  },
]

/** Accepted and overridden fields ready to apply to the model */
export const reviewedFields = referenceEvidenceRecords.filter(
  (record) => record.decision === 'accepted' || record.decision === 'overridden',
)

/** Fields with any unresolved conflicts or low confidence */
export const flaggedFields = referenceEvidenceRecords.filter(
  (record) => record.confidence < 0.85 || record.decision === 'rejected',
)
