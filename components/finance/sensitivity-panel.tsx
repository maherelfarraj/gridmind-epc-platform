'use client'

import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  SENSITIVITY_VARIABLES,
  runTornado,
  runSensitivityMatrix,
  runBreakEven,
  compareScenarios,
  type SensitivityOutputKey,
  type SensitivitySeries,
} from '@/lib/finance/sensitivity'
import type { FinancialModelAssumptions } from '@/lib/finance/types'

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
const pct = (v: number | null) => (v == null || !Number.isFinite(v) ? '—' : `${(v * 100).toFixed(2)}%`)
const mult = (v: number | null) => (v == null || !Number.isFinite(v) ? '—' : `${v.toFixed(2)}x`)
const yrs = (v: number | null) => (v == null || !Number.isFinite(v) ? '—' : `${v.toFixed(1)} yrs`)
const ccy = (v: number | null, c: string) => {
  if (v == null || !Number.isFinite(v)) return '—'
  return `${c} ${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(v)}`
}

function formatMetric(v: number | null, format: string, currency: string) {
  if (format === 'percent') return pct(v)
  if (format === 'multiple') return mult(v)
  if (format === 'years') return yrs(v)
  return ccy(v, currency)
}

function fmtBreakEvenDelta(unit: string, delta: number) {
  const sign = delta > 0 ? '+' : ''
  if (unit === '%') return `${sign}${delta.toFixed(1)}%`
  if (unit === 'years') return `${sign}${delta.toFixed(2)} yrs`
  return `${sign}${delta.toFixed(0)}bp`
}

