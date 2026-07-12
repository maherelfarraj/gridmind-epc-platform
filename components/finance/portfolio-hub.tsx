'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { calculateFinancialModel } from '@/lib/finance/calculate'
import { referenceSolarIppTemplate, epcStarterTemplate } from '@/lib/finance/templates'
import type { FinancialModelAssumptions } from '@/lib/finance/types'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calculator,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { useWorkspace, type Project } from '@/lib/workspace-store'
import { ReferenceTemplateAdmin } from '@/components/finance/reference-template-admin'

// ─── Static model registry ───────────────────────────────────────────────────
// In production this comes from the financial_models Neon table.
// For now we seed the two canonical templates so the hub is always populated.
type ModelStatus = 'approved' | 'in_review' | 'draft' | 'rejected' | 'archived'

const MODEL_REGISTRY: Array<{
  id: string
  name: string
  template: 'Solar IPP' | 'EPC'
  currency: string
  version: number
  status: ModelStatus
  lastCalc: string
  projectId: string | null
  assumptions: FinancialModelAssumptions
}> = [
  {
    id: 'reference-solar-ipp',
    name: 'Reference 50 MWp Solar IPP',
    template: 'Solar IPP',
    currency: 'USD',
    version: 1,
    status: 'approved',
    lastCalc: 'Jul 11, 2026',
    projectId: null,
    assumptions: referenceSolarIppTemplate,
  },
  {
    id: 'utility-epc-base',
    name: 'Utility EPC Base Case',
    template: 'EPC',
    currency: 'SAR',
    version: 1,
    status: 'draft',
    lastCalc: 'Jul 11, 2026',
    projectId: 'NEOM-SOL-004',
    assumptions: epcStarterTemplate,
  },
]

