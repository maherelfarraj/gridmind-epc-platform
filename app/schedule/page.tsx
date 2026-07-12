'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { cn } from '@/lib/utils'
import { fmtProjectValue, useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo, useState } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProjectSchedule {
  id: string
  name: string
  client: string
  color: string
  startMonth: number  // 0-indexed from Jan 2024
  endMonth: number
  progress: number    // 0-100
  spi: number         // schedule performance index
  status: 'on-track' | 'at-risk' | 'delayed' | 'complete'
  phase: string
  contractValue: string
  milestones: { month: number; label: string; done: boolean }[]
}

// ─── Data ──────────────────────────────────────────────────────────────────────

// Timeline: 24 months — Jan 2024 to Dec 2025 (indices 0-23)
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
const YEARS = MONTHS.map((_, i) => (i < 12 ? '2024' : '2025'))
// Current month pointer (Jul 2024 = index 6)
const CURRENT_MONTH = 6

// Maps each Gantt row to its canonical project id in the shared store
const scheduleToStoreId: Record<string, string> = {
  'NEOM-SOL': 'NEOM-SOL-004',
  'RYD-EPC7': 'RYD-EPC-007',
  'JED-SUB': 'JED-SUB-002',
  'KAEC-IPP': 'KAEC-SOL-400',
  'YNB-IND': 'YNB-IND-001',
  'TBK-SOL': 'TAB-SOL-010',
}

const baseProjects: ProjectSchedule[] = [
  {
    id: 'NEOM-SOL',
    name: 'NEOM Solar Farm',
    client: 'NEOM Company',
    color: '#4A7FA5',
    startMonth: 0,
    endMonth: 18,
    progress: 62,
    spi: 0.88,
    status: 'at-risk',
    phase: 'P4 Procurement',
    contractValue: '',   // overwritten at render time from workspace store
    milestones: [
      { month: 2,  label: 'FEED Complete',       done: true  },
      { month: 5,  label: 'IFC Drawings Issued',  done: true  },
      { month: 8,  label: 'Materials Delivered',  done: false },
      { month: 12, label: 'Energisation',         done: false },
      { month: 18, label: 'PAC',                  done: false },
    ],
  },
  {
    id: 'RYD-EPC7',
    name: 'Riyadh EPC-07',
    client: 'Saudi Aramco',
    color: '#C9A55A',
    startMonth: 1,
    endMonth: 13,
    progress: 81,
    spi: 0.95,
    status: 'on-track',
    phase: 'P3 Engineering',
    contractValue: '',
    milestones: [
      { month: 3,  label: 'Design Freeze',        done: true  },
      { month: 6,  label: 'Procurement Complete',  done: true  },
      { month: 9,  label: 'Construction Complete', done: false },
      { month: 13, label: 'PAC',                  done: false },
    ],
  },
  {
    id: 'JED-SUB',
    name: 'Jeddah Substation',
    client: 'SEC',
    color: '#8A5A5A',
    startMonth: 3,
    endMonth: 21,
    progress: 35,
    spi: 0.71,
    status: 'delayed',
    phase: 'P5 Construction',
    contractValue: '',
    milestones: [
      { month: 5,  label: 'Piling Complete',       done: true  },
      { month: 9,  label: 'Structure Erection',    done: false },
      { month: 14, label: 'Equipment Installed',   done: false },
      { month: 18, label: 'Commissioning Start',   done: false },
      { month: 21, label: 'PAC',                   done: false },
    ],
  },
  {
    id: 'KAEC-IPP',
    name: 'KAEC Solar IPP',
    client: 'KAEC',
    color: '#0D9488',
    startMonth: 5,
    endMonth: 23,
    progress: 12,
    spi: 1.0,
    status: 'on-track',
    phase: 'P1 Pre-Contract',
    contractValue: '',
    milestones: [
      { month: 7,  label: 'Contract Signed',       done: false },
      { month: 10, label: 'FEED Complete',          done: false },
      { month: 16, label: 'Construction Start',    done: false },
      { month: 23, label: 'COD',                   done: false },
    ],
  },
  {
    id: 'YNB-IND',
    name: 'Yanbu Industrial',
    client: 'SABIC',
    color: '#5A8A6A',
    startMonth: 0,
    endMonth: 8,
    progress: 95,
    spi: 0.97,
    status: 'on-track',
    phase: 'P6 Finance',
    contractValue: '',
    milestones: [
      { month: 2,  label: 'Procurement Done',      done: true  },
      { month: 5,  label: 'Construction Done',     done: true  },
      { month: 7,  label: 'Commissioning',         done: true  },
      { month: 8,  label: 'PAC',                   done: false },
    ],
  },
  {
    id: 'TBK-SOL',
    name: 'Tabuk Solar',
    client: 'NEOM Company',
    color: '#C9A55A',
    startMonth: 4,
    endMonth: 19,
    progress: 28,
    spi: 0.90,
    status: 'at-risk',
    phase: 'P2 Contract',
    contractValue: '',
    milestones: [
      { month: 6,  label: 'Contract Finalised',    done: false },
      { month: 9,  label: 'FEED Approved',         done: false },
      { month: 13, label: 'Materials on Site',     done: false },
      { month: 19, label: 'PAC',                   done: false },
    ],
  },
]

