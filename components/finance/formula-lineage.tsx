'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Info, TrendingUp } from 'lucide-react'
import type { MetricLineage, ModelLineage } from '@/lib/finance/types'

interface Props {
  lineage: ModelLineage
  currency?: string
}

const METRIC_ORDER = ['projectIrr', 'equityIrr', 'projectNpv', 'minimumDscr', 'paybackPeriod', 'totalRevenue']

const METRIC_COLORS: Record<string, string> = {
  projectIrr:    'text-[#002B49]',
  equityIrr:     'text-[#3944AC]',
  projectNpv:    'text-green-700',
  minimumDscr:   'text-amber-700',
  paybackPeriod: 'text-indigo-600',
  totalRevenue:  'text-teal-700',
}

const DRIVER_BAR_COLORS: Record<string, string> = {
  projectIrr:    'bg-[#002B49]',
  equityIrr:     'bg-[#3944AC]',
  projectNpv:    'bg-green-600',
  minimumDscr:   'bg-amber-500',
  paybackPeriod: 'bg-indigo-500',
  totalRevenue:  'bg-teal-600',
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

function formatLineageValue(v: number | null, unit: string): string {
  if (v == null) return '—'
  if (unit === '%' || unit.endsWith('%/yr')) return `${(v * 100).toFixed(2)}%`
  if (unit === 'x') return `${v.toFixed(2)}x`
  if (unit === 'years') return `${v.toFixed(1)} yr`
  if (unit === '%/yr') return `${(v * 100).toFixed(2)}%/yr`
  if (['USD','SAR','EUR','GBP'].includes(unit)) return compact.format(v)
  if (unit.includes('MWh') || unit.includes('MWp')) return v.toLocaleString('en', { maximumFractionDigits: 0 })
  return v.toLocaleString('en', { maximumFractionDigits: 4 })
}

function DriverBar({ metric, driver }: { metric: string; driver: { label: string; value: number; unit: string; contribution: number } }) {
  const barColor = DRIVER_BAR_COLORS[metric] ?? 'bg-[#002B49]'
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 shrink-0 text-xs text-muted-foreground truncate" title={driver.label}>{driver.label}</div>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} opacity-80 transition-all`}
          style={{ width: `${Math.max(2, Math.min(100, driver.contribution * 100))}%` }}
        />
      </div>
      <div className="w-16 shrink-0 text-right text-xs tabular-nums text-foreground">
        {formatLineageValue(driver.value, driver.unit)}
      </div>
    </div>
  )
}

function MetricCard({ metricKey, lineage }: { metricKey: string; lineage: MetricLineage }) {
  const [open, setOpen] = useState(false)
  const color = METRIC_COLORS[metricKey] ?? 'text-foreground'

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground truncate">{lineage.label}</span>
        </div>
        <span className={`text-sm font-bold tabular-nums ${color}`}>{lineage.formattedValue}</span>
      </button>

      {/* Drill-down body */}
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {/* Formula description */}
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {lineage.formulaDescription}
          </p>

          {/* Derivation steps */}
          {lineage.steps.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Derivation</p>
              <div className="space-y-1">
                {lineage.steps.map((step, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="text-muted-foreground">{step.label}</span>
                      {step.note && (
                        <span className="ml-1 text-[10px] text-muted-foreground/70">({step.note})</span>
                      )}
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">{step.formula}</div>
                    </div>
                    <span className={`shrink-0 tabular-nums font-medium ${i === lineage.steps.length - 1 ? color : 'text-foreground'}`}>
                      {formatLineageValue(step.value, step.unit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key drivers bar chart */}
          {lineage.keyDrivers.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Key Drivers</p>
              <div className="space-y-2">
                {lineage.keyDrivers.map((d, i) => (
                  <DriverBar key={i} metric={metricKey} driver={d} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function FormulaLineage({ lineage }: Props) {
  const keys = METRIC_ORDER.filter((k) => lineage[k])

  if (keys.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#002B49]" />
        <h3 className="text-sm font-semibold text-foreground">Formula Lineage</h3>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          click any metric to drill down
        </span>
      </div>
      <div className="space-y-1.5">
        {keys.map((k) => (
          <MetricCard key={k} metricKey={k} lineage={lineage[k]} />
        ))}
      </div>
    </div>
  )
}
