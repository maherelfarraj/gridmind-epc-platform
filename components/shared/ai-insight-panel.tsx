'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Brain, ChevronRight, Lightbulb, TrendingUp } from 'lucide-react'
import { useState } from 'react'

type InsightType = 'warning' | 'tip' | 'trend'

interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  action?: string
}

interface AIInsightPanelProps {
  insights: Insight[]
  className?: string
}

const insightConfig: Record<InsightType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  warning: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    label: 'Risk Alert',
  },
  tip: {
    icon: Lightbulb,
    color: 'text-[#C9A84C]',
    bg: 'bg-[#FFF8E1] border-[#C9A84C]/30',
    label: 'AI Suggestion',
  },
  trend: {
    icon: TrendingUp,
    color: 'text-[#3944AC]',
    bg: 'bg-[#EEF0FB] border-[#3944AC]/20',
    label: 'Trend Insight',
  },
}

export function AIInsightPanel({ insights, className }: AIInsightPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#3944AC] flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Insights</p>
          <p className="text-[10px] text-muted-foreground">GrindMindEPC Analysis</p>
        </div>
      </div>

      {insights.map((insight) => {
        const config = insightConfig[insight.type]
        const Icon = config.icon
        const isExpanded = expanded === insight.id

        return (
          <div
            key={insight.id}
            className={cn(
              'rounded-lg border p-3 cursor-pointer transition-all duration-200',
              config.bg,
              isExpanded ? 'shadow-sm' : 'hover:shadow-sm'
            )}
            onClick={() => setExpanded(isExpanded ? null : insight.id)}
          >
            <div className="flex items-start gap-2">
              <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', config.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider', config.color)}>
                    {config.label}
                  </span>
                  <ChevronRight
                    className={cn(
                      'w-3 h-3 transition-transform flex-shrink-0',
                      config.color,
                      isExpanded ? 'rotate-90' : ''
                    )}
                  />
                </div>
                <p className="text-xs font-medium text-foreground mt-0.5">{insight.title}</p>
                {isExpanded && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                    {insight.action && (
                      <button className={cn('text-xs font-medium underline underline-offset-2', config.color)}>
                        {insight.action}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Sample insights for reuse
export const sampleInsights: Insight[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Procurement delay risk detected',
    description: 'Based on current vendor lead times, 3 critical material deliveries may be delayed by 12–18 days, potentially impacting construction start for NEOM-Solar-04.',
    action: 'Review procurement schedule',
  },
  {
    id: '2',
    type: 'tip',
    title: 'Approval bottleneck identified',
    description: 'Stage 2 approvals are averaging 4.2 days above target. Consider delegating to Engineering Manager for drawings under 50 sheets.',
    action: 'Configure delegation rules',
  },
  {
    id: '3',
    type: 'trend',
    title: 'QA/QC pass rate improving',
    description: 'First-pass inspection rate improved from 67% to 84% over the last 30 days across all active construction sites.',
    action: 'View QA/QC report',
  },
]