// S-Curve data — planned vs actual cumulative progress across portfolio
const sCurveData = [
  { month: 'Jan', planned: 2,  actual: 2   },
  { month: 'Feb', planned: 5,  actual: 4   },
  { month: 'Mar', planned: 10, actual: 9   },
  { month: 'Apr', planned: 16, actual: 14  },
  { month: 'May', planned: 23, actual: 20  },
  { month: 'Jun', planned: 31, actual: 27  },
  { month: 'Jul', planned: 40, actual: 35  },
  { month: 'Aug', planned: 50, actual: null },
  { month: 'Sep', planned: 58, actual: null },
  { month: 'Oct', planned: 65, actual: null },
  { month: 'Nov', planned: 72, actual: null },
  { month: 'Dec', planned: 78, actual: null },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  'on-track': { label: 'On Track', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',  dot: 'bg-green-500' },
  'at-risk':  { label: 'At Risk',  color: 'text-amber-400 bg-accent border-amber-500/30', dot: 'bg-primary' },
  'delayed':  { label: 'Delayed',  color: 'text-red-400 bg-red-950/20 border-red-800/30',        dot: 'bg-red-500' },
  'complete': { label: 'Complete', color: 'text-primary bg-secondary/60 border-primary/20', dot: 'bg-primary' },
}

// ─── Gantt bar component ────────────────────────────────────────────────────────

function GanttRow({ project, visibleStart, visibleCount }: {
  project: ProjectSchedule
  visibleStart: number
  visibleCount: number
}) {
  const barStart = Math.max(project.startMonth - visibleStart, 0)
  const barEnd   = Math.min(project.endMonth - visibleStart, visibleCount - 1)
  const barWidth = barEnd - barStart + 1
  const progressWidth = Math.round((project.progress / 100) * barWidth)

  if (barEnd < 0 || barStart >= visibleCount) return null

  const visibleMilestones = project.milestones.filter(
    m => m.month >= visibleStart && m.month < visibleStart + visibleCount
  )

  return (
    <div className="relative flex items-center px-4 py-2 border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
      {/* Project label */}
      <div className="w-36 flex-shrink-0 pr-3">
        <p className="text-xs font-semibold text-foreground truncate">{project.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{project.phase}</p>
      </div>

      {/* Grid + bar */}
      <div className="flex-1 relative h-9">
        {/* Grid lines */}
        {Array.from({ length: visibleCount }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full border-r border-border/50"
            style={{ left: `${(i / visibleCount) * 100}%`, width: `${100 / visibleCount}%` }}
          />
        ))}

        {/* Today line */}
        {CURRENT_MONTH >= visibleStart && CURRENT_MONTH < visibleStart + visibleCount && (
          <div
            className="absolute top-0 h-full w-px bg-red-400 z-10"
            style={{ left: `${((CURRENT_MONTH - visibleStart + 0.5) / visibleCount) * 100}%` }}
          />
        )}

        {/* Bar background */}
        {barWidth > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-5 rounded-full overflow-hidden"
            style={{
              left: `${(barStart / visibleCount) * 100}%`,
              width: `${(barWidth / visibleCount) * 100}%`,
              background: `${project.color}22`,
              border: `1px solid ${project.color}44`,
            }}
          >
            {/* Progress fill */}
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(progressWidth / barWidth) * 100}%`,
                background: project.color,
                opacity: 0.85,
              }}
            />
          </div>
        )}

        {/* Milestones */}
        {visibleMilestones.map(ms => (
          <div
            key={ms.month}
            title={`${ms.label} ${ms.done ? '✓' : '(pending)'}`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group"
            style={{ left: `${((ms.month - visibleStart + 0.5) / visibleCount) * 100}%` }}
          >
            <div className={cn(
              'w-3 h-3 rotate-45 border',
              ms.done ? 'bg-green-500 border-green-600' : `border-2`
            )}
              style={ms.done ? {} : { borderColor: project.color, background: 'white' }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-30">
              <div className="bg-secondary text-foreground text-[9px] font-medium px-2 py-1 rounded whitespace-nowrap">
                {ms.label} {ms.done ? '(Done)' : '(Pending)'}
              </div>
              <div className="w-1.5 h-1.5 bg-secondary rotate-45 -mt-0.5" />
            </div>
          </div>
        ))}
      </div>

      {/* SPI */}
      <div className="w-14 flex-shrink-0 text-right pl-2">
        <span className={`text-xs font-bold ${project.spi >= 0.9 ? 'text-emerald-400' : project.spi >= 0.75 ? 'text-amber-400' : 'text-red-600'}`}>
          {project.spi.toFixed(2)}
        </span>
        <p className="text-[9px] text-muted-foreground">SPI</p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { projects: storeProjects, settings } = useWorkspace()
  const [activeTab, setActiveTab]   = useState<'gantt' | 'scurve' | 'milestones'>('gantt')
  const [visibleStart, setVisible]  = useState(0)
  const VISIBLE = 12  // show 12 months at a time

  // Sync live progress + contractValue from the shared store; keep Gantt-specific layout local.
  const projects = useMemo(
    () =>
      baseProjects.map((p) => {
        const match = storeProjects.find((sp) => sp.id === scheduleToStoreId[p.id])
        return match
          ? { ...p, progress: match.progress, contractValue: fmtProjectValue(match.valueSAR, match.currency) }
          : p
      }),
    [storeProjects],
  )

  const canBack    = visibleStart > 0
  const canForward = visibleStart + VISIBLE < MONTHS.length

  const onTrack  = projects.filter(p => p.status === 'on-track').length
  const delayed  = projects.filter(p => p.status === 'delayed').length
  const atRisk   = projects.filter(p => p.status === 'at-risk').length
  const avgSpi   = (projects.reduce((s, p) => s + p.spi, 0) / projects.length).toFixed(2)

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Portfolio Schedule</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Gantt-style timeline, milestone tracker, and S-Curve for all 6 active EPC projects — Jan 2024 to Dec 2025
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span>Today: Jul 2024</span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="On Track" value={onTrack.toString()} subtitle={`of ${projects.length} projects`} icon={CheckCircle} accent="green" />
          <KPICard title="At Risk" value={atRisk.toString()} subtitle="Need attention" icon={AlertTriangle} accent="orange" />
          <KPICard title="Delayed" value={delayed.toString()} subtitle="Behind schedule" icon={Clock} accent="red" />
          <KPICard title="Avg. SPI" value={avgSpi} subtitle="Schedule Performance Index" icon={TrendingUp} accent="navy" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-xl p-1 w-fit">
          {(['gantt', 'scurve', 'milestones'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'gantt' ? 'Gantt Chart' : t === 'scurve' ? 'S-Curve' : 'Milestones'}
            </button>
          ))}
        </div>

        {/* Gantt */}
        {activeTab === 'gantt' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Header row */}
            <div className="flex items-center border-b border-border bg-muted/30 px-4 py-2">
              <div className="w-36 flex-shrink-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Project</p>
              </div>
              <div className="flex-1 flex">
                {MONTHS.slice(visibleStart, visibleStart + VISIBLE).map((m, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p className="text-[9px] font-semibold text-muted-foreground">{m}</p>
                    <p className="text-[8px] text-muted-foreground/50">{YEARS[visibleStart + i]}</p>
                  </div>
                ))}
              </div>
              <div className="w-14 flex-shrink-0 text-right">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">SPI</p>
              </div>
            </div>

            {/* Project rows */}
            {projects.map(p => (
              <GanttRow key={p.id} project={p} visibleStart={visibleStart} visibleCount={VISIBLE} />
            ))}

            {/* Navigation footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-secondary opacity-85" />Actual Progress</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rotate-45 border-2 border-primary inline-block bg-card" />
                  Pending Milestone
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rotate-45 bg-green-500 inline-block" />
                  Completed Milestone
                </span>
                <span className="flex items-center gap-1.5"><span className="w-px h-3 bg-red-400 inline-block" />Today</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisible(v => Math.max(0, v - 6))}
                  disabled={!canBack}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <span className="text-xs text-muted-foreground">
                  {MONTHS[visibleStart]} {YEARS[visibleStart]} — {MONTHS[visibleStart + VISIBLE - 1]} {YEARS[visibleStart + VISIBLE - 1]}
                </span>
                <button
                  onClick={() => setVisible(v => Math.min(MONTHS.length - VISIBLE, v + 6))}
                  disabled={!canForward}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* S-Curve */}
        {activeTab === 'scurve' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Portfolio S-Curve — Cumulative Progress (%)</h2>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary inline-block" />Planned</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary inline-block" />Actual</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={sCurveData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A7FA5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4A7FA5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A55A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#C9A55A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(v, name) => [v != null ? `${v}%` : '—', name] as [string, string]}
                  />
                  <Area
                    type="monotone" dataKey="planned" stroke="#C9A55A" strokeWidth={2}
                    fill="url(#planGrad)" name="Planned" dot={false}
                    connectNulls
                  />
                  <Area
                    type="monotone" dataKey="actual" stroke="#8B6F3A" strokeWidth={2.5}
                    fill="url(#actGrad)" name="Actual" dot={{ fill: '#C9A55A', r: 3 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                As of Jul 2024: Planned 40% vs Actual 35% — 5% behind programme (SPI avg: {avgSpi})
              </p>
            </div>

            {/* Project summary cards */}
            <div className="space-y-3">
              {projects.map(p => {
                const sc = statusConfig[p.status]
                const planned = Math.round(CURRENT_MONTH >= p.startMonth
                  ? ((Math.min(CURRENT_MONTH, p.endMonth) - p.startMonth) / (p.endMonth - p.startMonth)) * 100
                  : 0)
                const variance = p.progress - planned

                return (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.client} · {p.contractValue}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs mb-2">
                      <span className="text-muted-foreground">Planned</span>
                      <span className="font-semibold text-foreground">{planned}%</span>
                      <span className="text-muted-foreground ml-2">Actual</span>
                      <span className="font-semibold text-foreground">{p.progress}%</span>
                      <span className={`ml-auto font-bold text-xs ${variance >= 0 ? 'text-emerald-400' : 'text-red-600'}`}>
                        {variance >= 0 ? '+' : ''}{variance}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div className="absolute left-0 top-0 h-full bg-muted-foreground/30 rounded-full" style={{ width: `${planned}%` }} />
                      <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Milestones */}
        {activeTab === 'milestones' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Portfolio Milestone Tracker</h2>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" />Completed</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" />Upcoming</span>
                <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-500" />Overdue</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {projects.map(p => (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <span className="text-xs text-muted-foreground">{p.client}</span>
                    <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusConfig[p.status].color}`}>
                      {statusConfig[p.status].label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.milestones.map((ms, i) => {
                      const isOverdue = !ms.done && ms.month <= CURRENT_MONTH
                      return (
                        <div
                          key={i}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs',
                            ms.done
                              ? 'bg-emerald-950/20 border-emerald-800/30'
                              : isOverdue
                              ? 'bg-red-950/20 border-red-800/30'
                              : 'bg-muted/30 border-border'
                          )}
                        >
                          {ms.done
                            ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            : isOverdue
                            ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                            : <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          }
                          <span className={ms.done ? 'text-green-800' : isOverdue ? 'text-red-400' : 'text-foreground'}>
                            {ms.label}
                          </span>
                          <span className={`text-[10px] font-mono ${ms.done ? 'text-emerald-400' : isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {MONTHS[ms.month]} {YEARS[ms.month]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
