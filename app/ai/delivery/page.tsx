'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { DeliveryIntelligence } from '@/components/ai/delivery-intelligence'
import { projects, gateReadiness } from '@/lib/mock/gridmind'
import { ArrowLeft, HardHat } from 'lucide-react'
import Link from 'next/link'

export default function DeliveryIntelligencePage() {
  const redCount   = gateReadiness.filter(g => g.status === 'red').length
  const atRiskCount = gateReadiness.filter(g => g.status === 'amber').length
  const blockers   = gateReadiness.reduce((s, g) => s + g.blockers, 0)
  const avgReady   = gateReadiness.length
    ? Math.round(gateReadiness.reduce((s, g) => s + g.readiness, 0) / gateReadiness.length)
    : 0

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
            <HardHat className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <nav className="flex items-center gap-1.5 mb-0.5">
              <Link href="/ai" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-3 h-3" /> AI Command Center
              </Link>
              <span className="text-xs text-border">/</span>
              <span className="text-xs font-semibold text-foreground">Delivery Intelligence</span>
            </nav>
            <h1 className="text-xl font-bold text-foreground leading-tight">Delivery Intelligence</h1>
            <p className="text-sm text-muted-foreground">Project execution, gate readiness and critical path · Updated just now</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-accent text-amber-400 font-semibold self-start mt-1 flex-shrink-0 hidden sm:inline">
            Mock AI · Demo data
          </span>
        </div>

        {/* Context strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ContextStat
            label="Active Projects"
            value={String(projects.length)}
            sub="Across 5 regions"
            subColor="text-muted-foreground"
          />
          <ContextStat
            label="Gates at Risk"
            value={String(redCount)}
            sub={`${atRiskCount} on watch`}
            subColor={redCount > 0 ? 'text-red-400' : 'text-emerald-400'}
          />
          <ContextStat
            label="Open Blockers"
            value={String(blockers)}
            sub="Across all gates"
            subColor={blockers > 5 ? 'text-red-400' : blockers > 2 ? 'text-amber-400' : 'text-emerald-400'}
          />
          <ContextStat
            label="Avg Gate Readiness"
            value={`${avgReady}%`}
            sub="Portfolio average"
            subColor={avgReady >= 70 ? 'text-emerald-400' : avgReady >= 50 ? 'text-amber-400' : 'text-red-400'}
          />
        </div>

        <DeliveryIntelligence />
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
