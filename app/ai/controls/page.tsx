'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { ControlsIntelligence } from '@/components/ai/controls-intelligence'
import { evmMetrics, changeOrders, costForecasts } from '@/lib/mock/gridmind'
import { ArrowLeft, Brain } from 'lucide-react'
import Link from 'next/link'

export default function ControlsIntelligencePage() {
  const portfolioCPI = evmMetrics.length
    ? (evmMetrics.reduce((s, m) => s + m.cpi, 0) / evmMetrics.length).toFixed(2)
    : '—'
  const portfolioSPI = evmMetrics.length
    ? (evmMetrics.reduce((s, m) => s + m.spi, 0) / evmMetrics.length).toFixed(2)
    : '—'
  const totalVAC = costForecasts.reduce((s, f) => s + f.vacM, 0)
  const pendingCOs = changeOrders.filter(c => ['draft', 'submitted', 'under-review'].includes(c.status)).length

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <nav className="flex items-center gap-1.5 mb-0.5">
              <Link href="/ai" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-3 h-3" /> AI Command Center
              </Link>
              <span className="text-xs text-border">/</span>
              <span className="text-xs font-semibold text-foreground">Controls Intelligence</span>
            </nav>
            <h1 className="text-xl font-bold text-foreground leading-tight">Controls Intelligence</h1>
            <p className="text-sm text-muted-foreground">Schedule, cost, EVM and commercial performance · Updated just now</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-accent text-amber-400 font-semibold self-start mt-1 flex-shrink-0 hidden sm:inline">
            Mock AI · Demo data
          </span>
        </div>

        {/* Context strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ContextStat
            label="Portfolio CPI"
            value={portfolioCPI}
            sub={Number(portfolioCPI) >= 1 ? 'Under budget' : 'Over budget'}
            subColor={Number(portfolioCPI) >= 1 ? 'text-emerald-400' : 'text-red-400'}
          />
          <ContextStat
            label="Portfolio SPI"
            value={portfolioSPI}
            sub={Number(portfolioSPI) >= 1 ? 'Ahead of schedule' : 'Behind schedule'}
            subColor={Number(portfolioSPI) >= 1 ? 'text-emerald-400' : 'text-amber-400'}
          />
          <ContextStat
            label="Portfolio VAC"
            value={`${totalVAC > 0 ? '+' : ''}${totalVAC}M`}
            sub="Variance at completion"
            subColor={totalVAC >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
          <ContextStat
            label="Pending CO/Claims"
            value={String(pendingCOs)}
            sub="Awaiting settlement"
            subColor={pendingCOs > 4 ? 'text-amber-400' : 'text-muted-foreground'}
          />
        </div>

        <ControlsIntelligence />
      </div>
    </AppLayout>
  )
}

function ContextStat({ label, value, sub, subColor }: { label: string; value: string; sub: string; subColor: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-0.5">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
      <p className={`text-[11px] font-medium ${subColor}`}>{sub}</p>
    </div>
  )
}