const STATUS_CONFIG = {
  approved: { label: 'Approved',  bg: 'bg-green-50',       text: 'text-green-700',      border: 'border-green-200',      icon: BadgeCheck   },
  in_review:{ label: 'In Review', bg: 'bg-[#EEF0FB]',      text: 'text-[#3944AC]',      border: 'border-[#3944AC]/20',   icon: Clock        },
  draft:    { label: 'Draft',     bg: 'bg-muted',           text: 'text-muted-foreground',border: 'border-border',         icon: FileText     },
  rejected: { label: 'Rejected',  bg: 'bg-red-50',          text: 'text-red-700',         border: 'border-red-200',        icon: AlertTriangle},
  archived: { label: 'Archived',  bg: 'bg-muted',           text: 'text-muted-foreground',border: 'border-border',         icon: FileText     },
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (v: number | null) => v == null ? '—' : `${(v * 100).toFixed(1)}%`
const mult = (v: number | null) => v == null ? '—' : `${v.toFixed(2)}x`

interface Props {
  projects: Project[]
  onNewModel?: () => void
}

export function PortfolioHub({ projects, onNewModel }: Props) {
  const { settings } = useWorkspace()
  const ccy = settings.currency

  // Run engine once per model for live KPIs
  const liveModels = useMemo(() =>
    MODEL_REGISTRY.map((m) => {
      try {
        const result = calculateFinancialModel(m.assumptions)
        return { ...m, result }
      } catch {
        return { ...m, result: null }
      }
    }), [])

  // Portfolio aggregates — only approved models
  const approvedModels = liveModels.filter((m) => m.status === 'approved' && m.result)
  const totalCapex = approvedModels.reduce((s, m) => s + (m.result?.metrics.totalCapex ?? 0), 0)
  const totalNpv   = approvedModels.reduce((s, m) => s + (m.result?.metrics.projectNpv  ?? 0), 0)
  const avgEquityIrr = approvedModels.length
    ? approvedModels.reduce((s, m) => s + (m.result?.metrics.equityIrr ?? 0), 0) / approvedModels.length
    : null
  const pendingReview = liveModels.filter((m) => m.status === 'in_review').length
  const draftCount    = liveModels.filter((m) => m.status === 'draft').length
  const totalValidationErrors = approvedModels.reduce(
    (s, m) => s + (m.result?.validations.filter((v) => v.severity === 'error').length ?? 0), 0,
  )

  return (
    <section className="space-y-5">
      {/* ── Section header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-[#002B49]" />
          <h2 className="text-sm font-semibold text-foreground">Financial Models</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {liveModels.length} models
          </span>
          {pendingReview > 0 && (
            <span className="rounded-full bg-[#EEF0FB] px-2 py-0.5 text-[10px] font-semibold text-[#3944AC]">
              {pendingReview} pending review
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/finance/models/reference-solar-ipp"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Reference 50 MWp
          </Link>
          <button
            onClick={onNewModel}
            className="flex items-center gap-1.5 rounded-lg bg-[#002B49] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003a63] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New model
          </button>
        </div>
      </div>

      {/* ── Portfolio KPI strip (approved models only) ── */}
      {approvedModels.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: 'Total modelled CAPEX',
              value: `${ccy} ${compact.format(totalCapex)}`,
              sub: `${approvedModels.length} approved model${approvedModels.length > 1 ? 's' : ''}`,
              icon: TrendingUp,
              accent: '#002B49',
            },
            {
              label: 'Portfolio NPV',
              value: `${ccy} ${compact.format(totalNpv)}`,
              sub: 'At model discount rates',
              icon: BarChart3,
              accent: '#3944AC',
            },
            {
              label: 'Avg. equity IRR',
              value: pct(avgEquityIrr),
              sub: 'Approved models only',
              icon: TrendingUp,
              accent: '#16A34A',
            },
            {
              label: 'Validation health',
              value: totalValidationErrors === 0 ? 'Clean' : `${totalValidationErrors} error${totalValidationErrors > 1 ? 's' : ''}`,
              sub: `${draftCount} draft${draftCount !== 1 ? 's' : ''} pending`,
              icon: totalValidationErrors === 0 ? CheckCircle2 : AlertTriangle,
              accent: totalValidationErrors === 0 ? '#16A34A' : '#FF8C00',
            },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <k.icon className="h-4 w-4 flex-shrink-0" style={{ color: k.accent }} />
              </div>
              <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{k.value}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{k.sub}</p>
              <p className="mt-1.5 text-[10px] font-semibold" style={{ color: k.accent }}>Approved models only</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Model list ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-xs font-semibold text-foreground">Model registry</p>
          <p className="text-[10px] text-muted-foreground">Portfolio aggregates use approved versions only</p>
        </div>

        <div className="divide-y divide-border">
          {liveModels.map((m) => {
            const cfg = STATUS_CONFIG[m.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
            const StatusIcon = cfg.icon
            const linked = projects.find((p) => p.id === m.projectId)
            const errors = m.result?.validations.filter((v) => v.severity === 'error').length ?? 0
            const warns  = m.result?.validations.filter((v) => v.severity === 'warning').length ?? 0

            return (
              <Link
                key={m.id}
                href={`/finance/models/${m.id}`}
                className="flex flex-col gap-3 px-5 py-4 hover:bg-muted/40 transition-colors sm:flex-row sm:items-center"
              >
                {/* Template badge */}
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${
                    m.template === 'Solar IPP' ? 'border-[#C9A84C]/30 bg-[#FFF9EC] text-[#9A5300]' : 'border-[#3944AC]/20 bg-[#EEF0FB] text-[#3944AC]'
                  }`}>
                    {m.template}
                  </span>
                </div>

                {/* Name + project */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {linked ? `Linked: ${linked.name}` : 'Standalone model'}
                    {' · '}{m.currency} · v{m.version} · {m.lastCalc}
                  </p>
                </div>

                {/* Live KPIs */}
                {m.result && (
                  <div className="hidden lg:flex items-center gap-6 text-xs tabular-nums">
                    <span className="text-center">
                      <p className="font-semibold text-foreground">{pct(m.result.metrics.projectIrr)}</p>
                      <p className="text-muted-foreground">Proj. IRR</p>
                    </span>
                    <span className="text-center">
                      <p className="font-semibold text-foreground">{pct(m.result.metrics.equityIrr)}</p>
                      <p className="text-muted-foreground">Eq. IRR</p>
                    </span>
                    <span className="text-center">
                      <p className="font-semibold text-foreground">{mult(m.result.metrics.minimumDscr)}</p>
                      <p className="text-muted-foreground">Min DSCR</p>
                    </span>
                    <span className="text-center">
                      <p className={`font-semibold ${errors > 0 ? 'text-red-600' : warns > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                        {errors > 0 ? `${errors} err` : warns > 0 ? `${warns} warn` : 'Clean'}
                      </p>
                      <p className="text-muted-foreground">Findings</p>
                    </span>
                  </div>
                )}

                {/* Status badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Template governance — reference seed & reconciliation */}
        <ReferenceTemplateAdmin />

        {/* Empty state */}
        {liveModels.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Calculator className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No financial models yet</p>
            <button
              onClick={onNewModel}
              className="mt-1 rounded-lg bg-[#002B49] px-4 py-2 text-xs font-semibold text-white hover:bg-[#003a63] transition-colors"
            >
              Create first model
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
