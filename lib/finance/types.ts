export type ModelTemplate = 'solar-ipp' | 'epc'
export type Periodicity = 'annual' | 'semiannual' | 'quarterly' | 'monthly'

export interface CommonModelAssumptions {
  name: string
  template: ModelTemplate
  currency: string
  startYear: number
  operatingYears: number
  periodicity: Periodicity
  discountRate: number
  inflationRate: number
  taxRate: number
  capex: number
  debtShare: number
  debtInterestRate: number
  debtTenorYears: number
  debtGraceYears: number
}

export interface SolarIppAssumptions extends CommonModelAssumptions {
  template: 'solar-ipp'
  capacityMwp: number
  specificYieldMwhPerMwp: number
  degradationRate: number
  availability: number
  tariffPerMwh: number
  tariffEscalationRate: number
  opexPerMwp: number
  opexEscalationRate: number
  adminCost: number
  adminEscalationRate: number
  depreciationYears: number
  // Advanced Solar IPP fields
  constructionYears?: number          // years of IDC before COD (default 0 = COD at start)
  dsraMonths?: number                 // Debt Service Reserve Account target in months of debt service (default 6)
  dsraFunded?: 'equity' | 'cashflow'  // how DSRA is funded (default 'equity')
  mraContributionPerMwp?: number      // Maintenance Reserve Account annual contribution per MWp (default 0 = disabled)
  mraReleaseYears?: number            // maintenance cycle length; MRA balance is released/spent every N years (default 0 = never)
  distributionLockupMinDscr?: number  // min DSCR below which distributions are locked up (default 1.10)
  taxLossCarryForwardYears?: number   // max years to carry forward losses (default 20)
  vatRate?: number                    // VAT / withholding rate on revenue (default 0)
  customsRate?: number                // customs / import duty rate on CAPEX (default 0)
}

export interface EpcAssumptions extends CommonModelAssumptions {
  template: 'epc'
  contractValue: number
  constructionYears: number
  grossMarginRate: number
  retentionRate: number
  retentionReleaseRate: number        // fraction released on practical completion (e.g. 0.5 = half on PC, rest at DLP)
  defectsLiabilityPeriodYears: number // DLP in years; remaining retention released at end
  advancePaymentRate: number
  advancePaymentRecoveryRate: number  // fraction recovered per period against certifications (default 0.2)
  variationOrderRate: number
  paymentLagPeriods: number
  overheadRate: number
  contingencyRate: number
  // Performance bond and guarantees
  performanceBondRate: number         // % of contract value (cost to contractor, default 0.01)
  advancePaymentBondRate: number      // % of advance drawn (default 0.015)
  retentionBondRate?: number          // cash retention can be replaced with a bond (optional)
  // Advanced EPC cost-tracking fields
  actualCostToDate?: number           // incurred costs to date for EAC reconciliation
  percentCompleteToDate?: number      // earned progress % for EVM (0–1)
  subcontractorRetentionRate?: number // sub-tier retention held by contractor (default 0)
  variationOrdersApproved?: number    // approved VO value applied to contract
  claimsValue?: number                // pending claims value (not yet approved)
  claimsSuccessRate?: number          // probability-weighted success rate on claims (0–1, default 0.5)
  // Working capital
  workingCapitalRate?: number         // % of annual revenue kept as working capital buffer (default 0.05)
  supplierPaymentLagPeriods?: number  // periods between cost incurrence and cash payment to subs (default 1)
}

export type FinancialModelAssumptions = SolarIppAssumptions | EpcAssumptions

