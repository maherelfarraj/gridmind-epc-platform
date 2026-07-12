'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { ActivityLog, sampleActivities } from '@/components/shared/activity-log'
import { AIInsightPanel, sampleInsights } from '@/components/shared/ai-insight-panel'
import { KPICard } from '@/components/shared/kpi-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { WorkflowTimeline, EPC_PHASES, deriveStepStatuses } from '@/components/shared/workflow-timeline'
import { fmtProjectValue, useWorkspace, type ActivityEntry } from '@/lib/workspace-store'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  FlaskConical,
  HardHat as HelmetIcon,
  Layers,
  MessageSquare,
  Package,
  PlusCircle,
  ShieldAlert,
  Sun,
  TrendingUp,
  Upload,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Monthly portfolio spend data at realistic EPC scale (SAR M)
const spendData = [
  { month: 'Jan', budget: 168, actual: 154 },
  { month: 'Feb', budget: 195, actual: 188 },
  { month: 'Mar', budget: 223, actual: 241 },
  { month: 'Apr', budget: 248, actual: 237 },
  { month: 'May', budget: 274, actual: 261 },
  { month: 'Jun', budget: 302, actual: 298 },
]


function formatPortfolioValue(totalM: number, currency = 'SAR'): string {
  const ccy = currency || 'SAR'
  if (totalM >= 1000) return `${ccy} ${(totalM / 1000).toFixed(2)}B`
  return `${ccy} ${Math.round(totalM).toLocaleString()}M`
}

const stageBreakdown = [
  { name: 'Pre-Contract',    value: 2, color: '#4A7FA5' },
  { name: 'Contract Setup',  value: 1, color: '#7EB8D9' },
  { name: 'Engineering',     value: 3, color: '#5A8A6A' },
  { name: 'Procurement',     value: 4, color: '#C9A55A' },
  { name: 'Construction',    value: 5, color: '#8B6F3A' },
  { name: 'Finance',         value: 2, color: '#7EC99A' },
  { name: 'T&C / Handover',  value: 1, color: '#8A5A8A' },
]

const toneMap = {
  success: { type: 'approval' as const, color: '#7EC99A' },
  danger:  { type: 'rejection' as const, color: '#E07070' },
  warning: { type: 'status' as const, color: '#C9A55A' },
  default: { type: 'comment' as const, color: '#7EB8D9' },
}

function mapActivity(a: ActivityEntry) {
  const { type, color } = toneMap[a.tone]
  const initials = a.actor.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return {
    id: `store-${a.id}`,
    type,
    user: a.actor,
    userInitials: initials,
    userColor: color,
    action: a.action,
    target: a.target,
    time: a.time,
    isNew: a.time === 'Just now',
  }
}

