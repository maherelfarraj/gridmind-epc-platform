'use client'

import { Fragment } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import { changeOrders, type ChangeOrder } from '@/lib/mock/gridmind'
import { useWorkspace } from '@/lib/workspace-store'
import {
  Brain,
  ChevronDown,
  ChevronUp,
  FileDiff,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type Filter = 'all' | 'variation' | 'claim'

const statusMap: Record<ChangeOrder['status'], 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected'> = {
  draft: 'draft',
  submitted: 'submitted',
  'under-review': 'under-review',
  approved: 'approved',
  rejected: 'rejected',
}

function formatM(m: number, currency = 'SAR'): string {
  const ccy = currency || 'SAR'
  const sign = m < 0 ? '-' : ''
  return `${sign}${ccy} ${Math.abs(m).toFixed(1)}M`
}

function EntitlementBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? '#5A8A6A' : pct >= 50 ? '#C9A55A' : '#8A5A5A'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function ChangesClaimsPage() {
  const { settings } = useWorkspace()
  const ccy = settings.currency
  const [filter, setFilter]       = useState<Filter>('all')
  const [expanded, setExpanded]   = useState<string | null>(null)

  const filtered = useMemo(
    () => (filter === 'all' ? changeOrders : changeOrders.filter((c) => c.type === filter)),
    [filter]
  )

  const variationTotal = changeOrders.filter((c) => c.type === 'variation').reduce((s, c) => s + c.valueSAR / 1_000_000, 0)
  const claimTotal     = changeOrders.filter((c) => c.type === 'claim').reduce((s, c) => s + c.valueSAR / 1_000_000, 0)
  const pending        = changeOrders.filter((c) => ['submitted', 'under-review', 'draft'].includes(c.status)).length
  const netExposure    = variationTotal + claimTotal

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <FileDiff className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Changes & Claims</h1>
            <p className="text-sm text-muted-foreground">Variation orders and claims registers with commercial exposure and AI entitlement assessment</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            title="Variations Value"
            value={formatM(variationTotal, ccy)}
            icon={FileDiff}
            accent="gold"
            subtitle={`${changeOrders.filter(c => c.type === 'variation').length} orders`}
          />
          <KPICard
            title="Claims Value"
            value={formatM(claimTotal, ccy)}
            icon={Scale}
            accent="indigo"
            subtitle={`${changeOrders.filter(c => c.type === 'claim').length} claims`}
          />
          <KPICard
            title="Net Exposure"
            value={formatM(netExposure, ccy)}
            icon={Wallet}
            accent={netExposure >= 0 ? 'navy' : 'orange'}
            subtitle="Variations + claims"
          />
          <KPICard
            title="Pending Items"
            value={String(pending)}
            icon={TrendingUp}
            accent="orange"
            subtitle="Awaiting settlement"
          />
        </div>

        {/* Claims exposure summary */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Commercial Exposure Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Entitlement strength breakdown */}
            <div className="rounded-lg border border-border/60 bg-secondary/10 p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Claims by Entitlement</p>
              {[
                { label: 'Strong (≥75%)',  count: changeOrders.filter(c => c.type === 'claim' && (c.entitlementPct ?? 0) >= 75).length, color: 'bg-emerald-600/70' },
                { label: 'Moderate (50–74%)', count: changeOrders.filter(c => c.type === 'claim' && (c.entitlementPct ?? 0) >= 50 && (c.entitlementPct ?? 0) < 75).length, color: 'bg-amber-500/70' },
                { label: 'Weak (<50%)',    count: changeOrders.filter(c => c.type === 'claim' && (c.entitlementPct ?? 0) > 0 && (c.entitlementPct ?? 0) < 50).length, color: 'bg-red-500/60' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2.5 h-2.5 rounded-sm', row.color)} />
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{row.count}</span>
                </div>
              ))}
            </div>

            {/* Status pipeline */}
            <div className="rounded-lg border border-border/60 bg-secondary/10 p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Pipeline Status</p>
              {((['draft', 'submitted', 'under-review', 'approved', 'rejected'] as const)).map((st) => {
                const count = changeOrders.filter(c => c.status === st).length
                const pct   = changeOrders.length ? Math.round((count / changeOrders.length) * 100) : 0
                const color = st === 'approved' ? 'bg-emerald-600/70' : st === 'rejected' ? 'bg-red-500/60' : st === 'under-review' ? 'bg-primary/60' : 'bg-muted-foreground/40'
                return (
                  <div key={st} className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground capitalize w-20 text-right">{st.replace('-', ' ')}</span>
                    <span className="text-[10px] font-bold text-foreground w-4 text-right">{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Project exposure ranking */}
            <div className="rounded-lg border border-border/60 bg-secondary/10 p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Exposure by Project</p>
              {Array.from(new Set(changeOrders.map(c => c.project))).map((proj) => {
                const orders = changeOrders.filter(c => c.project === proj)
                const total  = orders.reduce((s, c) => s + c.valueSAR / 1_000_000, 0)
                return (
                  <div key={proj} className="mb-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">{proj.replace(/^\S+\s/, '')}</p>
                      <span className={cn('text-[11px] font-bold', total < 0 ? 'text-red-400' : 'text-foreground')}>
                        {total < 0 ? '' : '+'}{formatM(total, ccy)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {(['all', 'variation', 'claim'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              )}
            >
              {f === 'all' ? 'All' : f === 'variation' ? 'Variations' : 'Claims'}
              <span className="ml-1.5 text-[10px] opacity-60">
                {f === 'all'
                  ? changeOrders.length
                  : changeOrders.filter(c => c.type === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Register */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/30 border-b border-border">
                  <th className="px-4 py-3 font-semibold">Ref</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold text-right">Value</th>
                  <th className="px-4 py-3 font-semibold text-right">Margin</th>
                  <th className="px-4 py-3 font-semibold text-right">Schedule</th>
                  <th className="px-4 py-3 font-semibold">Entitlement</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isOpen = expanded === c.id
                  return (
                    <Fragment key={c.id}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : c.id)}
                        className={cn(
                          'border-b border-border/60 last:border-0 cursor-pointer transition-colors',
                          isOpen ? 'bg-secondary/30' : 'hover:bg-muted/20'
                        )}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-primary font-bold">{c.id}</span>
                          <span className={cn(
                            'ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase',
                            c.type === 'claim'
                              ? 'bg-secondary/60 text-sky-400'
                              : 'bg-accent/60 text-amber-400'
                          )}>
                            {c.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground max-w-[240px] truncate">{c.title}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{c.project}</td>
                        <td className={cn(
                          'px-4 py-3 text-right font-semibold whitespace-nowrap',
                          c.valueSAR < 0 ? 'text-red-400' : 'text-foreground'
                        )}>
                          {formatM(c.valueSAR / 1_000_000, ccy)}
                        </td>
                        <td className={cn(
                          'px-4 py-3 text-right font-medium whitespace-nowrap text-xs',
                          c.marginImpact.startsWith('-') ? 'text-red-400' : 'text-emerald-400'
                        )}>
                          {c.marginImpact}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap text-xs">{c.scheduleImpact}</td>
                        <td className="px-4 py-3 min-w-[120px]">
                          {c.entitlementPct !== null ? (
                            <EntitlementBar pct={c.entitlementPct} />
                          ) : (
                            <span className="text-[11px] text-muted-foreground/50">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={statusMap[c.status]} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {isOpen
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </td>
                      </tr>

                      {/* Expanded AI narrative row */}
                      {isOpen && (
                        <tr className="bg-secondary/20 border-b border-border/60">
                          <td colSpan={9} className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Brain className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1">AI Entitlement Assessment</p>
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{c.aiNarrative}</p>
                                <p className="text-[10px] text-muted-foreground/50 mt-2">Submitted: {c.submitted}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AppLayout>
  )
}