// ---------------------------------------------------------------------------
// Output selector
// ---------------------------------------------------------------------------
const OUTPUT_OPTIONS: { key: SensitivityOutputKey; label: string }[] = [
  { key: 'projectIrr',        label: 'Project IRR' },
  { key: 'equityIrr',         label: 'Equity IRR' },
  { key: 'projectNpv',        label: 'Project NPV' },
  { key: 'minimumDscr',       label: 'Min DSCR' },
  { key: 'marginAtCompletion', label: 'Margin at Completion' },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

// Tornado chart
function TornadoChart({ series, outputKey, currency }: { series: SensitivitySeries[]; outputKey: SensitivityOutputKey; currency: string }) {
  const top = series.slice(0, 8)

  const data = top.map((s) => {
    const low = s.points.find((p) => p.step < 0 && Math.abs(p.step) === Math.max(...s.points.filter((x) => x.step < 0).map((x) => Math.abs(x.step))))
    const high = s.points.find((p) => p.step > 0 && Math.abs(p.step) === Math.max(...s.points.filter((x) => x.step > 0).map((x) => Math.abs(x.step))))
    return {
      label: s.variable.label,
      low: low ? low.delta : 0,
      high: high ? high.delta : 0,
    }
  }).sort((a, b) => Math.max(Math.abs(b.low), Math.abs(b.high)) - Math.max(Math.abs(a.low), Math.abs(a.high)))

  const fmt = (v: number) => {
    if (outputKey === 'projectIrr' || outputKey === 'equityIrr') return `${(v * 100).toFixed(1)}pp`
    if (outputKey === 'minimumDscr' || outputKey === 'marginAtCompletion') return v.toFixed(2)
    return ccy(v, currency)
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmt} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={110} />
        <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
        <ReferenceLine x={0} stroke="var(--border)" strokeWidth={1.5} />
        <Bar dataKey="low" fill="#EF4444" radius={[2, 2, 2, 2]} name="Downside" />
        <Bar dataKey="high" fill="#16A34A" radius={[2, 2, 2, 2]} name="Upside" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Sensitivity matrix heatmap
function MatrixHeatmap({
  assumptions, rowVarKey, colVarKey, outputKey, currency,
}: {
  assumptions: FinancialModelAssumptions
  rowVarKey: string
  colVarKey: string
  outputKey: SensitivityOutputKey
  currency: string
}) {
  const matrix = useMemo(
    () => runSensitivityMatrix(assumptions, rowVarKey, colVarKey, outputKey),
    [assumptions, rowVarKey, colVarKey, outputKey],
  )

  if (!matrix) return <p className="text-xs text-muted-foreground">Select two different variables.</p>

  const allValues = matrix.cells.map((c) => c.value)
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)

  function cellColor(v: number) {
    const ratio = maxVal === minVal ? 0.5 : (v - minVal) / (maxVal - minVal)
    if (ratio >= 0.65) return 'bg-green-100 text-green-900 font-semibold'
    if (ratio <= 0.35) return 'bg-red-100 text-red-900'
    return 'bg-amber-50 text-amber-900'
  }

  const fmt = (v: number) => {
    if (outputKey === 'projectIrr' || outputKey === 'equityIrr' || outputKey === 'marginAtCompletion') return `${(v * 100).toFixed(1)}%`
    if (outputKey === 'minimumDscr') return v.toFixed(2)
    return ccy(v, currency)
  }

  const stepLabel = (variable: typeof matrix.rowVar, step: number) =>
    variable.unit === '%' ? `${step > 0 ? '+' : ''}${step}%` : `${step > 0 ? '+' : ''}${step}bp`

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[460px] text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1.5 text-left text-muted-foreground">{matrix.rowVar.label} \ {matrix.colVar.label}</th>
            {matrix.colSteps.map((step) => (
              <th key={step} className="px-2 py-1.5 text-center font-semibold text-muted-foreground">{stepLabel(matrix.colVar, step)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rowSteps.map((rowStep, rowIndex) => (
            <tr key={rowStep} className="border-t border-border/60">
              <td className="px-2 py-1.5 font-semibold text-muted-foreground">{stepLabel(matrix.rowVar, rowStep)}</td>
              {matrix.colSteps.map((_colStep, colIndex) => {
                const cell = matrix.cells.find((c) => c.row === rowIndex && c.col === colIndex)
                const isBase = rowStep === 0 && _colStep === 0
                return (
                  <td key={colIndex} className={`px-2 py-1.5 text-center tabular-nums rounded ${cell ? cellColor(cell.value) : ''} ${isBase ? 'ring-1 ring-[#FF8C00]' : ''}`}>
                    {cell ? fmt(cell.value) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Break-even panel
function BreakEvenPanel({ assumptions, currency }: { assumptions: FinancialModelAssumptions; currency: string }) {
  const [varKey, setVarKey] = useState('tariffPerMwh')
  const [outputKey, setOutputKey] = useState<SensitivityOutputKey>('projectIrr')
  const [target, setTarget] = useState('0.10')

  const vars = SENSITIVITY_VARIABLES.filter((v) => v.applies === 'both' || v.applies === assumptions.template)

  const result = useMemo(() => {
    const t = parseFloat(target)
    if (!Number.isFinite(t)) return null
    // target entered as %; convert to decimal for IRR/margin, raw for DSCR/NPV
    const targetVal = (outputKey === 'projectIrr' || outputKey === 'equityIrr' || outputKey === 'marginAtCompletion') ? t / 100 : t
    return runBreakEven(assumptions, varKey, outputKey, targetVal)
  }, [assumptions, varKey, outputKey, target])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">Variable</span>
          <select value={varKey} onChange={(e) => setVarKey(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold">
            {vars.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">Output metric</span>
          <select value={outputKey} onChange={(e) => setOutputKey(e.target.value as SensitivityOutputKey)} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold">
            {OUTPUT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">Target value (IRR/margin in %)</span>
          <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold" step="0.5" />
        </label>
      </div>

      {result && (
        <div className={`rounded-xl border p-4 ${result.breakEvenDelta == null ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          {result.breakEvenDelta == null ? (
            <p className="text-sm font-semibold text-red-800">No break-even found within the search range. The output may not cross the target value under realistic stress levels.</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700">Break-even delta</p>
                <p className="text-2xl font-bold tabular-nums text-green-900">
                  {fmtBreakEvenDelta(result.variable.unit, result.breakEvenDelta)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700">Break-even absolute</p>
                <p className="text-2xl font-bold tabular-nums text-green-900">
                  {result.variable.format === 'currency' ? ccy(result.breakEvenAbsolute, currency) : result.variable.format === 'percent' ? pct(result.breakEvenAbsolute) : result.variable.format === 'years' ? `${result.breakEvenAbsolute?.toFixed(2)} yrs` : String(result.breakEvenAbsolute?.toFixed(2))}
                </p>
              </div>
              <div className="text-xs text-green-800">
                <p>A change of <strong>{fmtBreakEvenDelta(result.variable.unit, result.breakEvenDelta)}</strong> in <strong>{result.variable.label}</strong> causes <strong>{OUTPUT_OPTIONS.find((o) => o.key === outputKey)?.label}</strong> to cross the target of <strong>{target}{outputKey === 'minimumDscr' ? 'x' : '%'}</strong>.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Scenario comparison table
function ScenarioComparisonTable({ assumptions, currency }: { assumptions: FinancialModelAssumptions; currency: string }) {
  const [scenarios] = useState(() => {
    const downside = { ...(assumptions as unknown as Record<string, unknown>) }
    const upside = { ...(assumptions as unknown as Record<string, unknown>) }
    if (assumptions.template === 'solar-ipp') {
      downside.tariffPerMwh = (assumptions as { tariffPerMwh: number }).tariffPerMwh * 0.90
      downside.specificYieldMwhPerMwp = (assumptions as { specificYieldMwhPerMwp: number }).specificYieldMwhPerMwp * 0.95
      upside.tariffPerMwh = (assumptions as { tariffPerMwh: number }).tariffPerMwh * 1.10
      upside.specificYieldMwhPerMwp = (assumptions as { specificYieldMwhPerMwp: number }).specificYieldMwhPerMwp * 1.05
    } else {
      downside.grossMarginRate = (assumptions as { grossMarginRate: number }).grossMarginRate * 0.85
      upside.grossMarginRate = (assumptions as { grossMarginRate: number }).grossMarginRate * 1.10
    }
    return [
      { label: 'Downside', assumptions: downside as unknown as FinancialModelAssumptions },
      { label: 'Base', assumptions },
      { label: 'Upside', assumptions: upside as unknown as FinancialModelAssumptions },
    ]
  })

  const comparison = useMemo(() => compareScenarios(scenarios, currency), [scenarios, currency])

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[400px] text-xs">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-3 py-2 font-semibold">Metric</th>
            {comparison.scenarios.map((s, i) => (
              <th key={i} className={`px-3 py-2 font-semibold text-center ${s.label === 'Base' ? 'text-foreground' : ''}`}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.metrics.map((metric) => {
            const baseVal = metric.values[1]
            return (
              <tr key={metric.key} className="border-b border-border/60">
                <td className="px-3 py-2.5 text-muted-foreground">{metric.label}</td>
                {metric.values.map((v, i) => {
                  const isBase = i === 1
                  const diff = !isBase && baseVal != null && v != null ? v - baseVal : null
                  const worse = diff != null && (metric.key === 'projectIrr' || metric.key === 'equityIrr' || metric.key === 'projectNpv' || metric.key === 'minimumDscr' || metric.key === 'minimumLlcr' || metric.key === 'minimumPlcr') ? diff < 0 : diff != null ? diff > 0 : false
                  return (
                    <td key={i} className={`px-3 py-2.5 text-center tabular-nums ${isBase ? 'font-semibold text-foreground' : diff == null ? 'text-muted-foreground' : worse ? 'text-red-600' : 'text-green-700'}`}>
                      {formatMetric(v, metric.format, currency)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
type ActiveView = 'tornado' | 'matrix' | 'breakeven' | 'scenarios'

export function SensitivityPanel({ assumptions, currency }: { assumptions: FinancialModelAssumptions; currency: string }) {
  const [activeView, setActiveView] = useState<ActiveView>('tornado')
  const [outputKey, setOutputKey] = useState<SensitivityOutputKey>('projectIrr')
  const [rowVarKey, setRowVarKey] = useState('tariffPerMwh')
  const [colVarKey, setColVarKey] = useState('capex')

  const vars = SENSITIVITY_VARIABLES.filter((v) => v.applies === 'both' || v.applies === assumptions.template)
  const tornadoSeries = useMemo(() => runTornado(assumptions, outputKey), [assumptions, outputKey])

  const VIEWS: { id: ActiveView; label: string }[] = [
    { id: 'tornado', label: 'Tornado' },
    { id: 'matrix', label: 'Sensitivity matrix' },
    { id: 'breakeven', label: 'Break-even' },
    { id: 'scenarios', label: 'Scenario comparison' },
  ]

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Sub-nav */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {VIEWS.map((v) => (
          <button key={v.id} onClick={() => setActiveView(v.id)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${activeView === v.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Output selector (tornado + matrix share it) */}
      {(activeView === 'tornado' || activeView === 'matrix') && (
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Output metric</span>
          <div className="flex flex-wrap gap-1">
            {OUTPUT_OPTIONS.map((o) => (
              <button key={o.key} onClick={() => setOutputKey(o.key)} className={`rounded-full px-3 py-1 text-xs font-medium ${outputKey === o.key ? 'bg-[#002B49] text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tornado */}
      {activeView === 'tornado' && (
        <div>
          <SectionHeader title="Tornado chart" subtitle={`Impact on ${OUTPUT_OPTIONS.find((o) => o.key === outputKey)?.label} — top 8 variables ranked by sensitivity range`} />
          <TornadoChart series={tornadoSeries} outputKey={outputKey} currency={currency} />
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-3 py-2 font-semibold">Variable</th>
                  <th className="px-3 py-2 font-semibold">Base value</th>
                  <th className="px-3 py-2 font-semibold">Worst case</th>
                  <th className="px-3 py-2 font-semibold">Best case</th>
                  <th className="px-3 py-2 font-semibold">Range</th>
                </tr>
              </thead>
              <tbody>
                {tornadoSeries.slice(0, 8).map((s) => {
                  const worst = [...s.points].sort((a, b) => a.value - b.value)[0]
                  const best = [...s.points].sort((a, b) => b.value - a.value)[0]
                  return (
                    <tr key={s.variable.key} className="border-b border-border/60">
                      <td className="px-3 py-2 font-medium">{s.variable.label}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatMetric(s.baseValue, outputKey === 'projectIrr' || outputKey === 'equityIrr' || outputKey === 'marginAtCompletion' ? 'percent' : outputKey === 'minimumDscr' ? 'multiple' : 'currency', currency)}</td>
                      <td className="px-3 py-2 tabular-nums text-red-600">{formatMetric(worst.value, outputKey === 'projectIrr' || outputKey === 'equityIrr' || outputKey === 'marginAtCompletion' ? 'percent' : outputKey === 'minimumDscr' ? 'multiple' : 'currency', currency)}</td>
                      <td className="px-3 py-2 tabular-nums text-green-700">{formatMetric(best.value, outputKey === 'projectIrr' || outputKey === 'equityIrr' || outputKey === 'marginAtCompletion' ? 'percent' : outputKey === 'minimumDscr' ? 'multiple' : 'currency', currency)}</td>
                      <td className="px-3 py-2 tabular-nums font-semibold">{formatMetric(s.range, outputKey === 'projectIrr' || outputKey === 'equityIrr' || outputKey === 'marginAtCompletion' ? 'percent' : outputKey === 'minimumDscr' ? 'multiple' : 'currency', currency)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sensitivity matrix */}
      {activeView === 'matrix' && (
        <div>
          <SectionHeader title="Two-variable sensitivity matrix" subtitle="Each cell shows the output at the intersection of two variable stresses. Base case is highlighted." />
          <div className="mb-4 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Row variable</span>
              <select value={rowVarKey} onChange={(e) => setRowVarKey(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold">
                {vars.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Column variable</span>
              <select value={colVarKey} onChange={(e) => setColVarKey(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold">
                {vars.filter((v) => v.key !== rowVarKey).map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
              </select>
            </label>
          </div>
          <MatrixHeatmap assumptions={assumptions} rowVarKey={rowVarKey} colVarKey={colVarKey} outputKey={outputKey} currency={currency} />
        </div>
      )}

      {/* Break-even */}
      {activeView === 'breakeven' && (
        <div>
          <SectionHeader title="Break-even solver" subtitle="Binary-search for the exact variable level where the chosen output crosses a target value." />
          <BreakEvenPanel assumptions={assumptions} currency={currency} />
        </div>
      )}

      {/* Scenario comparison */}
      {activeView === 'scenarios' && (
        <div>
          <SectionHeader title="Scenario comparison" subtitle="Downside applies a −10% tariff and −5% yield (Solar IPP) or −15% margin (EPC). Upside applies the inverse." />
          <ScenarioComparisonTable assumptions={assumptions} currency={currency} />
        </div>
      )}
    </div>
  )
}
