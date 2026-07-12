'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { ActivityLog, sampleActivities } from '@/components/shared/activity-log'
import { AIInsightPanel, sampleInsights } from '@/components/shared/ai-insight-panel'
import { DocumentChecklist } from '@/components/shared/document-checklist'
import { KPICard } from '@/components/shared/kpi-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { WorkflowTimeline, EPC_PHASES, deriveStepStatuses } from '@/components/shared/workflow-timeline'
import { cn } from '@/lib/utils'
import { fmtProjectValue, useWorkspace } from '@/lib/workspace-store'
import { calculateFinancialModel } from '@/lib/finance/calculate'
import { epcStarterTemplate } from '@/lib/finance/templates'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  HardHat,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Sun,
  TrendingUp,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { use, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const documents = [
  { id: '1', name: 'RFP Package v2.1',              version: '2.1', status: 'approved' as const, uploadedBy: 'Ahmed',        date: 'Jan 10' },
  { id: '2', name: 'Contract Agreement — Final',    version: '3.0', status: 'approved' as const, uploadedBy: 'Legal Team',   date: 'Feb 5'  },
  { id: '3', name: 'Main BOQ — Revision 4',         version: '4',   status: 'approved' as const, uploadedBy: 'Eng. Dept',    date: 'Apr 12' },
  { id: '4', name: 'IFC Drawing Package',           version: '2',   status: 'pending'  as const, uploadedBy: 'Sara',         date: 'Jul 1'  },
  { id: '5', name: 'Vendor Quotations Comparison',  version: '1',   status: 'pending'  as const, uploadedBy: 'Procurement',  date: 'Jul 3'  },
  { id: '6', name: 'HSE Plan v1.0',                 version: '1',   status: 'missing'  as const },
  { id: '7', name: 'Subcontractor Agreement',       version: '—',   status: 'missing'  as const },
]

const milestones = [
  { name: 'Award (Step 6)',                  date: 'Jan 20, 2024', status: 'completed',   owner: 'Commercial Director',   step: 6  },
  { name: 'Contract Signed (Step 9)',        date: 'Feb 15, 2024', status: 'completed',   owner: 'Legal Reviewer',        step: 9  },
  { name: 'IFC Drawings Issued (Step 20)',   date: 'May 30, 2024', status: 'completed',   owner: 'Consultant Reviewer',   step: 20 },
  { name: 'Committee Approval (Step 23)',    date: 'Jul 9, 2024',  status: 'in-progress', owner: 'Procurement Committee', step: 23 },
  { name: 'Issue PO (Step 24)',              date: 'Jul 20, 2024', status: 'pending',     owner: 'Finance Manager',       step: 24 },
  { name: 'Start Construction (Step 32)',    date: 'Sep 15, 2024', status: 'pending',     owner: 'Construction Manager',  step: 32 },
  { name: 'Finish Construction (Step 36)',   date: 'Feb 28, 2025', status: 'pending',     owner: 'Construction Manager',  step: 36 },
  { name: 'PAC Certificate (Step 49)',       date: 'Apr 30, 2025', status: 'pending',     owner: 'Client Representative', step: 49 },
  { name: 'End / Closeout (Step 50)',        date: 'May 15, 2025', status: 'pending',     owner: 'Tenant Admin',          step: 50 },
]

// cashflowData is computed inside the component from project.valueSAR — not a static array.

const approvalHistory = [
  { role: 'Proposal Manager',    action: 'Approved', date: 'Jan 8, 2024',  comment: 'Scope is viable, proceed to costing.',           color: 'text-emerald-400'  },
  { role: 'Finance Manager',     action: 'Approved', date: 'Jan 14, 2024', comment: 'Budget confirmed within 10% contingency.',        color: 'text-emerald-400'  },
  { role: 'Commercial Director', action: 'Approved', date: 'Jan 18, 2024', comment: 'Margin is acceptable. Submit proposal.',          color: 'text-emerald-400'  },
  { role: 'Engineering Manager', action: 'Approved', date: 'Mar 12, 2024', comment: 'IFC drawings issued and reviewed.',               color: 'text-emerald-400'  },
  { role: 'Procurement Committee',action: 'Pending', date: '—',            comment: 'Awaiting committee session on Jul 15.',           color: 'text-amber-400'  },
]

const TABS = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'workflow',   label: 'Workflow'   },
  { id: 'documents',  label: 'Documents'  },
  { id: 'finance',    label: 'Finance'    },
  { id: 'approvals',  label: 'Approvals'  },
  { id: 'team',       label: 'Team'       },
  { id: 'comments',   label: 'Comments'   },
]

