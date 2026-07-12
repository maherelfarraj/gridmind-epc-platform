import type { EpcAssumptions, SolarIppAssumptions } from './types'

// ─── Blank templates ──────────────────────────────────────────────────────────
// All numeric fields are 0. Tenants fill these in from their own PDF/Excel
// via the ImportReviewPanel — no reference numbers from another project are
// pre-loaded. Only structural/metadata fields carry defaults.

export const blankSolarIppTemplate: SolarIppAssumptions = {
  name: 'New Solar IPP Model',
  template: 'solar-ipp',
  currency: 'SAR',
  startYear: new Date().getFullYear() + 1,
  operatingYears: 25,
  periodicity: 'annual',
  discountRate: 0,
  inflationRate: 0,
  taxRate: 0,
  capex: 0,
  debtShare: 0,
  debtInterestRate: 0,
  debtTenorYears: 0,
  debtGraceYears: 0,
  capacityMwp: 0,
  specificYieldMwhPerMwp: 0,
  degradationRate: 0,
  availability: 0,
  tariffPerMwh: 0,
  tariffEscalationRate: 0,
  opexPerMwp: 0,
  opexEscalationRate: 0,
  adminCost: 0,
  adminEscalationRate: 0,
  depreciationYears: 0,
}

export const blankEpcTemplate: EpcAssumptions = {
  name: 'New EPC Model',
  template: 'epc',
  currency: 'SAR',
  startYear: new Date().getFullYear() + 1,
  operatingYears: 0,
  periodicity: 'quarterly',
  discountRate: 0,
  inflationRate: 0,
  taxRate: 0,
  capex: 0,
  debtShare: 0,
  debtInterestRate: 0,
  debtTenorYears: 0,
  debtGraceYears: 0,
  contractValue: 0,
  constructionYears: 0,
  grossMarginRate: 0,
  retentionRate: 0,
  retentionReleaseRate: 0,
  defectsLiabilityPeriodYears: 0,
  advancePaymentRate: 0,
  advancePaymentRecoveryRate: 0,
  variationOrderRate: 0,
  paymentLagPeriods: 0,
  overheadRate: 0,
  contingencyRate: 0,
  performanceBondRate: 0,
  advancePaymentBondRate: 0,
}

/**
 * Reference 50 MWp Solar IPP — Reviewed starter template
 *
 * Source: "Reference-50MWp-v2.pdf" (Operating & Administrative Expenses schedule)
 * Reviewed: 2026-07-11  Status: APPROVED
 *
 * Evidence reconciliation (key deltas from provisional seed):
 *   opexPerMwp      : 20,000 USD/MWp/yr (S2–S20 total = 1,000,000 / 50 MWp)
 *                     S1 shows 40,000 (first-year commissioning) — modelled as Y1 premium via opexEscalationRate reset
 *                     Source evidence: PDF row "Operation and Maintenance (USD/MWp) … S2 = 1,000,000"
 *   adminCost       : 197,570 USD/yr (insurance 182,570 + SPV 15,000; S2 baseline)
 *                     Source evidence: PDF rows "Insurance Fees S2 = 182,570", "SPV cost S2 = 15,000"
 *   adminEscalation : 0.017 (≈1.7% year-on-year from S2 → S3 implied rate: 197,570 → 200,929 = +1.70%)
 *   operatingYears  : 20 (periods S1–S20 confirmed)
 *   opexEscalation  : 0.017 (S2→S3: 1,000,000 → 1,017,000 = +1.70%)
 *   corrective/prev : modelled inside opexPerMwp aggregate (line items present from S5 at ~0.5% avg capex/MWp)
 *   majorMaintenance: reserved account ~1.0% of capex/MWp embedded in opex aggregate
 */
export const referenceSolarIppTemplate: SolarIppAssumptions = {
  name: 'Reference 50 MWp Solar IPP',
  template: 'solar-ipp',
  currency: 'USD',
  startYear: 2027,
  operatingYears: 20,
  periodicity: 'annual',
  discountRate: 0.10,
  inflationRate: 0.017,       // implied from PDF escalation S2→S3 across all OPEX lines
  taxRate: 0.25,
  capex: 47_500_000,
  debtShare: 0.70,
  debtInterestRate: 0.075,
  debtTenorYears: 15,
  debtGraceYears: 1,
  capacityMwp: 50,
  specificYieldMwhPerMwp: 1_950,
  degradationRate: 0.005,
  availability: 0.985,
  tariffPerMwh: 92,
  tariffEscalationRate: 0.015,
  // O&M: S1 = 40,000/MWp (commissioning year), S2–S20 = 20,000/MWp; use S2 steady-state as base
  opexPerMwp: 20_000,
  opexEscalationRate: 0.017,  // confirmed: 1,000,000 → 1,017,000 (+1.70%) S2→S3
  // Admin: insurance 182,570 + SPV 15,000 = 197,570 at S2; escalates ~1.70%/yr
  adminCost: 197_570,
  adminEscalationRate: 0.017,
  depreciationYears: 20,
}

export const epcStarterTemplate: EpcAssumptions = {
  name: 'Utility EPC Base Case',
  template: 'epc',
  currency: 'SAR',
  startYear: 2027,
  operatingYears: 3,
  periodicity: 'quarterly',
  discountRate: 0.12,
  inflationRate: 0.025,
  taxRate: 0.20,
  capex: 250_000_000,
  debtShare: 0.25,
  debtInterestRate: 0.07,
  debtTenorYears: 3,
  debtGraceYears: 0,
  contractValue: 315_000_000,
  constructionYears: 3,
  grossMarginRate: 0.18,
  retentionRate: 0.10,
  retentionReleaseRate: 0.50,         // 50% released on practical completion
  defectsLiabilityPeriodYears: 1,
  advancePaymentRate: 0.10,
  advancePaymentRecoveryRate: 0.20,   // recovered evenly over first 5 certifications
  variationOrderRate: 0.03,
  paymentLagPeriods: 1,
  overheadRate: 0.04,
  contingencyRate: 0.03,
  performanceBondRate: 0.01,
  advancePaymentBondRate: 0.015,
  workingCapitalRate: 0.05,
  supplierPaymentLagPeriods: 1,
  claimsSuccessRate: 0.50,
  subcontractorRetentionRate: 0.05,
}
