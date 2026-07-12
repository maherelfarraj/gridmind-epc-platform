'use client'

import { AIResponsePanel } from '@/components/shared/ai-response-panel'
import { PromptCard } from '@/components/shared/prompt-card'
import { cn } from '@/lib/utils'
import { type AIResponse, generateAIResponse, getPrompts } from '@/lib/ai/mock-ai'
import {
  disciplineMetrics,
  gateReadiness,
  healthBg,
  healthColor,
  healthLabel,
  missingDeliverables,
  projects,
} from '@/lib/mock/gridmind'
import { CalendarClock, FileWarning, Grid3x3, Layers } from 'lucide-react'
import { useState } from 'react'

const deliverableStatusStyle: Record<string, string> = {
  missing:   'bg-red-950/20 text-red-400 border-red-800/30',
  overdue:   'bg-red-950/20 text-red-400 border-red-800/40',
  'at-risk': 'bg-amber-950/20 text-amber-400 border-amber-800/30',
  submitted: 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30',
}

export function DeliveryIntelligence() {
  const prompts = getPrompts('delivery')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AIResponse | null>(null)

  const run = async (key: string) => {
    setActiveKey(key)
    setLoading(true)
    setResponse(null)
    const r = await generateAIResponse('delivery', key)
    setResponse(r)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project health */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Project Health</h3>
            </div>
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={p.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.client} · {p.phase}</p>
                    </div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0', healthBg[p.status])}>
                      {healthLabel[p.status]}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: healthColor[p.status] }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                    <span>{p.progress}% complete</span>
                    <span className="flex items-center gap-3">
                      <span>CPI <b className="text-foreground">{p.cpi.toFixed(2)}</b></span>
                      <span>SPI <b className="text-foreground">{p.spi.toFixed(2)}</b></span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Discipline Health Matrix */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Grid3x3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Deliverable Health by Discipline</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {disciplineMetrics.map((d) => {
                const total = d.overdue + d.atRisk + d.onTime
                const overdueW  = total ? (d.overdue / total) * 100 : 0
                const atRiskW   = total ? (d.atRisk  / total) * 100 : 0
                const onTimeW   = total ? (d.onTime  / total) * 100 : 0
                return (
                  <div key={d.discipline} className="rounded-lg border border-border/60 bg-secondary/10 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-foreground">{d.discipline}</p>
                      <div className="flex items-center gap-2 text-[10px]">
                        {d.overdue > 0 && <span className="text-red-400 font-bold">{d.overdue} overdue</span>}
                        {d.atRisk  > 0 && <span className="text-amber-400 font-bold">{d.atRisk} at-risk</span>}
                        {d.overdue === 0 && d.atRisk === 0 && <span className="text-emerald-400 font-bold">On track</span>}
                      </div>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                      {overdueW > 0 && <div className="rounded-l-full bg-red-500/70"  style={{ width: `${overdueW}%` }} />}
                      {atRiskW  > 0 && <div className="bg-amber-400/70"              style={{ width: `${atRiskW}%` }} />}
                      {onTimeW  > 0 && <div className="rounded-r-full bg-emerald-600/70" style={{ width: `${onTimeW}%` }} />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">{total} deliverables total</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Gate readiness */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Gate Readiness</h3>
            </div>
            <div className="space-y-3">
              {gateReadiness.map((g, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-secondary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {g.gate}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{g.project}</p>
                      <span className="text-xs font-semibold text-foreground flex-shrink-0">{g.readiness}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <div className="h-full rounded-full" style={{ width: `${g.readiness}%`, backgroundColor: healthColor[g.status] }} />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{g.blockers} blocker{g.blockers === 1 ? '' : 's'} · target {g.target}</span>
                      <span>{g.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Missing deliverables */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileWarning className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-foreground">Attention Needed</h3>
            </div>
            <div className="space-y-2">
              {missingDeliverables.map((d) => (
                <div key={d.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground leading-snug">{d.title}</p>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-semibold uppercase flex-shrink-0', deliverableStatusStyle[d.status])}>
                      {d.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="font-medium text-primary">{d.discipline}</span>
                    <span>·</span>
                    <span className="truncate">{d.project}</span>
                    <span>·</span>
                    <span>Due {d.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI prompts + response */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Ask GridMind — Delivery</h3>
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
