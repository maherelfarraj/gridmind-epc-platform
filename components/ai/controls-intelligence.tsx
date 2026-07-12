'use client'

import { AIResponsePanel } from '@/components/shared/ai-response-panel'
import { PromptCard } from '@/components/shared/prompt-card'
import { cn } from '@/lib/utils'
import { type AIResponse, generateAIResponse, getPrompts } from '@/lib/ai/mock-ai'
import { changeOrders, costForecasts, evmMetrics, healthBg, healthColor, healthLabel } from '@/lib/mock/gridmind'
import { useWorkspace } from '@/lib/workspace-store'
import { BarChart3 } from 'lucide-react'
import { useState } from 'react'

/** Format a monetary number for EVM display. Negative = overrun (−), positive = saving (+). */
function fmtM(n: number, currency = 'SAR'): string {
  const ccy = currency || 'SAR'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : n > 0 ? '+' : ''
  if (abs >= 1_000_000_000) return `${sign}${ccy} ${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000)     return `${sign}${ccy} ${Math.round(abs / 1_000_000)}M`
  return `${sign}${ccy} ${Math.round(abs / 1_000)}K`
}

export function ControlsIntelligence() {
  const { settings } = useWorkspace()
  const ccy = settings.currency
  const prompts = getPrompts('controls')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AIResponse | null>(null)

  const run = async (key: string) => {
    setActiveKey(key)
    setLoading(true)
    setResponse(null)
    const r = await generateAIResponse('controls', key)
    setResponse(r)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cost Forecast — BAC vs EAC comparison */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Portfolio Cost Forecast — BAC vs EAC</h3>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-secondary/80 inline-block" />BAC</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-primary/70 inline-block" />EAC</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-red-500/60 inline-block" />Overrun</span>
            </div>
            <div className="space-y-3">
              {costForecasts.map((f) => {
                const maxM = Math.max(...costForecasts.map(x => Math.max(x.bacM, x.eacM)))
                const bacPct = (f.bacM / maxM) * 100
                const eacPct = (f.eacM / maxM) * 100
                const isOverrun = f.vacM < 0
                return (
                  <div key={f.projectId}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground">{f.project}</p>
                      <span className={cn('text-xs font-bold', isOverrun ? 'text-red-400' : 'text-emerald-400')}>
                        VAC {isOverrun ? '' : '+'}{f.vacM > 0 ? '+' : ''}{f.vacM}M
                      </span>
                    </div>
                    <div className="relative h-4 rounded bg-muted overflow-hidden">
                      {/* BAC bar */}
                      <div className="absolute top-0 bottom-0 left-0 rounded bg-secondary/60" style={{ width: `${bacPct}%` }} />
                      {/* EAC bar — overlaid, narrower height */}
                      <div
                        className="absolute bottom-0 h-2 left-0 rounded"
                        style={{ width: `${eacPct}%`, backgroundColor: isOverrun ? 'rgba(220,38,38,0.55)' : 'rgba(74,127,165,0.6)' }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5 text-[10px] text-muted-foreground">
                      <span>BAC {ccy} {(f.bacM / 1000).toFixed(2)}B</span>
                      <span>EAC {ccy} {(f.eacM / 1000).toFixed(2)}B</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Portfolio total */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Portfolio Total</span>
              <div className="flex items-center gap-4">
                <span>BAC <span className="font-bold text-foreground">SAR {(costForecasts.reduce((s, f) => s + f.bacM, 0) / 1000).toFixed(2)}B</span></span>
                <span>EAC <span className="font-bold text-foreground">SAR {(costForecasts.reduce((s, f) => s + f.eacM, 0) / 1000).toFixed(2)}B</span></span>
                <span className="font-bold text-red-400">VAC {costForecasts.reduce((s, f) => s + f.vacM, 0) > 0 ? '+' : ''}{costForecasts.reduce((s, f) => s + f.vacM, 0)}M</span>
              </div>
            </div>
          </section>

          {/* EVM cards */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Earned Value — By Project</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evmMetrics.map((m) => (
                <div key={m.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-sm font-semibold text-foreground truncate">{m.project}</p>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0', healthBg[m.status])}>
                      {healthLabel[m.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <IndexCell label="CPI" value={m.cpi} />
                    <IndexCell label="SPI" value={m.spi} />
                  </div>
                  <dl className="mt-3 space-y-1 text-[11px]">
                    <Row k="BAC"           v={fmtM(m.bac,  ccy)} />
                    <Row k="Earned Value"  v={fmtM(m.ev,   ccy)} />
                    <Row k="Actual Cost"   v={fmtM(m.ac,   ccy)} />
                    <Row k="EAC (forecast)"v={fmtM(m.eac,  ccy)} />
                    <Row k="VAC"           v={fmtM(m.vac,  ccy)} highlight={m.vac < 0 ? 'red' : 'green'} />
                  </dl>
                </div>
              ))}
            </div>
          </section>

          {/* Commercial exposure */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Commercial Exposure — Changes & Claims</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="pb-2 font-semibold">Ref</th>
                    <th className="pb-2 font-semibold">Title</th>
                    <th className="pb-2 font-semibold text-right">Value</th>
                    <th className="pb-2 font-semibold text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {changeOrders.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 font-mono text-xs text-primary font-semibold">{c.id}</td>
                      <td className="py-2 pr-2">
                        <span className="text-foreground">{c.title}</span>
                        <span className={cn('ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase', c.type === 'claim' ? 'bg-accent text-primary' : 'bg-accent text-amber-400')}>
                          {c.type}
                        </span>
                      </td>
                      <td className="py-2 text-right font-semibold text-foreground whitespace-nowrap">{fmtM(c.valueSAR, ccy)}</td>
                      <td className={cn('py-2 text-right font-medium whitespace-nowrap', c.marginImpact.startsWith('-') ? 'text-red-500' : 'text-green-600')}>{c.marginImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right: AI */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Ask GridMind — Controls</h3>
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

function IndexCell({ label, value }: { label: string; value: number }) {
  const color = value >= 1 ? '#5A8A6A' : value >= 0.95 ? '#C9A55A' : '#8A5A5A'
  return (
    <div className="rounded-md bg-muted/50 p-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-lg font-bold leading-none mt-1" style={{ color }}>{value.toFixed(2)}</p>
    </div>
  )
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: 'red' | 'green' }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn('font-semibold', highlight === 'red' ? 'text-red-500' : highlight === 'green' ? 'text-green-600' : 'text-foreground')}>{v}</dd>
    </div>
  )
}
