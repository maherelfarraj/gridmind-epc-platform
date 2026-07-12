/**
 * export-xlsx.ts
 * Rich multi-sheet XLSX workbook for financial models.
 * Produces: Cover | Assumptions | Period Schedule | Metrics | EPC Cost Tracking | Validation
 */

import * as XLSX from 'xlsx'
import type { FinancialModelAssumptions, FinancialModelResult } from './types'

const pct = (v: number) => `${(v * 100).toFixed(2)}%`
const curr = (v: number, ccy: string) => `${ccy} ${v.toLocaleString('en', { maximumFractionDigits: 0 })}`
const x = (v: number | null) => (v == null ? '—' : `${v.toFixed(2)}x`)
const na = (v: unknown) => (v == null ? '—' : v)

export function exportModelXlsx(assumptions: FinancialModelAssumptions, result: FinancialModelResult) {
  const wb = XLSX.utils.book_new()
  const { currency: ccy } = assumptions
  const { metrics, periods, validations } = result

  // ── Sheet 1: Cover ────────────────────────────────────────────────────────
  const cover = [
    ['SmartFlow EPC Finance — Model Export'],
    [],
    ['Model name',      assumptions.name],
    ['Template',        assumptions.template === 'solar-ipp' ? 'Solar IPP' : 'EPC Contract'],
    ['Currency',        ccy],
    ['Engine version',  result.engineVersion],
    ['Calculated at',   result.calculatedAt],
    ['Periods',         periods.length],
    ['Periodicity',     assumptions.periodicity],
    [],
    ['── Summary metrics ───────────────────'],
    ['Project IRR',     metrics.projectIrr != null ? pct(metrics.projectIrr) : '—'],
    ['Equity IRR',      metrics.equityIrr  != null ? pct(metrics.equityIrr)  : '—'],
    ['Project NPV',     curr(metrics.projectNpv, ccy)],
    ['Min DSCR',        x(metrics.minimumDscr)],
    ['Avg DSCR',        x(metrics.averageDscr)],
    ['Payback (yrs)',   na(metrics.paybackPeriod)],
    ['Total CAPEX',     curr(metrics.totalCapex, ccy)],
    ['Debt amount',     curr(metrics.debtAmount, ccy)],
    ['Equity amount',   curr(metrics.equityAmount, ccy)],
    ...(assumptions.template === 'solar-ipp' ? [
      [],
      ['── Solar IPP advanced ────────────────'],
      ['Min LLCR',          x(metrics.minimumLlcr)],
      ['Min PLCR',          x(metrics.minimumPlcr)],
      ['DSRA peak',         curr(metrics.dsraPeak, ccy)],
      ['IDC capitalised',   curr(metrics.idcCapitalised, ccy)],
      ['Eff. tax rate',     pct(metrics.effectiveTaxRate)],
      ['Total tax paid',    curr(metrics.totalTaxPaid, ccy)],
      ['Total distribution',curr(metrics.totalDistribution, ccy)],
    ] : [
      [],
      ['── EPC contract advanced ─────────────'],
      ['Final contract value',   curr(metrics.finalContractValue, ccy)],
      ['Total certified',        curr(metrics.totalCertified, ccy)],
      ['Total invoiced',         curr(metrics.totalInvoiced, ccy)],
      ['Total paid',             curr(metrics.totalPaid, ccy)],
      ['Peak retention balance', curr(metrics.peakRetentionBalance, ccy)],
      ['Total retention released', curr(metrics.totalRetentionReleased, ccy)],
      ['Total advance drawn',    curr(metrics.totalAdvanceDrawn, ccy)],
      ['EAC',                    metrics.estimateAtCompletion != null ? curr(metrics.estimateAtCompletion, ccy) : '—'],
      ['CTC',                    metrics.costToComplete != null ? curr(metrics.costToComplete, ccy) : '—'],
      ['Margin at completion',   metrics.marginAtCompletion != null ? pct(metrics.marginAtCompletion) : '—'],
      ['Bond cost',              curr(metrics.bondCost, ccy)],
    ]),
    [],
    ['── Validation ────────────────────────'],
    ['Errors',    validations.filter(v => v.severity === 'error').length],
    ['Warnings',  validations.filter(v => v.severity === 'warning').length],
    ['Info',      validations.filter(v => v.severity === 'info').length],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cover), 'Cover')

  // ── Sheet 2: Assumptions ─────────────────────────────────────────────────
  const assumptionRows = Object.entries(assumptions).map(([key, value]) => ({
    Key: key,
    Value: typeof value === 'boolean' ? String(value) : value,
    Type: typeof value,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assumptionRows), 'Assumptions')

  // ── Sheet 3: Period Schedule (Solar IPP) ──────────────────────────────────
  if (assumptions.template === 'solar-ipp') {
    const rows = periods.map((p) => ({
      Period:              p.label,
      Year:                p.year,
      'Energy (MWh)':      na(p.energyMwh),
      [`Revenue (${ccy})`]:      p.revenue,
      [`Op. cost (${ccy})`]:     p.operatingCost,
      [`EBITDA (${ccy})`]:       p.ebitda,
      [`Depreciation (${ccy})`]: p.depreciation,
      [`EBIT (${ccy})`]:         p.ebit,
      [`Interest (${ccy})`]:     p.interest,
      [`Tax (${ccy})`]:          p.tax,
      [`Debt service (${ccy})`]: p.debtService,
      [`Ending debt (${ccy})`]:  p.endingDebt,
      [`Project CF (${ccy})`]:   p.projectCashFlow,
      [`Equity CF (${ccy})`]:    p.equityCashFlow,
      DSCR:                      na(p.dscr),
      LLCR:                      na(p.llcr),
      PLCR:                      na(p.plcr),
      [`DSRA balance (${ccy})`]: na(p.dsraBalance),
      [`Distribution (${ccy})`]: na(p.distribution),
      'Dist. locked':             p.distributionLocked ? 'YES' : 'no',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Period Schedule')
  }

  // ── Sheet 4: EPC Cost Tracking ────────────────────────────────────────────
  if (assumptions.template === 'epc') {
    const rows = periods.map((p) => ({
      Period:                    p.label,
      Year:                      p.year,
      [`Certified (${ccy})`]:    na(p.certified),
      [`Invoiced (${ccy})`]:     na(p.invoiced),
      [`Paid (${ccy})`]:         na(p.paid),
      [`Retention held (${ccy})`]: na(p.retentionHeld),
      [`Retention released (${ccy})`]: na(p.retentionReleased),
      [`Adv. outstanding (${ccy})`]: na(p.advanceOutstanding),
      [`Adv. recovered (${ccy})`]: na(p.advanceRecovered),
      [`Incurred (${ccy})`]:     na(p.incurred),
      [`Earned value (${ccy})`]: na(p.earnedValue),
      [`Planned value (${ccy})`]: na(p.plannedValue),
      'CPI':                     na(p.costPerformanceIndex),
      'SPI':                     na(p.schedulePerformanceIndex),
      [`CV (${ccy})`]:           na(p.costVariance),
      [`SV (${ccy})`]:           na(p.scheduleVariance),
      [`EAC (${ccy})`]:          na(p.estimateAtCompletion),
      [`CTC (${ccy})`]:          na(p.costToComplete),
      [`Gross profit (${ccy})`]: na(p.grossProfit),
      [`Working capital (${ccy})`]: na(p.workingCapitalBalance),
      [`Revenue (${ccy})`]:      p.revenue,
      [`Op. cost (${ccy})`]:     p.operatingCost,
      [`EBITDA (${ccy})`]:       p.ebitda,
      [`Tax (${ccy})`]:          p.tax,
      [`Debt service (${ccy})`]: p.debtService,
      [`Equity CF (${ccy})`]:    p.equityCashFlow,
      DSCR:                      na(p.dscr),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'EPC Cost Tracking')
  }

  // ── Sheet 5: Metrics ──────────────────────────────────────────────────────
  const metricRows = Object.entries(metrics).map(([key, value]) => ({
    Metric: key,
    Value:  value == null ? '—' : typeof value === 'number' ? Number(value.toFixed(6)) : value,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metricRows), 'Metrics')

  // ── Sheet 6: Validation ───────────────────────────────────────────────────
  const valRows = validations.length
    ? validations.map((v) => ({ Severity: v.severity, Code: v.code, Message: v.message }))
    : [{ Severity: 'info', Code: 'ALL_CHECKS_PASSED', Message: 'All deterministic validation checks passed.' }]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(valRows), 'Validation')

  // ── Write ─────────────────────────────────────────────────────────────────
  const slug = assumptions.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  XLSX.writeFile(wb, `${slug}-v${result.engineVersion}.xlsx`)
}

// CSV export for a single period schedule (lightweight, no library needed)
export function exportScheduleCsv(assumptions: FinancialModelAssumptions, result: FinancialModelResult) {
  const ccy = assumptions.currency
  const headers = assumptions.template === 'solar-ipp'
    ? ['Period', 'Year', `Revenue (${ccy})`, `Op. cost (${ccy})`, `EBITDA (${ccy})`, `Tax (${ccy})`, `Debt service (${ccy})`, `Equity CF (${ccy})`, 'DSCR', 'LLCR', 'PLCR']
    : ['Period', 'Year', `Certified (${ccy})`, `Invoiced (${ccy})`, `Paid (${ccy})`, 'CPI', 'SPI', `EAC (${ccy})`, `CTC (${ccy})`, `Gross profit (${ccy})`]

  const rows = result.periods.map((p) =>
    assumptions.template === 'solar-ipp'
      ? [p.label, p.year, p.revenue, p.operatingCost, p.ebitda, p.tax, p.debtService, p.equityCashFlow, p.dscr ?? '', p.llcr ?? '', p.plcr ?? '']
      : [p.label, p.year, p.certified ?? '', p.invoiced ?? '', p.paid ?? '', p.costPerformanceIndex ?? '', p.schedulePerformanceIndex ?? '', p.estimateAtCompletion ?? '', p.costToComplete ?? '', p.grossProfit ?? ''],
  )

  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${assumptions.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-schedule.csv`
  a.click()
  URL.revokeObjectURL(url)
}
