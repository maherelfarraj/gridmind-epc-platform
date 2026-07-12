'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { FinancialModelResult } from '@/lib/finance/types'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const fmt = (v: number, currency: string) => `${currency} ${compact.format(v)}`

interface WaterfallBar {
  label: string
  base: number   // invisible spacer
  value: number  // visible segment height (positive)
  raw: number    // signed value for tooltip
  color: string
}

function buildWaterfall(result: FinancialModelResult, currency: string): WaterfallBar[] {
  const { metrics, periods } = result

  const totalRevenue = metrics.totalRevenue
  const totalOpex = metrics.totalOperatingCost
  const ebitda = totalRevenue - totalOpex
  const totalTax = metrics.totalTaxPaid
  const totalDebtService = periods.reduce(
    (sum, p) => sum + (p.debtService ?? 0),
    0,
  )
  const dsraPeak = metrics.dsraPeak
  const mraPeak = metrics.mraPeak
  const totalDistribution = metrics.totalDistribution

  const steps: Array<{ label: string; amount: number }> = [
    { label: 'Revenue',       amount:  totalRevenue },
    { label: 'Opex',          amount: -totalOpex },
    { label: 'Tax',           amount: -totalTax },
    { label: 'Debt service',  amount: -totalDebtService },
    { label: 'DSRA funded',   amount: -dsraPeak },
    { label: 'MRA funded',    amount: -mraPeak },
    { label: 'Distribution',  amount:  totalDistribution },
  ]

  const bars: WaterfallBar[] = []
  let running = 0

  for (const step of steps) {
    const isPositive = step.amount >= 0
    const absValue = Math.abs(step.amount)
    const base = isPositive ? running : running + step.amount
    bars.push({
      label: step.label,
      base: Math.max(0, base),
      value: absValue,
      raw: step.amount,
      color: step.label === 'Distribution'
        ? '#002B49'
        : isPositive
          ? '#4A9B6F'
          : step.label === 'Opex'
            ? '#E57373'
            : '#FF8C00',
    })
    running += step.amount
  }

  return bars
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WaterfallTooltip({ active, payload, currency }: any) {
  if (!active || !payload?.length) return null
  const bar: WaterfallBar = payload[0]?.payload
  if (!bar) return null
  const sign = bar.raw >= 0 ? '+' : '−'
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-foreground">{bar.label}</p>
      <p className="mt-0.5 tabular-nums text-muted-foreground">
        {sign} {fmt(Math.abs(bar.raw), currency)}
      </p>
    </div>
  )
}

export function DistributionWaterfall({
  result,
  currency,
}: {
  result: FinancialModelResult
  currency: string
}) {
  const bars = useMemo(() => buildWaterfall(result, currency), [result, currency])

  if (result.assumptions.template === 'epc') return null

  const maxVal = Math.max(...bars.map((b) => b.base + b.value)) * 1.1

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">Cash Distribution Waterfall</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Cumulative cash flow allocation over the project life — from revenue to equity distributions.
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={bars} margin={{ top: 8, right: 16, left: 8, bottom: 4 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => compact.format(v)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            domain={[0, maxVal]}
          />
          <Tooltip content={<WaterfallTooltip currency={currency} />} />
          {/* Invisible spacer bar */}
          <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
          {/* Visible value bar */}
          <Bar dataKey="value" stackId="w" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {bars.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: number) => compact.format(v)}
              style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          { color: '#4A9B6F', label: 'Inflow' },
          { color: '#E57373', label: 'Operating cost' },
          { color: '#FF8C00', label: 'Outflow (tax / debt / reserves)' },
          { color: '#002B49', label: 'Distribution to equity' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