const teamMembers = [
  { name: 'Ahmed Al-Rashidi',  role: 'Project Manager',         discipline: 'Management',    email: 'a.rashidi@gsi.sa',    phone: '+966 50 111 2233', status: 'active',   availability: 80, initials: 'AA', color: '#4A7FA5' },
  { name: 'Dr. Khaled Hassan', role: 'Engineering Manager',     discipline: 'Electrical',    email: 'k.hassan@gsi.sa',     phone: '+966 55 234 5678', status: 'active',   availability: 65, initials: 'KH', color: '#C9A55A' },
  { name: 'Walid Al-Saud',     role: 'Procurement Manager',     discipline: 'Procurement',   email: 'w.saud@gsi.sa',       phone: '+966 54 987 6543', status: 'active',   availability: 90, initials: 'WS', color: '#C9A55A' },
  { name: 'Sara Al-Otaibi',    role: 'Document Controller',     discipline: 'Administration',email: 's.otaibi@gsi.sa',     phone: '+966 56 432 1098', status: 'active',   availability: 55, initials: 'SA', color: '#0D9488' },
  { name: 'Faisal Al-Dossary', role: 'Construction Manager',    discipline: 'Civil',         email: 'f.dossary@gsi.sa',    phone: '+966 50 876 5432', status: 'active',   availability: 95, initials: 'FD', color: '#8B6F3A' },
  { name: 'Nora Al-Hamdan',    role: 'HSE Officer',             discipline: 'HSE',           email: 'n.hamdan@gsi.sa',     phone: '+966 53 321 0987', status: 'active',   availability: 70, initials: 'NH', color: '#5A8A6A' },
  { name: 'Omar Al-Ghamdi',    role: 'QA/QC Inspector',         discipline: 'Quality',       email: 'o.ghamdi@gsi.sa',     phone: '+966 55 543 2109', status: 'active',   availability: 60, initials: 'OG', color: '#7C3AED' },
  { name: 'Rayan Al-Zahrani',  role: 'Finance Manager',         discipline: 'Finance',       email: 'r.zahrani@gsi.sa',    phone: '+966 54 654 3210', status: 'on-leave', availability: 0,  initials: 'RZ', color: '#64748B' },
  { name: 'Hassan Al-Mutairi', role: 'Site Engineer',           discipline: 'Mechanical',    email: 'h.mutairi@gsi.sa',    phone: '+966 50 765 4321', status: 'active',   availability: 85, initials: 'HM', color: '#EA580C' },
  { name: 'Tariq Al-Balawi',   role: 'SCADA / Commissioning Eng', discipline: 'Electrical', email: 't.balawi@gsi.sa',     phone: '+966 56 876 5432', status: 'active',   availability: 75, initials: 'TB', color: '#0891B2' },
]

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { getProject, addPaymentCertificate, settings } = useWorkspace()
  const [tab, setTab] = useState('overview')
  const [showAddCert, setShowAddCert] = useState(false)
  const [certForm, setCertForm] = useState<{ amountSAR: string; date: string; status: 'paid' | 'pending' | 'overdue'; method: string }>(
    { amountSAR: '', date: '', status: 'pending', method: '' }
  )

  const project = getProject(id)
  const projectWorkflowPhases = deriveStepStatuses(EPC_PHASES, project?.currentStep ?? 1)
  const linkedModel = calculateFinancialModel({ ...epcStarterTemplate, name: `${project?.name ?? 'Project'} Financial Model` })
  const linkedCurrency = linkedModel.assumptions.currency
  const linkedCompact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Project not found</h1>
          <p className="text-sm text-muted-foreground mt-1">No project matches the ID &quot;{id}&quot;.</p>
          <Link href="/projects" className="mt-5 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
      </AppLayout>
    )
  }

  // Cumulative cashflow — monthly billings ramp from 0 to project.progress% of valueSAR
  // Revenue lags cost in early months (front-loaded cost is typical EPC cash burn)
  const cashflowData = useMemo(() => {
    const totalM = project.valueSAR / 1_000_000
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const revPct  = [0.04, 0.07, 0.11, 0.16, 0.22, 0.28]
    const costPct = [0.05, 0.08, 0.13, 0.17, 0.21, 0.26]
    return months.map((month, i) => ({
      month,
      revenue: parseFloat((totalM * revPct[i]).toFixed(1)),
      cost:    parseFloat((totalM * costPct[i]).toFixed(1)),
    }))
  }, [project.valueSAR])

  const phaseProgressLabel = project.progress >= 80 ? 'Near completion' : project.progress >= 40 ? 'On schedule' : 'Early stage'

  return (
    <AppLayout>
      <div className="space-y-5 max-w-[1600px]">

        {/* Back link */}
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          All Projects
        </Link>

        {/* ── Header ── */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center flex-shrink-0">
                <Sun className="w-7 h-7 text-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
                  <StatusBadge status={project.status} />
                  {project.alert && (
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium bg-accent border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Schedule Risk
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1">{project.description || `${project.phaseName} — ${project.contractType ?? 'EPC'} Contract`}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {project.pm} (PM)</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {project.startDate} — {project.targetDate}</span>
                  <span className="font-mono text-foreground font-semibold">{project.id}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="border border-border text-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Edit Project
              </button>
              <button className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                Submit for Approval
              </button>
            </div>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          <KPICard title="Contract Value" value={fmtProjectValue(project.valueSAR, project.currency)} icon={DollarSign} accent="gold" />
          <KPICard title="Progress"       value={`${project.progress}%`}           subtitle={phaseProgressLabel}    icon={CheckCircle} accent="indigo" />
          <KPICard title="Phase"          value={`${project.phaseId} / 7`}         subtitle={project.phaseName.split(' ')[0]}  icon={HardHat}     accent="orange" />
          <KPICard title="Current Step"   value={`${project.currentStep} / 50`}    subtitle={project.activeStep.replace(/^Step \d+:\s*/, '')}    icon={Clock}       accent="red"    />
          <KPICard title="Documents"      value={project.documents.toString()}     subtitle={`${project.pendingApprovals} pending approvals`}    icon={FileText}    accent="navy"   />
        </div>

        {/* ── Tabs ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-shrink-0 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
                  tab === t.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ── */}
          {tab === 'overview' && (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Milestones + AI Insights */}
              <div className="lg:col-span-2 space-y-5">
                {/* Milestones */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-foreground" />
                      <h2 className="text-sm font-semibold text-foreground">Milestones</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">3 / 9 completed</span>
                  </div>
                  <div className="divide-y divide-border">
                    {milestones.map((m) => (
                      <div key={m.name} className="flex items-center gap-4 px-5 py-3">
                        <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0', {
                          'bg-emerald-950/30 text-emerald-400': m.status === 'completed',
                          'bg-accent text-amber-400': m.status === 'in-progress',
                          'bg-muted text-muted-foreground': m.status === 'pending',
                        })}>
                          <CheckCircle className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-medium', m.status === 'pending' ? 'text-muted-foreground' : 'text-foreground')}>
                            {m.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{m.owner}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">{m.date}</p>
                          <span className={cn('text-[10px] font-medium', {
                            'text-emerald-400': m.status === 'completed',
                            'text-amber-400': m.status === 'in-progress',
                            'text-muted-foreground': m.status === 'pending',
                          })}>
                            {m.status === 'in-progress' ? 'In Progress' : m.status === 'completed' ? 'Done' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity */}
                <div className="border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
                  </div>
                  <ActivityLog activities={sampleActivities} />
                </div>
              </div>

              {/* Right: Project Info + AI */}
              <div className="space-y-5">
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-secondary px-5 py-3">
                    <p className="text-foreground text-xs font-semibold">Project Information</p>
                  </div>
                  <div className="divide-y divide-border">
                    {[
                      { label: 'Client',           value: project.client                 },
                      { label: 'Contract Type',    value: project.contractType ?? 'EPC'  },
                      { label: 'Capacity',         value: project.capacity ?? '—'        },
                      { label: 'Location',         value: project.location ?? '—'        },
                      { label: 'Start Date',       value: project.startDate              },
                      { label: 'Target Date',      value: project.targetDate             },
                      { label: 'Project Manager',  value: project.pm                     },
                      { label: 'Current Phase',    value: `P${project.phaseId} · ${project.phaseName}` },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-medium text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-5">
                  <AIInsightPanel insights={sampleInsights} />
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Workflow ── */}
          {tab === 'workflow' && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">EPC Workflow — 7 Phases · 50 Steps</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Currently at {project.activeStep} ({project.phaseName})
                  </p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-1 rounded-lg">Phase {project.phaseId} of 7</span>
              </div>
              <WorkflowTimeline phases={projectWorkflowPhases} variant="phased" />
            </div>
          )}

          {/* ── Tab: Documents ── */}
          {tab === 'documents' && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Document Register</h2>
                </div>
                <button className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors font-medium">
                  <Paperclip className="w-3.5 h-3.5" />
                  Upload Document
                </button>
              </div>
              <DocumentChecklist documents={documents} />
              <div className="mt-4 bg-secondary/60 border border-primary/20 rounded-lg p-4">
                <p className="text-xs font-semibold text-primary mb-2">Required Documents — Current Phase (Procurement)</p>
                <ul className="grid grid-cols-2 gap-1.5">
                  {['Vendor List / RFQ Pack', 'Quotation Comparison Matrix', 'Committee Approval Minutes', 'Purchase Orders', 'Shipping Docs', 'Site Inspection Report'].map(d => (
                    <li key={d} className="flex items-center gap-1.5 text-xs text-primary">
                      <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── Tab: Finance ��─ */}
          {tab === 'finance' && (
            <div className="p-5 space-y-5">
              <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-emerald-950/20 px-2 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-800/30">APPROVED v1</span>
                    <p className="text-sm font-semibold text-foreground">EPC investment model summary</p>
                    {linkedModel.validations.filter(v => v.severity === 'error').length > 0 && (
                      <span className="rounded-full bg-red-950/20 px-2 py-1 text-[10px] font-semibold text-red-400 border border-red-800/30">
                        {linkedModel.validations.filter(v => v.severity === 'error').length} validation error{linkedModel.validations.filter(v => v.severity === 'error').length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Deterministic engine v{linkedModel.engineVersion} · Operational invoices below remain separate from model forecasts.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href="/finance?tab=models" className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                    Portfolio hub
                  </Link>
                  <Link href={`/finance/models/utility-epc-base`} className="inline-flex items-center justify-center rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors">
                    Open financial model
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Contract Value', value: `${linkedCurrency} ${linkedCompact.format(linkedModel.metrics.totalRevenue)}`, sub: 'Model life revenue' },
                  { label: 'Equity IRR', value: linkedModel.metrics.equityIrr === null ? '—' : `${(linkedModel.metrics.equityIrr * 100).toFixed(1)}%`, sub: 'Latest approved model' },
                  { label: 'Project NPV', value: `${linkedCurrency} ${linkedCompact.format(linkedModel.metrics.projectNpv)}`, sub: 'At model discount rate' },
                  { label: 'Minimum DSCR', value: linkedModel.metrics.minimumDscr === null ? '—' : `${linkedModel.metrics.minimumDscr.toFixed(2)}x`, sub: `${linkedModel.validations.length} validation findings` },
                ].map(k => (
                  <div key={k.label} className="border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Cashflow chart */}
              <div className="border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Cashflow — Revenue vs Cost (SAR M)</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cashflowData}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E2230" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1E2230" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cst" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A55A" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#C9A55A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `SAR ${v}M`} />
                    <Area type="monotone" dataKey="revenue" stroke="#4A7FA5" fill="url(#rev)" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="cost"    stroke="#8B6F3A" fill="url(#cst)" strokeWidth={2} name="Cost"    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Payments table — driven entirely from project.paymentCertificates in store */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/30 px-5 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">Payment Certificate Register</p>
                  <button
                    onClick={() => setShowAddCert(v => !v)}
                    className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Certificate
                  </button>
                </div>

                {/* Inline Add Certificate form */}
                {showAddCert && (
                  <div className="border-b border-border bg-accent/30 px-5 py-4">
                    <p className="text-xs font-semibold text-foreground mb-3">New Payment Certificate</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium block mb-1">Amount (SAR)</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="e.g. 124000000"
                          value={certForm.amountSAR}
                          onChange={e => setCertForm(f => ({ ...f, amountSAR: e.target.value }))}
                          className="w-full border border-border rounded-lg px-3 py-1.5 text-xs bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium block mb-1">Issue Date</label>
                        <input
                          type="date"
                          value={certForm.date}
                          onChange={e => setCertForm(f => ({ ...f, date: e.target.value }))}
                          className="w-full border border-border rounded-lg px-3 py-1.5 text-xs bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium block mb-1">Status</label>
                        <select
                          value={certForm.status}
                          onChange={e => setCertForm(f => ({ ...f, status: e.target.value as 'paid' | 'pending' | 'overdue' }))}
                          className="w-full border border-border rounded-lg px-3 py-1.5 text-xs bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/20"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-medium block mb-1">Payment Method</label>
                        <input
                          type="text"
                          placeholder="e.g. 30-day LC"
                          value={certForm.method}
                          onChange={e => setCertForm(f => ({ ...f, method: e.target.value }))}
                          className="w-full border border-border rounded-lg px-3 py-1.5 text-xs bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/20"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const amt = parseFloat(certForm.amountSAR)
                          if (!certForm.amountSAR || isNaN(amt) || amt <= 0 || !certForm.date) return
                          addPaymentCertificate(project.id, {
                            amountSAR: amt,
                            date: certForm.date,
                            status: certForm.status,
                            method: certForm.method || 'Bank Transfer',
                          })
                          setCertForm({ amountSAR: '', date: '', status: 'pending', method: '' })
                          setShowAddCert(false)
                        }}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowAddCert(false)}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-border">
                  {(project.paymentCertificates ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                      <DollarSign className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-xs font-medium text-muted-foreground">No payment certificates yet</p>
                      <p className="text-[11px] text-muted-foreground/60">Click &ldquo;Add Certificate&rdquo; above to record the first progress payment.</p>
                    </div>
                  ) : (
                    (project.paymentCertificates ?? []).map(p => {
                      const amtM = p.amountSAR / 1_000_000
                      const amtLabel = amtM >= 1000
                        ? `SAR ${(amtM / 1000).toFixed(2)}B`
                        : `SAR ${amtM.toFixed(0)}M`
                      return (
                        <div key={p.id} className="flex items-center gap-4 px-5 py-3 text-xs">
                          <span className="font-mono font-semibold text-foreground w-16 flex-shrink-0">{p.id}</span>
                          <span className="font-semibold text-foreground w-24 flex-shrink-0">{amtLabel}</span>
                          <span className="text-muted-foreground flex-1">{p.date}</span>
                          <span className="text-muted-foreground hidden sm:block">{p.method}</span>
                          <span className={cn('font-medium flex-shrink-0',
                            p.status === 'paid' ? 'text-emerald-400'
                            : p.status === 'overdue' ? 'text-red-400'
                            : 'text-amber-400'
                          )}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Approvals ── */}
          {tab === 'approvals' && (
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Approval History</h2>
              </div>
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                  {approvalHistory.map((h, i) => (
                    <div key={i} className="flex items-start gap-4 px-5 py-4">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold', {
                        'bg-emerald-950/30 text-emerald-400': h.action === 'Approved',
                        'bg-accent text-amber-400': h.action === 'Pending',
                        'bg-red-950/20 text-red-400': h.action === 'Rejected',
                      })}>
                        {h.action === 'Approved' ? '✓' : h.action === 'Pending' ? '⏳' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground">{h.role}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn('text-xs font-semibold', h.color)}>{h.action}</span>
                            <span className="text-[10px] text-muted-foreground">{h.date}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{h.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next required approvals */}
              <div className="bg-accent border border-amber-500/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-400 mb-2">Pending Approval Gates</p>
                <div className="space-y-2">
                  {[
                    { gate: 'Procurement Committee', step: 'Step 23: Committee Approval', due: 'Jul 15, 2024' },
                    { gate: 'Finance Manager',        step: 'Step 24: Issue PO',           due: 'Jul 20, 2024' },
                  ].map((g, i) => (
                    <div key={i} className="flex items-center justify-between text-xs gap-4">
                      <div>
                        <span className="font-semibold text-foreground">{g.gate}</span>
                        <span className="text-muted-foreground ml-2">— {g.step}</span>
                      </div>
                      <span className="text-amber-400 font-medium flex-shrink-0">{g.due}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Team ── */}
          {tab === 'team' && (
            <div className="p-5 space-y-5">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Project Team — {project.id}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{teamMembers.length} members · {teamMembers.filter(m => m.status === 'active').length} active · {teamMembers.filter(m => m.status === 'on-leave').length} on leave</p>
                </div>
                <button
                  onClick={() => {}}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  Add Member
                </button>
              </div>

              {/* Discipline summary pills */}
              <div className="flex flex-wrap gap-2">
                {['Management', 'Electrical', 'Civil', 'Procurement', 'HSE', 'Quality', 'Finance', 'Mechanical', 'Administration'].map(disc => {
                  const count = teamMembers.filter(m => m.discipline === disc).length
                  if (!count) return null
                  return (
                    <span key={disc} className="text-[10px] font-medium px-2.5 py-1 bg-muted border border-border rounded-full text-muted-foreground">
                      {disc} · {count}
                    </span>
                  )
                })}
              </div>

              {/* Team grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {teamMembers.map(member => (
                  <div
                    key={member.name}
                    className={cn(
                      'border border-border rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow',
                      member.status === 'on-leave' ? 'opacity-60' : ''
                    )}
                  >
                    {/* Avatar + name + status */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: member.color }}
                      >
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                          <span className={cn(
                            'text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                            member.status === 'active' ? 'bg-emerald-950/30 text-emerald-400' : 'bg-muted text-muted-foreground'
                          )}>
                            {member.status === 'active' ? 'ACTIVE' : 'ON LEAVE'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                      </div>
                    </div>

                    {/* Discipline badge */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded border"
                        style={{ color: member.color, background: `${member.color}12`, borderColor: `${member.color}30` }}
                      >
                        {member.discipline}
                      </span>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    </div>

                    {/* Workload bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Workload</span>
                        <span className={cn('text-[10px] font-semibold', {
                          'text-emerald-400': member.availability <= 70,
                          'text-amber-400': member.availability > 70 && member.availability <= 90,
                          'text-red-600': member.availability > 90,
                          'text-muted-foreground': member.status === 'on-leave',
                        })}>
                          {member.status === 'on-leave' ? '— on leave' : `${member.availability}%`}
                        </span>
                      </div>
                      <div className="bg-muted rounded-full h-1.5">
                        <div
                          className={cn('h-1.5 rounded-full transition-all', {
                            'bg-green-500': member.availability <= 70,
                            'bg-primary': member.availability > 70 && member.availability <= 90,
                            'bg-red-500': member.availability > 90,
                          })}
                          style={{ width: `${member.availability}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: Comments ── */}
          {tab === 'comments' && (
            <div className="p-5">
              <div className="space-y-4 max-w-2xl">
                {[
                  { user: 'Ahmed Al-Rashidi', initials: 'AA', color: '#4A7FA5', text: 'IFC drawings have been issued to the construction team. Awaiting final consultant review before procurement can close.', time: '2 hours ago' },
                  { user: 'Walid Al-Saud',    initials: 'WS', color: '#C9A55A', text: 'Vendor quotations received from 4 suppliers. Comparison matrix is being prepared — will share by EOD.', time: '5 hours ago' },
                  { user: 'Dr. Khaled Hassan',initials: 'KH', color: '#C9A55A', text: 'Main BOQ Revision 4 has been finalized and approved. No further changes expected at this stage.', time: 'Yesterday' },
                ].map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: c.color }}>
                      {c.initials}
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-foreground">{c.user}</p>
                        <p className="text-[10px] text-muted-foreground">{c.time}</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-3 border-t border-border">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">PM</div>
                  <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                    <input
                      className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
                      placeholder="Add a comment..."
                    />
                    <button className="text-amber-400 hover:text-[#e07d00] transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
