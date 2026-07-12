import { AppLayout } from '@/components/layout/app-layout'
import { ExecutiveIntelligence } from '@/components/ai/executive-intelligence'
import { portfolioKpis, portfolioRisks, execDecisions } from '@/lib/mock/gridmind'
import { ArrowLeft, Brain, LineChart } from 'lucide-react'
import Link from 'next/link'

export default function ExecutiveIntelligencePage() {
  const highUrgency = execDecisions.filter(d => d.urgency === 'high').length
  const criticalRisks = portfolioRisks.filter(r => r.probability * r.impact >= 15).length
  const marginKpi = portfolioKpis.find(k => k.id === 'margin')
  const spiKpi = portfolioKpis.find(k => k.id === 'spi')

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Breadcrumb + header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <nav className="flex items-center gap-1.5 mb-0.5">
              <Link href="/ai" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-3 h-3" /> AI Command Center
              </Link>
              <span className="text-xs text-border">/</span>
              <span className="text-xs font-semibold text-foreground">Executive Intelligence</span>
            </nav>
            <h1 className="text-xl font-bold text-foreground leading-tight">Executive Intelligence</h1>
            <p className="text-sm text-muted-foreground">Board and PMO-level portfolio view · Updated just now</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-accent text-amber-400 font-semibold self-start mt-1 flex-shrink-0 hidden sm:inline">
            Mock AI · Demo data
          </span>
        </div>

        {/* Context strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ContextStat
            label="Portfolio Margin"
            value={marginKpi?.value ?? '11.4%'}
            sub={marginKpi?.delta ?? '−0.8%'}
            subColor="text-red-400"
          />
          <ContextStat
            label="Weighted SPI"
            value={spiKpi?.value ?? '0.92'}
            sub="Schedule performance"
            subColor="text-amber-400"
          />
          <ContextStat
            label="Decisions Awaiting"
            value={String(execDecisions.length)}
            sub={`${highUrgency} high urgency`}
            subColor="text-red-400"
          />
          <ContextStat
            label="Critical Risks"
            value={String(criticalRisks)}
            sub="Score ≥ 15 on heatmap"
            subColor="text-muted-foreground"
          />
        </div>

        <ExecutiveIntelligence />
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