export default function DashboardPage() {
  const { projects, approvals, activity, simRuns, pendingApprovalCount, settings } = useWorkspace()
  const [stageFilter, setStageFilter] = useState<string>('all')

  const portfolioValue = useMemo(
    () => formatPortfolioValue(projects.reduce((s, p) => s + p.valueSAR / 1_000_000, 0), settings.currency),
    [projects, settings.currency],
  )
  const procurementSpendM = useMemo(
    () => Math.round(projects.reduce((s, p) => s + (p.valueSAR / 1_000_000) * 0.145, 0)),
    [projects],
  )
  const procurementDisplay = procurementSpendM >= 1000
    ? `SAR ${(procurementSpendM / 1000).toFixed(2)}B`
    : `SAR ${procurementSpendM}M`

  const stages = useMemo(() => ['all', ...Array.from(new Set(projects.map(p => p.stage)))], [projects])
  const visibleProjects = stageFilter === 'all' ? projects : projects.filter(p => p.stage === stageFilter)

  const neom = projects.find(p => p.name === 'NEOM Solar Farm')
  const neomWorkflowPhases = deriveStepStatuses(EPC_PHASES, neom?.currentStep ?? 23)

  const pendingApprovals = approvals.filter(a => a.status === 'pending' || a.status === 'under-review').slice(0, 5)
  const openDocs = 247

  const activities = useMemo(
    () => [...activity.map(mapActivity), ...sampleActivities].slice(0, 6),
    [activity],
  )

  const latestRun = simRuns[0]

  return (
    <AppLayout>
      <div className="space-y-5 max-w-[1600px]">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-1">
          <div>
            <p className="text-white/20 text-[9px] font-semibold uppercase tracking-[0.2em] mb-1">Portfolio Overview</p>
            <h1 className="text-xl font-bold text-white/90 tracking-tight">GSI Holding Company</h1>
            <p className="text-white/35 text-[11px] mt-1">
              EPC Portfolio &nbsp;·&nbsp; Q2 2024 &nbsp;·&nbsp; {projects.length} Active Projects
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 bg-[#5A8A6A]/12 text-[#7EC99A] border border-[#5A8A6A]/20 rounded px-3 py-1.5 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7EC99A] animate-pulse" />
              All Systems Operational
            </div>
            <Link
              href="/projects/new"
              className="bg-[#C9A55A] hover:bg-[#B8943A] text-[#0A0B0D] text-[11px] font-semibold px-4 py-1.5 rounded transition-colors"
            >
              + New Project
            </Link>
          </div>
        </div>

        {/* ── Alert strips ────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/15 rounded-lg px-4 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-red-400">At-Risk: </span>
              <span className="text-[11px] text-red-400/70">Jeddah Substation is 12 days behind on Construction Step 32 — milestone overdue.</span>
            </div>
            <Link href="/construction" className="text-[10px] font-semibold text-red-400 border border-red-500/25 px-2.5 py-1 rounded hover:bg-red-500/10 transition-colors flex-shrink-0">
              View
            </Link>
          </div>

          <div className="flex items-center gap-3 bg-[#C9A55A]/8 border border-[#C9A55A]/15 rounded-lg px-4 py-2.5">
            <Clock className="w-3.5 h-3.5 text-[#C9A55A] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-[#C9A55A]">{pendingApprovalCount} approval{pendingApprovalCount === 1 ? '' : 's'} require action — </span>
              <span className="text-[11px] text-[#C9A55A]/60">review the queue to keep the workflow moving.</span>
            </div>
            <Link href="/approvals" className="text-[10px] font-semibold text-[#C9A55A] border border-[#C9A55A]/25 px-2.5 py-1 rounded hover:bg-[#C9A55A]/10 transition-colors flex-shrink-0">
              Queue
            </Link>
          </div>

          {latestRun && (
            <div className={`flex items-center gap-3 border rounded-lg px-4 py-2.5 ${
              latestRun.errors > 0
                ? 'bg-red-500/8 border-red-500/15'
                : latestRun.warnings > 0
                ? 'bg-[#C9A55A]/8 border-[#C9A55A]/15'
                : 'bg-[#5A8A6A]/8 border-[#5A8A6A]/15'
            }`}>
              <FlaskConical className={`w-3.5 h-3.5 flex-shrink-0 ${latestRun.errors > 0 ? 'text-red-400' : latestRun.warnings > 0 ? 'text-[#C9A55A]' : 'text-[#7EC99A]'}`} />
              <div className="flex-1 min-w-0">
                <span className={`text-[11px] font-semibold ${latestRun.errors > 0 ? 'text-red-400' : latestRun.warnings > 0 ? 'text-[#C9A55A]' : 'text-[#7EC99A]'}`}>
                  Simulation ({latestRun.scenario}): {latestRun.outcome.toUpperCase()} —{' '}
                </span>
                <span className={`text-[11px] opacity-70 ${latestRun.errors > 0 ? 'text-red-400' : latestRun.warnings > 0 ? 'text-[#C9A55A]' : 'text-[#7EC99A]'}`}>
                  {latestRun.passed} passed · {latestRun.warnings} warning(s) · {latestRun.errors} error(s)
                </span>
              </div>
              <Link href="/simulator" className="text-[10px] font-semibold border px-2.5 py-1 rounded transition-colors flex-shrink-0 border-current opacity-60 hover:opacity-100">
                Open
              </Link>
            </div>
          )}
        </div>

        {/* ── Quick Actions ────────────────────────────────────── */}
        <div className="bg-[#131620] border border-white/[0.07] rounded-lg px-5 py-4 luxury-card">
          <p className="text-white/20 text-[9px] font-semibold uppercase tracking-[0.18em] mb-3">Quick Actions</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: 'Submit RFI',          icon: MessageSquare, href: '/engineering',  color: '#7EB8D9' },
              { label: 'Log NCR',             icon: ShieldAlert,   href: '/qaqc',         color: '#C9A55A' },
              { label: 'Upload Document',     icon: Upload,        href: '/documents',    color: '#E8E4DC' },
              { label: 'Request Approval',    icon: PlusCircle,    href: '/approvals',    color: '#C9A55A' },
              { label: 'New Variation Order', icon: Wrench,        href: '/construction', color: '#7EC99A' },
              { label: 'Log Toolbox Talk',    icon: HelmetIcon,    href: '/hse',          color: '#7EB8D9' },
            ].map(({ label, icon: Icon, href, color }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg border border-white/[0.06] hover:border-[#C9A55A]/25 hover:bg-[#C9A55A]/5 transition-all group"
              >
                <div className="w-8 h-8 rounded bg-card/[0.04] border border-white/[0.07] flex items-center justify-center group-hover:border-[#C9A55A]/25 transition-colors">
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-[10px] font-medium text-white/35 group-hover:text-white/65 text-center leading-tight transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── KPI Row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KPICard title="Active Projects"     value={String(projects.length)} subtitle="Across 7 stages"      icon={Layers}      accent="navy"   trend={{ value: 12, label: 'vs last Q' }} />
          <KPICard title="Portfolio Value"     value={portfolioValue}          subtitle="Under management"    icon={DollarSign}  accent="gold"   trend={{ value: 8,  label: 'vs last Q' }} />
          <KPICard title="Pending Approvals"   value={String(pendingApprovalCount)} subtitle="Requires action"  icon={Clock}       accent="orange" />
          <KPICard title="On-Time Delivery"    value="78%"                     subtitle="Milestone adherence" icon={CheckCircle} accent="indigo" trend={{ value: -4, label: 'vs last Q' }} />
          <KPICard title="Open Documents"      value={String(openDocs)}        subtitle="Awaiting sign-off"   icon={FileText}    accent="navy"   />
          <KPICard title="Procurement Spend"   value={procurementDisplay}      subtitle="YTD actual"          icon={Package}     accent="green"  trend={{ value: 5,  label: 'on budget' }} />
        </div>

        {/* ── EPC Workflow Timeline ────────────────────────────── */}
        <div className="bg-[#131620] border border-white/[0.07] rounded-lg p-5 luxury-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/20 text-[9px] font-semibold uppercase tracking-[0.18em] mb-1">Active Pipeline</p>
              <h2 className="text-[13px] font-semibold text-white/80">EPC Workflow — NEOM Solar Farm (400 MW)</h2>
              <p className="text-[10px] text-white/30 mt-0.5">
                7 phases &nbsp;·&nbsp; 50 steps &nbsp;·&nbsp; Step {neom?.currentStep ?? 23}: Committee Approval
              </p>
            </div>
            <Link href="/projects" className="text-[10px] text-[#C9A55A] hover:text-[#C9A55A]/70 font-medium transition-colors">
              View projects
            </Link>
          </div>
          <WorkflowTimeline phases={neomWorkflowPhases} variant="phased" />
        </div>

        {/* ── Main grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Projects table */}
          <div className="lg:col-span-2 bg-[#131620] border border-white/[0.07] rounded-lg overflow-hidden luxury-card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#C9A55A]" />
                <h2 className="text-[12px] font-semibold text-white/75">Active Projects</h2>
                <span className="text-[10px] text-white/25">({visibleProjects.length})</span>
              </div>
              <Link href="/projects" className="text-[10px] text-[#C9A55A] hover:text-[#C9A55A]/70 font-medium transition-colors">View all</Link>
            </div>

            {/* Stage filter chips */}
            <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-white/[0.05] flex-wrap">
              {stages.map(s => (
                <button
                  key={s}
                  onClick={() => setStageFilter(s)}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium capitalize transition-colors border ${
                    stageFilter === s
                      ? 'bg-[#C9A55A]/15 text-[#C9A55A] border-[#C9A55A]/30'
                      : 'bg-transparent text-white/30 border-white/[0.07] hover:border-white/20 hover:text-white/55'
                  }`}
                >
                  {s === 'all' ? 'All Stages' : s}
                </button>
              ))}
            </div>

            <div className="divide-y divide-white/[0.05]">
              {visibleProjects.map(p => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-card/[0.025] transition-colors"
                >
                  <div className="w-7 h-7 rounded bg-[#C9A55A]/8 border border-[#C9A55A]/15 flex items-center justify-center flex-shrink-0">
                    <Sun className="w-3.5 h-3.5 text-[#C9A55A]/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-medium text-white/75 truncate">{p.name}</p>
                      {p.alert && <AlertTriangle className="w-3 h-3 text-[#C9A55A] flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-white/30">{p.stage}</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="flex-1 bg-card/[0.06] rounded-full h-[3px] max-w-[100px]">
                          <div className="h-[3px] rounded-full bg-[#C9A55A]/60" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-[9px] text-white/25">{p.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-semibold text-white/60 mb-1">{fmtProjectValue(p.valueSAR, p.currency)}</p>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                </Link>
              ))}
              {visibleProjects.length === 0 && (
                <p className="px-5 py-8 text-center text-[11px] text-white/25">No projects in this stage.</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Stage breakdown */}
            <div className="bg-[#131620] border border-white/[0.07] rounded-lg p-5 luxury-card">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-[#C9A55A]" />
                <h2 className="text-[12px] font-semibold text-white/75">Projects by Stage</h2>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={stageBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stageBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [`${v} projects`, n]}
                    contentStyle={{ fontSize: 10, borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: '#131620', color: '#E8E4DC' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {stageBreakdown.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-[9px] text-white/30 truncate">{s.name}</span>
                    <span className="text-[9px] font-semibold text-white/55 ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom row ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Spend chart */}
          <div className="lg:col-span-2 bg-[#131620] border border-white/[0.07] rounded-lg p-5 luxury-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#C9A55A]" />
                <h2 className="text-[12px] font-semibold text-white/75">Monthly Portfolio Spend vs Budget (SAR M)</h2>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-white/35">
                <span className="flex items-center gap-1.5"><span className="w-3 h-[2px] bg-[#4A7FA5] inline-block" /> Budget</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-[2px] bg-[#C9A55A] inline-block" /> Actual</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={spendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 10, borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: '#131620', color: '#E8E4DC' }}
                  formatter={v => [`SAR ${v}M`]}
                />
                <Line type="monotone" dataKey="budget" stroke="#4A7FA5" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#C9A55A" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pending approvals */}
          <div className="bg-[#131620] border border-white/[0.07] rounded-lg overflow-hidden luxury-card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C9A55A]" />
                <h2 className="text-[12px] font-semibold text-white/75">Pending Approvals</h2>
                <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-red-500/25">{pendingApprovals.length}</span>
              </div>
              <Link href="/approvals" className="text-[10px] text-[#C9A55A] hover:text-[#C9A55A]/70 font-medium transition-colors">View all</Link>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {pendingApprovals.length === 0 ? (
                <p className="px-4 py-8 text-center text-[11px] text-white/25">No pending approvals.</p>
              ) : (
                pendingApprovals.map(a => (
                  <Link key={a.id} href="/approvals" className="block px-4 py-3 hover:bg-card/[0.025] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-medium text-white/65 leading-snug flex-1">{a.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 border ${
                        a.priority === 'high'   ? 'bg-red-500/12 text-red-400 border-red-500/20'   :
                        a.priority === 'medium' ? 'bg-[#C9A55A]/12 text-[#C9A55A] border-[#C9A55A]/20' :
                                                  'bg-[#5A8A6A]/12 text-[#7EC99A] border-[#5A8A6A]/20'
                      }`}>
                        {a.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] bg-[#4A7FA5]/12 text-[#7EB8D9] px-1.5 py-0.5 rounded-sm border border-[#4A7FA5]/20 font-medium">{a.type}</span>
                      <span className="text-[9px] text-white/25">Due: {a.due}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <div className="px-4 py-3 border-t border-white/[0.05]">
              <Link href="/approvals" className="w-full flex items-center justify-center bg-[#C9A55A] hover:bg-[#B8943A] text-[#0A0B0D] text-[11px] font-semibold py-2 rounded transition-colors">
                Review All Approvals
              </Link>
            </div>
          </div>
        </div>

        {/* ── Activity & AI insights ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-[#131620] border border-white/[0.07] rounded-lg p-5 luxury-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-3.5 h-3.5 text-[#C9A55A]" />
              <h2 className="text-[12px] font-semibold text-white/75">Activity Log</h2>
              <span className="text-[10px] text-white/25 ml-auto tracking-wide">Live feed</span>
            </div>
            <ActivityLog activities={activities} />
          </div>
          <div className="bg-[#131620] border border-white/[0.07] rounded-lg p-5 luxury-card">
            <AIInsightPanel insights={sampleInsights} />
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
