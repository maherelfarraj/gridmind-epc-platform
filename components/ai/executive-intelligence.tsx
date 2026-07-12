'use client'

import { AIResponsePanel } from '@/components/shared/ai-response-panel'
import { PromptCard } from '@/components/shared/prompt-card'
import { KPICard } from '@/components/shared/kpi-card'
import { cn } from '@/lib/utils'
import {
  type AIResponse,
  generateAIResponse,
  getPrompts,
} from '@/lib/ai/mock-ai'
import {
  execDecisions,
  healthBg,
  healthColor,
  healthLabel,
  portfolioKpis,
  portfolioRisks,
  projectMilestones,
} from '@/lib/mock/gridmind'
import { AlertCircle, Banknote, CalendarCheck, DollarSign, Gauge, ShieldAlert, TrendingUp } from 'lucide-react'
import { useState } from 'react'

const kpiIcon = [DollarSign, TrendingUp, Gauge, Gauge, Banknote, ShieldAlert]
const kpiAccent = ['navy', 'gold', 'indigo', 'red', 'green', 'navy'] as const

export function ExecutiveIntelligence() {
  const prompts = getPrompts('executive')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AIResponse | null>(null)

  const run = async (key: string) => {
    setActiveKey(key)
    setLoading(true)
    setResponse(null)
    const r = await generateAIResponse('executive', key)
    setResponse(r)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {portfolioKpis.map((kpi, i) => (
          <KPICard
            key={kpi.id}
            title={kpi.label}
            value={kpi.value}
            trend={{ value: Number.parseFloat(kpi.delta.replace(/[^0-9.-]/g, '')) || 0, label: 'vs last month' }}
            icon={kpiIcon[i]}
            accent={kpiAccent[i]}
          />
        ))}
      </div>

      {/* Portfolio Milestone Timeline */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Upcoming Gate Milestones</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">Next 35 days · sorted by proximity</span>
        </div>
        <div className="space-y-2.5">
          {projectMilestones.map((m) => {
            const barWidth = Math.max(4, Math.min(100, Math.round((1 - m.daysAway / 40) * 100)))
            return (
              <div key={m.projectId} className="flex items-center gap-3">
                <div className="w-32 sm:w-44 flex-shrink-0 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate leading-tight">{m.project}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.gateLabel}</p>
                </div>
                <div className="flex-1 relative">
                  <div className="h-5 rounded-md bg-muted overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{ width: `${barWidth}%`, backgroundColor: healthColor[m.status] + '55' }}
                    />
                    <div
                      className="absolute top-0 bottom-0 rounded-full w-1"
                      style={{ left: `${barWidth}%`, backgroundColor: healthColor[m.status] }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border', healthBg[m.status])}>
                    {m.gate}
                  </span>
                  <div className="text-right w-16">
                    <p className="text-xs font-bold text-foreground">{m.targetDate}</p>
                    <p className={cn('text-[10px] font-medium', m.status === 'red' ? 'text-red-400' : m.status === 'amber' ? 'text-amber-400' : 'text-emerald-400')}>
                      {m.daysAway}d away
                    </p>
                  </div>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-semibold hidden sm:inline', healthBg[m.status])}>
                    {healthLabel[m.status]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: prompts + risk heatmap + decisions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk heatmap */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Portfolio Risk Heatmap</h3>
              <span className="text-xs text-muted-foreground">{portfolioRisks.length} tracked risks</span>
            </div>
            <RiskHeatmap />
          </section>

          {/* Executive decisions */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Decisions Awaiting You</h3>
            <div className="space-y-3">
              {execDecisions.map((d) => (
                <div key={d.id} className="rounded-lg border border-border p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <AlertCircle
                        className={cn(
                          'w-4 h-4 flex-shrink-0 mt-0.5',
                          d.urgency === 'high' ? 'text-red-500' : d.urgency === 'medium' ? 'text-amber-400' : 'text-muted-foreground'
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">{d.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{d.context}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                          <span className="font-medium text-primary">{d.project}</span>
                          <span>Owner: {d.owner}</span>
                          <span className="font-medium">{d.due}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: AI prompt + response */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Ask GridMind — Executive</h3>
            <div className="space-y-2">
              {prompts.map((p) => (
                <PromptCard key={p.key} prompt={p.prompt} active={activeKey === p.key} disabled={loading} onClick={() => run(p.key)} />
              ))}
            </div>
          </div>
          <AIResponsePanel response={response} loading={loading} />
        </div>
      </div>
    </div>
  )
}

function RiskHeatmap() {
  // 5x5 grid: rows = impact (5 at top), cols = probability (1..5)
  const impacts = [5, 4, 3, 2, 1]
  const probs = [1, 2, 3, 4, 5]

  const cellColor = (p: number, i: number) => {
    const score = p * i
    if (score >= 15) return '#DC2626'
    if (score >= 8) return '#F59E0B'
    return '#5A8A6A'
  }

  const risksAt = (p: number, i: number) => portfolioRisks.filter((r) => r.probability === p && r.impact === i)

  return (
    <div className="flex gap-2">
      {/* Y axis label */}
      <div className="flex flex-col items-center justify-center">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider -rotate-90 whitespace-nowrap">Impact</span>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-5 gap-1.5">
          {impacts.map((i) =>
            probs.map((p) => {
              const cellRisks = risksAt(p, i)
              return (
                <div
                  key={`${p}-${i}`}
                  className="aspect-square rounded-md flex items-center justify-center relative group"
                  style={{ backgroundColor: `${cellColor(p, i)}22`, border: `1px solid ${cellColor(p, i)}55` }}
                >
                  {cellRisks.length > 0 && (
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ backgroundColor: cellColor(p, i) }}
                    >
                      {cellRisks.length}
                    </span>
                  )}
                  {cellRisks.length > 0 && (
                    <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 rounded-lg bg-secondary text-white text-[11px] p-2 shadow-lg">
                      {cellRisks.map((r) => (
                        <div key={r.id} className="leading-snug mb-1 last:mb-0">
                          <span className="font-semibold">{r.id}</span> — {r.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        {/* X axis */}
        <div className="text-center mt-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Probability →</span>
        </div>
      </div>
    </div>
  )
}
