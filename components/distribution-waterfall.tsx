'use client'

import { ArrowDown, BadgeDollarSign, Banknote, CircleDollarSign, Lock, Wallet } from 'lucide-react'

type DistributionWaterfallProps = {
  result: any
  currency: string
}

const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function WaterfallCard({
  title,
  value,
  note,
  icon: Icon,
  tone = 'default',
}: {
  title: string
  value: string
  note: string
  icon: any
  tone?: 'default' | 'green' | 'orange' | 'red'
}) {
  const styles =
    tone === 'green'
      ? 'border-green-200 bg-green-50 text-green-800'
      : tone === 'orange'
        ? 'border-[#FF8C00]/30 bg-[#FFF3E0] text-[#9A5600]'
        : tone === 'red'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-border bg-card text-foreground'

  return (
    <div className={`rounded-xl border p-4 ${styles}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
            {title}
          </p>
          <p className="mt-2 text-xl font-bold tabular-nums">{value}</p>
          <p className="mt-1 text-xs opacity-75">{note}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 opacity-70" />
      </div>
    </div>
  )
}

export function DistributionWaterfall({ result, currency }: DistributionWaterfallProps) {
  const periods = result?.periods ?? []
  const metrics = result?.metrics ?? {}

  const totalRevenue =
    metrics.totalRevenue ??
    periods.reduce((sum: number, period: any) => sum + (period.revenue ?? 0), 0)

  const totalOperatingCost =
    metrics.totalOperatingCost ??
    periods.reduce((sum: number, period: any) => sum + (period.operatingCost ?? 0), 0)

  const totalDebtService =
    periods.reduce((sum: number, period: any) => sum + (period.debtService ?? 0), 0)

  const totalTax =
    metrics.totalTaxPaid ??
    periods.reduce((sum: number, period: any) => sum + (period.tax ?? 0), 0)

  const totalDistribution =
    periods.reduce((sum: number, period: any) => sum + (period.distribution ?? 0), 0)

  const lockedPeriods = periods.filter((period: any) => period.distributionLocked).length

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">
          Distribution waterfall
        </h3>
        <p className="text-xs text-muted-foreground">
          Summary of project cash generation, reserve constraints, debt service, and distributable cash.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <WaterfallCard
          title="Revenue"
          value={`${currency} ${compact.format(totalRevenue)}`}
          note="Total model revenue"
          icon={CircleDollarSign}
          tone="green"
        />

        <WaterfallCard
          title="Operating cost"
          value={`${currency} ${compact.format(totalOperatingCost)}`}
          note="Total operating cost"
          icon={Wallet}
          tone="orange"
        />

        <WaterfallCard
          title="Debt service"
          value={`${currency} ${compact.format(totalDebtService)}`}
          note="Principal and interest"
          icon={Banknote}
        />

        <WaterfallCard
          title="Tax"
          value={`${currency} ${compact.format(totalTax)}`}
          note="Total tax paid"
          icon={BadgeDollarSign}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4 text-[#FF8C00]" />
            <h4 className="text-sm font-semibold text-foreground">
              Available distribution
            </h4>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
            {currency} {compact.format(totalDistribution)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Total shareholder distribution after operating costs, debt service, tax, and reserve constraints.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#002B49]" />
            <h4 className="text-sm font-semibold text-foreground">
              Distribution lockups
            </h4>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
            {lockedPeriods}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Periods where distributions are restricted by model rules or covenant logic.
          </p>
        </div>
      </div>
    </section>
  )
}
