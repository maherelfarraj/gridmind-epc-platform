'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { useWorkspace } from '@/lib/workspace-store'
import {
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileBarChart,
  FileText,
  Filter,
  HardHat,
  Layers,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { calculateFinancialModel } from '@/lib/finance/calculate'
import { referenceSolarIppTemplate, epcStarterTemplate } from '@/lib/finance/templates'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

// ─── Data ─────────────────────────────────────────────────────────────────────

// Monthly revenue / cost at EPC portfolio scale (SAR M); margin in %
const portfolioKPIs = [
  { month: 'Jan', revenue: 182, cost: 135, margin: 25.6 },
  { month: 'Feb', revenue: 214, cost: 156, margin: 27.2 },
  { month: 'Mar', revenue: 248, cost: 178, margin: 28.4 },
  { month: 'Apr', revenue: 221, cost: 166, margin: 24.8 },
  { month: 'May', revenue: 263, cost: 191, margin: 27.6 },
  { month: 'Jun', revenue: 289, cost: 205, margin: 29.1 },
  { month: 'Jul', revenue: 244, cost: 177, margin: 27.6 },
]

// Phase id → short label + color, used for distribution + health table
const PHASE_META: Record<number, { label: string; color: string }> = {
  1: { label: 'P1 Pre-Contract',    color: '#4A7FA5' },
  2: { label: 'P2 Contract Setup',  color: '#C9A55A' },
  3: { label: 'P3 Engineering',     color: '#0D9488' },
  4: { label: 'P4 Procurement',     color: '#C9A55A' },
  5: { label: 'P5 Construction',    color: '#8B6F3A' },
  6: { label: 'P6 Finance',         color: '#5A8A6A' },
  7: { label: 'P7 T&C/Handover',    color: '#7C3AED' },
}



function formatPortfolioValue(totalM: number, currency = 'SAR'): string {
  const ccy = currency || 'SAR'
  if (totalM >= 1000) return `${ccy} ${(totalM / 1000).toFixed(2)}B`
  return `${ccy} ${Math.round(totalM).toLocaleString()}M`
}

const approvalStats = [
  { month: 'Feb', submitted: 18, approved: 15, rejected: 2, pending: 1 },
  { month: 'Mar', submitted: 24, approved: 20, rejected: 3, pending: 1 },
  { month: 'Apr', submitted: 19, approved: 17, rejected: 1, pending: 1 },
  { month: 'May', submitted: 31, approved: 25, rejected: 4, pending: 2 },
  { month: 'Jun', submitted: 28, approved: 24, rejected: 2, pending: 2 },
  { month: 'Jul', submitted: 22, approved: 16, rejected: 1, pending: 5 },
]

const exportableReports = [
  { id: 'RPT-MON-001', name: 'Monthly Portfolio Summary', category: 'Portfolio', lastGenerated: 'Jul 1, 2024', format: 'PDF', icon: FileBarChart, color: '#4A7FA5' },
  { id: 'RPT-FIN-002', name: 'Finance & Cashflow Report — June 2024', category: 'Finance', lastGenerated: 'Jul 2, 2024', format: 'Excel', icon: TrendingUp, color: '#5A8A6A' },
  { id: 'RPT-MDL-009', name: 'Financial Model Portfolio Summary — Approved', category: 'Finance', lastGenerated: 'Jul 11, 2026', format: 'Excel', icon: FileBarChart, color: '#C9A55A' },
  { id: 'RPT-ENG-003', name: 'Engineering Progress Report — NEOM Solar', category: 'Engineering', lastGenerated: 'Jul 5, 2024', format: 'PDF', icon: Layers, color: '#0D9488' },
  { id: 'RPT-HSE-004', name: 'HSE Statistics Report — Q2 2024', category: 'HSE', lastGenerated: 'Jul 1, 2024', format: 'PDF', icon: HardHat, color: '#8B6F3A' },
  { id: 'RPT-PRO-005', name: 'Procurement & PO Status Report', category: 'Procurement', lastGenerated: 'Jul 6, 2024', format: 'Excel', icon: ShieldCheck, color: '#C9A55A' },
  { id: 'RPT-APP-006', name: 'Approval Queue & Turnaround Analysis', category: 'Approvals', lastGenerated: 'Jul 7, 2024', format: 'PDF', icon: CheckCircle2, color: '#C9A55A' },
  { id: 'RPT-CON-007', name: 'Construction Milestone Tracker', category: 'Construction', lastGenerated: 'Jul 4, 2024', format: 'PDF', icon: HardHat, color: '#8B6F3A' },
  { id: 'RPT-QAQ-008', name: 'QA/QC NCR Register & Close-out', category: 'QA/QC', lastGenerated: 'Jul 3, 2024', format: 'Excel', icon: ShieldCheck, color: '#8A5A5A' },
]

const riskColors: Record<string, string> = {
  high: 'text-red-600',
  medium: 'text-amber-400',
  low: 'text-emerald-400',
}

const riskBg: Record<string, string> = {
  high: 'bg-red-950/20 border-red-800/30',
  medium: 'bg-accent border-amber-500/30',
  low: 'bg-emerald-950/20 border-emerald-800/30',
}

// ─── Export builder state ──────────────────────────────────────────────────────

const MODULE_OPTIONS = [
  { id: 'portfolio',   label: 'Portfolio Overview',    checked: true  },
  { id: 'finance',     label: 'Finance & Cashflow',    checked: true  },
  { id: 'engineering', label: 'Engineering Progress',  checked: false },
  { id: 'procurement', label: 'Procurement & PO',      checked: true  },
  { id: 'construction',label: 'Construction Milestone',checked: false },
  { id: 'hse',         label: 'HSE Statistics',        checked: false },
  { id: 'qaqc',        label: 'QA/QC NCR Register',   checked: true  },
  { id: 'approvals',   label: 'Approval Turnaround',   checked: false },
  { id: 'risk',        label: 'Risk Register',         checked: false },
  { id: 'schedule',    label: 'Portfolio Schedule',    checked: false },
]

// ─── Financial model summary for reports sidebar ─────────────────────────────

const REPORT_MODELS = [
  { id: 'reference-solar-ipp', name: 'Reference 50 MWp Solar IPP', status: 'approved', assumptions: referenceSolarIppTemplate },
  { id: 'utility-epc-base', name: 'Utility EPC Base Case',  status: 'draft',    assumptions: epcStarterTemplate },
]

function FinancialModelSummaryCard() {
  const models = useMemo(() =>
    REPORT_MODELS.map((m) => {
      try {
        const r = calculateFinancialModel(m.assumptions)
        return { ...m, metrics: r.metrics, errors: r.validations.filter(v => v.severity === 'error').length }
      } catch {
        return { ...m, metrics: null, errors: 0 }
      }
    }), [])

  const fmtPct = (v: number | null) => v == null ? '—' : `${(v * 100).toFixed(1)}%`

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Financial Models</h2>
        <Link href="/finance?tab=models" className="text-[10px] text-primary hover:underline font-medium">
          Open hub
        </Link>
      </div>
      <div className="space-y-3">
        {models.map((m) => (
          <Link key={m.id} href={`/finance/models/${m.id}`} className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/60 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
              <span className={`flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${
                m.status === 'approved'
                  ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}>
                {m.status === 'approved' ? 'Approved' : 'Draft'}
              </span>
            </div>
            {m.metrics && (
              <div className="flex items-center gap-3 text-[10px] tabular-nums text-muted-foreground mt-0.5">
                <span>IRR <span className="font-semibold text-foreground">{fmtPct(m.metrics.projectIrr)}</span></span>
                <span>Eq. IRR <span className="font-semibold text-foreground">{fmtPct(m.metrics.equityIrr)}</span></span>
                <span className={m.errors > 0 ? 'text-red-600 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {m.errors > 0 ? `${m.errors} err` : 'Clean'}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">Aggregates include approved models only</p>
    </div>
  )
}

export default function ReportsPage() {
  const { projects, approvals, pendingApprovalCount, settings } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'overview' | 'project-health' | 'approvals' | 'export'>('overview')
  const [searchReport, setSearchReport] = useState('')

  // Derived portfolio metrics from the shared store
  const portfolioValueM = useMemo(() => projects.reduce((s, p) => s + p.valueSAR / 1_000_000, 0), [projects])

  const projectHealth = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        project: p.name,
        phase: PHASE_META[p.phaseId]?.label ?? `P${p.phaseId}`,
        progress: p.progress,
        // schedule health degrades when a project is flagged; budget/quality kept representative
        budget: p.alert ? 82 : 96,
        schedule: p.alert ? 71 : Math.min(100, 80 + Math.round(p.progress / 8)),
        quality: p.alert ? 88 : 95,
        risk: p.alert ? 'high' : p.progress < 20 ? 'low' : 'low',
      })),
    [projects],
  )

  const phaseDistribution = useMemo(() => {
    return Object.entries(PHASE_META).map(([id, meta]) => ({
      name: meta.label,
      value: projects.filter((p) => p.phaseId === Number(id)).length,
      color: meta.color,
    }))
  }, [projects])

  const totalDocs = useMemo(() => projects.reduce((s, p) => s + p.documents, 0), [projects])
  const approvedCount = approvals.filter((a) => a.status === 'approved').length

  // Export builder state
  const [exportProject,  setExportProject]  = useState('all')
  const [exportDateRange,setExportDateRange] = useState('ytd')
  const [exportFormat,   setExportFormat]   = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [exportModules,  setExportModules]  = useState<Record<string, boolean>>(
    Object.fromEntries(MODULE_OPTIONS.map(m => [m.id, m.checked]))
  )
  const [previewOpen,    setPreviewOpen]    = useState(false)
  const [generating,     setGenerating]     = useState(false)
  const [toastMsg,       setToastMsg]       = useState<string | null>(null)

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3500) }

  const selectedModuleCount = Object.values(exportModules).filter(Boolean).length

  const toggleModule = (id: string) => setExportModules(prev => ({ ...prev, [id]: !prev[id] }))

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setPreviewOpen(true)
    }, 1200)
  }

  const handleDownload = () => {
    showToast(`${exportFormat.toUpperCase()} report downloaded — ${selectedModuleCount} modules, ${
      exportProject === 'all' ? 'All Projects' : exportProject
    }`)
    setPreviewOpen(false)
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Cross-phase KPIs, portfolio performance, approval turnaround, and exportable reports across all 7 EPC phases
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 border border-border hover:bg-muted text-sm px-3 py-2 rounded-lg transition-colors text-foreground">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
              <Printer className="w-4 h-4" />
              Print Portfolio Report
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Portfolio Value" value={formatPortfolioValue(portfolioValueM, settings.currency)} subtitle={`${projects.length} projects active`} trend={{ value: 22, label: 'vs last year' }} icon={TrendingUp} accent="navy" />
          <KPICard title="Avg. Gross Margin" value="27.2%" subtitle="Target: 25%" trend={{ value: 2.2, label: 'above target' }} icon={BarChart2} accent="green" />
          <KPICard title="Pending Approvals" value={pendingApprovalCount.toString()} subtitle={`${approvedCount} approved to date`} icon={CheckCircle2} accent="indigo" />
          <KPICard title="Documents Issued" value={totalDocs.toString()} subtitle="Across all projects" icon={Clock} accent="gold" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          {(['overview', 'project-health', 'approvals', 'export'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'project-health' ? 'Project Health' :
               t === 'approvals' ? 'Approvals Analytics' :
               t === 'export' ? 'Export Reports' :
               'Portfolio Overview'}
            </button>
          ))}
        </div>

        {/* Portfolio Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">

              {/* Revenue vs Cost */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Portfolio Revenue vs Cost — 2024 (SAR M)</h2>
                  <button className="text-xs text-muted-foreground border border-border px-2 py-1 rounded hover:bg-muted transition-colors">
                    <Download className="w-3.5 h-3.5 inline mr-1" />Export
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={portfolioKPIs}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E2230" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1E2230" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.10} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}M`} />
                    <Tooltip formatter={(v) => `${settings.currency} ${v}M`} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#4A7FA5" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="cost" stroke="#C0392B" fill="url(#costGrad)" strokeWidth={2} name="Cost" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Gross margin line */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Monthly Gross Margin Trend (%)</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={portfolioKPIs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[20, 35]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="margin" stroke="#C9A55A" strokeWidth={2.5} dot={{ fill: '#C9A55A', r: 4 }} name="Gross Margin" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              {/* Phase distribution */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Projects by EPC Phase</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={phaseDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {phaseDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v} project${Number(v) === 1 ? '' : 's'}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 mt-2">
                  {phaseDistribution.filter(p => p.value > 0).map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Portfolio Quick Stats</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Total Contract Value', value: formatPortfolioValue(portfolioValueM, settings.currency) },
                    { label: 'Active Projects', value: `${projects.length} projects` },
                    { label: 'Pending Approvals', value: `${pendingApprovalCount} items` },
                    { label: 'Flagged Projects', value: `${projects.filter(p => p.alert).length} at risk`, warn: projects.some(p => p.alert) },
                    { label: 'Documents Issued', value: `${totalDocs} docs` },
                    { label: 'Approved to Date', value: `${approvedCount} items` },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between gap-4 text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className={`font-semibold ${s.warn ? 'text-red-600' : 'text-foreground'}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Financial model provenance card */}
              <FinancialModelSummaryCard />
            </div>
          </div>
        )}

        {/* Project Health tab */}
        {activeTab === 'project-health' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Project', 'Current Phase', 'Progress', 'Budget %', 'Schedule %', 'Quality %', 'Risk', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projectHealth.map(p => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 text-sm font-semibold text-foreground whitespace-nowrap">{p.project}</td>
                        <td className="px-4 py-4">
                          <span className="text-[10px] font-semibold bg-secondary/60 text-foreground border border-primary/20 px-2 py-0.5 rounded-full">{p.phase}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-secondary rounded-full" style={{ width: `${p.progress}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-foreground">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-semibold ${p.budget >= 95 ? 'text-emerald-400' : p.budget >= 85 ? 'text-amber-400' : 'text-red-600'}`}>
                            {p.budget}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-semibold ${p.schedule >= 90 ? 'text-emerald-400' : p.schedule >= 75 ? 'text-amber-400' : 'text-red-600'}`}>
                            {p.schedule}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-semibold ${p.quality >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {p.quality}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${riskBg[p.risk]} ${riskColors[p.risk]}`}>{p.risk}</span>
                        </td>
                        <td className="px-4 py-4">
                          <a href={`/projects/${p.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                            Open <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Approvals Analytics tab */}
        {activeTab === 'approvals' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Monthly Approval Activity</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={approvalStats} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submitted" fill="#C9A55A" radius={[2, 2, 0, 0]} name="Submitted" />
                  <Bar dataKey="approved" fill="#10B981" radius={[2, 2, 0, 0]} name="Approved" />
                  <Bar dataKey="rejected" fill="#DC2626" radius={[2, 2, 0, 0]} name="Rejected" />
                  <Bar dataKey="pending" fill="#C9A55A" radius={[2, 2, 0, 0]} name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Approval Turnaround by Phase</h2>
              <div className="space-y-3">
                {[
                  { phase: 'P1 Pre-Contract', avg: '1.2 days', items: 6, color: '#4A7FA5' },
                  { phase: 'P2 Contract Setup', avg: '2.8 days', items: 14, color: '#C9A55A' },
                  { phase: 'P3 Engineering', avg: '3.1 days', items: 28, color: '#0D9488' },
                  { phase: 'P4 Procurement', avg: '2.4 days', items: 22, color: '#C9A55A' },
                  { phase: 'P5 Construction', avg: '1.9 days', items: 41, color: '#8B6F3A' },
                  { phase: 'P6 Finance', avg: '2.0 days', items: 18, color: '#5A8A6A' },
                  { phase: 'P7 T&C / Handover', avg: '3.5 days', items: 9, color: '#7C3AED' },
                ].map(row => (
                  <div key={row.phase} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-40 flex-shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                      <span className="text-xs text-muted-foreground truncate">{row.phase}</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(row.items / 50) * 100}%`, backgroundColor: row.color }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-foreground">{row.avg}</div>
                      <div className="text-[10px] text-muted-foreground">{row.items} items</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Export Reports tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Toast */}
            {toastMsg && (
              <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{toastMsg}</span>
                <button onClick={() => setToastMsg(null)} className="ml-auto text-white/60 hover:text-white">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Recent reports library */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Recent Reports</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={searchReport}
                    onChange={e => setSearchReport(e.target.value)}
                    placeholder="Search reports..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-card border border-border rounded-lg outline-none focus:border-primary w-52"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {exportableReports
                  .filter(r => !searchReport || r.name.toLowerCase().includes(searchReport.toLowerCase()) || r.category.toLowerCase().includes(searchReport.toLowerCase()))
                  .map(report => {
                    const Icon = report.icon
                    return (
                      <div key={report.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${report.color}15` }}>
                            <Icon className="w-4 h-4" style={{ color: report.color }} />
                          </div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            report.format === 'PDF' ? 'text-red-400 bg-red-950/20 border-red-800/30' : 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30'
                          }`}>
                            {report.format}
                          </span>
                        </div>
                        <h3 className="text-xs font-semibold text-foreground leading-snug mb-1">{report.name}</h3>
                        <p className="text-[10px] text-muted-foreground mb-3">{report.category} · {report.lastGenerated}</p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => showToast(`${report.name} downloaded`)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-secondary hover:bg-secondary/80 text-white text-[10px] font-semibold py-1.5 rounded-lg transition-colors"
                          >
                            <Download className="w-3 h-3" /> Download
                          </button>
                          <button
                            onClick={() => showToast(`${report.name} regenerated`)}
                            className="w-7 h-7 flex items-center justify-center border border-border hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Custom report builder */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-secondary">
                <h2 className="text-sm font-semibold text-white">Custom Report Builder</h2>
                <p className="text-[11px] text-white/60 mt-0.5">Configure scope, modules, and format — then generate a preview before downloading</p>
              </div>

              <div className="p-5 grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: config */}
                <div className="xl:col-span-2 space-y-5">

                  {/* Row 1: project + date range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Project Scope</label>
                      <select
                        value={exportProject}
                        onChange={e => setExportProject(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                      >
                        <option value="all">All Projects</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Date Range</label>
                      <select
                        value={exportDateRange}
                        onChange={e => setExportDateRange(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                      >
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="ytd">Year to Date (2024)</option>
                        <option value="q2">Q2 2024 (Apr–Jun)</option>
                        <option value="q3">Q3 2024 (Jul–Sep)</option>
                        <option value="all">Full Project Lifecycle</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: module checkboxes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Report Modules</label>
                      <div className="flex gap-2">
                        <button onClick={() => setExportModules(Object.fromEntries(MODULE_OPTIONS.map(m => [m.id, true])))} className="text-[10px] text-primary hover:underline">Select All</button>
                        <span className="text-muted-foreground/40">·</span>
                        <button onClick={() => setExportModules(Object.fromEntries(MODULE_OPTIONS.map(m => [m.id, false])))} className="text-[10px] text-muted-foreground hover:underline">Clear</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {MODULE_OPTIONS.map(mod => (
                        <label
                          key={mod.id}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                            exportModules[mod.id]
                              ? 'border-primary bg-secondary/60 text-primary'
                              : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={exportModules[mod.id]}
                            onChange={() => toggleModule(mod.id)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            exportModules[mod.id] ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                          }`}>
                            {exportModules[mod.id] && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-xs font-medium leading-tight">{mod.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Row 3: format toggle */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Output Format</label>
                    <div className="flex gap-2">
                      {(['pdf', 'excel', 'csv'] as const).map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setExportFormat(fmt)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                            exportFormat === fmt
                              ? fmt === 'pdf'
                                ? 'bg-red-600 border-red-600 text-white'
                                : fmt === 'excel'
                                ? 'bg-emerald-700 border-emerald-700 text-white'
                                : 'bg-primary border-primary text-white'
                              : 'bg-card border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <FileBarChart className="w-4 h-4" />
                          {fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate CTA */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleGenerate}
                      disabled={selectedModuleCount === 0 || generating}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                    >
                      {generating
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                        : <><FileText className="w-4 h-4" /> Generate Preview</>
                      }
                    </button>
                    {selectedModuleCount === 0 && (
                      <p className="text-xs text-red-500">Select at least one module</p>
                    )}
                    {selectedModuleCount > 0 && !generating && (
                      <p className="text-xs text-muted-foreground">{selectedModuleCount} module{selectedModuleCount !== 1 ? 's' : ''} selected</p>
                    )}
                  </div>
                </div>

                {/* Right: preview panel */}
                <div>
                  {previewOpen ? (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-full">
                      {/* Preview header — simulates a PDF cover */}
                      <div className="bg-secondary px-4 py-3 flex items-center justify-between">
                        <p className="text-white text-xs font-semibold">Report Preview</p>
                        <span className="text-[10px] text-white/60 uppercase tracking-wider">{exportFormat}</span>
                      </div>
                      <div className="p-4 space-y-3 overflow-auto max-h-[420px]">
                        {/* Simulated cover page */}
                        <div className="text-center py-3 border-b border-border">
                          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto mb-2">
                            <FileBarChart className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-bold text-foreground">GSI Holding EPC Platform</p>
                          <p className="text-xs text-muted-foreground">Custom Report — Generated Jul 9, 2024</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Scope: {exportProject === 'all' ? 'All Projects' : exportProject} ·{' '}
                            {exportDateRange === 'ytd' ? 'Year to Date 2024' : exportDateRange === '30d' ? 'Last 30 days' : exportDateRange === '90d' ? 'Last 90 days' : exportDateRange === 'all' ? 'Full Lifecycle' : exportDateRange.toUpperCase()}
                          </p>
                        </div>

                        {/* TOC */}
                        <div>
                          <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Table of Contents</p>
                          <div className="space-y-1">
                            {MODULE_OPTIONS.filter(m => exportModules[m.id]).map((m, i) => (
                              <div key={m.id} className="flex items-center gap-2 text-[10px]">
                                <span className="text-muted-foreground font-mono">{(i + 1).toString().padStart(2, '0')}</span>
                                <span className="flex-1 border-b border-dotted border-muted-foreground/30">{m.label}</span>
                                <span className="text-muted-foreground font-mono">{(i + 2) * 3}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Simulated KPI summary */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-foreground mb-2">Executive Summary KPIs</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { l: 'Portfolio Revenue', v: formatPortfolioValue(portfolioValueM, settings.currency) },
                              { l: 'Avg. Margin', v: '27.2%' },
                              { l: 'Schedule SPI', v: '0.88' },
                              { l: 'Open Risks', v: '6' },
                            ].map(k => (
                              <div key={k.l} className="bg-card rounded p-2 text-center border border-border/50">
                                <p className="text-[9px] text-muted-foreground">{k.l}</p>
                                <p className="text-xs font-bold text-foreground">{k.v}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleDownload}
                          className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download {exportFormat.toUpperCase()}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/20 border border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-center h-full min-h-[280px]">
                      <FileBarChart className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">Report Preview</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Configure your scope and modules, then click Generate Preview to see a preview before downloading.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
