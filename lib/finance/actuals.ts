import type { ModelPeriod } from './types'

// ---------------------------------------------------------------------------
// Actual-vs-forecast variance analysis
//
// Actuals are captured per period as a small set of line items and compared
// against the model forecast (the baseline version's computed periods).
// A metric can be "up-good" (revenue, ebitda, cash) or "up-bad" (cost), which
// determines whether a positive variance is favourable or unfavourable.
// ---------------------------------------------------------------------------

/** The metrics captured as actuals per period. Keys match ActualLineItem keys. */
export const ACTUAL_METRICS = [
  { key: 'revenue', label: 'Revenue', direction: 'up-good', forecastKey: 'revenue' },
  { key: 'operatingCost', label: 'Operating cost', direction: 'up-bad', forecastKey: 'operatingCost' },
  { key: 'ebitda', label: 'EBITDA', direction: 'up-good', forecastKey: 'ebitda' },
  { key: 'cashFlow', label: 'Net cash flow', direction: 'up-good', forecastKey: 'projectCashFlow' },
] as const

export type ActualMetricKey = (typeof ACTUAL_METRICS)[number]['key']
export type ActualLineItems = Partial<Record<ActualMetricKey, number>>

/** One persisted actuals record for a period (mirrors the DB row). */
export interface ActualPeriodInput {
  periodIndex: number
  periodLabel: string
  actuals: ActualLineItems
  locked: boolean
}

export interface MetricVariance {
  key: ActualMetricKey
  label: string
  direction: 'up-good' | 'up-bad'
  forecast: number
  actual: number | null
  variance: number | null        // actual − forecast
  variancePercent: number | null // variance / |forecast|
  favourable: boolean | null     // true if the variance helps the project
}

export interface PeriodVariance {
  periodIndex: number
  periodLabel: string
  locked: boolean
  hasActuals: boolean
  metrics: MetricVariance[]
}

export interface VarianceSummary {
  periods: PeriodVariance[]
  totals: MetricVariance[]
  periodsWithActuals: number
  lockedPeriods: number
  /** Blended forecast+actual view: actuals replace forecast where locked/entered. */
  blendedCashFlow: { periodLabel: string; forecast: number; actual: number | null; blended: number }[]
}

function favourability(direction: 'up-good' | 'up-bad', variance: number | null): boolean | null {
  if (variance === null || variance === 0) return variance === 0 ? true : null
  return direction === 'up-good' ? variance > 0 : variance < 0
}

function buildMetricVariance(
  def: (typeof ACTUAL_METRICS)[number],
  forecast: number,
  actual: number | null,
): MetricVariance {
  const variance = actual === null ? null : actual - forecast
  const variancePercent =
    variance === null || forecast === 0 ? (variance !== null && forecast === 0 ? null : variance === null ? null : 0) : variance / Math.abs(forecast)
  return {
    key: def.key,
    label: def.label,
    direction: def.direction,
    forecast,
    actual,
    variance,
    variancePercent,
    favourable: favourability(def.direction, variance),
  }
}

export function buildVarianceSummary(
  forecastPeriods: ModelPeriod[],
  actualRows: ActualPeriodInput[],
): VarianceSummary {
  const actualsByIndex = new Map(actualRows.map((r) => [r.periodIndex, r]))

  const periods: PeriodVariance[] = forecastPeriods.map((period) => {
    const row = actualsByIndex.get(period.index)
    const hasActuals = !!row && Object.keys(row.actuals).length > 0
    const metrics = ACTUAL_METRICS.map((def) => {
      const forecast = Number(period[def.forecastKey as keyof ModelPeriod] ?? 0)
      const actual = row && row.actuals[def.key] !== undefined ? Number(row.actuals[def.key]) : null
      return buildMetricVariance(def, forecast, actual)
    })
    return {
      periodIndex: period.index,
      periodLabel: period.label,
      locked: !!row?.locked,
      hasActuals,
      metrics,
    }
  })

  // Totals across all periods
  const totals: MetricVariance[] = ACTUAL_METRICS.map((def) => {
    const forecast = forecastPeriods.reduce((sum, p) => sum + Number(p[def.forecastKey as keyof ModelPeriod] ?? 0), 0)
    const relevant = periods.filter((p) => p.metrics.find((m) => m.key === def.key)?.actual !== null)
    const anyActual = relevant.length > 0
    const actual = anyActual
      ? relevant.reduce((sum, p) => sum + (p.metrics.find((m) => m.key === def.key)?.actual ?? 0), 0)
      : null
    // Forecast comparable only over periods that have actuals, for a like-for-like total
    const forecastComparable = anyActual
      ? relevant.reduce((sum, p) => sum + (p.metrics.find((m) => m.key === def.key)?.forecast ?? 0), 0)
      : forecast
    return buildMetricVariance(def, forecastComparable, actual)
  })

  const blendedCashFlow = forecastPeriods.map((period) => {
    const row = actualsByIndex.get(period.index)
    const forecast = Number(period.projectCashFlow ?? 0)
    const actual = row && row.actuals.cashFlow !== undefined ? Number(row.actuals.cashFlow) : null
    // Locked actuals become historical fact; open periods fall back to forecast
    const blended = row?.locked && actual !== null ? actual : actual !== null ? actual : forecast
    return { periodLabel: period.label, forecast, actual, blended }
  })

  return {
    periods,
    totals,
    periodsWithActuals: periods.filter((p) => p.hasActuals).length,
    lockedPeriods: periods.filter((p) => p.locked).length,
    blendedCashFlow,
  }
}
