import type {
  EngineResult,
  EpcAssumptions,
  FinancialModelAssumptions,
  FinancialModelResult,
  LineageDriver,
  LineageStep,
  MetricLineage,
  ModelLineage,
  ModelMetrics,
  ModelPeriod,
  ModelValidation,
  Periodicity,
  SolarIppAssumptions,
} from './types'

export const FINANCE_ENGINE_VERSION = '2.0.0'

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
const periodsPerYear: Record<Periodicity, number> = {
  annual: 1,
  semiannual: 2,
  quarterly: 4,
  monthly: 12,
}

const safeRate = (rate: number) => (Number.isFinite(rate) ? rate : 0)

function presentValue(value: number, periodicRate: number, period: number) {
  return value / (1 + periodicRate) ** period
}

function npv(cashFlows: number[], annualRate: number, ppy: number) {
  const periodicRate = (1 + annualRate) ** (1 / ppy) - 1
  return cashFlows.reduce((sum, value, index) => sum + presentValue(value, periodicRate, index), 0)
}

function irr(cashFlows: number[], ppy: number): number | null {
  if (!cashFlows.some((v) => v < 0) || !cashFlows.some((v) => v > 0)) return null
  let low = -0.9999
  let high = 10
  for (let i = 0; i < 300; i += 1) {
    const guess = (low + high) / 2
    const value = cashFlows.reduce((sum, cf, index) => sum + cf / (1 + guess) ** index, 0)
    if (Math.abs(value) < 0.01) return (1 + guess) ** ppy - 1
    if (value > 0) low = guess
    else high = guess
  }
  const periodic = (low + high) / 2
  return Number.isFinite(periodic) ? (1 + periodic) ** ppy - 1 : null
}

