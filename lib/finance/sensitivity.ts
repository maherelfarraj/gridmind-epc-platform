import { calculateFinancialModel as calculateModel } from './calculate'
import type { FinancialModelAssumptions, SolarIppAssumptions, EpcAssumptions } from './types'

// ---------------------------------------------------------------------------
// Variable definitions — what can be stressed and by how much
// ---------------------------------------------------------------------------
export interface SensitivityVariable {
  key: string
  label: string
  unit: '%' | 'abs' | 'years'
  steps: number[]            // deltas to apply (e.g. [-20, -10, 0, +10, +20])
  format: 'percent' | 'currency' | 'number' | 'years'
  applies: 'solar-ipp' | 'epc' | 'both'
  deltaBounds?: [number, number]  // break-even search bounds (defaults to [-80, 200])
}

export const SENSITIVITY_VARIABLES: SensitivityVariable[] = [
  { key: 'tariffPerMwh',          label: 'PPA Tariff',         unit: '%',   steps: [-20,-10,-5,0,5,10,20],  format: 'currency', applies: 'solar-ipp' },
  { key: 'capex',                  label: 'CAPEX',              unit: '%',   steps: [-20,-10,-5,0,5,10,20],  format: 'currency', applies: 'both' },
  { key: 'specificYieldMwhPerMwp', label: 'Energy Yield',       unit: '%',   steps: [-20,-10,-5,0,5,10,20],  format: 'number',   applies: 'solar-ipp' },
  { key: 'debtInterestRate',       label: 'Interest Rate',      unit: 'abs', steps: [-200,-100,-50,0,50,100,200], format: 'percent', applies: 'both' },
  { key: 'opexPerMwp',             label: 'O&M Cost',           unit: '%',   steps: [-20,-10,-5,0,5,10,20],  format: 'currency', applies: 'solar-ipp' },
  { key: 'adminCost',              label: 'Admin Cost',         unit: '%',   steps: [-20,-10,-5,0,5,10,20],  format: 'currency', applies: 'solar-ipp' },
  { key: 'grossMarginRate',        label: 'Gross Margin',       unit: 'abs', steps: [-500,-250,-100,0,100,250,500], format: 'percent', applies: 'epc' },
  { key: 'contractValue',          label: 'Contract Value',     unit: '%',   steps: [-20,-10,-5,0,5,10,20],  format: 'currency', applies: 'epc' },
  { key: 'discountRate',           label: 'Discount Rate',      unit: 'abs', steps: [-200,-100,-50,0,50,100,200], format: 'percent', applies: 'both' },
  { key: 'debtShare',              label: 'Debt Share',         unit: 'abs', steps: [-20,-10,-5,0,5,10,20],  format: 'percent', applies: 'both' },
  { key: 'constructionYears',      label: 'COD Delay',          unit: 'years', steps: [-0.5,0,0.25,0.5,1,1.5,2], format: 'years', applies: 'both', deltaBounds: [-1, 6] },
]

export type SensitivityOutputKey = 'projectIrr' | 'equityIrr' | 'projectNpv' | 'minimumDscr' | 'marginAtCompletion'

export interface SensitivityPoint {
  step: number       // delta applied (e.g. +10 means +10%)
  value: number      // output value at this stress level
  delta: number      // change vs base
  deltaPercent: number
}

export interface SensitivitySeries {
  variable: SensitivityVariable
  baseValue: number
  points: SensitivityPoint[]
  range: number      // max(|delta|) — used for tornado rank
}

export interface SensitivityMatrixCell {
  row: number   // row variable step index
  col: number   // col variable step index
  value: number
}

export interface SensitivityMatrix {
  rowVar: SensitivityVariable
  colVar: SensitivityVariable
  outputKey: SensitivityOutputKey
  rowSteps: number[]
  colSteps: number[]
  baseValue: number
  cells: SensitivityMatrixCell[]
}

