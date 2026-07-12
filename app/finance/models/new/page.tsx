'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft, FileSpreadsheet, SunMedium, Zap } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type TemplateId = 'blank-epc' | 'blank-ipp' | 'ref-ipp' | 'ref-epc'

interface TemplateOption {
  id: TemplateId
  icon: React.ElementType
  label: string
  description: string
  tag: string
  tagColor: string
  href: string
  warning?: string
}

const templates: TemplateOption[] = [
  {
    id: 'blank-epc',
    icon: FileSpreadsheet,
    label: 'Blank EPC Model',
    description: 'All fields start at zero. Import your own assumptions from a PDF or Excel sheet after creating the model.',
    tag: 'Recommended',
    tagColor: 'bg-emerald-950/30 border-emerald-800/30 text-emerald-400',
    href: '/finance/models/new-epc',
  },
  {
    id: 'blank-ipp',
    icon: SunMedium,
    label: 'Blank Solar IPP Model',
    description: 'All fields start at zero. Import your project assumptions from a PDF or Excel sheet after creating the model.',
    tag: 'Recommended',
    tagColor: 'bg-emerald-950/30 border-emerald-800/30 text-emerald-400',
    href: '/finance/models/new-ipp',
  },
  {
    id: 'ref-epc',
    icon: Zap,
    label: 'EPC Base Case Reference',
    description: 'Pre-filled with reference assumptions for a utility-scale EPC contract. Use as a starting point and update all values for your project.',
    tag: 'Reference only',
    tagColor: 'bg-amber-950/30 border-amber-800/30 text-amber-400',
    href: '/finance/models/utility-epc-base',
    warning: 'These are illustrative reference numbers, not your project data. Replace all values before using.',
  },
  {
    id: 'ref-ipp',
    icon: SunMedium,
    label: 'Solar IPP Reference (50 MWp)',
    description: 'Pre-filled from a reviewed 50 MWp IPP study. Use as a benchmark and update with your own tariff, CAPEX, and O&M assumptions.',
    tag: 'Reference only',
    tagColor: 'bg-amber-950/30 border-amber-800/30 text-amber-400',
    href: '/finance/models/reference-solar-ipp',
    warning: 'These numbers come from a specific reviewed project. Do not present them as your own project assumptions.',
  },
]

export default function NewModelPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<TemplateId>('blank-epc')

  const chosen = templates.find(t => t.id === selected)!

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back + header */}
        <div className="flex items-center gap-3">
          <Link
            href="/finance"
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">New Financial Model</h1>
            <p className="text-sm text-muted-foreground">Choose a starting point for your model</p>
          </div>
        </div>

        {/* Template cards */}
        <div className="space-y-3">
          {templates.map(t => {
            const Icon = t.icon
            const isSelected = selected === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={cn(
                  'w-full text-left rounded-xl border p-4 transition-all flex items-start gap-4',
                  isSelected
                    ? 'border-primary/50 bg-secondary/60 ring-1 ring-primary/20'
                    : 'border-border bg-card hover:bg-muted/40'
                )}
              >
                {/* Selection indicator */}
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                )} />

                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  isSelected ? 'bg-primary/10' : 'bg-muted'
                )}>
                  <Icon className={cn('w-5 h-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-foreground">{t.label}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', t.tagColor)}>
                      {t.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                  {t.warning && isSelected && (
                    <p className="mt-2 text-[11px] text-amber-400 leading-relaxed bg-amber-950/20 border border-amber-800/20 rounded-lg px-3 py-2">
                      {t.warning}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Import callout — shown when blank template is selected */}
        {(selected === 'blank-epc' || selected === 'blank-ipp') && (
          <div className="bg-secondary/40 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <FileSpreadsheet className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">Import from PDF or Excel</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                After creating your blank model, use the <span className="font-medium text-foreground">Import</span> button in the model workspace to upload your project&apos;s financial spreadsheet or PDF. The AI will extract assumptions field-by-field — you review and approve each one before it enters the model.
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/finance"
            className="border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <Link
            href={chosen.href}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Create Model
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