function payback(cashFlows: number[], ppy: number): number | null {
  let cumulative = 0
  for (let index = 0; index < cashFlows.length; index += 1) {
    const previous = cumulative
    cumulative += cashFlows[index]
    if (cumulative >= 0 && index > 0) {
      const fraction = cashFlows[index] === 0 ? 0 : Math.abs(previous) / cashFlows[index]
      return (index - 1 + fraction) / ppy
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Debt schedule (straight-line principal)
// ---------------------------------------------------------------------------
function debtSchedule(
  debtAmount: number,
  tenorYears: number,
  graceYears: number,
  annualInterestRate: number,
  periodCount: number,
  ppy: number,
) {
  const gracePeriods = graceYears * ppy
  const repaymentPeriods = Math.max(1, Math.min(tenorYears * ppy - gracePeriods, periodCount))
  const principal = debtAmount / repaymentPeriods
  const rate = safeRate(annualInterestRate) / ppy
  let balance = debtAmount

  return Array.from({ length: periodCount }, (_, index) => {
    const interest = balance * rate
    const canRepay = index >= gracePeriods && index < gracePeriods + repaymentPeriods
    const repayment = canRepay ? Math.min(principal, balance) : 0
    balance = Math.max(0, balance - repayment)
    return { interest, repayment, endingDebt: balance }
  })
}

// ---------------------------------------------------------------------------
// Interest During Construction (IDC) capitalised into CAPEX
// ---------------------------------------------------------------------------
function interestDuringConstruction(
  baseCost: number,
  debtShare: number,
  annualInterestRate: number,
  constructionYears: number,
): number {
  if (constructionYears <= 0) return 0
  const drawBalance = baseCost * debtShare
  // Approximate: average balance = 50% of debt drawn linearly, compounded
  const avgBalance = drawBalance * 0.5
  return avgBalance * annualInterestRate * constructionYears
}

// ---------------------------------------------------------------------------
// DSRA: Debt Service Reserve Account
// ---------------------------------------------------------------------------
function computeDsraTarget(
  debtService: number[],
  dsraMonths: number,
  ppy: number,
): number[] {
  // Target = next N months of debt service (forward-looking)
  const periodsToReserve = Math.ceil((dsraMonths / 12) * ppy)
  return debtService.map((_, i) => {
    let total = 0
    for (let j = i + 1; j <= i + periodsToReserve && j < debtService.length; j += 1) {
      total += debtService[j]
    }
    return total
  })
}

// ---------------------------------------------------------------------------
// LLCR / PLCR
// ---------------------------------------------------------------------------
function computeLlcr(
  periods: ModelPeriod[],
  endingDebt: number[],
  annualDiscountRate: number,
  ppy: number,
  fromIndex: number,
  debtTenorPeriods: number,
): number | null {
  const debt = endingDebt[fromIndex]
  if (!debt || debt <= 0) return null
  const endPeriod = Math.min(fromIndex + debtTenorPeriods, periods.length)
  let pvCashFlow = 0
  const rate = (1 + annualDiscountRate) ** (1 / ppy) - 1
  for (let j = fromIndex; j < endPeriod; j += 1) {
    pvCashFlow += presentValue(periods[j].ebitda - (periods[j].tax ?? 0), rate, j - fromIndex + 1)
  }
  return pvCashFlow / debt
}

function computePlcr(
  periods: ModelPeriod[],
  endingDebt: number[],
  annualDiscountRate: number,
  ppy: number,
  fromIndex: number,
): number | null {
  const debt = endingDebt[fromIndex]
  if (!debt || debt <= 0) return null
  const rate = (1 + annualDiscountRate) ** (1 / ppy) - 1
  let pvCashFlow = 0
  for (let j = fromIndex; j < periods.length; j += 1) {
    pvCashFlow += presentValue(periods[j].ebitda - (periods[j].tax ?? 0), rate, j - fromIndex + 1)
  }
  return pvCashFlow / debt
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateCommon(input: FinancialModelAssumptions): ModelValidation[] {
  const validations: ModelValidation[] = []
  if (input.capex <= 0) validations.push({ severity: 'error', code: 'CAPEX_REQUIRED', message: 'CAPEX must be greater than zero.' })
  if (input.operatingYears < 1 || input.operatingYears > 50) validations.push({ severity: 'error', code: 'MODEL_LIFE', message: 'Operating life must be between 1 and 50 years.' })
  if (input.debtShare < 0 || input.debtShare > 1) validations.push({ severity: 'error', code: 'DEBT_SHARE', message: 'Debt share must be between 0% and 100%.' })
  if (input.discountRate <= 0) validations.push({ severity: 'warning', code: 'DISCOUNT_RATE', message: 'Discount rate is zero or negative; NPV may be misleading.' })
  if (input.debtTenorYears > input.operatingYears) validations.push({ severity: 'warning', code: 'DEBT_TENOR', message: 'Debt tenor extends beyond the modeled operating life.' })
  return validations
}

// ---------------------------------------------------------------------------
// Solar IPP
// ---------------------------------------------------------------------------
function calculateSolar(input: SolarIppAssumptions): EngineResult {
  const ppy = periodsPerYear[input.periodicity]
  const periodCount = input.operatingYears * ppy
  const constructionYears = input.constructionYears ?? 0
  const dsraMonths = input.dsraMonths ?? 6
  const mraPerYear = (input.mraContributionPerMwp ?? 0) * input.capacityMwp
  const mraReleaseYears = input.mraReleaseYears ?? 0
  const lockupDscr = input.distributionLockupMinDscr ?? 1.10
  const tlcfMaxYears = input.taxLossCarryForwardYears ?? 20
  const vatRate = input.vatRate ?? 0
  const customsRate = input.customsRate ?? 0

  // IDC capitalised into CAPEX
  const idc = interestDuringConstruction(input.capex, input.debtShare, input.debtInterestRate, constructionYears)
  const totalCapex = input.capex + idc
  const customsDuty = input.capex * customsRate
  const adjustedCapex = totalCapex + customsDuty

  const debtAmount = adjustedCapex * input.debtShare
  const equityAmount = adjustedCapex - debtAmount
  const depreciation = adjustedCapex / Math.max(1, input.depreciationYears) / ppy

  const debt = debtSchedule(debtAmount, input.debtTenorYears, input.debtGraceYears, input.debtInterestRate, periodCount, ppy)
  const dsraTarget = computeDsraTarget(debt.map((d) => d.interest + d.repayment), dsraMonths, ppy)

  // First pass: compute pre-tax cash flows and rolling TLCF
  let tlcfBalance = 0
  const tlcfMaxPeriods = tlcfMaxYears * ppy
  const periods: ModelPeriod[] = []

  for (let index = 0; index < periodCount; index += 1) {
    const periodYear = Math.floor(index / ppy)
    const energy = (input.capacityMwp * input.specificYieldMwhPerMwp * input.availability * (1 - input.degradationRate) ** periodYear) / ppy
    const tariff = input.tariffPerMwh * (1 + input.tariffEscalationRate) ** (index / ppy)
    const grossRevenue = energy * tariff
    const vat = grossRevenue * vatRate
    const revenue = grossRevenue - vat

    const opex = (input.capacityMwp * input.opexPerMwp * (1 + input.opexEscalationRate) ** (index / ppy)) / ppy
    const admin = (input.adminCost * (1 + input.adminEscalationRate) ** (index / ppy)) / ppy
    const operatingCost = opex + admin

    const ebitda = revenue - operatingCost
    const periodDepreciation = periodYear < input.depreciationYears ? depreciation : 0
    const ebit = ebitda - periodDepreciation
    const taxableBeforeRelief = ebit - debt[index].interest
    // Apply TLCF: consume oldest losses first
    const reliefUsed = Math.min(tlcfBalance, Math.max(0, taxableBeforeRelief))
    const taxableIncome = Math.max(0, taxableBeforeRelief - reliefUsed)
    const tax = taxableIncome * input.taxRate

    // Update TLCF balance
    if (taxableBeforeRelief < 0) {
      // New loss — check if within carry-forward window
      if (index < tlcfMaxPeriods) tlcfBalance += Math.abs(taxableBeforeRelief)
    } else {
      tlcfBalance = Math.max(0, tlcfBalance - reliefUsed)
    }

    const debtService = debt[index].interest + debt[index].repayment
    const projectCashFlow = ebitda - tax
    const equityCashFlowBeforeDsra = projectCashFlow - debtService

    // DSRA movement: fund up to target, release if over
    const prevDsra = index === 0 ? (input.dsraFunded === 'equity' ? dsraTarget[0] : 0) : (periods[index - 1].dsraBalance ?? 0)
    const dsraMovement = Math.max(-prevDsra, dsraTarget[index] - prevDsra)
    const dsraBalance = prevDsra + dsraMovement

    const equityAfterDsra = equityCashFlowBeforeDsra - Math.max(0, dsraMovement)
    const dscr = debtService > 0 ? (ebitda - tax) / debtService : null

    // MRA sinking fund: contribute each period, release the balance at each maintenance cycle end
    const mraContribution = mraPerYear / ppy
    const prevMra = index === 0 ? 0 : (periods[index - 1].mraBalance ?? 0)
    const isCycleEnd = mraReleaseYears > 0 && (periodYear + 1) % mraReleaseYears === 0 && (index + 1) % ppy === 0
    let mraBalance = prevMra + mraContribution
    let mraRelease = 0
    if (isCycleEnd) { mraRelease = mraBalance; mraBalance = 0 }
    // Contributions trap cash from distributions; releases return it (assumed spent on major maintenance)
    const equityAfterReserves = equityAfterDsra - mraContribution + mraRelease

    // Distribution lock-up
    const distributionLocked = dscr !== null && dscr < lockupDscr
    const distribution = distributionLocked ? 0 : Math.max(0, equityAfterReserves)
    const equityCashFlow = equityAfterReserves

    periods.push({
      index,
      label: input.periodicity === 'annual' ? `Y${index + 1}` : `P${index + 1}`,
      year: input.startYear + constructionYears + periodYear,
      fraction: 1 / ppy,
      revenue,
      operatingCost,
      ebitda,
      depreciation: periodDepreciation,
      ebit,
      interest: debt[index].interest,
      tax,
      debtDraw: 0,
      principalRepayment: debt[index].repayment,
      debtService,
      endingDebt: debt[index].endingDebt,
      projectCashFlow,
      equityCashFlow,
      dscr,
      energyMwh: energy,
      taxableIncome,
      taxLossCarryForward: tlcfBalance,
      dsraBalance,
      dsraMovement,
      mraBalance,
      mraMovement: mraContribution,
      mraRelease,
      distributionLocked,
      distribution,
    })
  }

  // Second pass: LLCR and PLCR
  const endingDebt = debt.map((d) => d.endingDebt)
  const debtTenorPeriods = input.debtTenorYears * ppy
  for (const period of periods) {
    period.llcr = computeLlcr(periods, endingDebt, input.discountRate, ppy, period.index, debtTenorPeriods)
    period.plcr = computePlcr(periods, endingDebt, input.discountRate, ppy, period.index)
  }

  const validations = validateCommon(input)
  if (customsDuty > 0) validations.push({ severity: 'info', code: 'CUSTOMS_APPLIED', message: `Customs duty of ${(customsRate * 100).toFixed(1)}% applied to CAPEX (${customsDuty.toLocaleString()} ${input.currency}).` })
  if (vatRate > 0) validations.push({ severity: 'info', code: 'VAT_APPLIED', message: `VAT/withholding at ${(vatRate * 100).toFixed(1)}% reduces net revenue each period.` })
  if (idc > 0) validations.push({ severity: 'info', code: 'IDC_CAPITALISED', message: `Interest during construction of ${idc.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${input.currency} capitalised into CAPEX.` })

  const projectCFs = [-adjustedCapex, ...periods.map((p) => p.projectCashFlow)]
  const equityCFs = [-equityAmount, ...periods.map((p) => p.equityCashFlow)]
  return finalize(input, periods, projectCFs, equityCFs, ppy, validations, idc, customsDuty, vatRate)
}

// ---------------------------------------------------------------------------
// EPC contractor — advanced cost-tracking engine
// ---------------------------------------------------------------------------
function calculateEpc(input: EpcAssumptions): EngineResult {
  const ppy = periodsPerYear[input.periodicity]
  const constructionPeriods = Math.max(1, input.constructionYears * ppy)
  const debtAmount = input.capex * input.debtShare
  const equityAmount = input.capex - debtAmount
  const debt = debtSchedule(debtAmount, input.debtTenorYears, input.debtGraceYears, input.debtInterestRate, constructionPeriods, ppy)

  // ---- Contract value & VO ----
  const approvedVos = input.variationOrdersApproved ?? 0
  const pendingClaimsValue = input.claimsValue ?? 0
  const claimsSuccessRate = input.claimsSuccessRate ?? 0.5
  const probabilisticClaimsValue = pendingClaimsValue * claimsSuccessRate
  const baseContract = input.contractValue
  const finalContractValue = baseContract * (1 + input.variationOrderRate) + approvedVos
  const adjustedContractWithClaims = finalContractValue + probabilisticClaimsValue

  // ---- EAC / CTC from EVM ----
  const percentComplete = input.percentCompleteToDate ?? 0
  const actualCostToDate = input.actualCostToDate ?? 0
  const budgetAtCompletion = finalContractValue * (1 - input.grossMarginRate)
  const earnedValue = percentComplete * budgetAtCompletion
  const cpi = earnedValue > 0 && actualCostToDate > 0 ? earnedValue / actualCostToDate : 1
  const eac = cpi > 0 ? budgetAtCompletion / cpi : budgetAtCompletion
  const ctc = Math.max(0, eac - actualCostToDate)
  const plannedPerPeriod = budgetAtCompletion / constructionPeriods
  const costPerPeriod = ctc > 0 ? ctc / Math.max(1, constructionPeriods - Math.floor(percentComplete * constructionPeriods)) : plannedPerPeriod

  // ---- Advance payment ----
  const totalAdvanceDrawn = baseContract * input.advancePaymentRate
  const recoveryRate = input.advancePaymentRecoveryRate ?? 0.2
  const advanceBondCost = totalAdvanceDrawn * input.advancePaymentBondRate
  const performanceBondCost = finalContractValue * input.performanceBondRate

  // ---- Retention ----
  const maxRetentionRate = input.retentionRate
  const retentionReleaseOnPc = input.retentionReleaseRate ?? 0.5
  const dlpPeriods = Math.round((input.defectsLiabilityPeriodYears ?? 1) * ppy)
  const subRetentionRate = input.subcontractorRetentionRate ?? 0
  const workingCapitalRate = input.workingCapitalRate ?? 0.05
  const supplierLag = input.supplierPaymentLagPeriods ?? 1

  // ---- S-curve (linear for simplicity) ----
  const earnedPerPeriod = adjustedContractWithClaims / constructionPeriods

  // ---- Period-by-period accumulation ----
  let cumulativeRetentionHeld = 0
  let cumulativeRetentionReleased = 0
  let advanceOutstanding = totalAdvanceDrawn
  let cumulativeVo = approvedVos
  let cumulativeClaims = 0
  let cumulativeCertified = 0
  let cumulativePaid = 0
  let cumulativeIncurred = actualCostToDate
  const periods: ModelPeriod[] = []

  for (let index = 0; index < constructionPeriods; index += 1) {
    const isPracticalCompletion = index === constructionPeriods - 1
    const isDlpRelease = index === constructionPeriods - 1 + dlpPeriods

    // Earned value for period
    const certified = earnedPerPeriod
    cumulativeCertified += certified
    const plannedValue = plannedPerPeriod * (index + 1)
    const earnedValuePeriod = (percentComplete > 0 ? earnedValue : cumulativeCertified)

    // Variation orders and claims
    const voThisPeriod = index === 0 ? approvedVos : 0
    cumulativeVo += voThisPeriod > 0 ? 0 : 0  // already in finalContractValue
    const claimsThisPeriod = index === constructionPeriods - 1 ? probabilisticClaimsValue : 0
    cumulativeClaims += claimsThisPeriod

    // Advance: drawn on period 0, recovered pro-rata from certified milestones
    const advance = index === 0 ? totalAdvanceDrawn : 0
    const advanceRecovered = Math.min(advanceOutstanding, certified * recoveryRate)
    advanceOutstanding = Math.max(0, advanceOutstanding - advanceRecovered)

    // Retention: held on each certification; released on PC and DLP
    const retentionHeldThisPeriod = certified * maxRetentionRate
    cumulativeRetentionHeld += retentionHeldThisPeriod
    let retentionReleased = 0
    if (isPracticalCompletion) {
      retentionReleased = cumulativeRetentionHeld * retentionReleaseOnPc
      cumulativeRetentionReleased += retentionReleased
    }
    if (isDlpRelease) {
      retentionReleased += cumulativeRetentionHeld - cumulativeRetentionReleased
      cumulativeRetentionReleased = cumulativeRetentionHeld
    }

    // Revenue: certification + advance draw − retention held + retention released + claims
    const invoiced = certified - retentionHeldThisPeriod + retentionReleased + (index === 0 ? advance : 0) + claimsThisPeriod
    const laggedIndex = Math.max(0, index - input.paymentLagPeriods)
    const paidThisPeriod = laggedIndex < constructionPeriods ? periods[laggedIndex]?.invoiced ?? invoiced : invoiced
    cumulativePaid += paidThisPeriod
    const revenue = invoiced  // P&L recognition = certification basis

    // Cost: direct + overhead + contingency − sub retention captured
    const directCost = index < Math.floor(percentComplete * constructionPeriods) ? 0 : costPerPeriod
    cumulativeIncurred += directCost
    const overhead = earnedPerPeriod * input.overheadRate
    const contingency = index === 0 ? baseContract * input.contingencyRate : 0
    const bondCostPeriod = index === 0 ? advanceBondCost + performanceBondCost : 0
    const subRetentionCaptured = directCost * subRetentionRate
    const supplierPayment = laggedIndex >= 0 && index >= supplierLag ? periods[Math.max(0, index - supplierLag)]?.incurred ?? directCost : directCost
    const operatingCost = directCost + overhead + contingency + bondCostPeriod - subRetentionCaptured

    const grossProfit = certified - directCost - overhead - contingency
    const contributionMargin = grossProfit - overhead

    const ebitda = revenue - operatingCost
    const taxable = Math.max(0, ebitda - debt[index].interest)
    const tax = taxable * input.taxRate
    const debtService = debt[index].interest + debt[index].repayment
    const projectCashFlow = ebitda - tax
    const equityCashFlow = projectCashFlow - debtService
    const workingCapitalBalance = (revenue - supplierPayment) * workingCapitalRate

    const eacPeriod = cpi > 0 ? budgetAtCompletion / cpi : budgetAtCompletion
    const ctcPeriod = Math.max(0, eacPeriod - cumulativeIncurred)
    const sv = earnedValuePeriod - plannedValue
    const cv = earnedValuePeriod - cumulativeIncurred

    periods.push({
      index,
      label: input.periodicity === 'annual' ? `Y${index + 1}` : `P${index + 1}`,
      year: input.startYear + Math.floor(index / ppy),
      fraction: 1 / ppy,
      revenue,
      operatingCost,
      ebitda,
      depreciation: 0,
      ebit: ebitda,
      interest: debt[index].interest,
      tax,
      debtDraw: 0,
      principalRepayment: debt[index].repayment,
      debtService,
      endingDebt: debt[index].endingDebt,
      projectCashFlow,
      equityCashFlow,
      dscr: debtService > 0 ? (ebitda - tax) / debtService : null,
      taxableIncome: taxable,
      // EPC-specific
      contractValue: finalContractValue,
      committed: directCost * constructionPeriods,
      incurred: directCost,
      certified,
      invoiced,
      paid: paidThisPeriod,
      retentionHeld: retentionHeldThisPeriod,
      retentionReleased,
      advanceOutstanding,
      advanceRecovered,
      variationOrders: cumulativeVo,
      claimsRecognised: cumulativeClaims,
      earnedValue: earnedValuePeriod,
      plannedValue,
      costVariance: cv,
      scheduleVariance: sv,
      costPerformanceIndex: cpi,
      schedulePerformanceIndex: earnedValuePeriod > 0 && plannedValue > 0 ? earnedValuePeriod / plannedValue : undefined,
      estimateAtCompletion: eacPeriod,
      costToComplete: ctcPeriod,
      workingCapitalBalance,
      grossProfit,
      contributionMargin,
    })
  }

  // ---- Validations ----
  const validations = validateCommon(input)
  if (input.grossMarginRate <= input.overheadRate) {
    validations.push({ severity: 'warning', code: 'MARGIN_PRESSURE', message: 'Gross margin does not comfortably cover project overhead.' })
  }
  if (input.paymentLagPeriods > constructionPeriods) {
    validations.push({ severity: 'warning', code: 'PAYMENT_LAG', message: 'Payment lag exceeds the construction schedule.' })
  }
  if (eac > budgetAtCompletion * 1.05) {
    validations.push({ severity: 'warning', code: 'EAC_OVERRUN', message: `EAC (${eac.toLocaleString(undefined, { maximumFractionDigits: 0 })}) exceeds original budget by >5%.` })
  }
  if (cpi < 0.95) {
    validations.push({ severity: 'warning', code: 'CPI_LOW', message: `Cost performance index of ${cpi.toFixed(2)} indicates cost overrun trend.` })
  }
  if (pendingClaimsValue > 0) {
    validations.push({ severity: 'info', code: 'CLAIMS_PENDING', message: `Pending claims of ${pendingClaimsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} recognised at ${(claimsSuccessRate * 100).toFixed(0)}% probability-weighted value.` })
  }

  const projectCFs = [-input.capex, ...periods.map((p) => p.projectCashFlow)]
  const equityCFs = [-equityAmount, ...periods.map((p) => p.equityCashFlow)]

  const epcExtras = {
    finalContractValue,
    eac,
    ctc: Math.max(0, eac - actualCostToDate),
    totalAdvanceDrawn,
    totalCertified: cumulativeCertified,
    totalPaid: cumulativePaid,
    totalRetentionHeld: cumulativeRetentionHeld,
    totalRetentionReleased: cumulativeRetentionReleased,
    totalVo: approvedVos,
    totalClaims: cumulativeClaims,
    bondCost: advanceBondCost + performanceBondCost,
    cpi,
  }

  return finalizeEpc(input, periods, projectCFs, equityCFs, ppy, validations, epcExtras)
}

// ---------------------------------------------------------------------------
// Finalize EPC — wraps finalize with EPC-specific metrics
// ---------------------------------------------------------------------------
function finalizeEpc(
  assumptions: EpcAssumptions,
  periods: ModelPeriod[],
  projectCashFlows: number[],
  equityCashFlows: number[],
  ppy: number,
  validations: ModelValidation[],
  extras: {
    finalContractValue: number; eac: number; ctc: number; totalAdvanceDrawn: number
    totalCertified: number; totalPaid: number; totalRetentionHeld: number
    totalRetentionReleased: number; totalVo: number; totalClaims: number
    bondCost: number; cpi: number
  },
): EngineResult {
  const base = finalize(assumptions, periods, projectCashFlows, equityCashFlows, ppy, validations, 0, 0, 0)
  const totalDirectCost = periods.reduce((s, p) => s + (p.incurred ?? 0), 0)
  const finalMargin = extras.totalCertified > 0 ? (extras.totalCertified - totalDirectCost) / extras.totalCertified : null
  const marginAtCompletion = extras.eac > 0 ? (extras.finalContractValue - extras.eac) / extras.finalContractValue : null
  const peakWc = Math.max(0, ...periods.map((p) => p.workingCapitalBalance ?? 0))
  const peakDebt = Math.max(0, ...periods.map((p) => p.endingDebt))
  const peakRetention = Math.max(0, ...periods.map((p) => p.retentionHeld ?? 0))
  const peakAdvance = periods[0]?.advanceOutstanding ?? 0

  base.metrics.finalContractValue = extras.finalContractValue
  base.metrics.totalCertified = extras.totalCertified
  base.metrics.totalInvoiced = periods.reduce((s, p) => s + (p.invoiced ?? 0), 0)
  base.metrics.totalPaid = extras.totalPaid
  base.metrics.totalRetentionHeld = extras.totalRetentionHeld
  base.metrics.totalRetentionReleased = extras.totalRetentionReleased
  base.metrics.peakRetentionBalance = peakRetention
  base.metrics.totalAdvanceDrawn = extras.totalAdvanceDrawn
  base.metrics.totalAdvanceRecovered = periods.reduce((s, p) => s + (p.advanceRecovered ?? 0), 0)
  base.metrics.peakAdvanceOutstanding = peakAdvance
  base.metrics.totalVariationOrders = extras.totalVo
  base.metrics.totalClaimsRecognised = extras.totalClaims
  base.metrics.estimateAtCompletion = extras.eac
  base.metrics.costToComplete = extras.ctc
  base.metrics.finalGrossMargin = finalMargin
  base.metrics.marginAtCompletion = marginAtCompletion
  base.metrics.peakWorkingCapital = peakWc
  base.metrics.peakDebtDraw = peakDebt
  base.metrics.bondCost = extras.bondCost

  // Covenant checks specific to EPC
  if (marginAtCompletion !== null && marginAtCompletion < 0.05) {
    base.validations.push({ severity: 'warning', code: 'MARGIN_AT_COMPLETION_LOW', message: `Forecast margin at completion of ${(marginAtCompletion * 100).toFixed(1)}% is below 5% — insufficient buffer for overruns.` })
  }
  if (extras.ctc > 0 && extras.ctc > extras.totalCertified * 0.3) {
    base.validations.push({ severity: 'info', code: 'HIGH_CTC', message: `Remaining cost to complete is ${((extras.ctc / extras.finalContractValue) * 100).toFixed(1)}% of contract value.` })
  }

  return base
}

// ---------------------------------------------------------------------------
// Finalize: shared metrics, covenant checks, result assembly
// ---------------------------------------------------------------------------
function finalize(
  assumptions: FinancialModelAssumptions,
  periods: ModelPeriod[],
  projectCashFlows: number[],
  equityCashFlows: number[],
  ppy: number,
  validations: ModelValidation[],
  idcCapitalised: number,
  customsDuty: number,
  vatRate: number,
): EngineResult {
  const dscrValues = periods.map((p) => p.dscr).filter((v): v is number => v !== null && Number.isFinite(v))
  const llcrValues: number[] = periods.map((p) => p.llcr).filter((v): v is number => v !== null && Number.isFinite(v) && (v as number) > 0)
  const plcrValues: number[] = periods.map((p) => p.plcr).filter((v): v is number => v !== null && Number.isFinite(v) && (v as number) > 0)
  const totalRevenue = periods.reduce((sum, p) => sum + p.revenue, 0)
  const totalOperatingCost = periods.reduce((sum, p) => sum + p.operatingCost, 0)
  const totalEbitda = periods.reduce((sum, p) => sum + p.ebitda, 0)
  const totalTaxPaid = periods.reduce((sum, p) => sum + p.tax, 0)
  const totalDistribution = periods.reduce((sum, p) => sum + (p.distribution ?? 0), 0)
  const dsraPeak = Math.max(0, ...periods.map((p) => p.dsraBalance ?? 0))
  const mraPeak = Math.max(0, ...periods.map((p) => p.mraBalance ?? 0))
  const totalVat = totalRevenue * vatRate

  const metrics: ModelMetrics = {
    totalRevenue,
    totalOperatingCost,
    totalCapex: assumptions.capex + idcCapitalised + customsDuty,
    ebitdaMargin: totalRevenue ? totalEbitda / totalRevenue : 0,
    projectNpv: npv(projectCashFlows, assumptions.discountRate, ppy),
    projectIrr: irr(projectCashFlows, ppy),
    equityIrr: irr(equityCashFlows, ppy),
    minimumDscr: dscrValues.length ? Math.min(...dscrValues) : null,
    averageDscr: dscrValues.length ? dscrValues.reduce((s, v) => s + v, 0) / dscrValues.length : null,
    paybackPeriod: payback(equityCashFlows, ppy),
    debtAmount: assumptions.capex * assumptions.debtShare,
    equityAmount: assumptions.capex * (1 - assumptions.debtShare),
    minimumLlcr: llcrValues.length ? Math.min(...llcrValues) : null,
    minimumPlcr: plcrValues.length ? Math.min(...plcrValues) : null,
    totalTaxPaid,
    totalDistribution,
    dsraPeak,
    mraPeak,
    idcCapitalised,
    totalVat,
    effectiveTaxRate: totalEbitda > 0 ? totalTaxPaid / totalEbitda : 0,
    // EPC fields — filled in by finalizeEpc for EPC models; zeroed here
    finalContractValue: 0,
    totalCertified: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    totalRetentionHeld: 0,
    totalRetentionReleased: 0,
    peakRetentionBalance: 0,
    totalAdvanceDrawn: 0,
    totalAdvanceRecovered: 0,
    peakAdvanceOutstanding: 0,
    totalVariationOrders: 0,
    totalClaimsRecognised: 0,
    estimateAtCompletion: null,
    costToComplete: null,
    finalGrossMargin: null,
    marginAtCompletion: null,
    peakWorkingCapital: 0,
    peakDebtDraw: 0,
    bondCost: 0,
  }

  if (metrics.minimumDscr !== null && metrics.minimumDscr < 1) validations.push({ severity: 'error', code: 'DSCR_BREACH', message: 'Minimum DSCR falls below 1.00x — debt service cannot be covered from operating cash flow.' })
  else if (metrics.minimumDscr !== null && metrics.minimumDscr < 1.2) validations.push({ severity: 'warning', code: 'DSCR_HEADROOM', message: 'Minimum DSCR is below 1.20x — limited covenant headroom.' })
  if (metrics.minimumLlcr !== null && metrics.minimumLlcr < 1.2) validations.push({ severity: 'warning', code: 'LLCR_LOW', message: `Minimum LLCR is ${metrics.minimumLlcr.toFixed(2)}x — lenders may require DSRA top-up or cash sweep.` })
  if (metrics.projectIrr !== null && metrics.projectIrr < assumptions.discountRate) validations.push({ severity: 'warning', code: 'IRR_HURDLE', message: 'Project IRR is below the selected discount rate — project does not clear the hurdle.' })
  if (periods.some((p) => p.distributionLocked)) validations.push({ severity: 'info', code: 'DISTRIBUTION_LOCKED', message: 'One or more periods trigger the DSCR distribution lock-up. Equity distributions are deferred.' })

  return { assumptions, periods, metrics, validations, calculatedAt: new Date().toISOString(), engineVersion: FINANCE_ENGINE_VERSION } satisfies EngineResult
}

// ---------------------------------------------------------------------------
// Formula lineage builder
// ---------------------------------------------------------------------------
const fmt = {
  pct: (v: number | null) => v == null ? '—' : `${(v * 100).toFixed(2)}%`,
  usd: (v: number | null, ccy = 'USD') => v == null ? '—' : `${ccy} ${v.toLocaleString('en', { maximumFractionDigits: 0 })}`,
  x:   (v: number | null) => v == null ? '—' : `${v.toFixed(2)}x`,
  yr:  (v: number | null) => v == null ? '—' : `${v.toFixed(1)} years`,
}

function totalAbsSum(values: number[]): number {
  return values.reduce((s, v) => s + Math.abs(v), 0)
}

function buildLineage(
  input: FinancialModelAssumptions,
  periods: ModelPeriod[],
  metrics: ModelMetrics,  // eslint-disable-line @typescript-eslint/no-unused-vars -- all fields used below
): ModelLineage {
  const ccy = input.currency
  const ppy = { annual: 1, semiannual: 2, quarterly: 4, monthly: 12 }[input.periodicity]
  const totalRevenue = metrics.totalRevenue
  const totalOpex = metrics.totalOperatingCost
  const totalDebtService = periods.reduce((s, p) => s + p.debtService, 0)
  const totalTax = periods.reduce((s, p) => s + p.tax, 0)
  const totalProjectCF = periods.reduce((s, p) => s + p.projectCashFlow, 0)

  // ── Project IRR ──
  const irrDriverSum = totalAbsSum([totalRevenue, -totalOpex, -totalDebtService, -totalTax])
  const irrDrivers: LineageDriver[] = [
    { label: 'Total Revenue', value: totalRevenue, unit: ccy, contribution: Math.abs(totalRevenue) / irrDriverSum },
    { label: 'Total Opex',    value: -totalOpex,   unit: ccy, contribution: Math.abs(totalOpex)    / irrDriverSum },
    { label: 'Debt Service',  value: -totalDebtService, unit: ccy, contribution: Math.abs(totalDebtService) / irrDriverSum },
    { label: 'Tax',           value: -totalTax,    unit: ccy, contribution: Math.abs(totalTax)     / irrDriverSum },
  ]
  const irrSteps: LineageStep[] = input.template === 'solar-ipp' ? [
    { label: 'Installed capacity',      formula: `${(input as SolarIppAssumptions).capacityMwp} MWp`, value: (input as SolarIppAssumptions).capacityMwp, unit: 'MWp' },
    { label: 'Specific yield (Y1)',     formula: `${(input as SolarIppAssumptions).specificYieldMwhPerMwp} MWh/MWp`, value: (input as SolarIppAssumptions).specificYieldMwhPerMwp * (input as SolarIppAssumptions).capacityMwp, unit: 'MWh' },
    { label: 'Tariff (base)',           formula: `${ccy} ${(input as SolarIppAssumptions).tariffPerMwh}/MWh`, value: (input as SolarIppAssumptions).tariffPerMwh, unit: `${ccy}/MWh` },
    { label: 'Total operating revenue', formula: 'Σ(energy × tariff × escalation^n)', value: totalRevenue, unit: ccy },
    { label: 'Total OPEX',             formula: 'Σ(opex + admin) × escalation^n', value: -totalOpex, unit: ccy },
    { label: 'CAPEX outflow',          formula: `−${fmt.usd(input.capex, ccy)} at t=0`, value: -input.capex, unit: ccy },
    { label: 'Project IRR',            formula: 'IRR(−CAPEX, CF₁…CFₙ) annualised', value: metrics.projectIrr, unit: '%', note: `Solved by bisection over ${periods.length * ppy} iterations` },
  ] : [
    { label: 'Contract value',          formula: `${ccy} ${(input as EpcAssumptions).contractValue.toLocaleString()}`, value: (input as EpcAssumptions).contractValue, unit: ccy },
    { label: 'Gross margin rate',       formula: `${fmt.pct((input as EpcAssumptions).grossMarginRate)} of revenue`, value: (input as EpcAssumptions).grossMarginRate * (input as EpcAssumptions).contractValue, unit: ccy },
    { label: 'Total certified revenue', formula: 'Σ(certified × tariff per milestone)', value: totalRevenue, unit: ccy },
    { label: 'Direct + overhead costs', formula: `${fmt.usd(totalOpex, ccy)} across all periods`, value: -totalOpex, unit: ccy },
    { label: 'Project IRR',             formula: 'IRR(−CAPEX, CF₁…CFₙ) annualised', value: metrics.projectIrr, unit: '%' },
  ]

  const projectIrr: MetricLineage = {
    metric: 'projectIrr',
    label: 'Project IRR',
    formattedValue: fmt.pct(metrics.projectIrr),
    formulaDescription: 'Internal rate of return on all project cash flows including capex outflow at t=0, before financing.',
    steps: irrSteps,
    keyDrivers: irrDrivers,
  }

  // ── Equity IRR ──
  const equityOutflow = metrics.equityAmount
  const equityDriverSum = totalAbsSum([equityOutflow, totalProjectCF, totalDebtService])
  const equityIrr: MetricLineage = {
    metric: 'equityIrr',
    label: 'Equity IRR',
    formattedValue: fmt.pct(metrics.equityIrr),
    formulaDescription: 'IRR on equity cash flows: equity contribution at t=0, then project cash flow less all debt service.',
    steps: [
      { label: 'Equity contribution',  formula: `${fmt.usd(equityOutflow, ccy)} = ${fmt.pct(1 - input.debtShare)} × CAPEX`, value: -equityOutflow, unit: ccy },
      { label: 'Debt leverage',        formula: `${fmt.pct(input.debtShare)} debt → ${input.debtInterestRate * 100}% interest`, value: metrics.debtAmount, unit: ccy },
      { label: 'Total project CF',     formula: 'Σ(revenue − opex − tax) over all periods', value: totalProjectCF, unit: ccy },
      { label: 'Total debt service',   formula: `Σ(interest + principal) over ${input.debtTenorYears} yr tenor`, value: -totalDebtService, unit: ccy },
      { label: 'Equity IRR',           formula: 'IRR(−equity, ECF₁…ECFₙ) annualised', value: metrics.equityIrr, unit: '%' },
    ],
    keyDrivers: [
      { label: 'Equity outflow',   value: -equityOutflow,    unit: ccy, contribution: Math.abs(equityOutflow)    / equityDriverSum },
      { label: 'Project CF',       value: totalProjectCF,    unit: ccy, contribution: Math.abs(totalProjectCF)   / equityDriverSum },
      { label: 'Debt service',     value: -totalDebtService, unit: ccy, contribution: Math.abs(totalDebtService) / equityDriverSum },
    ],
  }

  // ── Project NPV ──
  const npvDrivers: LineageDriver[] = [
    { label: 'PV of cash flows', value: metrics.projectNpv + input.capex, unit: ccy, contribution: 0.7 },
    { label: 'CAPEX',            value: -input.capex,                    unit: ccy, contribution: 0.3 },
  ]
  const projectNpv: MetricLineage = {
    metric: 'projectNpv',
    label: 'Project NPV',
    formattedValue: fmt.usd(metrics.projectNpv, ccy),
    formulaDescription: `NPV = Σ[CFₜ / (1 + ${fmt.pct(input.discountRate)})ᵗ] − CAPEX, discounted at WACC/hurdle rate.`,
    steps: [
      { label: 'Discount rate (WACC)',  formula: fmt.pct(input.discountRate), value: input.discountRate, unit: '%' },
      { label: 'Discount basis',        formula: `${periods.length} periods × ${ppy} p/yr`, value: periods.length, unit: 'periods' },
      { label: 'CAPEX outflow',         formula: fmt.usd(-input.capex, ccy), value: -input.capex, unit: ccy },
      { label: 'PV of operating CFs',   formula: `Σ[CFₜ / (1+r)ᵗ]`, value: metrics.projectNpv + input.capex, unit: ccy },
      { label: 'Project NPV',           formula: 'PV(CFs) − CAPEX', value: metrics.projectNpv, unit: ccy },
    ],
    keyDrivers: npvDrivers,
  }

  // ── Minimum DSCR ──
  const dscrPeriods = periods.filter((p) => p.dscr !== null && p.endingDebt > 0)
  const minDscrPeriod = dscrPeriods.reduce(
    (min, p) => (p.dscr as number) < (min.dscr as number) ? p : min,
    dscrPeriods[0] ?? periods[0],
  )
  const minDscr: MetricLineage = {
    metric: 'minimumDscr',
    label: 'Minimum DSCR',
    formattedValue: fmt.x(metrics.minimumDscr),
    formulaDescription: 'Debt Service Coverage Ratio = (EBITDA − Tax) / Debt Service. Covenant minimum typically 1.20x.',
    steps: [
      { label: 'DSCR formula',         formula: '(EBITDA − Tax) ÷ Debt Service', value: null, unit: '' },
      { label: 'Period with min DSCR', formula: minDscrPeriod?.label ?? '—', value: minDscrPeriod?.dscr ?? null, unit: 'x', note: minDscrPeriod ? `Year ${minDscrPeriod.year}` : undefined },
      { label: 'EBITDA at min period', formula: 'Revenue − Operating Cost', value: minDscrPeriod?.ebitda ?? null, unit: ccy },
      { label: 'Tax at min period',    formula: `${fmt.pct(input.taxRate)} × taxable income`, value: minDscrPeriod?.tax ?? null, unit: ccy },
      { label: 'Debt service',         formula: 'Interest + Principal repayment', value: minDscrPeriod?.debtService ?? null, unit: ccy },
      { label: 'Minimum DSCR',         formula: '(EBITDA − Tax) / Debt Service', value: metrics.minimumDscr, unit: 'x' },
    ],
    keyDrivers: dscrPeriods.slice(0, 8).map((p) => ({
      label: p.label,
      value: p.dscr as number,
      unit: 'x',
      contribution: (p.dscr as number) / Math.max(...dscrPeriods.map((d) => d.dscr as number)),
    })),
  }

  // ── Payback period ──
  const paybackMetric: MetricLineage = {
    metric: 'paybackPeriod',
    label: 'Payback Period',
    formattedValue: fmt.yr(metrics.paybackPeriod),
    formulaDescription: 'Time for cumulative equity cash flows to recover the equity investment.',
    steps: [
      { label: 'Equity investment',    formula: fmt.usd(metrics.equityAmount, ccy), value: -metrics.equityAmount, unit: ccy },
      { label: 'Annual equity CF avg', formula: `${fmt.usd(totalProjectCF / periods.length, ccy)} / yr avg`, value: totalProjectCF / periods.length, unit: ccy },
      { label: 'Payback period',       formula: 't where Σ(equity CF) ≥ 0', value: metrics.paybackPeriod, unit: 'years' },
    ],
    keyDrivers: [
      { label: 'Equity invested',    value: -metrics.equityAmount,                    unit: ccy, contribution: 0.5 },
      { label: 'Avg annual equity CF', value: totalProjectCF / periods.length,           unit: ccy, contribution: 0.5 },
    ],
  }

  // ── Total Revenue breakdown (Solar IPP) ──
  const totalRevenueMetric: MetricLineage = input.template === 'solar-ipp' ? (() => {
    const ipp = input as SolarIppAssumptions
    const y1Energy = ipp.capacityMwp * ipp.specificYieldMwhPerMwp * ipp.availability
    const y1Revenue = y1Energy * ipp.tariffPerMwh
    const revDrivers: LineageDriver[] = [
      { label: 'Y1 energy output', value: y1Energy, unit: 'MWh', contribution: 0.4 },
      { label: 'Tariff',           value: ipp.tariffPerMwh, unit: `${ccy}/MWh`, contribution: 0.35 },
      { label: 'Availability',     value: ipp.availability * 100, unit: '%', contribution: 0.1 },
      { label: 'Tariff escalation', value: ipp.tariffEscalationRate * 100, unit: '%/yr', contribution: 0.15 },
    ]
    return {
      metric: 'totalRevenue',
      label: 'Total Revenue',
      formattedValue: fmt.usd(totalRevenue, ccy),
      formulaDescription: 'Σ over all periods: Capacity × Yield × Availability × (1−Degradation)ⁿ × Tariff × (1+Escalation)ⁿ',
      steps: [
        { label: 'Capacity',           formula: `${ipp.capacityMwp} MWp`, value: ipp.capacityMwp, unit: 'MWp' },
        { label: 'Specific yield',     formula: `${ipp.specificYieldMwhPerMwp} MWh/MWp/yr`, value: ipp.specificYieldMwhPerMwp, unit: 'MWh/MWp' },
        { label: 'Availability',       formula: fmt.pct(ipp.availability), value: ipp.availability, unit: '%' },
        { label: 'Degradation',        formula: `${fmt.pct(ipp.degradationRate)}/yr compounding`, value: ipp.degradationRate, unit: '%/yr' },
        { label: 'Y1 energy',          formula: `${ipp.capacityMwp} × ${ipp.specificYieldMwhPerMwp} × ${ipp.availability}`, value: y1Energy, unit: 'MWh' },
        { label: 'Y1 revenue',         formula: `${y1Energy.toLocaleString()} MWh × ${ccy} ${ipp.tariffPerMwh}/MWh`, value: y1Revenue, unit: ccy },
        { label: 'Tariff escalation',  formula: `+${fmt.pct(ipp.tariffEscalationRate)}/yr`, value: ipp.tariffEscalationRate, unit: '%/yr' },
        { label: 'Total revenue (20yr)', formula: `Σ PPA revenue over ${ipp.operatingYears} years`, value: totalRevenue, unit: ccy },
      ],
      keyDrivers: revDrivers,
    }
  })() : {
    metric: 'totalRevenue', label: 'Total Revenue', formattedValue: fmt.usd(totalRevenue, ccy),
    formulaDescription: 'Sum of all billing certifications less retentions recovered.',
    steps: [], keyDrivers: [],
  }

  return {
    projectIrr,
    equityIrr,
    projectNpv,
    minimumDscr: minDscr,
    paybackPeriod: paybackMetric,
    totalRevenue: totalRevenueMetric,
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export function calculateFinancialModel(input: FinancialModelAssumptions): FinancialModelResult {
  const base = input.template === 'solar-ipp' ? calculateSolar(input) : calculateEpc(input)
  const lineage = buildLineage(input, base.periods, base.metrics)
  return { ...base, lineage }
}