export interface BreakEvenResult {
  variable: SensitivityVariable
  outputKey: SensitivityOutputKey
  targetValue: number
  breakEvenDelta: number | null  // delta from base where output crosses target
  breakEvenAbsolute: number | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function applyDelta(base: FinancialModelAssumptions, key: string, unit: '%' | 'abs' | 'years', step: number): FinancialModelAssumptions {
  const cloned = { ...(base as unknown as Record<string, unknown>) }
  // Optional numeric fields (e.g. constructionYears) default to 0 so additive units still apply
  const current = typeof cloned[key] === 'number' ? (cloned[key] as number) : unit === 'years' ? 0 : NaN
  if (!Number.isFinite(current)) return base
  if (unit === '%') {
    cloned[key] = current * (1 + step / 100)
  } else if (unit === 'years') {
    // additive year delta; never negative construction
    cloned[key] = Math.max(0, current + step)
  } else {
    // abs steps are in basis points for rates, raw units for others
    cloned[key] = current + step / 10000
  }
  return cloned as unknown as FinancialModelAssumptions
}

function getOutput(assumptions: FinancialModelAssumptions, outputKey: SensitivityOutputKey): number {
  try {
    const result = calculateModel(assumptions)
    const value = result.metrics[outputKey as keyof typeof result.metrics]
    return typeof value === 'number' && Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

// ---------------------------------------------------------------------------
// Tornado: single-variable sensitivities ranked by impact
// ---------------------------------------------------------------------------
export function runTornado(
  base: FinancialModelAssumptions,
  outputKey: SensitivityOutputKey,
  variables?: SensitivityVariable[],
): SensitivitySeries[] {
  const vars = (variables ?? SENSITIVITY_VARIABLES).filter(
    (v) => v.applies === 'both' || v.applies === base.template,
  )
  const baseValue = getOutput(base, outputKey)

  const series: SensitivitySeries[] = vars.map((variable) => {
    const points: SensitivityPoint[] = variable.steps.map((step) => {
      const stressed = applyDelta(base, variable.key, variable.unit, step)
      const value = getOutput(stressed, outputKey)
      const delta = value - baseValue
      return { step, value, delta, deltaPercent: baseValue !== 0 ? (delta / Math.abs(baseValue)) * 100 : 0 }
    })
    const range = Math.max(...points.map((p) => Math.abs(p.delta)))
    return { variable, baseValue, points, range }
  })

  return series.sort((a, b) => b.range - a.range)
}

// ---------------------------------------------------------------------------
// Two-variable sensitivity matrix
// ---------------------------------------------------------------------------
export function runSensitivityMatrix(
  base: FinancialModelAssumptions,
  rowVarKey: string,
  colVarKey: string,
  outputKey: SensitivityOutputKey,
): SensitivityMatrix | null {
  const rowVar = SENSITIVITY_VARIABLES.find((v) => v.key === rowVarKey)
  const colVar = SENSITIVITY_VARIABLES.find((v) => v.key === colVarKey)
  if (!rowVar || !colVar) return null

  const baseValue = getOutput(base, outputKey)
  const cells: SensitivityMatrixCell[] = []

  rowVar.steps.forEach((rowStep, rowIndex) => {
    colVar.steps.forEach((colStep, colIndex) => {
      const stressed = applyDelta(
        applyDelta(base, rowVar.key, rowVar.unit, rowStep),
        colVar.key,
        colVar.unit,
        colStep,
      )
      cells.push({ row: rowIndex, col: colIndex, value: getOutput(stressed, outputKey) })
    })
  })

  return { rowVar, colVar, outputKey, rowSteps: rowVar.steps, colSteps: colVar.steps, baseValue, cells }
}

// ---------------------------------------------------------------------------
// Break-even solver: binary search for the step where output crosses target
// ---------------------------------------------------------------------------
export function runBreakEven(
  base: FinancialModelAssumptions,
  varKey: string,
  outputKey: SensitivityOutputKey,
  targetValue: number,
): BreakEvenResult | null {
  const variable = SENSITIVITY_VARIABLES.find((v) => v.key === varKey)
  if (!variable) return null

  const baseValue = getOutput(base, outputKey)
  const sign = baseValue > targetValue ? 1 : -1

  let [lo, hi] = variable.deltaBounds ?? [-80, 200]
  let converged = false

  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2
    const stressed = applyDelta(base, variable.key, variable.unit, mid)
    const val = getOutput(stressed, outputKey)
    const diff = val - targetValue
    if (Math.abs(diff) < 1e-6) { lo = mid; converged = true; break }
    if (diff * sign > 0) lo = mid
    else hi = mid
  }

  if (!converged && Math.abs(hi - lo) > 0.5) {
    return { variable, outputKey, targetValue, breakEvenDelta: null, breakEvenAbsolute: null }
  }

  const delta = (lo + hi) / 2
  const cloned = { ...(base as unknown as Record<string, unknown>) }
  const rawCurrent = cloned[variable.key]
  const current = typeof rawCurrent === 'number' ? rawCurrent : variable.unit === 'years' ? 0 : NaN
  if (!Number.isFinite(current)) return { variable, outputKey, targetValue, breakEvenDelta: null, breakEvenAbsolute: null }
  const abs =
    variable.unit === '%' ? current * (1 + delta / 100)
    : variable.unit === 'years' ? Math.max(0, current + delta)
    : current + delta / 10000

  return { variable, outputKey, targetValue, breakEvenDelta: delta, breakEvenAbsolute: abs }
}

// ---------------------------------------------------------------------------
// Scenario comparison
// ---------------------------------------------------------------------------
export interface ScenarioSnapshot {
  label: string
  assumptions: FinancialModelAssumptions
}

export interface ScenarioComparison {
  scenarios: ScenarioSnapshot[]
  metrics: {
    key: string
    label: string
    values: (number | null)[]
    format: 'percent' | 'currency' | 'multiple' | 'years'
  }[]
}

export function compareScenarios(scenarios: ScenarioSnapshot[], currency: string): ScenarioComparison {
  const results = scenarios.map((s) => { try { return calculateModel(s.assumptions) } catch { return null } })

  const METRIC_DEFS: { key: keyof typeof results[0] extends never ? string : string; label: string; format: ScenarioComparison['metrics'][0]['format'] }[] = [
    { key: 'projectIrr',      label: 'Project IRR',       format: 'percent' },
    { key: 'equityIrr',       label: 'Equity IRR',        format: 'percent' },
    { key: 'projectNpv',      label: `Project NPV (${currency})`, format: 'currency' },
    { key: 'minimumDscr',     label: 'Min DSCR',          format: 'multiple' },
    { key: 'averageDscr',     label: 'Avg DSCR',          format: 'multiple' },
    { key: 'paybackPeriod',   label: 'Payback',           format: 'years' },
    { key: 'totalRevenue',    label: `Total Revenue (${currency})`, format: 'currency' },
    { key: 'debtAmount',      label: `Debt (${currency})`, format: 'currency' },
    { key: 'minimumLlcr',     label: 'Min LLCR',          format: 'multiple' },
    { key: 'minimumPlcr',     label: 'Min PLCR',          format: 'multiple' },
  ]

  return {
    scenarios,
    metrics: METRIC_DEFS.map((def) => ({
      key: def.key,
      label: def.label,
      format: def.format,
      values: results.map((r) => {
        if (!r) return null
        const v = r.metrics[def.key as keyof typeof r.metrics]
        return typeof v === 'number' ? v : null
      }),
    })),
  }
}
