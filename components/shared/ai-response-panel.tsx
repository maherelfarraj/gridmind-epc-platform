'use client'

import { cn } from '@/lib/utils'
import type { AIResponse } from '@/lib/ai/mock-ai'
import {
  ArrowUpRight,
  Brain,
  Check,
  Copy,
  Download,
  Loader2,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'

interface AIResponsePanelProps {
  response: AIResponse | null
  loading?: boolean
  className?: string
}

const toneIcon = {
  positive: { Icon: TrendingUp, color: 'text-emerald-400' },
  negative: { Icon: TrendingDown, color: 'text-red-400' },
  neutral:  { Icon: Minus,       color: 'text-muted-foreground' },
}

export function AIResponsePanel({ response, loading, className }: AIResponsePanelProps) {
  const [copied, setCopied] = useState(false)

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-primary/20 bg-accent/40 p-6', className)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">GridMind is analysing…</p>
            <p className="text-xs text-muted-foreground">Synthesising portfolio signals</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 rounded bg-primary/10 animate-pulse w-3/4" />
          <div className="h-3 rounded bg-primary/10 animate-pulse w-full" />
          <div className="h-3 rounded bg-primary/10 animate-pulse w-5/6" />
        </div>
      </div>
    )
  }

  if (!response) {
    return (
      <div className={cn('rounded-xl border border-dashed border-border bg-card p-6 text-center', className)}>
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">Select a prompt to generate insight</p>
        <p className="text-xs text-muted-foreground mt-1">GridMind will produce a structured analysis with recommendations.</p>
      </div>
    )
  }

  const copy = () => {
    const text = `${response.headline}\n\n${response.sections.map(s => `${s.heading}\n${s.body ?? ''}${(s.bullets ?? []).map(b => `\n- ${b.text}`).join('')}`).join('\n\n')}`
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const confidencePct = Math.round(response.confidence * 100)

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-start gap-3 p-5 border-b border-border bg-accent/30">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">GridMind AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-amber-400 font-semibold">Mock</span>
            <span className="text-[10px] text-muted-foreground">· {response.generatedAt}</span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-1 text-balance leading-snug">{response.headline}</p>
        </div>
      </div>

      {/* Confidence */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium">Confidence</span>
          <span className="font-semibold text-foreground">{confidencePct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', confidencePct >= 80 ? 'bg-emerald-500' : confidencePct >= 65 ? 'bg-primary' : 'bg-amber-500')}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="p-5 space-y-4">
        {response.sections.map((section, i) => (
          <div key={i}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5">{section.heading}</h4>
            {section.body && <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>}
            {section.bullets && (
              <ul className="mt-2 space-y-1.5">
                {section.bullets.map((b, j) => {
                  const { Icon, color } = toneIcon[b.tone ?? 'neutral']
                  return (
                    <li key={j} className="flex items-start gap-2">
                      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', color)} />
                      <span className="text-sm text-foreground leading-snug">{b.text}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {response.recommendations.length > 0 && (
        <div className="px-5 pb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Recommended Actions</h4>
          <div className="space-y-2">
            {response.recommendations.map((rec, i) => (
              <div key={i} className="rounded-lg border border-primary/20 bg-accent/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                  <span className="text-[10px] font-bold text-primary whitespace-nowrap">{Math.round(rec.confidence * 100)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.rationale}</p>
                <div className="flex items-center gap-1 mt-2 text-[11px] font-medium text-primary">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{rec.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: sources + actions */}
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground truncate">
          <span className="font-semibold">Sources:</span> {response.sources.join(' · ')}
        </p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={copy}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors">
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
