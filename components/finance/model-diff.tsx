'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, BadgeCheck, GitCompare } from 'lucide-react'
import { calculateFinancialModel } from '@/lib/finance/calculate'
import { referenceSolarIppTemplate, epcStarterTemplate } from '@/lib/finance/templates'
import type { FinancialModelAssumptions, FinancialModelResult } from '@/lib/finance/types'

// ─── Available comparison targets ────────────────────────────────────────────
const COMPARISON_MODELS: Array<{ id: string; label: string; assumptions: FinancialModelAssumptions }> = [
  { id: 'reference-solar-ipp-v1', label: 'Reference 50 MWp — Approved v1', assumptions: referenceSolarIppTemplate },
  { id: 'utility-epc-base-v1', label: 'Utility EPC — Draft v1',       assumptions: epcStarterTemplate },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (v: number | null) => v == null ? '—' : `${(v * 100).toFixed(2)}%`
const x   = (v: number | null) => v == null ? '—' : `${v.toFixed(2)}x`

function delta(a: number | null, b: number | null) {
  if (a == null || b == null) return null
  return b - a
}

function DeltaBadge({ d, isRate = false }: { d: number | null; isRate?: boolean }) {
  if (d == null) return <span className="text-muted-foreground text-[10px]">—</span>
  const pos = d >= 0
  const display = isRate
    ? `${pos ? '+' : ''}${(d * 100).toFixed(2)}pp`
    : `${pos ? '+' : ''}${compact.format(d)}`
  return (
    <span className={`text-[10px] font-semibold tabular-nums ${pos ? 'text-green-700' : 'text-red-600'}`}>
      {display}
    </span>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
interface Props {
  baseAssumptions: FinancialModelAssumptions
  baseResult: FinancialModelResult
  currency: string
}

export function ModelDiff({ baseAssumptions, baseResult, currency }: Props) {
  const [compareId, setCompareId] = useState<string>(COMPARISON_MODELS[0].id)
  const [showAssumptions, setShowAssumptions] = useState(false)

  const compareModel = COMPARISON_MODELS.find((m) => m.id === compareId)

  const compareResult = useMemo(() => {
    if (!compareModel) return null
    try { return calculateFinancialModel(compareModel.assumptions) } catch { return null }
  }, [compareModel])

  if (!compareResult || !compareModel) return null

  const bm = baseResult.metrics
  const cm = compareResult.metrics

  const metricRows: Array<[string, string, string, number | null, boolean]> = [
    ['Project IRR',    pct(bm.projectIrr),   pct(cm.projectIrr),   delta(bm.projectIrr, cm.projectIrr),   true ],
    ['Equity IRR',     pct(bm.equityIrr),    pct(cm.equityIrr),    delta(bm.equityIrr, cm.equityIrr),     true ],
    ['Project NPV',    compact.format(bm.projectNpv), compact.format(cm.projectNpv), delta(bm.projectNpv, cm.projectNpv), false],
    ['Min DSCR',       x(bm.minimumDscr),    x(cm.minimumDscr),    delta(bm.minimumDscr, cm.minimumDscr), false],
    ['Avg DSCR',       x(bm.averageDscr),    x(cm.averageDscr),    delta(bm.averageDscr, cm.averageDscr), false],
    ['EBITDA margin',  pct(bm.ebitdaMargin),  pct(cm.ebitdaMargin), delta(bm.ebitdaMargin, cm.ebitdaMargin), true],
    ['Total revenue',  compact.format(bm.totalRevenue), compact.format(cm.totalRevenue), delta(bm.totalRevenue, cm.totalRevenue), false],
    ['Total op. cost', compact.format(bm.totalOperatingCost), compact.format(cm.totalOperatingCost), delta(bm.totalOperatingCost, cm.totalOperatingCost), false],
    ['Total CAPEX',    compact.format(bm.totalCapex),    compact.format(cm.totalCapex),    delta(bm.totalCapex, cm.totalCapex),    false],
    ['Debt amount',    compact.format(bm.debtAmount),    compact.format(cm.debtAmount),    delta(bm.debtAmount, cm.debtAmount),    false],
  ]

  // Assumption diff
  const baseEntries = Object.entries(baseAssumptions) as [string, unknown][]
  const compareEntries = Object.fromEntries(Object.entries(compareModel.assumptions))
  const changedAssumptions = baseEntries
    .filter(([key, val]) => {
      const other = compareEntries[key]
      return typeof val === 'number' && typeof other === 'number' && Math.abs(val - other) > 1e-9
    })
    .map(([key, val]) => ({
      key,
      base: val as number,
      compare: compareEntries[key] as number,
      diff: (compareEntries[key] as number) - (val as number),
    }))

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Version comparison</h2>
        </div>
        <select
          value={compareId}
          onChange={(e) => setCompareId(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#3944AC]/30"
        >
          {COMPARISON_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Model name banner */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
        <div>
          <span className="rounded-full bg-[#EEF0FB] px-2 py-0.5 text-[9px] font-semibold text-[#3944AC]">BASE</span>
          <p className="mt-1 text-sm font-bold text-foreground">{baseAssumptions.name}</p>
          <p className="text-[10px] text-muted-foreground">Engine v{baseResult.engineVersion}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="text-right">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">COMPARE</span>
          <p className="mt-1 text-sm font-bold text-foreground">{compareModel.label}</p>
          <p className="text-[10px] text-muted-foreground">Engine v{compareResult.engineVersion}</p>
        </div>
      </div>

      {/* Metrics diff table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[580px] text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Metric</th>
              <th className="px-4 py-2.5 font-semibold text-[#3944AC]">Base</th>
              <th className="px-4 py-2.5 font-semibold">Compare</th>
              <th className="px-4 py-2.5 font-semibold">Delta</th>
            </tr>
          </thead>
          <tbody>
            {metricRows.map(([label, base, compare, d, isRate]) => (
              <tr key={label} className="border-b border-border/70">
                <td className="px-4 py-2.5 font-medium text-foreground">{label}</td>
                <td className="px-4 py-2.5 tabular-nums font-semibold text-[#3944AC]">{base}</td>
                <td className="px-4 py-2.5 tabular-nums">{compare}</td>
                <td className="px-4 py-2.5"><DeltaBadge d={d} isRate={isRate} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validation comparison strip */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Base', res: baseResult },
          { label: 'Compare', res: compareResult },
        ].map(({ label, res }) => {
          const errs = res.validations.filter(v => v.severity === 'error').length
          const warns = res.validations.filter(v => v.severity === 'warning').length
          return (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-foreground">{label} — validation</p>
                {errs === 0 && warns === 0
                  ? <BadgeCheck className="h-4 w-4 text-green-600" />
                  : <AlertTriangle className="h-4 w-4 text-amber-600" />}
              </div>
              <div className="flex gap-3 text-[10px]">
                <span className={`font-semibold ${errs > 0 ? 'text-red-600' : 'text-green-700'}`}>{errs} error{errs !== 1 ? 's' : ''}</span>
                <span className={`font-semibold ${warns > 0 ? 'text-amber-700' : 'text-muted-foreground'}`}>{warns} warning{warns !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Assumption diff table */}
      <div>
        <button
          onClick={() => setShowAssumptions((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          {showAssumptions ? 'Hide' : 'Show'} assumption deltas
          {changedAssumptions.length > 0 && (
            <span className="rounded-full bg-[#EEF0FB] px-1.5 py-0.5 text-[9px] font-semibold text-[#3944AC]">{changedAssumptions.length}</span>
          )}
        </button>
        {showAssumptions && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            {changedAssumptions.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">All numeric assumptions are identical between the two models.</p>
            ) : (
              <table className="w-full min-w-[500px] text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                    {['Assumption', 'Base', 'Compare', 'Absolute delta'].map(h => (
                      <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {changedAssumptions.map(({ key, base, compare, diff }) => (
                    <tr key={key} className="border-b border-border/70">
                      <td className="px-4 py-2.5 font-medium text-foreground">{key}</td>
                      <td className="px-4 py-2.5 tabular-nums text-[#3944AC] font-semibold">{base.toLocaleString('en', { maximumFractionDigits: 6 })}</td>
                      <td className="px-4 py-2.5 tabular-nums">{compare.toLocaleString('en', { maximumFractionDigits: 6 })}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-semibold tabular-nums ${diff >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {diff >= 0 ? '+' : ''}{diff.toLocaleString('en', { maximumFractionDigits: 6 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Deltas show compare minus base. Positive deltas are not always favourable — review in context.
      </p>
    </div>
  )
}