export interface ModelPeriod {
  index: number
  label: string
  year: number
  fraction: number
  revenue: number
  operatingCost: number
  ebitda: number
  depreciation: number
  ebit: number
  interest: number
  tax: number
  debtDraw: number
  principalRepayment: number
  debtService: number
  endingDebt: number
  projectCashFlow: number
  equityCashFlow: number
  dscr: number | null
  energyMwh?: number
  // Advanced Solar IPP fields
  taxableIncome?: number
  taxLossCarryForward?: number
  dsraBalance?: number
  dsraMovement?: number
  mraBalance?: number                 // Maintenance Reserve Account balance end of period
  mraMovement?: number                // MRA contribution (+) this period
  mraRelease?: number                 // MRA released/spent this period at a maintenance cycle
  distributionLocked?: boolean
  distribution?: number
  llcr?: number | null
  plcr?: number | null
  // Advanced EPC cost-tracking fields
  contractValue?: number              // cumulative contract value incl. approved VOs
  committed?: number                  // committed cost (sub-orders placed)
  incurred?: number                   // costs incurred / accrued this period
  certified?: number                  // engineer-certified progress value
  invoiced?: number                   // contractor invoice raised
  paid?: number                       // actual cash received from client
  retentionHeld?: number              // cumulative retention withheld by client
  retentionReleased?: number          // retention released this period
  advanceOutstanding?: number         // advance payment balance not yet recovered
  advanceRecovered?: number           // advance recovered this period
  variationOrders?: number            // cumulative approved VO value
  claimsRecognised?: number           // probability-weighted claims recognised
  earnedValue?: number                // EVM earned value (% complete × BAC)
  plannedValue?: number               // EVM planned value (S-curve planned)
  costVariance?: number               // EVM: EV − AC
  scheduleVariance?: number           // EVM: EV − PV
  costPerformanceIndex?: number       // EVM: EV / AC
  schedulePerformanceIndex?: number   // EVM: EV / PV
  estimateAtCompletion?: number       // EAC = BAC / CPI
  costToComplete?: number             // CTC = EAC − actual cost to date
  workingCapitalBalance?: number      // net working capital position end of period
  grossProfit?: number                // revenue − direct cost before overhead
  contributionMargin?: number         // gross profit − overhead
}

export interface ModelMetrics {
  totalRevenue: number
  totalOperatingCost: number
  totalCapex: number
  ebitdaMargin: number
  projectNpv: number
  projectIrr: number | null
  equityIrr: number | null
  minimumDscr: number | null
  averageDscr: number | null
  paybackPeriod: number | null
  debtAmount: number
  equityAmount: number
  // Advanced Solar IPP metrics
  minimumLlcr: number | null
  minimumPlcr: number | null
  totalTaxPaid: number
  totalDistribution: number
  dsraPeak: number
  mraPeak: number
  idcCapitalised: number
  totalVat: number
  effectiveTaxRate: number
  // Advanced EPC metrics
  finalContractValue: number          // contract + all approved VOs
  totalCertified: number
  totalInvoiced: number
  totalPaid: number
  totalRetentionHeld: number
  totalRetentionReleased: number
  peakRetentionBalance: number
  totalAdvanceDrawn: number
  totalAdvanceRecovered: number
  peakAdvanceOutstanding: number
  totalVariationOrders: number
  totalClaimsRecognised: number
  estimateAtCompletion: number | null
  costToComplete: number | null
  finalGrossMargin: number | null     // actual realised gross margin %
  marginAtCompletion: number | null   // forecast margin % at EAC
  peakWorkingCapital: number
  peakDebtDraw: number
  bondCost: number                    // total performance + AP bond premiums
}

export interface ModelValidation {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
}

// ─── Formula Lineage ─────────────────────────────────────────────────────────

/** One step in a metric's derivation chain */
export interface LineageStep {
  label: string
  formula: string          // human-readable formula or expression
  value: number | null
  unit: string
  note?: string
}

/** One key driver row in a metric drill-down */
export interface LineageDriver {
  label: string
  value: number
  unit: string
  contribution: number     // fraction of total (0-1) for bar charts
}

/** Full drill-down for one KPI */
export interface MetricLineage {
  metric: string           // canonical key e.g. 'projectIrr'
  label: string
  formattedValue: string
  formulaDescription: string
  steps: LineageStep[]
  keyDrivers: LineageDriver[]
}

/** Map of metric key → lineage */
export type ModelLineage = Record<string, MetricLineage>

/** Internal engine result — lineage is attached by the public entry point. */
export type EngineResult = {
  assumptions: FinancialModelAssumptions
  periods: ModelPeriod[]
  metrics: ModelMetrics
  validations: ModelValidation[]
  calculatedAt: string
  engineVersion: string
}

export interface FinancialModelResult extends EngineResult {
  lineage: ModelLineage
}
