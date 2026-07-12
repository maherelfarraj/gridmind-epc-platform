'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { cn } from '@/lib/utils'
import {
  gateApprovers,
  gatePackChecklist,
  gateReadiness,
  healthBg,
  healthColor,
  healthLabel,
  stageGateDefinitions,
} from '@/lib/mock/gridmind'
import {
  Check,
  ChevronRight,
  CircleDashed,
  Clock,
  Download,
  GitBranch,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react'
import { useState } from 'react'

// Phase → accent color token (Tailwind + hex for SVG)
const phaseStyle: Record<string, { border: string; text: string; ring: string; hex: string }> = {
  'Pre-Contract':       { border: 'border-sky-800/40',     text: 'text-sky-400',     ring: 'ring-sky-700/30',     hex: '#38bdf8' },
  'Contract Setup':     { border: 'border-violet-800/40',  text: 'text-violet-400',  ring: 'ring-violet-700/30',  hex: '#a78bfa' },
  'Engineering':        { border: 'border-blue-800/40',    text: 'text-blue-400',    ring: 'ring-blue-700/30',    hex: '#60a5fa' },
  'Procurement':        { border: 'border-amber-800/40',   text: 'text-amber-400',   ring: 'ring-amber-700/30',   hex: '#fbbf24' },
  'Construction':       { border: 'border-orange-800/40',  text: 'text-orange-400',  ring: 'ring-orange-700/30',  hex: '#fb923c' },
  'Testing & Handover': { border: 'border-emerald-800/40', text: 'text-emerald-400', ring: 'ring-emerald-700/30', hex: '#34d399' },
}

const packStatusStyle: Record<string, { icon: React.ElementType; className: string }> = {
  complete:      { icon: Check,        className: 'text-emerald-400' },
  'in-progress': { icon: Loader2,      className: 'text-amber-400' },
  'not-started': { icon: CircleDashed, className: 'text-muted-foreground' },
}

export default function StageGatesPage() {
  const [selectedGate, setSelectedGate] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  // Local sign-offs keyed by "G{n}-{approverIndex}" so they persist across gate switches
  const [signedOff, setSignedOff] = useState<Set<string>>(new Set())

  function signApprover(gate: number, index: number) {
    setSignedOff(prev => new Set([...prev, `G${gate}-${index}`]))
  }

  function isSignedOff(gate: number, index: number): boolean {
    return signedOff.has(`G${gate}-${index}`)
  }

  const gateDef      = stageGateDefinitions[selectedGate]
  const style        = phaseStyle[gateDef.phase] ?? phaseStyle['Pre-Contract']
  const projectsAtGate = gateReadiness.filter((g) => g.gate === `G${selectedGate}`)
  const packItems    = gatePackChecklist[`G${selectedGate}`] ?? []
  const approvers    = gateApprovers[`G${selectedGate}`] ?? []
  const completeCount  = packItems.filter((i) => i.status === 'complete').length
  const pct = packItems.length ? Math.round((completeCount / packItems.length) * 100) : 0

  // SVG donut params
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  function handleGenerate() {
    setGenerating(true)
    setGenerated(false)
    setTimeout(() => { setGenerating(false); setGenerated(true) }, 2200)
  }

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
              <GitBranch className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">Stage Gates</h1>
              <p className="text-sm text-muted-foreground">G0–G8 governance across the EPC lifecycle</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-md bg-card border border-border font-mono">
              {gateReadiness.filter(g => g.status === 'red').length} critical
            </span>
            <span className="px-2 py-1 rounded-md bg-card border border-border font-mono">
              {gateReadiness.filter(g => g.status === 'amber').length} watch
            </span>
          </div>
        </div>

        {/* Gate stepper */}
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Gate Lifecycle</p>
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-0.5 min-w-max">
              {stageGateDefinitions.map((g, i) => {
                const s      = phaseStyle[g.phase] ?? phaseStyle['Pre-Contract']
                const isSel  = i === selectedGate
                return (
                  <div key={g.id} className="flex items-center">
                    <button
                      onClick={() => { setSelectedGate(i); setGenerated(false) }}
                      className={cn(
                        'group flex flex-col items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all',
                        isSel ? 'bg-secondary/50' : 'hover:bg-muted/60'
                      )}
                    >
                      <span className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border',
                        isSel
                          ? `bg-card ${s.border} ${s.text} ring-2 ${s.ring}`
                          : 'bg-secondary border-transparent text-muted-foreground group-hover:text-foreground'
                      )}>
                        {g.code}
                      </span>
                      <span className={cn(
                        'text-[10px] font-medium max-w-[68px] text-center leading-tight',
                        isSel ? s.text : 'text-muted-foreground'
                      )}>
                        {g.name}
                      </span>
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full border',
                        isSel ? `${s.border} ${s.text} bg-card` : 'border-transparent text-muted-foreground/50'
                      )}>
                        {g.phase}
                      </span>
                    </button>
                    {i < stageGateDefinitions.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-border/60 flex-shrink-0 mx-0.5" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Detail grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left col: gate info + projects */}
          <div className="lg:col-span-2 space-y-6">

            {/* Gate info card */}
            <section className={cn('rounded-xl border bg-card p-5', style.border)}>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn(
                  'w-10 h-10 rounded-lg border text-sm font-bold flex items-center justify-center flex-shrink-0',
                  style.border, style.text
                )}>
                  {gateDef.code}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">{gateDef.name}</h3>
                  <p className={cn('text-[10px] uppercase tracking-widest font-semibold', style.text)}>{gateDef.phase}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{gateDef.description}</p>
            </section>

            {/* Projects at this gate */}
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">
                Projects at <span className={style.text}>{gateDef.code}</span>
              </h3>
              {projectsAtGate.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <CircleDashed className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No projects are currently at this gate.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectsAtGate.map((g, i) => (
                    <div key={i} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-sm font-semibold text-foreground">{g.project}</p>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', healthBg[g.status])}>
                          {healthLabel[g.status]}
                        </span>
                      </div>
                      {/* Readiness bar */}
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${g.readiness}%`, backgroundColor: healthColor[g.status] }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          <span className="text-foreground font-semibold">{g.readiness}%</span> ready
                          {g.blockers > 0 && (
                            <span className="ml-2 text-red-400 font-medium">
                              · {g.blockers} blocker{g.blockers !== 1 ? 's' : ''}
                            </span>
                          )}
                        </span>
                        <span>Target <span className="text-foreground font-medium">{g.target}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          {/* Approver sign-off timeline */}
          {approvers.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5">
              {(() => {
                const signedCount = approvers.filter((a, i) =>
                  a.status === 'approved' || isSignedOff(selectedGate, i)
                ).length
                const signedPct = Math.round((signedCount / approvers.length) * 100)
                return (<>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      Approval Authority — <span className={style.text}>{gateDef.code}</span>
                    </h3>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {signedCount}/{approvers.length} signed
                    </span>
                  </div>
                  <div className="space-y-2">
                    {approvers.map((a, i) => {
                      const localSigned = isSignedOff(selectedGate, i)
                      const effectiveSigned = a.status === 'approved' || localSigned
                      const dotColor = effectiveSigned ? 'bg-emerald-500' : a.status === 'overdue' ? 'bg-red-500' : 'bg-amber-400'
                      const textColor = effectiveSigned ? 'text-emerald-400' : a.status === 'overdue' ? 'text-red-400' : 'text-amber-400'
                      return (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/10 px-3 py-2.5">
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColor)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{a.role}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!effectiveSigned && (
                              <button
                                onClick={() => signApprover(selectedGate, i)}
                                className="text-[10px] font-semibold px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                              >
                                Sign
                              </button>
                            )}
                            {!effectiveSigned && <Clock className="w-3 h-3 text-muted-foreground" />}
                            <span className={cn('text-[11px] font-semibold', textColor)}>
                              {effectiveSigned ? 'Approved' : a.dueIn}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Sign-off progress bar */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                      <span>Sign-off completion</span>
                      <span className="font-semibold text-foreground">{signedPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                        style={{ width: `${signedPct}%` }}
                      />
                    </div>
                  </div>
                </>)
              })()}
            </section>
          )}
          </div>

          {/* Right col: gate pack checklist */}
          <section className="rounded-xl border border-border bg-card p-5 h-fit">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-5">
              {/* Donut */}
              <div className="relative flex-shrink-0">
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/40" />
                  <circle
                    cx="28" cy="28" r={r} fill="none"
                    stroke={style.hex}
                    strokeWidth="4"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">{pct}%</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Gate Pack</p>
                <p className={cn('text-xs font-medium', style.text)}>{gateDef.code} — {gateDef.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{completeCount} of {packItems.length} items done</p>
              </div>
            </div>

            {/* Checklist */}
            {packItems.length === 0 ? (
              <div className="text-center py-6">
                <CircleDashed className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No gate pack configured.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-5">
                {packItems.map((item) => {
                  const { icon: Icon, className } = packStatusStyle[item.status]
                  return (
                    <div key={item.id} className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-secondary/20 p-3">
                      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', className, item.status === 'in-progress' && 'animate-spin')} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground leading-snug">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.owner}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Generate Gate Pack CTA */}
            <div className="border-t border-border pt-4 space-y-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
                  generating
                    ? 'bg-secondary text-muted-foreground cursor-wait'
                    : generated
                    ? 'bg-emerald-950/30 border border-emerald-800/40 text-emerald-400'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating pack…</>
                ) : generated ? (
                  <><Check className="w-4 h-4" /> Gate Pack Ready</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Gate Pack</>
                )}
              </button>
              {generated && (
                <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
