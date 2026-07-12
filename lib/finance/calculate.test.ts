import { describe, expect, it } from 'vitest'
import { calculateFinancialModel, FINANCE_ENGINE_VERSION } from './calculate'
import { referenceSolarIppTemplate, epcStarterTemplate } from './templates'

describe('deterministic finance engine v2', () => {

  // --- Determinism ---
  it('produces identical Solar IPP outputs for identical inputs', () => {
    const first = calculateFinancialModel(referenceSolarIppTemplate)
    const second = calculateFinancialModel(referenceSolarIppTemplate)
    expect(first.metrics).toEqual(second.metrics)
    expect(first.periods).toEqual(second.periods)
    expect(first.periods).toHaveLength(referenceSolarIppTemplate.operatingYears)
    expect(first.engineVersion).toBe(FINANCE_ENGINE_VERSION)
  })

  it('converts an EPC quarterly schedule to the expected period count', () => {
    const result = calculateFinancialModel(epcStarterTemplate)
    expect(result.periods).toHaveLength(epcStarterTemplate.constructionYears * 4)
    expect(result.periods.at(-1)?.endingDebt).toBeCloseTo(0, 2)
    expect(result.metrics.totalRevenue).toBeGreaterThan(epcStarterTemplate.contractValue)
  })

  // --- Validation codes ---
  it('surfaces blocking assumption and covenant failures', () => {
    const result = calculateFinancialModel({ ...referenceSolarIppTemplate, capex: 0, debtShare: 1.2, operatingYears: 0 })
    const codes = result.validations.map((v) => v.code)
    expect(codes).toContain('CAPEX_REQUIRED')
    expect(codes).toContain('DEBT_SHARE')
    expect(codes).toContain('MODEL_LIFE')
  })

  // --- Capital structure ---
  it('normalizes debt and equity to total CAPEX', () => {
    const result = calculateFinancialModel(referenceSolarIppTemplate)
    expect(result.metrics.debtAmount + result.metrics.equityAmount).toBeCloseTo(referenceSolarIppTemplate.capex, 2)
    expect(result.metrics.debtAmount).toBeCloseTo(referenceSolarIppTemplate.capex * referenceSolarIppTemplate.debtShare, 2)
  })

  // --- IDC ---
  it('capitalises IDC into CAPEX when construction years > 0', () => {
    const result = calculateFinancialModel({ ...referenceSolarIppTemplate, constructionYears: 2 })
    expect(result.metrics.idcCapitalised).toBeGreaterThan(0)
    expect(result.metrics.totalCapex).toBeGreaterThan(referenceSolarIppTemplate.capex)
    expect(result.validations.some((v) => v.code === 'IDC_CAPITALISED')).toBe(true)
  })

  // --- Tax-loss carry-forward ---
  it('applies tax-loss carry-forward to reduce tax in profitable periods', () => {
    // Set very high OPEX to generate early losses
    const result = calculateFinancialModel({ ...referenceSolarIppTemplate, opexPerMwp: 80_000 })
    const taxPaid = result.periods.reduce((s, p) => s + p.tax, 0)
    const noRelief = calculateFinancialModel({ ...referenceSolarIppTemplate, opexPerMwp: 80_000, taxLossCarryForwardYears: 0 })
    const taxNoRelief = noRelief.periods.reduce((s, p) => s + p.tax, 0)
    // With TLCF the total tax should be <= the no-relief total
    expect(taxPaid).toBeLessThanOrEqual(taxNoRelief + 1)
  })

  // --- DSRA ---
  it('builds a DSRA balance when dsraMonths > 0', () => {
    const result = calculateFinancialModel({ ...referenceSolarIppTemplate, dsraMonths: 6 })
    const peakDsra = result.metrics.dsraPeak
    expect(peakDsra).toBeGreaterThan(0)
    // DSRA balance should be non-negative in every period
    result.periods.forEach((p) => {
      expect(p.dsraBalance ?? 0).toBeGreaterThanOrEqual(0)
    })
  })

  // --- LLCR / PLCR ---
  it('computes LLCR and PLCR for Solar IPP periods with outstanding debt', () => {
    const result = calculateFinancialModel(referenceSolarIppTemplate)
    const periodsWithDebt = result.periods.filter((p) => p.endingDebt > 0)
    expect(periodsWithDebt.length).toBeGreaterThan(0)
    periodsWithDebt.forEach((p) => {
      expect(p.llcr).not.toBeNull()
      expect(p.plcr).not.toBeNull()
      expect(p.llcr as number).toBeGreaterThan(0)
    })
    expect(result.metrics.minimumLlcr).not.toBeNull()
    expect(result.metrics.minimumPlcr).not.toBeNull()
  })

  // --- Distribution waterfall ---
  it('locks distributions when DSCR falls below threshold', () => {
    // Force very low tariff to trigger low DSCR and lock-up
    const result = calculateFinancialModel({ ...referenceSolarIppTemplate, tariffPerMwh: 10, distributionLockupMinDscr: 2.0 })
    const lockedPeriods = result.periods.filter((p) => p.distributionLocked)
    expect(lockedPeriods.length).toBeGreaterThan(0)
    lockedPeriods.forEach((p) => expect(p.distribution).toBe(0))
    expect(result.validations.some((v) => v.code === 'DISTRIBUTION_LOCKED')).toBe(true)
  })

  // --- VAT and customs ---
  it('reduces net revenue by VAT rate and increases CAPEX by customs rate', () => {
    const base = calculateFinancialModel(referenceSolarIppTemplate)
    const withTaxes = calculateFinancialModel({ ...referenceSolarIppTemplate, vatRate: 0.05, customsRate: 0.03 })
    expect(withTaxes.metrics.totalRevenue).toBeLessThan(base.metrics.totalRevenue)
    expect(withTaxes.metrics.totalCapex).toBeGreaterThan(base.metrics.totalCapex)
    expect(withTaxes.validations.some((v) => v.code === 'VAT_APPLIED')).toBe(true)
    expect(withTaxes.validations.some((v) => v.code === 'CUSTOMS_APPLIED')).toBe(true)
  })

  // --- EPC EAC overrun ---
  it('flags EAC overrun when actual costs project beyond original budget', () => {
    const result = calculateFinancialModel({
      ...epcStarterTemplate,
      actualCostToDate: epcStarterTemplate.contractValue * 0.6,
      percentCompleteToDate: 0.4, // implies EAC = 1.5× contract value
    })
    expect(result.validations.some((v) => v.code === 'EAC_OVERRUN')).toBe(true)
  })

  // --- Advanced metrics presence ---
  it('returns all advanced metrics in the result', () => {
    const result = calculateFinancialModel(referenceSolarIppTemplate)
    expect(typeof result.metrics.minimumLlcr === 'number' || result.metrics.minimumLlcr === null).toBe(true)
    expect(typeof result.metrics.minimumPlcr === 'number' || result.metrics.minimumPlcr === null).toBe(true)
    expect(typeof result.metrics.totalTaxPaid).toBe('number')
    expect(typeof result.metrics.totalDistribution).toBe('number')
    expect(typeof result.metrics.dsraPeak).toBe('number')
    expect(typeof result.metrics.effectiveTaxRate).toBe('number')
    expect(typeof result.metrics.idcCapitalised).toBe('number')
  })
})
